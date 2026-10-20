// L02 demos. Code panels are copied from csc4801/notes/L02-agents.md (checked by
// csc4801/tools/check.py). The ReAct player replays the toy harness's run, line for line.

const CODE = {
  mainPy: `import requests

city = input("Enter city: ")
url = f"https://wttr.in/{city}?format=j1"

data = requests.get(url).json()
current = data["current_condition"][0]

print(f"{city}: {current['temp_C']} C, ")`,
  agentLoop: `def agent(prompt, llm, max_turns=10):
    messages = [{"role": "user", "content": prompt}]          # 1 Receive prompt
    for turn in range(1, max_turns + 1):                      # 3 Prepare context
        reply = llm(SYSTEM, messages, list(TOOLS))            # 4 Call LLM
        messages.append({"role": "assistant", "content": reply})
        print(f"[{turn}] {reply['thought']}")
        if "tool" not in reply:                               # Tool use? NO
            print(f"    messages: {len(messages)}")
            return reply["answer"]                            # 9 End
        result = TOOLS[reply["tool"]](*reply["args"])          # 6 Call tool
        print(f"    {reply['tool']}({reply['args'][0]!r}) -> {result.splitlines()[0]!r}")
        messages.append({"role": "user", "content": [         # 7 Receive tool results
            {"type": "tool_result", "content": result},
        ]})
    return "Stopped: reached the maximum number of turns."    # 8 Check loop`,
};

// ---------- the workflow map (slide 15) ----------

const STEPS = {
  0: ["0 Start", "We have main.py and a task: add error handling in the file @main.py."],
  1: ["1 Receive prompt", "Text, an @ file reference (the file is loaded into the message) or a / command."],
  2: ["2 Initialize", "Set up the runtime state (message list, available tools) in one state variable."],
  3: ["3 Prepare context", "Gather what this call will send: the system prompt and the whole message history."],
  4: ["4 Call LLM", "POST the model name, system prompt, all messages and every tool's JSON schema to the API."],
  5: ["5 Stream processing", "Receive the reply token by token instead of waiting minutes for all of it."],
  q: ["Tool use?", "Did the model ask for a tool? Yes: steps 6–8. No: step 9."],
  6: ["6 Call tool", "The harness runs the tool the model asked for. Tools that change things need permission."],
  7: ["7 Receive tool results", "Append the result to the message list as a tool_result."],
  8: ["8 Check loop", "Stop on the turn limit, the token limit, a user stop or an API error; otherwise go round again."],
  9: ["9 End", "Update the state (e.g. token usage), send a summary, store all messages as a backup."],
};
// The path our request takes: three tool turns, then a final answer.
const PATH = (() => {
  const p = [0, 1, 2];
  for (let t = 0; t < 3; t++) p.push(3, 4, 5, "q", 6, 7, 8);
  p.push(3, 4, 5, "q", 9);
  return p;
})();

function flowSVG(active, visited) {
  const box = (id, x, y, w, kind) => {
    const on = String(active) === String(id);
    const seen = visited.has(String(id));
    const fill = on ? "var(--mark)" : kind === "end" ? "var(--card-2)" : kind === "in" ? "var(--green-soft)" : "var(--card)";
    const stroke = on ? "var(--amber)" : seen ? "var(--teal)" : "var(--line)";
    return `<rect x="${x}" y="${y}" width="${w}" height="30" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="${on ? 2.5 : 1.3}" data-step="${id}" style="cursor:pointer"/>
      <text x="${x + w / 2}" y="${y + 19}" text-anchor="middle" font-size="12" fill="var(--ink)" pointer-events="none">${STEPS[id][0]}</text>`;
  };
  const line = (d) => `<path d="${d}" fill="none" stroke="var(--stone)" stroke-width="1.3" marker-end="url(#fa)"/>`;
  const qOn = active === "q";
  return `<svg viewBox="0 0 640 430" role="img" aria-label="Agent workflow">
    <defs><marker id="fa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="var(--stone)"/></marker></defs>
    ${line("M 130 25 L 228 25")}${line("M 320 40 L 320 58")}${line("M 320 90 L 320 108")}${line("M 320 140 L 320 158")}
    ${line("M 320 190 L 320 208")}${line("M 320 240 L 320 258")}
    ${line("M 270 280 L 130 280 L 130 300")}${line("M 130 330 L 130 343")}${line("M 130 375 L 130 388")}
    ${line("M 370 280 L 520 280 L 520 340")}
    ${line("M 60 405 L 20 405 L 20 124 L 228 124")}
    <text x="200" y="274" font-size="11" fill="var(--stone)">YES</text><text x="440" y="274" font-size="11" fill="var(--stone)">NO</text>
    ${box(0, 20, 10, 110, "end")}${box(1, 230, 10, 180, "in")}${box(2, 230, 60, 180, "in")}
    ${box(3, 230, 110, 180)}${box(4, 230, 160, 180)}${box(5, 230, 210, 180)}
    <polygon points="320,258 372,280 320,302 268,280" fill="${qOn ? "var(--mark)" : "var(--teal-soft)"}" stroke="${qOn ? "var(--amber)" : visited.has("q") ? "var(--teal)" : "var(--line)"}" stroke-width="${qOn ? 2.5 : 1.3}" data-step="q" style="cursor:pointer"/>
    <text x="320" y="284" text-anchor="middle" font-size="11" fill="var(--ink)" pointer-events="none">Tool use?</text>
    ${box(6, 40, 300, 180)}${box(7, 40, 345, 180)}${box(8, 60, 390, 140)}
    ${box(9, 460, 342, 120, "end")}
  </svg>`;
}

function demoWorkflow(el, { mini = false } = {}) {
  let i = 0, timer = null;
  el.innerHTML = `<div class="svgbox wf-svg"></div>${mini ? "" : `<div class="msg wf-msg"></div>
    <div class="controls"><button class="cbtn wf-reset">⟲ Reset</button><button class="cbtn wf-back">◀ Back</button>
    <button class="cbtn wf-step on">Step ▶</button><button class="cbtn wf-play">Play</button>
    <span class="spacer"></span><span class="counter wf-count"></span></div>`}`;
  const $ = (q) => el.querySelector(q);
  function render() {
    const visited = new Set(PATH.slice(0, i + 1).map(String));
    const s = PATH[i];
    $(".wf-svg").innerHTML = flowSVG(s, visited);
    if (mini) return;
    const pass = PATH.slice(0, i + 1).filter((x) => x === 3).length;
    $(".wf-msg").innerHTML = `<b>${STEPS[s][0]}</b>${pass && !["0", "1", "2"].includes(String(s)) ? ` <span class="counter">(loop pass ${pass})</span>` : ""} — ${STEPS[s][1]}`;
    $(".wf-count").textContent = `step ${i + 1} / ${PATH.length}`;
    $(".wf-back").disabled = $(".wf-reset").disabled = i === 0;
    $(".wf-step").disabled = i === PATH.length - 1;
    el.querySelectorAll("[data-step]").forEach((n) => {
      n.onclick = () => { stop(); $(".wf-msg").innerHTML = `<b>${STEPS[n.dataset.step][0]}</b> — ${STEPS[n.dataset.step][1]}`; };
    });
  }
  function stop() { clearInterval(timer); timer = null; if (!mini) $(".wf-play").textContent = "Play"; }
  function play() {
    if (timer) return stop();
    if (i === PATH.length - 1) i = 0;
    if (!mini) $(".wf-play").textContent = "Pause";
    timer = setInterval(() => { if (i < PATH.length - 1) i++; else if (mini) i = 0; else return stop(); render(); }, mini ? 650 : 700);
  }
  if (!mini) {
    $(".wf-reset").onclick = () => { stop(); i = 0; render(); };
    $(".wf-back").onclick = () => { stop(); if (i) i--; render(); };
    $(".wf-step").onclick = () => { stop(); if (i < PATH.length - 1) i++; render(); };
    $(".wf-play").onclick = play;
  }
  render();
  if (mini) play();
}

// ---------- input: from what you type to the message ----------

function demoInput(el) {
  const FILES = { "main.py": CODE.mainPy };
  const COMMANDS = { "/review": "a predefined prompt that asks for a code review" };
  el.innerHTML = `<div class="controls" style="margin-top:0">
      <input type="text" class="in-text" value="Add error handling in the file @main.py" style="flex:1;min-width:220px">
      <label><input type="checkbox" class="in-sys" checked> add the system prompt</label></div>
    <div class="controls">
      <button class="cbtn" data-ex="Add error handling in the file @main.py">@ file reference</button>
      <button class="cbtn" data-ex="/review">/ command</button>
      <button class="cbtn" data-ex="Explain what this project does">plain text</button>
    </div>
    <div class="in-parts" style="margin-top:10px"></div>
    <div class="in-json"></div>`;
  const $ = (q) => el.querySelector(q);
  function render() {
    const text = $(".in-text").value;
    const parts = [];
    const refs = [...text.matchAll(/@([\w./-]+)/g)].map((m) => m[1]);
    const cmd = text.trim().startsWith("/") ? text.trim().split(/\s+/)[0] : null;
    parts.push(`<span class="tag">text</span> the user prompt`);
    refs.forEach((r) => parts.push(FILES[r] ? `<span class="tag">@${r}</span> file found: its whole content is loaded into the message`
      : `<span class="tag">@${r}</span> no such file in this demo (try main.py)`));
    if (cmd) parts.push(`<span class="tag">${cmd}</span> ${COMMANDS[cmd] ? "a command: " + COMMANDS[cmd] : "a command (unknown in this demo; try /review)"}`);
    $(".in-parts").innerHTML = parts.map((p) => `<div style="font-size:14px;margin:3px 0">${p}</div>`).join("");
    const msg = {};
    if ($(".in-sys").checked) msg.system = "You are a helpful coding assistant.";
    msg.type = "user";
    msg.message = { role: "user", content: text };
    let json = JSON.stringify(msg, null, 4);
    const loaded = refs.filter((r) => FILES[r]);
    if (loaded.length) json += `\n\n# loaded with the message: ${loaded.join(", ")} (${FILES[loaded[0]].split("\n").length} lines)`;
    $(".in-json").innerHTML = codeBlock(json, "repl");
  }
  $(".in-text").oninput = render;
  $(".in-sys").onchange = render;
  el.querySelectorAll("[data-ex]").forEach((b) => { b.onclick = () => { $(".in-text").value = b.dataset.ex; render(); }; });
  render();
}

// ---------- multi-layer prompts ----------

function demoLayers(el) {
  const LAYERS = [
    ["Model system prompt", "written by the model provider; you can't see it", "You are Claude… (thousands of words, much of it safety)"],
    ["Project system prompt", "e.g. CLAUDE.md in the project folder", "This project uses Python 3.12. Run the tests before you finish."],
    ["Memory / skills", "extended capabilities", "Skill: how to write error messages for CLI tools."],
    ["User prompt", "your input", "Add error handling in the file @main.py"],
  ];
  el.innerHTML = `<div class="controls" style="margin-top:0">${LAYERS.map((l, k) =>
    `<label><input type="checkbox" class="ly" data-k="${k}" checked> ${l[0]}</label>`).join("")}</div>
    <div class="ly-stack" style="display:grid;gap:6px;margin-top:10px"></div><p class="hint ly-hint"></p>`;
  function render() {
    const on = [...el.querySelectorAll(".ly")].map((c) => c.checked);
    el.querySelector(".ly-stack").innerHTML = LAYERS.map((l, k) => on[k] ? `<div class="frame" style="box-shadow:inset 3px 0 0 var(--${k === 3 ? "amber" : "teal"})">
      <span class="fname">${k + 1}. ${l[0]}</span> <span class="vars">— ${l[1]}</span><div class="status">${esc(l[2])}</div></div>` : "").join("");
    el.querySelector(".ly-hint").innerHTML = on[3] ? "Everything above your prompt arrives first. The example texts are made up for this demo." : "With no user prompt there is nothing to do: the agent waits for input.";
  }
  el.querySelectorAll(".ly").forEach((c) => { c.onchange = render; });
  render();
}

// ---------- the ReAct run (the toy harness, replayed) ----------

// One entry per step: what happens, which workflow step, the console line(s) printed.
const RUN = [
  { phase: "start", wf: 1, msg: "The request arrives. messages = [user].", add: ["user"] },
];
[
  ["I need to inspect main.py first.", "Read", "main.py", "import requests", "Read('main.py') -> 'import requests'"],
  ["I should catch the errors of missing arguments.", "Edit", "main.py, <proposed changes>", "Update successfully", "Edit('main.py') -> 'Update successfully'"],
  ["I need to verify the code.", "Run", "python main.py", "Usage: python main.py <config-file>", "Run('python main.py') -> 'Usage: python main.py <config-file>'"],
].forEach(([thought, tool, args, result, line], k) => {
  const turn = k + 1;
  RUN.push({ phase: "reason", wf: 4, turn, thought, msg: `Turn ${turn}: call the LLM with all ${1 + 2 * k} message${k ? "s" : ""}. It reasons: “${thought}”`, add: ["assistant"], out: `[${turn}] ${thought}` });
  RUN.push({ phase: "act", wf: 6, turn, call: `${tool}(${args})`, msg: `It asks for a tool: <code>${esc(tool)}(${esc(args)})</code>. The model only writes the request; the harness runs it.` });
  RUN.push({ phase: "observe", wf: 7, turn, result, msg: `The tool returns “${esc(result)}”. The harness appends it as a tool_result.`, add: ["tool_result"], out: `    ${line}` });
});
RUN.push({ phase: "reason", wf: 4, turn: 4, thought: "No action is required.", msg: "Turn 4: call the LLM with all 7 messages. “No action is required.” No tool this time.", add: ["assistant"], out: "[4] No action is required." });
RUN.push({ phase: "end", wf: 9, turn: 4, msg: "Tool use? No → 9 End. The final result goes back to the user.", out: "    messages: 8\nAdded error handling to main.py." });

function demoReact(el, { mini = false } = {}) {
  let i = 0, timer = null;
  el.innerHTML = `
    <div class="react-req" style="text-align:center;margin-bottom:8px"><span class="tag">user</span> <code>Add error handling in the file @main.py</code></div>
    <div class="react-grid" style="display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:start">
      <div><div class="counter">THOUGHTS · reason / plan</div><div class="rx-th" style="display:grid;gap:6px;margin-top:6px"></div></div>
      <div class="rx-llm" style="width:92px;height:92px;border-radius:14px;display:grid;place-items:center;text-align:center;font:600 13px var(--mono);border:2px solid var(--teal);background:var(--teal-soft)"></div>
      <div><div class="counter">TOOLS · execute</div><div class="rx-tools" style="display:grid;gap:6px;margin-top:6px"></div></div>
    </div>
    ${mini ? "" : `<div class="counter" style="margin-top:12px">MESSAGES SENT ON THE NEXT CALL</div><div class="tags rx-msgs" style="margin-top:4px"></div>
    <div class="msg rx-msg"></div>
    <div class="counter" style="margin-top:10px">what the toy harness prints</div><div class="console rx-out"></div>
    <div class="controls"><button class="cbtn rx-reset">⟲ Reset</button><button class="cbtn rx-back">◀ Back</button>
      <button class="cbtn rx-step on">Step ▶</button><button class="cbtn rx-play">Play</button>
      <span class="spacer"></span><span class="counter rx-count"></span></div>`}`;
  const $ = (q) => el.querySelector(q);
  const card = (txt, cls) => `<div class="frame ${cls}" style="font-size:12.5px">${txt}</div>`;
  function render() {
    const done = RUN.slice(0, i + 1);
    const s = RUN[i];
    const th = done.filter((r) => r.thought).map((r, k, a) => card(esc(r.thought), k === a.length - 1 && s.phase === "reason" ? "top" : ""));
    const tools = [];
    done.forEach((r) => {
      if (r.call) tools.push(card(`<b>${esc(r.call)}</b>`, r === s ? "top" : ""));
      if (r.result) tools.push(card(`→ ${esc(r.result)}`, r === s ? "ret" : ""));
    });
    $(".rx-th").innerHTML = th.slice(mini ? -2 : 0).join("") || `<div class="hint">—</div>`;
    $(".rx-tools").innerHTML = tools.slice(mini ? -2 : 0).join("") || `<div class="hint">—</div>`;
    const label = { start: "ready", reason: "thinking", act: "asks for a tool", observe: "reads result", end: "done" }[s.phase];
    $(".rx-llm").innerHTML = `LLM<br><span style="font-weight:400;font-size:11px">${s.turn ? "turn " + s.turn + "<br>" : ""}${label}</span>`;
    $(".rx-llm").style.borderColor = s.phase === "act" || s.phase === "observe" ? "var(--amber)" : "var(--teal)";
    if (mini) return;
    const msgs = done.flatMap((r) => r.add || []);
    $(".rx-msgs").innerHTML = msgs.map((m) => `<span class="tag" style="${m === "tool_result" ? "background:var(--mark)" : m === "user" ? "background:var(--green-soft)" : ""}">${m}</span>`).join("") + ` <span class="counter">${msgs.length}</span>`;
    $(".rx-msg").innerHTML = `<span class="tag">step ${s.wf}</span> ${s.msg}`;
    $(".rx-msg").className = "msg rx-msg" + (s.phase === "end" ? " good" : "");
    $(".rx-out").textContent = done.filter((r) => r.out).map((r) => r.out).join("\n");
    $(".rx-count").textContent = `step ${i + 1} / ${RUN.length}`;
    $(".rx-back").disabled = $(".rx-reset").disabled = i === 0;
    $(".rx-step").disabled = i === RUN.length - 1;
  }
  function stop() { clearInterval(timer); timer = null; if (!mini) $(".rx-play").textContent = "Play"; }
  function play() {
    if (timer) return stop();
    if (i === RUN.length - 1) i = 0;
    if (!mini) $(".rx-play").textContent = "Pause";
    timer = setInterval(() => { if (i < RUN.length - 1) i++; else if (mini) i = 0; else return stop(); render(); }, mini ? 1300 : 1100);
  }
  if (!mini) {
    $(".rx-reset").onclick = () => { stop(); i = 0; render(); };
    $(".rx-back").onclick = () => { stop(); if (i) i--; render(); };
    $(".rx-step").onclick = () => { stop(); if (i < RUN.length - 1) i++; render(); };
    $(".rx-play").onclick = play;
    el.tabIndex = 0;
    el.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); $(".rx-step").click(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); $(".rx-back").click(); }
    });
  }
  render();
  if (mini) play();
}

// ---------- 4 Call LLM: the request body grows ----------

function demoRequest(el) {
  const history = [
    `{"role": "user", "content": "Add error handling in the file @main.py"}`,
    `{"role": "assistant", "content": {"thought": "I need to inspect main.py first.", "tool": "Read", ...}}`,
    `{"role": "user", "content": [{"type": "tool_result", "content": "import requests..."}]}`,
    `{"role": "assistant", "content": {"thought": "I should catch the errors of missing arguments.", "tool": "Edit", ...}}`,
    `{"role": "user", "content": [{"type": "tool_result", "content": "Update successfully"}]}`,
    `{"role": "assistant", "content": {"thought": "I need to verify the code.", "tool": "Run", ...}}`,
    `{"role": "user", "content": [{"type": "tool_result", "content": "Usage: python main.py <config-file>"}]}`,
  ];
  el.innerHTML = `<div class="controls" style="margin-top:0"><label>call number <input type="range" class="rq-n" min="1" max="4" value="1"> <b class="rq-v mono">1</b></label></div>
    <div class="rq-body"></div><div class="stats rq-stats"></div>`;
  function render() {
    const n = +el.querySelector(".rq-n").value;
    el.querySelector(".rq-v").textContent = n;
    const msgs = history.slice(0, 1 + 2 * (n - 1));
    const body = `POST https://api.anthropic.com/v1/messages
{
    "model": "...",
    "system": [{"type": "text", "text": "You are a helpful coding assistant."}],
    "messages": [
        ${msgs.join(",\n        ")}
    ],
    "tools": [ /* 40+ tools' JSON Schema, every call */ ],
    "max_tokens": 16384,
    "stream": true
}`;
    el.querySelector(".rq-body").innerHTML = codeBlock(body, "repl");
    const chars = msgs.join("").length;
    el.querySelector(".rq-stats").innerHTML = `<div class="stat"><small>messages sent</small><b>${msgs.length}</b></div>
      <div class="stat"><small>message characters</small><b>${chars}</b></div>
      <div class="stat"><small>tool schemas sent</small><b>40+</b></div>`;
  }
  el.querySelector(".rq-n").oninput = render;
  render();
}

// ---------- 5 Stream processing ----------

function demoStream(el, { mini = false } = {}) {
  const tokens = CODE.mainPy.match(/\s+|[A-Za-z_]+|\d+|[^\sA-Za-z_\d]/g);
  el.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
    <div><div class="counter">streamed, token by token</div><pre class="code nonum st-a" style="min-height:${mini ? 150 : 210}px;margin:4px 0 0;padding:10px;font-size:12px;white-space:pre-wrap"></pre></div>
    <div><div class="counter">all at once, at the end</div><pre class="code nonum st-b" style="min-height:${mini ? 150 : 210}px;margin:4px 0 0;padding:10px;font-size:12px;white-space:pre-wrap"></pre></div></div>
    ${mini ? "" : `<div class="controls"><button class="cbtn on st-go">Generate</button><span class="spacer"></span><span class="counter st-n"></span></div>`}`;
  const a = el.querySelector(".st-a"), b = el.querySelector(".st-b");
  let k = 0, timer = null;
  function tick() {
    if (!el.isConnected) { clearInterval(timer); return; }
    k++;
    a.textContent = tokens.slice(0, k).join("");
    b.textContent = k < tokens.length ? "waiting…" : CODE.mainPy;
    if (!mini) el.querySelector(".st-n").textContent = `${k} / ${tokens.length} tokens`;
    if (k >= tokens.length) {
      clearInterval(timer); timer = null;
      if (mini) setTimeout(() => { if (el.isConnected) go(); }, 2500);
    }
  }
  function go() { clearInterval(timer); k = 0; a.textContent = ""; b.textContent = "waiting…"; timer = setInterval(tick, mini ? 70 : 55); }
  if (!mini) { el.querySelector(".st-go").onclick = go; b.textContent = "waiting…"; } else go();
}

// ---------- 6/7 Tools: permission, parallel reads, sequential writes ----------

const TOOL_INFO = {
  Bash: ["Executes shell commands in your environment", true],
  Edit: ["Makes targeted edits to specific files", true],
  Glob: ["Finds files based on pattern matching", false],
  Grep: ["Searches for patterns in file contents", false],
  Read: ["Reads the contents of files", false],
  Write: ["Creates or overwrites files", true],
};

function demoTools(el) {
  let picked = ["Grep", "Read", "Glob", "Edit", "Bash"];
  el.innerHTML = `<p class="hint" style="margin-top:0">Pick the tool calls the model asks for in one turn, then see how the harness runs them.</p>
    <div class="controls tl-pick" style="margin-top:0"></div><div class="svgbox tl-svg" style="margin-top:10px"></div><p class="hint tl-hint"></p>`;
  function render() {
    el.querySelector(".tl-pick").innerHTML = Object.keys(TOOL_INFO).map((t) =>
      `<button class="cbtn ${picked.includes(t) ? "on" : ""}" data-t="${t}" title="${TOOL_INFO[t][0]}">${t}${TOOL_INFO[t][1] ? " 🔒" : ""}</button>`).join("");
    el.querySelectorAll("[data-t]").forEach((b) => {
      b.onclick = () => { const t = b.dataset.t; picked = picked.includes(t) ? picked.filter((x) => x !== t) : [...picked, t]; render(); };
    });
    const reads = picked.filter((t) => !TOOL_INFO[t][1]);
    const writes = picked.filter((t) => TOOL_INFO[t][1]);
    const W = 640, unit = 90, H = 30 + Math.max(reads.length, 1) * 34 + 40;
    let g = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="tool schedule"><text x="10" y="18" font-size="11" fill="var(--stone)">time →</text>`;
    reads.forEach((t, k) => {
      g += `<rect x="10" y="${28 + k * 34}" width="${unit}" height="26" rx="5" fill="var(--green-soft)" stroke="var(--green)"/><text x="${10 + unit / 2}" y="${45 + k * 34}" text-anchor="middle" font-size="12" fill="var(--ink)">${t}</text>`;
    });
    const x0 = reads.length ? 10 + unit + 12 : 10;
    writes.forEach((t, k) => {
      const x = x0 + k * (unit + 8);
      g += `<rect x="${x}" y="28" width="${unit}" height="26" rx="5" fill="var(--mark)" stroke="var(--amber)"/><text x="${x + unit / 2}" y="45" text-anchor="middle" font-size="12" fill="var(--ink)">${t} 🔒</text>`;
    });
    const end = x0 + writes.length * (unit + 8);
    g += `<text x="${Math.min(end + 4, W - 60)}" y="45" font-size="12" fill="var(--teal)">Return</text></svg>`;
    el.querySelector(".tl-svg").innerHTML = picked.length ? g : `<p class="hint">Pick at least one tool.</p>`;
    el.querySelector(".tl-hint").innerHTML = `Read tools (${reads.join(", ") || "none"}) run <b>in parallel</b>: they change nothing, so order doesn't matter. ` +
      `Write tools (${writes.join(", ") || "none"}) run <b>in sequence</b> and need your <b>permission</b> 🔒. ` +
      `<span class="counter">The order between the two groups is drawn for illustration.</span>`;
  }
  render();
}

// ---------- 8 Check loop: what stops it ----------

function demoStop(el) {
  el.innerHTML = `<p class="hint" style="margin-top:0">A model that keeps asking for <code>Read("main.py")</code> and never says it is done. Which check stops it first?</p>
    <div class="controls" style="margin-top:0">
      <label>max turns <input type="range" class="sp-max" min="1" max="12" value="3"> <b class="sp-maxv mono">3</b></label>
      <label>message limit <input type="range" class="sp-lim" min="2" max="25" value="25"> <b class="sp-limv mono">25</b></label>
      <label>user stops at turn <select class="sp-user"><option value="0">never</option>${[1, 2, 3, 4, 5, 6].map((k) => `<option>${k}</option>`).join("")}</select></label>
      <label>API error at turn <select class="sp-api"><option value="0">never</option>${[1, 2, 3, 4, 5, 6].map((k) => `<option>${k}</option>`).join("")}</select></label>
    </div>
    <div class="console sp-out" style="margin-top:10px"></div><div class="msg sp-msg"></div>
    <p class="hint">The message limit stands in for the token limit: each turn adds two messages.</p>`;
  const $ = (q) => el.querySelector(q);
  function render() {
    const max = +$(".sp-max").value, lim = +$(".sp-lim").value, user = +$(".sp-user").value, api = +$(".sp-api").value;
    $(".sp-maxv").textContent = max; $(".sp-limv").textContent = lim;
    const out = [];
    let messages = 1, why = null;
    for (let turn = 1; turn <= max; turn++) {
      if (user === turn) { why = `the user asked to stop (turn ${turn})`; break; }
      if (api === turn) { why = `the API returned an error (turn ${turn})`; break; }
      if (messages > lim) { why = `the messages exceed the limit (${messages} > ${lim})`; break; }
      out.push(`[${turn}] Let me look again.`, `    Read('main.py') -> 'import requests'`);
      messages += 2;
    }
    if (!why) why = `it reached the maximum number of turns (${max})`;
    $(".sp-out").textContent = out.join("\n");
    $(".sp-msg").innerHTML = `Stopped: ${why}.`;
  }
  el.querySelectorAll("input,select").forEach((c) => { c.oninput = render; c.onchange = render; });
  render();
}

// ---------- Agentless vs the agent loop ----------

function demoAgentless(el, { mini = false } = {}) {
  const LOOP = ["LLM: I need to inspect main.py first.", "Read(main.py)", "LLM: I should catch the errors…", "Edit(main.py)", "LLM: I need to verify the code.", "Run(python main.py)", "LLM: No action is required."];
  const PIPE = ["LLM call 1: explore the repo structure", "LLM call 2: read the relevant file (@main.py)", "LLM call 3: fix the bug"];
  let i = 0, timer = null;
  el.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
    <div><div class="counter">AGENT · open loop, the model decides</div><div class="al-a" style="display:grid;gap:5px;margin-top:6px"></div></div>
    <div><div class="counter">AGENTLESS · fixed pipeline</div><div class="al-b" style="display:grid;gap:5px;margin-top:6px"></div></div></div>
    ${mini ? "" : `<div class="controls"><button class="cbtn al-reset">⟲ Reset</button><button class="cbtn on al-step">Step ▶</button><span class="spacer"></span><span class="counter al-n"></span></div>`}`;
  const n = Math.max(LOOP.length, PIPE.length);
  function render() {
    const row = (t, k, on) => `<div class="frame ${k === i - 1 ? "top" : ""}" style="font-size:12.5px;${on ? "" : "opacity:.25"}">${esc(t)}</div>`;
    el.querySelector(".al-a").innerHTML = LOOP.map((t, k) => row(t, k, k < i)).join("");
    el.querySelector(".al-b").innerHTML = PIPE.map((t, k) => row(t, k, k < i)).join("");
    if (mini) return;
    el.querySelector(".al-n").textContent = `step ${i} / ${n}`;
    el.querySelector(".al-step").disabled = i >= n;
  }
  if (!mini) {
    el.querySelector(".al-reset").onclick = () => { i = 0; render(); };
    el.querySelector(".al-step").onclick = () => { if (i < n) i++; render(); };
  } else {
    timer = setInterval(() => { i = i >= n ? 0 : i + 1; render(); }, 900);
  }
  render();
}

// ---------- quiz ----------

function demoQuiz(el, questions) {
  el.innerHTML = `<div class="quiz">` + questions.map((q, k) => `<div class="card q" data-k="${k}">
      <p><b>Q${k + 1}.</b> ${q.q}</p>${q.code ? codeBlock(q.code) : ""}
      <div class="opts">${q.opts.map((o, j) => `<button class="opt" data-j="${j}">${o}</button>`).join("")}</div>
      <div class="explain">${q.why}</div></div>`).join("") +
    `<p class="score"></p></div>`;
  let right = 0, done = 0;
  el.querySelectorAll(".q").forEach((qe) => {
    const q = questions[+qe.dataset.k];
    qe.querySelectorAll(".opt").forEach((b) => {
      b.onclick = () => {
        const j = +b.dataset.j;
        qe.querySelectorAll(".opt").forEach((x) => { x.disabled = true; });
        qe.querySelectorAll(".opt")[q.a].classList.add("right");
        if (j !== q.a) b.classList.add("wrong"); else right++;
        qe.classList.add("done");
        done++;
        el.querySelector(".score").textContent = `${right} / ${done} correct` + (done === questions.length ? (right === questions.length ? " — all right!" : " — reread the sections you missed.") : "");
      };
    });
  });
}

// Demo registry: data-demo="name" in chapters.js mounts DEMOS[name].
const DEMOS = {
  workflow: (el) => demoWorkflow(el),
  workflowMini: (el) => demoWorkflow(el, { mini: true }),
  input: (el) => demoInput(el),
  layers: (el) => demoLayers(el),
  react: (el) => demoReact(el),
  reactMini: (el) => demoReact(el, { mini: true }),
  request: (el) => demoRequest(el),
  stream: (el) => demoStream(el),
  streamMini: (el) => demoStream(el, { mini: true }),
  tools: (el) => demoTools(el),
  stop: (el) => demoStop(el),
  agentless: (el) => demoAgentless(el),
  agentlessMini: (el) => demoAgentless(el, { mini: true }),
  quiz: (el) => demoQuiz(el, QUIZ),
};
