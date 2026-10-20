// L03 demos. CODE and OUT are copied from csc4801/notes/L03-advanced-agents.md (checked by
// csc4801/tools/check.py); the demos replay those programs step by step.

// ---------- generated from csc4801/notes/L03-advanced-agents.md (checked by check.py) ----------

const CODE = {
  runTask: `def size(messages):
    """How much text a call sends: the characters of every message."""
    return sum(len(m["content"]) for m in messages)


def run_task(results):
    """Replay a task: one tool turn per result. Return what each call sends."""
    messages = [{"role": "user", "content": "Add error handling in the file @main.py"}]
    sent = []
    for result in results:
        sent.append(size(messages))                                   # 4 Call LLM
        messages.append({"role": "assistant", "content": "<tool call>"})
        messages.append({"role": "user", "content": result})          # 7 tool result
    sent.append(size(messages))                                       # the final call
    return sent


# Slide 7: read 10 files + run the tests 3 times + edit 5 times.
results = ["r" * 4000] * 10 + ["t" * 3000] * 3 + ["e" * 100] * 5
sent = run_task(results)
print("calls:", len(sent))
print("call 1 sends", sent[0], "characters")
print("call 19 sends", sent[-1], "characters")
print("all calls together:", sum(sent))`,
  cache: `def cached_prefix(previous, call):
    """How many leading messages of this call match the previous call."""
    n = 0
    for old, new in zip(previous, call):
        if old != new:
            break
        n += 1
    return n


def replay(calls):
    previous = []
    for k, call in enumerate(calls, 1):
        hit = cached_prefix(previous, call)
        print(f"LLM call {k}: {hit} reused from cache, {len(call) - hit} new")
        previous = call


calls = [
    ["1 User: error handling"],
    ["1 User: error handling", "2 Assistant: missing args"],
    ["1 User: error handling", "2 Assistant: missing args", "3 User: edit code"],
]
replay(calls)`,
  price: `HIT, MISS = 0.0028, 0.14    # USD per 1M input tokens: cache hit, cache miss (slide 17)

print(f"a cache miss costs {MISS / HIT:.0f} times a cache hit")


def input_cost(cached, new):
    """Dollars for one call's input tokens."""
    return (cached * HIT + new * MISS) / 1_000_000


print(f"100,000 tokens, none cached: \${input_cost(0, 100_000):.4f}")
print(f"100,000 tokens, 95,000 cached: \${input_cost(95_000, 5_000):.4f}")`,
  systemFirst: `SYSTEM = "0 System: You are a helpful coding assistant."

print("System prompt first:")
replay([[SYSTEM] + call for call in calls])
print("System prompt last:")
replay([call + [SYSTEM] for call in calls])`,
  budgetResult: `disk = {}                       # stands in for files under /tmp


def budget_result(result, name, limit=10_000):
    """Strategy 1: a result longer than the limit goes to a temp file."""
    if len(result) <= limit:
        return result
    path = f"/tmp/{name}"
    disk[path] = result
    return f"Saved to {path}, {len(result) // 1000}k in total. Preview: {result[:30]!r}"


log = "".join(f"test_{k:04d}.py PASSED\\n" for k in range(4000))   # an 80,000-character log
print(len(log))
print(budget_result("Update successfully", "edit_1"))
print(budget_result(log, "bash_1.txt"))`,
  readAgain: `def read_again(path):
    """Read again if needed: the full result is still on disk."""
    return disk[path]


print(read_again("/tmp/bash_1.txt").splitlines()[-1])`,
  budgetCount: `READ_TOOLS = {"Read", "Bash", "Grep", "Glob"}    # slide 23: can redo
WRITE_TOOLS = {"Edit", "Write"}                  # can NOT redo
CLEARED = "[Old tool result content cleared]"


def budget_count(results, keep=5):
    """Strategy 2: keep only the \`keep\` most recent read results; keep all write results."""
    reads = [k for k, r in enumerate(results) if r["tool"] in READ_TOOLS]
    old = set(reads[:-keep]) if len(reads) > keep else set()
    return [dict(r, content=CLEARED) if k in old else r for k, r in enumerate(results)]


results = [{"tool": "Read", "content": f"content of file{k}.py"} for k in range(1, 7)]
results.insert(3, {"tool": "Edit", "content": "Update successfully"})
results.append({"tool": "Bash", "content": "3 passed"})
for r in budget_count(results):
    print(f"{r['tool']:5} {r['content']}")`,
  rounds: `def rounds_of(messages):
    """Split messages into rounds: an assistant message plus its tool calls and results."""
    rounds = []
    for m in messages:
        if m["role"] == "assistant" or not rounds:
            rounds.append([])
        rounds[-1].append(m)
    return rounds


def budget_rounds(messages, keep=20):
    """Strategy 3: keep the first message (the request) and the last \`keep\` rounds."""
    rounds = rounds_of(messages[1:])
    kept = [m for r in rounds[-keep:] for m in r]
    return messages[:1] + kept


messages = [{"role": "user", "content": "Add error handling in the file @main.py"}]
for k in range(1, 71):                      # 70 rounds, as on slide 25
    messages.append({"role": "assistant", "content": f"round {k}: thought + tool call"})
    messages.append({"role": "user", "content": f"round {k}: tool result"})

short = budget_rounds(messages)
print(len(messages), "messages ->", len(short))
print(short[1]["content"])
print(short[-1]["content"])`,
  autoCompact: `WINDOW = 1000                  # a tiny context window, in characters, for the demo
TRIGGER = 0.83                 # slide 29: compact when the context still fills 83%


def summarize(messages):
    """A fake LLM call that writes the summary from the slide's checklist."""
    return ("Summary. 1 Recently modified files: main.py. 2 Agent status: tests pass. "
            "3 Plan: add the usage message. 4 Used tools: Read, Edit, Bash.")


def auto_compact(messages):
    """Strategy 4: if the context is still too full after cutting, summarize it."""
    used = size(messages) / WINDOW
    if used < TRIGGER:
        return messages, f"{used:.0%} full: no compact"
    summary = {"role": "user", "content": summarize(messages)}
    return messages[:1] + [summary], f"{used:.0%} full: compacted"


history = messages[:1] + [{"role": "assistant", "content": "x" * 100}] * 8
for n in (4, 9):
    kept, note = auto_compact(history[:n])
    print(f"{n} messages, {note} -> {len(kept)} messages, {size(kept) / WINDOW:.0%} full")`,
  collapse: `import json


def context_collapse(messages, session):
    """Strategy 5: save everything to disk, then restart the session."""
    path = f"/tmp/session_{session}.json"
    disk[path] = json.dumps(messages)
    note = f"Previous session saved to {path}. Read it if you need the details."
    return [messages[0], {"role": "user", "content": note}]


fresh = context_collapse(history, session=1)
print(len(history), "->", len(fresh), "messages")
print(fresh[1]["content"])
print(len(json.loads(disk["/tmp/session_1.json"])), "messages on disk")`,
  memory: `memory_md = []                 # MEMORY.md, written and read by the agent (dynamic memory)


def remember(kind, text):
    """Write tool: add a line to MEMORY.md."""
    memory_md.append(f"- [{kind}] {text}")


def recall():
    """Read tool: the whole of MEMORY.md, loaded into the next session's context."""
    return "\\n".join(memory_md)


remember("feedback/preference", "Use PEP 8 names.")
remember("project status", "Error handling in main.py is done.")
print(recall())`,
  vector: `import math

CHUNKS = {                     # slide 42: text chunks and their (simplified) embeddings
    1: ('For boolean checking functions, use the prefix "has_" followed by the object and property.',
        [0.12, 0.87, 0.34, 0.66]),
    2: ("Each file has most 30 functions.", [0.72, 0.21, 0.91, 0.15]),
    3: ("Folder depth at most 5 layers.", [0.31, 0.45, 0.88, 0.20]),
}


def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    return dot / (math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b)))


def search(query_vector, k=1):
    """The vector database: the k chunks whose vectors are most similar to the query."""
    scored = sorted(CHUNKS, key=lambda i: cosine(query_vector, CHUNKS[i][1]), reverse=True)
    return [(i, round(cosine(query_vector, CHUNKS[i][1]), 3)) for i in scored[:k]]


query = "Add a function to check status."
query_vector = [0.15, 0.82, 0.38, 0.61]            # slide 43
print(search(query_vector, k=3))`,
  ragPrompt: `def rag_prompt(query, query_vector):
    """Steps 1-5 on slide 44: retrieve the top chunk and put it in the prompt."""
    best, _ = search(query_vector, k=1)[0]
    return f"{query}\\n{CHUNKS[best][0]}"


print(rag_prompt(query, query_vector))`,
  userAsCode: `from dataclasses import dataclass, field
from datetime import date

# Phase 1, Memorize: flat facts, appended and never overwritten (from slide 55).
facts = [
    "[session_1, 20 January, 2023] Jon lost his job on January 19, 2023.",
    "[session_1, 20 January, 2023] Jon's former job was as a banker.",
    "[session_1, 20 January, 2023] Jon is starting a dance studio.",
]


# Phase 2, Structure: the same facts as typed Python objects (after slide 56).
@dataclass
class JobHistory:
    title: str
    date_ended: date


@dataclass
class Person:
    name: str
    jobs: list = field(default_factory=list)
    notes: list = field(default_factory=list)


jon = Person(name="Jon")
jon.jobs.append(JobHistory(title="Banker", date_ended=date(2023, 1, 19)))
jon.notes.append("Starting a dance studio")
print(jon.jobs[0].title, jon.jobs[0].date_ended.isoformat())
print(jon)`,
  polluted: `def discount_price(price, is_premium):
    return price * 0.8


def test_discount():
    assert discount_price(100, True) == 80`,
  discount: `def discount_price(price, is_premium):     # slide 58: the generated code
    return price * 0.8


def run_tests(tests):
    for t in tests:
        try:
            t()
            print(f"  {t.__name__}: passed")
        except AssertionError:
            print(f"  {t.__name__}: FAILED")


def test_discount():                        # one agent, code already in its context
    assert discount_price(100, True) == 80


def test_discount_complete():               # slide 60: a separate test subagent
    assert discount_price(100, True) == 80
    assert discount_price(100, False) == 100


print("Test written next to the code:")
run_tests([test_discount])
print("Test written by a test subagent:")
run_tests([test_discount_complete])`,
  harness: `def scripted_llm(replies):
    """A fake LLM that gives the replies in order, whatever it is sent (as in L02)."""
    replies = iter(replies)

    def call(system, messages):
        return next(replies)

    return call


def agent(name, task, llm, tools):
    """L02's loop, cut down. Each agent has its own message list."""
    messages = [{"role": "user", "content": task}]
    while True:
        reply = llm(f"You are {name}.", messages)
        messages.append({"role": "assistant", "content": reply})
        if "tool" not in reply:
            print(f"  {name} done, {len(messages)} messages in its context")
            return reply["answer"]
        result = tools[reply["tool"]]()
        messages.append({"role": "user", "content": result})


def subagent(name, task, llm):
    """A subagent is a tool: calling it runs a fresh agent with an empty context."""
    return lambda: agent(name, task, llm, tools={})


coder = scripted_llm([{"answer": "def discount_price(price, is_premium): ..."}])
tester = scripted_llm([{"answer": "def test_discount(): ...  # premium and regular users"}])
TOOLS = {
    "Coder": subagent("coder", "Generate the code to calculate discount price.", coder),
    "Tester": subagent("tester", "Generate the test for discount calculation.", tester),
}
main_llm = scripted_llm([
    {"tool": "Coder"},
    {"tool": "Tester"},
    {"answer": "Code and tests are ready."},
])
print(agent("main", "Add a function to calculate the discount price for premium users. "
            "Generate code + tests.", main_llm, TOOLS))`,
  reviewerMd: `---
name: code-reviewer
description: Reviews code for quality and best practices
tools: Read, Glob, Grep
model: sonnet
---

You are a code reviewer. When invoked, analyze the code and provide
specific, actionable feedback on quality, security, and best practices.`,
  loadSubagent: `REVIEWER_MD = """---
name: code-reviewer
description: Reviews code for quality and best practices
tools: Read, Glob, Grep
model: sonnet
---

You are a code reviewer. When invoked, analyze the code and provide
specific, actionable feedback on quality, security, and best practices."""


def load_subagent(text):
    """Split a subagent file into its settings and its system prompt."""
    _, header, body = text.split("---\\n", 2)
    settings = dict(line.split(": ", 1) for line in header.strip().splitlines())
    settings["tools"] = settings["tools"].split(", ")
    return settings, body.strip()


settings, prompt = load_subagent(REVIEWER_MD)
print(settings)
print(prompt.splitlines()[0])`,
  ex2: `cleared = [r for r in budget_count(results, keep=3) if r["content"] == CLEARED]
print(len(cleared), "cleared")
print([r["tool"] for r in budget_count(results, keep=3) if r["content"] != CLEARED])`,
  ex3: `first = input_cost(0, 10_000) + 19 * input_cost(10_000, 0)
last = 20 * input_cost(0, 10_000)
print(f"first: \${first:.6f}  last: \${last:.6f}  ratio: {last / first:.1f}")`,
};

const OUT = {
  runTask: `calls: 19
call 1 sends 39 characters
call 19 sends 49737 characters
all calls together: 607122`,
  cache: `LLM call 1: 0 reused from cache, 1 new
LLM call 2: 1 reused from cache, 1 new
LLM call 3: 2 reused from cache, 1 new`,
  price: `a cache miss costs 50 times a cache hit
100,000 tokens, none cached: $0.0140
100,000 tokens, 95,000 cached: $0.0010`,
  systemFirst: `System prompt first:
LLM call 1: 0 reused from cache, 2 new
LLM call 2: 2 reused from cache, 1 new
LLM call 3: 3 reused from cache, 1 new
System prompt last:
LLM call 1: 0 reused from cache, 2 new
LLM call 2: 1 reused from cache, 2 new
LLM call 3: 2 reused from cache, 2 new`,
  budgetResult: `80000
Update successfully
Saved to /tmp/bash_1.txt, 80k in total. Preview: 'test_0000.py PASSED\\ntest_0001.'`,
  readAgain: `test_3999.py PASSED`,
  budgetCount: `Read  [Old tool result content cleared]
Read  [Old tool result content cleared]
Read  content of file3.py
Edit  Update successfully
Read  content of file4.py
Read  content of file5.py
Read  content of file6.py
Bash  3 passed`,
  rounds: `141 messages -> 41
round 51: thought + tool call
round 70: tool result`,
  autoCompact: `4 messages, 34% full: no compact -> 4 messages, 34% full
9 messages, 84% full: compacted -> 2 messages, 17% full`,
  collapse: `9 -> 2 messages
Previous session saved to /tmp/session_1.json. Read it if you need the details.
9 messages on disk`,
  memory: `- [feedback/preference] Use PEP 8 names.
- [project status] Error handling in main.py is done.`,
  vector: `[(1, 0.998), (3, 0.751), (2, 0.548)]`,
  ragPrompt: `Add a function to check status.
For boolean checking functions, use the prefix "has_" followed by the object and property.`,
  userAsCode: `Banker 2023-01-19
Person(name='Jon', jobs=[JobHistory(title='Banker', date_ended=datetime.date(2023, 1, 19))], notes=['Starting a dance studio'])`,
  discount: `Test written next to the code:
  test_discount: passed
Test written by a test subagent:
  test_discount_complete: FAILED`,
  harness: `  coder done, 2 messages in its context
  tester done, 2 messages in its context
  main done, 6 messages in its context
Code and tests are ready.`,
  loadSubagent: `{'name': 'code-reviewer', 'description': 'Reviews code for quality and best practices', 'tools': ['Read', 'Glob', 'Grep'], 'model': 'sonnet'}
You are a code reviewer. When invoked, analyze the code and provide`,
  ex2: `4 cleared
['Edit', 'Read', 'Read', 'Bash']`,
  ex3: `first: $0.001932  last: $0.028000  ratio: 14.5`,
};

// ---------- a shared step player: Reset / Back / Step / Play, ← → keys ----------

function makeSteps(el, count, render, { mini = false, ms = 1100 } = {}) {
  let i = 0, timer = null;
  const ctl = el.querySelector(".ctl");
  if (ctl && !mini) {
    ctl.innerHTML = `<div class="controls"><button class="cbtn s-reset">⟲ Reset</button><button class="cbtn s-back">◀ Back</button>
      <button class="cbtn on s-step">Step ▶</button><button class="cbtn s-play">Play</button>
      <span class="spacer"></span><span class="counter s-count"></span></div>`;
  }
  const q = (s) => ctl.querySelector(s);
  const n = () => count();
  function draw() {
    if (i > n() - 1) i = n() - 1;
    render(i);
    if (mini || !ctl) return;
    q(".s-count").textContent = `step ${i + 1} / ${n()}`;
    q(".s-back").disabled = q(".s-reset").disabled = i === 0;
    q(".s-step").disabled = i >= n() - 1;
  }
  function stop() { clearInterval(timer); timer = null; if (!mini && ctl) q(".s-play").textContent = "Play"; }
  function play() {
    if (timer) return stop();
    if (i >= n() - 1) i = 0;
    if (!mini) q(".s-play").textContent = "Pause";
    timer = setInterval(() => {
      if (!el.isConnected) return stop();
      if (i < n() - 1) i++; else if (mini) i = 0; else return stop();
      draw();
    }, ms);
  }
  if (!mini && ctl) {
    q(".s-reset").onclick = () => { stop(); i = 0; draw(); };
    q(".s-back").onclick = () => { stop(); if (i) i--; draw(); };
    q(".s-step").onclick = () => { stop(); if (i < n() - 1) i++; draw(); };
    q(".s-play").onclick = play;
    el.tabIndex = 0;
    el.addEventListener("keydown", (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === "ArrowRight") { e.preventDefault(); q(".s-step").click(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); q(".s-back").click(); }
    });
  }
  draw();
  if (mini) play();
  return { reset() { stop(); i = 0; draw(); }, redraw: draw };
}

const fmt = (n) => n.toLocaleString("en-US");
const panel = (label, body, cls = "") => `<div class="${cls}"><div class="counter">${label}</div>${body}</div>`;
const grid = (min) => `display:grid;grid-template-columns:repeat(auto-fit,minmax(${min}px,1fr));gap:10px`;

// ---------- 1 · stateless: every call resends everything (slide 7) ----------

const TURNS = [
  ...Array.from({ length: 10 }, (_, k) => [`Read file ${k + 1}`, 4000]),
  ...Array.from({ length: 3 }, (_, k) => [`Run the tests (${k + 1})`, 3000]),
  ...Array.from({ length: 5 }, (_, k) => [`Edit (${k + 1})`, 100]),
];
const REQUEST_LEN = "Add error handling in the file @main.py".length;   // 39
const CALL_LEN = "<tool call>".length;                                   // 11
const SENT = [REQUEST_LEN];
TURNS.forEach(([, n]) => SENT.push(SENT[SENT.length - 1] + CALL_LEN + n));

function demoGrow(el, { mini = false } = {}) {
  el.innerHTML = `<div class="svgbox g-svg"></div>${mini ? "" : `<div class="msg g-msg"></div><div class="stats g-stats"></div><div class="ctl"></div>
    <p class="hint">Sizes from the notes' example: each file 4,000 characters, each test run 3,000, each edit result 100 (made up). Characters, not tokens.</p>`}`;
  const max = SENT[SENT.length - 1];
  makeSteps(el, () => SENT.length, (i) => {
    const W = 640, H = 200, bw = 28, gap = 5, x0 = 24;
    let g = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="characters sent per call">`;
    g += `<text x="${x0}" y="14" font-size="11" fill="var(--stone)">characters sent by each LLM call</text>`;
    SENT.forEach((s, k) => {
      const h = Math.max(2, (s / max) * 150), x = x0 + k * (bw + gap), y = 180 - h;
      const kind = k === 0 ? "" : TURNS[k - 1][1] === 4000 ? "var(--teal)" : TURNS[k - 1][1] === 3000 ? "var(--sea)" : "var(--amber)";
      g += `<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="3" fill="${k <= i ? (k === i ? "var(--amber)" : kind || "var(--teal)") : "var(--line)"}" opacity="${k <= i ? 1 : 0.5}"/>`;
      g += `<text x="${x + bw / 2}" y="195" text-anchor="middle" font-size="9" fill="var(--stone)">${k + 1}</text>`;
    });
    g += `</svg>`;
    el.querySelector(".g-svg").innerHTML = g;
    if (mini) return;
    const before = i === 0 ? "the request alone" : `the request + ${i} tool turn${i > 1 ? "s" : ""} (last: ${TURNS[i - 1][0]})`;
    el.querySelector(".g-msg").innerHTML = `<b>LLM call ${i + 1}</b> sends ${before}: ${1 + 2 * i} messages. The LLM is stateless, so all of them go again.` +
      (i === SENT.length - 1 ? " This is the final call: the model answers without a tool." : "");
    el.querySelector(".g-msg").className = "msg g-msg" + (i === SENT.length - 1 ? " good" : "");
    const total = SENT.slice(0, i + 1).reduce((a, b) => a + b, 0);
    el.querySelector(".g-stats").innerHTML = `<div class="stat"><small>this call sends</small><b>${fmt(SENT[i])}</b></div>
      <div class="stat"><small>all calls so far</small><b>${fmt(total)}</b></div>
      <div class="stat"><small>≈ tokens so far (÷4)</small><b>${fmt(Math.round(total / 4))}</b></div>`;
  }, { mini, ms: mini ? 450 : 700 });
}

// ---------- 2 · the prompt cache: prefix matching (slides 15–18) ----------

const CACHE_CALLS = [
  ["1 User: error handling"],
  ["1 User: error handling", "2 Assistant: missing args"],
  ["1 User: error handling", "2 Assistant: missing args", "3 User: edit code"],
];
const SYS = "0 System: You are a helpful coding assistant.";

function cachedPrefix(prev, call) {
  let n = 0;
  for (let k = 0; k < Math.min(prev.length, call.length) && prev[k] === call[k]; k++) n++;
  return n;
}

function demoCache(el, { mini = false } = {}) {
  let mode = "none";
  el.innerHTML = `${mini ? "" : `<div class="controls" style="margin-top:0">
      <button class="cbtn on" data-m="none">Slide 15–16: no system prompt</button>
      <button class="cbtn" data-m="first">System prompt first</button>
      <button class="cbtn" data-m="last">System prompt last</button></div>`}
    <div class="c-rows" style="display:grid;gap:8px;margin-top:10px"></div>
    ${mini ? "" : `<div class="msg c-msg"></div><div class="counter" style="margin-top:10px">what replay() prints</div><div class="console c-out"></div><div class="ctl"></div>
    <p class="hint"><span class="tag" style="background:var(--green-soft)">reused</span> matched the previous call's prefix · <span class="tag" style="background:var(--mark)">new</span> computed again</p>`}`;
  const build = (c) => mode === "first" ? [SYS, ...c] : mode === "last" ? [...c, SYS] : c;
  const steps = makeSteps(el, () => 3, (i) => {
    const calls = CACHE_CALLS.map(build);
    const rows = [], out = [];
    for (let k = 0; k <= i; k++) {
      const hit = cachedPrefix(k ? calls[k - 1] : [], calls[k]);
      out.push(`LLM call ${k + 1}: ${hit} reused from cache, ${calls[k].length - hit} new`);
      rows.push(`<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center"><span class="counter" style="min-width:70px">LLM call ${k + 1}</span>${calls[k].map((m, j) =>
        `<span class="frame ${k === i ? "new" : ""}" style="padding:4px 8px;font-size:12px;background:${j < hit ? "var(--green-soft)" : "var(--mark)"};${k === i ? "" : "opacity:.6"}">${esc(m.length > 28 ? m.slice(0, 26) + "…" : m)}</span>`).join("")}</div>`);
    }
    el.querySelector(".c-rows").innerHTML = rows.join("");
    if (mini) return;
    const hit = cachedPrefix(i ? calls[i - 1] : [], calls[i]);
    el.querySelector(".c-msg").innerHTML = i === 0 ? "Call 1: nothing is cached yet, so every message is new."
      : `Call ${i + 1} starts with the same ${hit} message${hit > 1 ? "s" : ""} as call ${i}: the server reuses that prefix.` +
        (mode === "last" ? " But the system prompt sits at the end, so it is new input on every call." : "");
    el.querySelector(".c-out").textContent = (mode === "first" ? "System prompt first:\n" : mode === "last" ? "System prompt last:\n" : "") + out.join("\n");
  }, { mini, ms: mini ? 1400 : 1100 });
  el.querySelectorAll("[data-m]").forEach((b) => {
    b.onclick = () => {
      mode = b.dataset.m;
      el.querySelectorAll("[data-m]").forEach((x) => x.classList.toggle("on", x === b));
      steps.reset();
    };
  });
}

// ---------- 3 · what a cache hit is worth (slide 17) ----------

function demoCost(el) {
  const HIT = 0.0028, MISS = 0.14;
  el.innerHTML = `<div class="controls" style="margin-top:0"><label>cached tokens of 100,000 <input type="range" class="k-n" min="0" max="100000" step="5000" value="95000"> <b class="k-v mono"></b></label></div>
    <div class="bars k-bars"></div><div class="stats k-stats"></div>
    <p class="hint">Prices from slide 17 (DeepSeek V4 Flash, USD per 1M input tokens): cache hit $0.0028, cache miss $0.14. The 100,000-token call is our example.</p>`;
  function render() {
    const cached = +el.querySelector(".k-n").value, fresh = 100000 - cached;
    el.querySelector(".k-v").textContent = fmt(cached);
    const cost = (cached * HIT + fresh * MISS) / 1e6, none = 100000 * MISS / 1e6;
    el.querySelector(".k-bars").innerHTML = [["none cached", none, "red"], [`${fmt(cached)} cached`, cost, "teal"]].map(([l, v, c]) =>
      `<div class="bar"><span>${l}</span><span class="track"><span class="fill ${c === "red" ? "red" : ""}" style="display:block;width:${(v / none) * 100}%"></span></span><span class="v">$${v.toFixed(4)}</span></div>`).join("");
    el.querySelector(".k-stats").innerHTML = `<div class="stat"><small>miss ÷ hit</small><b>${(MISS / HIT).toFixed(0)}×</b></div>
      <div class="stat good"><small>saved on this call</small><b>${none ? Math.round((1 - cost / none) * 100) : 0}%</b></div>`;
  }
  el.querySelector(".k-n").oninput = render;
  render();
}

// ---------- 4 · strategy 1: tool result budget (slides 21–22) ----------

function demoResult(el) {
  let big = true;
  const PREVIEW = OUT.budgetResult.split("\n")[2];
  el.innerHTML = `<div class="controls" style="margin-top:0"><button class="cbtn on" data-r="1">Bash: an 80,000-character test log</button><button class="cbtn" data-r="0">Edit: "Update successfully"</button></div>
    <div style="${grid(220)};margin-top:10px">
      ${panel("CONTEXT WINDOW · tool result vs the 10,000-character limit", `<div class="svgbox r-svg"></div>`)}
      ${panel("DISK · /tmp", `<div class="r-disk" style="display:grid;gap:6px;margin-top:6px"></div>`)}</div>
    <div class="msg r-msg"></div><div class="counter" style="margin-top:10px">in the context</div><div class="console r-out"></div><div class="ctl"></div>
    <p class="hint">The 10,000-character limit is ours; the slides give no number.</p>`;
  const STEPS_BIG = [
    ["The tests run. Bash returns the whole log: 80,000 characters, far over the limit.", 80000, false, ""],
    ["Over the threshold: the harness writes the full result into a temp file, /tmp/bash_1.txt.", 80000, true, ""],
    ["The context keeps only a short preview, not the 80,000 characters.", 120, true, PREVIEW],
    ["Later the model needs the details. Read again if needed: the file is still there.", 120, true, PREVIEW + "\n\n>>> read_again(\"/tmp/bash_1.txt\").splitlines()[-1]\n" + OUT.readAgain],
  ];
  const STEPS_SMALL = [
    ["Edit returns 19 characters.", 19, false, ""],
    ["Under the threshold: the result goes into the context unchanged.", 19, false, "Update successfully"],
  ];
  const steps = makeSteps(el, () => (big ? STEPS_BIG : STEPS_SMALL).length, (i) => {
    const [msg, len, saved, out] = (big ? STEPS_BIG : STEPS_SMALL)[i];
    const H = 180, limitY = 180 - (10000 / 80000) * 160 - 10;
    const h = Math.max(3, (len / 80000) * 160);
    el.querySelector(".r-svg").innerHTML = `<svg viewBox="0 0 260 ${H}" role="img" aria-label="tool result size">
      <rect x="60" y="10" width="80" height="170" fill="var(--teal-soft)"/>
      <rect x="60" y="${180 - h}" width="80" height="${h}" fill="${len > 10000 ? "var(--amber)" : "var(--green)"}"/>
      <line x1="40" x2="170" y1="${limitY}" y2="${limitY}" stroke="var(--red)" stroke-width="1.5"/>
      <text x="175" y="${limitY + 4}" font-size="11" fill="var(--red)">limit</text>
      <text x="175" y="${Math.max(24, 184 - h)}" font-size="11" fill="var(--ink)">${fmt(len)} chars</text></svg>`;
    el.querySelector(".r-disk").innerHTML = saved ? `<div class="frame ret"><span class="fname">/tmp/bash_1.txt</span><div class="status">80,000 characters · test_0000.py PASSED … test_3999.py PASSED</div></div>` : `<div class="hint">empty</div>`;
    el.querySelector(".r-msg").innerHTML = msg;
    el.querySelector(".r-out").textContent = out;
  });
  el.querySelectorAll("[data-r]").forEach((b) => {
    b.onclick = () => { big = b.dataset.r === "1"; el.querySelectorAll("[data-r]").forEach((x) => x.classList.toggle("on", x === b)); steps.reset(); };
  });
}

// ---------- 5 · strategy 2: tool count budget (slides 23–24) ----------

const COUNT_SEQ = [
  ["Read", "content of file1.py"], ["Read", "content of file2.py"], ["Read", "content of file3.py"],
  ["Edit", "Update successfully"], ["Read", "content of file4.py"], ["Read", "content of file5.py"],
  ["Read", "content of file6.py"], ["Bash", "3 passed"],
];
const READ_TOOLS = ["Read", "Bash", "Grep", "Glob"];

function budgetCount(results, keep) {
  const reads = results.map((r, k) => (READ_TOOLS.includes(r[0]) ? k : -1)).filter((k) => k >= 0);
  const old = new Set(reads.length > keep ? reads.slice(0, reads.length - keep) : []);
  return results.map((r, k) => (old.has(k) ? [r[0], "[Old tool result content cleared]", true] : [r[0], r[1], false]));
}

function demoCount(el) {
  el.innerHTML = `<div class="controls" style="margin-top:0"><label>keep the most recent <input type="range" class="n-keep" min="1" max="7" value="5"> <b class="n-v mono"></b> read results</label></div>
    <div class="n-list" style="display:grid;gap:5px;margin-top:10px"></div><div class="msg n-msg"></div>
    <div class="counter" style="margin-top:10px">what the loop in the notes prints</div><div class="console n-out"></div><div class="ctl"></div>
    <p class="hint">Read, Bash, Grep, Glob: can redo, so old results may go. Edit, Write: can NOT redo, so every result stays (🔒).</p>`;
  const steps = makeSteps(el, () => COUNT_SEQ.length, (i) => {
    const keep = +el.querySelector(".n-keep").value;
    el.querySelector(".n-v").textContent = keep;
    const now = budgetCount(COUNT_SEQ.slice(0, i + 1), keep);
    el.querySelector(".n-list").innerHTML = now.map(([t, c, cleared], k) => `<div class="frame ${k === i ? "new top" : ""} ${cleared ? "" : READ_TOOLS.includes(t) ? "" : "ret"}" style="font-size:12.5px;${cleared ? "opacity:.55" : ""}">
      <span class="fname">${t}${READ_TOOLS.includes(t) ? "" : " 🔒"}</span> <span class="vars">${esc(c)}</span></div>`).join("");
    const cleared = now.filter((r) => r[2]).length;
    const [t] = COUNT_SEQ[i];
    el.querySelector(".n-msg").innerHTML = `Result ${i + 1}: <b>${t}</b>. ` + (READ_TOOLS.includes(t)
      ? `${now.filter((r) => READ_TOOLS.includes(r[0])).length} read-type results so far; ${cleared} cleared.`
      : "A write result: it is kept, however old it gets.");
    el.querySelector(".n-out").textContent = now.map(([tl, c]) => `${tl.padEnd(5)} ${c}`).join("\n");
  });
  el.querySelector(".n-keep").oninput = () => steps.redraw();
}

// ---------- 6 · strategy 3: conversation round budget (slides 25–27) ----------

function demoRounds(el) {
  el.innerHTML = `<div class="controls" style="margin-top:0"><label>keep the last <input type="range" class="o-keep" min="1" max="70" value="20"> <b class="o-v mono"></b> rounds</label></div>
    <div class="o-grid" style="display:grid;grid-template-columns:repeat(14,1fr);gap:3px;margin-top:10px"></div>
    <div class="stats o-stats"></div><div class="msg o-msg"></div><div class="ctl"></div>
    <p class="hint">Each step adds one round: an assistant message plus its tool call results (2 messages). The request (message 1) always stays, as in the notes.</p>`;
  const steps = makeSteps(el, () => 70, (i) => {
    const total = i + 1, keep = +el.querySelector(".o-keep").value;
    el.querySelector(".o-v").textContent = keep;
    const first = Math.max(1, total - keep + 1);
    el.querySelector(".o-grid").innerHTML = Array.from({ length: 70 }, (_, k) => {
      const r = k + 1;
      const bg = r > total ? "var(--paper-2)" : r >= first ? "var(--green-soft)" : "var(--red-soft)";
      return `<div title="round ${r}" style="height:22px;border-radius:4px;background:${bg};font:10px/22px var(--mono);text-align:center;color:var(--stone)">${r % 10 === 0 || r === 1 ? r : ""}</div>`;
    }).join("");
    const before = 1 + 2 * total, after = 1 + 2 * Math.min(keep, total);
    el.querySelector(".o-stats").innerHTML = `<div class="stat"><small>messages</small><b>${before}</b></div>
      <div class="stat good"><small>after the budget</small><b>${after}</b></div>
      <div class="stat bad"><small>rounds removed</small><b>${total - Math.min(keep, total)}</b></div>`;
    el.querySelector(".o-msg").innerHTML = total > keep
      ? `Rounds 1–${first - 1} are removed (they may hold wrong directions); rounds ${first}–${total}, the current conversation, stay. <code>${before} messages -> ${after}</code>`
      : `${total} round${total > 1 ? "s" : ""}: within the budget, nothing removed.`;
  }, { ms: 120 });
  el.querySelector(".o-keep").oninput = () => steps.redraw();
}

// ---------- 7 · the whole context manager: cut, then compress (slides 20–33) ----------

const SEG_COLORS = {
  system: "var(--teal)", "CLAUDE.md": "var(--sea)", request: "var(--green)", "big result": "var(--amber)",
  "old reads": "#b98f4a", writes: "var(--red)", "old rounds": "var(--stone)", "recent rounds": "#7fb3ae",
  summary: "var(--mark)", pointer: "var(--green-soft)",
};
const SCENARIOS = {
  light: { label: "Cutting is enough", start: { "big result": 35, "old reads": 15, writes: 5, "old rounds": 20, "recent rounds": 12 }, summary: 4 },
  heavy: { label: "Still 83% after cutting", start: { "big result": 8, "old reads": 4, writes: 18, "old rounds": 4, "recent rounds": 55 }, summary: 4 },
  stuck: { label: "Still almost full after compact", start: { "big result": 8, "old reads": 4, writes: 18, "old rounds": 4, "recent rounds": 55 }, summary: 80 },
};
const FIXED = { system: 6, "CLAUDE.md": 3, request: 1 };

function managerSteps(sc) {
  const S = SCENARIOS[sc];
  let segs = { ...FIXED, ...S.start };
  const out = [];
  const used = () => Object.values(segs).reduce((a, b) => a + b, 0);
  const push = (title, msg) => out.push({ title, msg, segs: { ...segs }, used: used() });
  push("The window fills up", "A long task: the context fills " + used() + "% of the window.");
  segs["big result"] = 1; push("1 Tool result budget", "The huge tool result goes to /tmp; a one-line preview stays.");
  segs["old reads"] = 1; push("2 Tool count budget", "Old read results become [Old tool result content cleared]. Write results stay.");
  segs["old rounds"] = 0; push("3 Conversation round budget", "The oldest rounds are removed.");
  if (used() < 83) { push("Check: below 83%", "Cutting was enough: no compression needed."); return out; }
  push("Check: still ≥ 83%", `After cutting, the context still occupies ${used()}%: auto compact is triggered.`);
  segs = { ...FIXED, summary: S.summary };
  push("4 Auto compact", "An LLM summarizes the messages: 1 recent modified files · 2 agent status · 3 plan · 4 used tools.");
  if (used() < 90) { push("Done", `The context is down to ${used()}%. The loop goes on.`); return out; }
  push("Check: still almost full", `After all strategies the window is still ${used()}% full.`);
  segs = { ...FIXED, pointer: 1 };
  push("5 Context collapse", "Save everything into disk (/tmp/session_1.json) and restart the session with a pointer to it.");
  return out;
}

function demoManager(el, { mini = false } = {}) {
  let sc = "heavy";
  el.innerHTML = `${mini ? "" : `<div class="controls" style="margin-top:0">${Object.entries(SCENARIOS).map(([k, s]) =>
    `<button class="cbtn ${k === sc ? "on" : ""}" data-s="${k}">${s.label}</button>`).join("")}</div>`}
    <div class="svgbox m-svg" style="margin-top:8px"></div>
    ${mini ? `<div class="msg m-msg" style="margin-top:6px"></div>` : `<div class="msg m-msg"></div><div class="tags m-legend" style="margin-top:8px"></div><div class="ctl"></div>
    <p class="hint">The 83% trigger is from slide 29. The sizes of the parts are made up to show each path; "almost full" is drawn as 90% or more.</p>`}`;
  let list = managerSteps(sc);
  const steps = makeSteps(el, () => list.length, (i) => {
    const s = list[i];
    const W = 640;
    let x = 10, g = `<svg viewBox="0 0 ${W} 74" role="img" aria-label="context window">`;
    g += `<rect x="10" y="20" width="${W - 20}" height="30" rx="4" fill="var(--paper-2)" stroke="var(--line)"/>`;
    Object.entries(s.segs).forEach(([k, v]) => {
      if (!v) return;
      const w = (v / 100) * (W - 20);
      g += `<rect x="${x}" y="20" width="${w}" height="30" fill="${SEG_COLORS[k]}" stroke="var(--card)" stroke-width="1"><title>${k}: ${v}%</title></rect>`;
      x += w;
    });
    const t = 10 + 0.83 * (W - 20);
    g += `<line x1="${t}" x2="${t}" y1="12" y2="58" stroke="var(--red)" stroke-width="2" stroke-dasharray="4 3"/><text x="${t}" y="70" text-anchor="middle" font-size="11" fill="var(--red)">83%</text>`;
    g += `<text x="10" y="13" font-size="11" fill="var(--stone)">context window · ${s.used}% used</text></svg>`;
    el.querySelector(".m-svg").innerHTML = g;
    el.querySelector(".m-msg").innerHTML = `<b>${s.title}</b> — ${s.msg}`;
    el.querySelector(".m-msg").className = "msg m-msg" + (s.used < 83 && i === list.length - 1 ? " good" : "");
    if (!mini) el.querySelector(".m-legend").innerHTML = Object.keys(s.segs).filter((k) => s.segs[k]).map((k) =>
      `<span class="tag" style="box-shadow:inset 10px 0 0 ${SEG_COLORS[k]};padding-left:16px">${k} ${s.segs[k]}%</span>`).join("");
  }, { mini, ms: mini ? 1500 : 1300 });
  el.querySelectorAll("[data-s]").forEach((b) => {
    b.onclick = () => { sc = b.dataset.s; list = managerSteps(sc); el.querySelectorAll("[data-s]").forEach((x) => x.classList.toggle("on", x === b)); steps.reset(); };
  });
}

// ---------- 8 · RAG: vector search and the five steps (slides 42–44) ----------

const CHUNKS = [
  [1, 'For boolean checking functions, use the prefix "has_" followed by the object and property.', [0.12, 0.87, 0.34, 0.66]],
  [2, "Each file has most 30 functions.", [0.72, 0.21, 0.91, 0.15]],
  [3, "Folder depth at most 5 layers.", [0.31, 0.45, 0.88, 0.20]],
];
const SLIDE_Q = [0.15, 0.82, 0.38, 0.61];
const cosine = (a, b) => {
  const dot = a.reduce((s, x, k) => s + x * b[k], 0);
  const n = (v) => Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return dot / (n(a) * n(b) || 1);
};

function demoRag(el) {
  let qv = [...SLIDE_Q];
  el.innerHTML = `<p class="hint" style="margin-top:0">Query: <b>Add a function to check status.</b> Move the sliders to change its (simplified) vector.</p>
    <div class="controls q-sl" style="margin-top:0"></div><div class="controls" style="margin-top:4px"><button class="cbtn q-reset">Slide 43's query vector</button></div>
    <div class="bars q-bars"></div>
    <div class="q-flow" style="display:grid;gap:5px;margin-top:12px"></div>
    <div class="counter" style="margin-top:10px">prompt sent to the LLM</div><div class="console q-out" style="white-space:pre-wrap"></div><div class="ctl"></div>
    <p class="hint">Cosine similarity of the slide's vectors gives 0.998 for chunk 1; the slide shows 0.96, an illustrative number. The ranking is the same.</p>`;
  const FLOW = ["1 · The user's request reaches the agent.", "2 · The agent turns it into a vector and queries the vector DB.",
    "3 · The DB returns the top-1 chunk.", "4 · The agent adds that chunk to the prompt.", "5 · The prompt goes to the LLM."];
  el.querySelector(".q-sl").innerHTML = qv.map((v, k) => `<label>q[${k}] <input type="range" min="0" max="1" step="0.01" value="${v}" data-q="${k}"> <b class="mono" data-qv="${k}"></b></label>`).join("");
  const ranked = () => CHUNKS.map(([id, t, v]) => [id, t, cosine(qv, v)]).sort((a, b) => b[2] - a[2]);
  const steps = makeSteps(el, () => FLOW.length, (i) => {
    qv.forEach((v, k) => { el.querySelector(`[data-qv="${k}"]`).textContent = v.toFixed(2); });
    const r = ranked();
    el.querySelector(".q-bars").innerHTML = r.map(([id, t, s], k) => `<div class="bar"><span title="${esc(t)}">#${id} ${esc(t.slice(0, 16))}…</span><span class="track"><span class="fill ${k === 0 && i >= 2 ? "amber" : ""}" style="display:block;width:${Math.max(0, s) * 100}%"></span></span><span class="v">${s.toFixed(3)}</span></div>`).join("");
    el.querySelector(".q-flow").innerHTML = FLOW.map((f, k) => `<div class="frame ${k === i ? "top" : ""}" style="font-size:13px;${k <= i ? "" : "opacity:.35"}">${f}</div>`).join("");
    el.querySelector(".q-out").textContent = i >= 3 ? `Add a function to check status.\n${r[0][1]}` : "Add a function to check status.";
  });
  el.querySelectorAll("[data-q]").forEach((s) => { s.oninput = () => { qv[+s.dataset.q] = +s.value; steps.redraw(); }; });
  el.querySelector(".q-reset").onclick = () => { qv = [...SLIDE_Q]; el.querySelectorAll("[data-q]").forEach((s) => { s.value = qv[+s.dataset.q]; }); steps.redraw(); };
}

// ---------- 9 · similarity is not relevance (slide 46) ----------

function demoRelevance(el) {
  const HITS = [["Bug reports should store in test/ folder.", false], ["Run all tests before commit.", false], ["A common bug is due to unchecked inputs.", true]];
  el.innerHTML = `<p class="hint" style="margin-top:0">Query: <b>Does this code has bugs?</b> The vector DB returns three similar chunks. Which ones actually help answer it?</p>
    <div class="v-list" style="display:grid;gap:8px"></div><div class="msg v-msg"></div>`;
  const answers = [];
  function render() {
    el.querySelector(".v-list").innerHTML = HITS.map(([t, rel], k) => `<div class="frame ${answers[k] === undefined ? "" : rel ? "ret" : "err"}" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
      <span style="flex:1;min-width:180px">${esc(t)}</span>
      ${answers[k] === undefined ? `<button class="cbtn" data-k="${k}" data-a="1">relevant</button><button class="cbtn" data-k="${k}" data-a="0">not relevant</button>`
        : `<span class="status">${answers[k] === rel ? "✓ you agree with the slide" : "✗ the slide says otherwise"}: ${rel ? "relevant" : "similar, but not relevant"}</span>`}</div>`).join("");
    el.querySelectorAll("[data-k]").forEach((b) => { b.onclick = () => { answers[+b.dataset.k] = b.dataset.a === "1"; render(); }; });
    const done = answers.filter((a) => a !== undefined).length;
    el.querySelector(".v-msg").innerHTML = done < 3 ? `${done} / 3 judged.` : "All three came back as <b>similar</b> to the query. Only one is <b>relevant</b>. Similarity ≠ relevance.";
    el.querySelector(".v-msg").className = "msg v-msg" + (done === 3 ? " good" : "");
  }
  render();
}

// ---------- 10 · user as code: flat facts → typed objects (slides 54–56) ----------

function demoUserCode(el) {
  const RAW = `SESSION 1 · 20 January, 2023
Jon:  Lost my job as a banker yesterday, so I'm gonna take
      a shot at starting my own business.
Jon:  I'm starting a dance studio 'cause I'm passionate
      about dancing ...`;
  const [HEAD, PHASE2] = CODE.userAsCode.split("\n\n\n# Phase 2");
  const FACTS = HEAD.split("\n").slice(3).join("\n");
  
  const S = [
    ["Raw conversation", "The unstructured input the agent receives: sessions of chat, days apart (LOCOMO conv-30; an excerpt from slide 54).", RAW, "out"],
    ["Phase 1 · Memorize", "An LLM extracts every fact as a flat string and appends it, never overwriting. On the slide this gives 1,419 facts.", FACTS, "py"],
    ["Phase 2 · Structure", "An LLM rewrites the facts as typed Python objects: dates become date() objects, repeated entities become typed lists.", "# Phase 2" + PHASE2, "py"],
    ["Ask the memory", "When did Jon's job end? Flat strings: search them and parse “January 19, 2023” yourself. Structured: one attribute.", ">>> jon.jobs[0].date_ended.isoformat()\n'2023-01-19'\n\n" + OUT.userAsCode, "out"],
  ];
  el.innerHTML = `<div class="u-tabs tags"></div><div class="msg u-msg"></div><div class="u-code"></div><div class="ctl"></div>`;
  makeSteps(el, () => S.length, (i) => {
    el.querySelector(".u-tabs").innerHTML = S.map((s, k) => `<span class="tag" style="${k === i ? "background:var(--mark)" : ""}">${s[0]}</span>`).join("");
    el.querySelector(".u-msg").innerHTML = `<b>${S[i][0]}</b> — ${S[i][1]}`;
    el.querySelector(".u-code").innerHTML = codeBlock(S[i][2], S[i][3]);
  });
}

// ---------- 11 · context pollution vs subagents (slides 58–60) ----------

function demoPollution(el, { mini = false } = {}) {
  let mode = mini ? "sub" : "one", fixed = false;
  el.innerHTML = `${mini ? "" : `<div class="controls" style="margin-top:0"><button class="cbtn on" data-p="one">One agent: code + tests</button><button class="cbtn" data-p="sub">Two subagents</button></div>`}
    <div class="tags"><span class="tag" style="background:var(--green-soft)">user</span> <span style="font-size:13px">Add a function to calculate the discount price for premium users. Generate code + tests.</span></div>
    <div class="p-agents" style="${grid(200)};margin-top:10px"></div>
    ${mini ? "" : `<div class="msg p-msg"></div><div class="counter" style="margin-top:10px">run_tests()</div><div class="console p-out"></div>
    <div class="controls p-fix" style="display:none"><button class="cbtn">Fix the code (ours): price * 0.8 if is_premium else price</button></div><div class="ctl"></div>`}`;
  const CODE_TXT = () => fixed ? "def discount_price(price, is_premium):\n    return price * 0.8 if is_premium else price" : "def discount_price(price, is_premium):\n    return price * 0.8";
  const TEST1 = "def test_discount():\n    assert discount_price(100, True) == 80";
  const TEST2 = "def test_discount():\n    assert discount_price(100, True)==80\n    assert discount_price(100, False)==100";
  const price = (p, prem) => (fixed ? (prem ? p * 0.8 : p) : p * 0.8);
  const box = (title, ctx, body, on) => `<div class="frame ${on ? "top" : ""}" style="font-size:12.5px"><span class="fname">${title}</span>
    <div class="status">context: ${ctx}</div>${body ? `<pre class="code nonum" style="margin:6px 0 0;padding:6px 8px;font-size:11.5px;white-space:pre-wrap">${esc(body)}</pre>` : ""}</div>`;
  const n = () => (mode === "one" ? 4 : 5);
  const steps = makeSteps(el, n, (i) => {
    let html = "", msg = "", out = "";
    if (mode === "one") {
      html = box("Agent", i === 0 ? "the request" : i === 1 ? "the request + its own code" : "the request + its own code + its test",
        [i >= 1 ? CODE_TXT() : "", i >= 2 ? TEST1 : ""].filter(Boolean).join("\n\n"), true);
      msg = ["One agent gets the whole job.", "It writes the code. Now the code is in its context.",
        "It writes a test for the code it just wrote: only the premium case.", "The test passes. Passed testing with incomplete test cases: the regular-user case was never checked.",
      ][i];
      if (i >= 3) out = "Test written next to the code:\n  test_discount: passed";
    } else {
      html = box("Main agent", i < 3 ? "the request" : "the request + two short answers", "", i === 0 || i >= 3) +
        box("Coder subagent", i >= 1 ? "only: Generate the code to calculate discount price." : "(not started)", i >= 1 ? CODE_TXT() : "", i === 1) +
        box("Tester subagent", i >= 2 ? "only: Generate the test for discount calculation." : "(not started)", i >= 2 ? TEST2 : "", i === 2);
      const ok2 = price(100, false) === 100;
      msg = ["The main agent splits the job.", "The coder subagent writes the code in its own, isolated context.",
        "The tester subagent never sees the code. It tests the task: a premium user and a regular user.",
        "The main agent collects the two answers.",
        ok2 ? "Both assertions pass: the code is now right." : `Run the tests: discount_price(100, False) returns ${price(100, false).toFixed(1)}, not 100. The complete test catches the bug.`][i];
      if (i >= 4) out = ok2 ? "Test written by a test subagent:\n  test_discount_complete: passed" : "Test written by a test subagent:\n  test_discount_complete: FAILED";
    }
    el.querySelector(".p-agents").innerHTML = html;
    if (mini) return;
    el.querySelector(".p-msg").innerHTML = msg;
    el.querySelector(".p-msg").className = "msg p-msg" + (out.includes("FAILED") ? " bad" : out && mode === "sub" ? " good" : "");
    el.querySelector(".p-out").textContent = out;
    el.querySelector(".p-fix").style.display = mode === "sub" && i === 4 && !fixed ? "" : "none";
  }, { mini, ms: mini ? 1600 : 1300 });
  if (mini) return;
  el.querySelectorAll("[data-p]").forEach((b) => {
    b.onclick = () => { mode = b.dataset.p; fixed = false; el.querySelectorAll("[data-p]").forEach((x) => x.classList.toggle("on", x === b)); steps.reset(); };
  });
  el.querySelector(".p-fix button").onclick = () => { fixed = true; steps.redraw(); };
}

// ---------- 12 · a subagent is a tool with a fresh context (the harness in the notes) ----------

const SUB_RUN = [
  ["main", "user", "Add a function … Generate code + tests.", "The main agent starts with the request.", ""],
  ["main", "assistant", '{"tool": "Coder"}', "The main LLM asks for the Coder tool, which is a subagent.", ""],
  ["coder", "user", "Generate the code to calculate discount price.", "Calling the tool runs a fresh agent. Its context: only its task.", ""],
  ["coder", "assistant", "def discount_price(price, is_premium): ...", "The coder answers without a tool, so its loop ends.", "  coder done, 2 messages in its context"],
  ["main", "user", "def discount_price(price, is_premium): ...", "Only the coder's final answer comes back, as the tool result.", ""],
  ["main", "assistant", '{"tool": "Tester"}', "The main LLM asks for the Tester subagent.", ""],
  ["tester", "user", "Generate the test for discount calculation.", "Another fresh context. The tester never sees the coder's messages.", ""],
  ["tester", "assistant", "def test_discount(): ...  # premium and regular users", "The tester answers.", "  tester done, 2 messages in its context"],
  ["main", "user", "def test_discount(): ...  # premium and regular users", "Its answer comes back to the main agent.", ""],
  ["main", "assistant", "Code and tests are ready.", "No tool: the main agent ends.", "  main done, 6 messages in its context\nCode and tests are ready."],
];

function demoSubRun(el) {
  el.innerHTML = `<div class="s-cols" style="${grid(180)}"></div><div class="msg s-msg"></div>
    <div class="counter" style="margin-top:10px">what the harness prints</div><div class="console s-out"></div><div class="ctl"></div>`;
  makeSteps(el, () => SUB_RUN.length, (i) => {
    const done = SUB_RUN.slice(0, i + 1);
    el.querySelector(".s-cols").innerHTML = ["main", "coder", "tester"].map((a) => {
      const ms = done.filter((r) => r[0] === a);
      return `<div><div class="counter">${a.toUpperCase()} · ${ms.length} messages</div><div style="display:grid;gap:5px;margin-top:6px">${ms.map((r) =>
        `<div class="frame ${r === SUB_RUN[i] ? "new top" : ""}" style="font-size:12px"><span class="tag" style="${r[1] === "user" ? "background:var(--green-soft)" : ""}">${r[1]}</span> ${esc(r[2])}</div>`).join("") || `<div class="hint">—</div>`}</div></div>`;
    }).join("");
    el.querySelector(".s-msg").innerHTML = SUB_RUN[i][3];
    el.querySelector(".s-out").textContent = done.map((r) => r[4]).filter(Boolean).join("\n");
  });
}

// ---------- 13 · a predefined subagent file (slide 64) ----------

function pyRepr(v) {
  if (Array.isArray(v)) return `[${v.map(pyRepr).join(", ")}]`;
  if (typeof v === "object") return `{${Object.entries(v).map(([k, x]) => `${pyRepr(k)}: ${pyRepr(x)}`).join(", ")}}`;
  return `'${String(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

function demoSubFile(el) {
  el.innerHTML = `<p class="hint" style="margin-top:0">Edit the file: change the tools, the model, or the prompt. The box below runs <code>load_subagent</code> from the notes (ported to JavaScript).</p>
    <textarea class="f-text" spellcheck="false" style="width:100%;box-sizing:border-box;min-height:190px;font:12.5px/1.5 var(--mono);padding:10px;border:1px solid var(--line);border-radius:8px;background:var(--code-bg);color:var(--ink)"></textarea>
    <div class="controls"><button class="cbtn f-reset">Slide 64's file</button></div>
    <div class="counter" style="margin-top:6px">print(settings); print(prompt.splitlines()[0])</div><div class="console f-out" style="white-space:pre-wrap"></div><div class="msg f-msg"></div>`;
  const ta = el.querySelector(".f-text");
  function render() {
    const text = ta.value;
    const parts = text.split("---\n");
    try {
      if (parts.length < 3) throw new Error("ValueError: need a header between two --- lines");
      const header = parts[1], body = parts.slice(2).join("---\n");
      const settings = {};
      header.trim().split("\n").forEach((line) => {
        const k = line.indexOf(": ");
        if (k < 0) throw new Error(`ValueError: no ": " in ${JSON.stringify(line)}`);
        settings[line.slice(0, k)] = line.slice(k + 2);
      });
      if (!("tools" in settings)) throw new Error("KeyError: 'tools'");
      settings.tools = settings.tools.split(", ");
      el.querySelector(".f-out").textContent = pyRepr(settings) + "\n" + body.trim().split("\n")[0];
      const writes = settings.tools.filter((t) => ["Edit", "Write", "Bash"].includes(t));
      el.querySelector(".f-msg").innerHTML = writes.length ? `This subagent can change things (${writes.join(", ")}): those tools need permission.` : "Read-only tools: this reviewer can look but not change anything.";
      el.querySelector(".f-msg").className = "msg f-msg" + (writes.length ? " bad" : " good");
    } catch (e) {
      el.querySelector(".f-out").textContent = e.message;
      el.querySelector(".f-msg").innerHTML = "The file does not parse.";
      el.querySelector(".f-msg").className = "msg f-msg bad";
    }
  }
  ta.value = CODE.reviewerMd;
  ta.oninput = render;
  el.querySelector(".f-reset").onclick = () => { ta.value = CODE.reviewerMd; render(); };
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
  grow: (el) => demoGrow(el),
  growMini: (el) => demoGrow(el, { mini: true }),
  cache: (el) => demoCache(el),
  cacheMini: (el) => demoCache(el, { mini: true }),
  cost: (el) => demoCost(el),
  result: (el) => demoResult(el),
  count: (el) => demoCount(el),
  rounds: (el) => demoRounds(el),
  manager: (el) => demoManager(el),
  managerMini: (el) => demoManager(el, { mini: true }),
  rag: (el) => demoRag(el),
  relevance: (el) => demoRelevance(el),
  userCode: (el) => demoUserCode(el),
  pollution: (el) => demoPollution(el),
  pollutionMini: (el) => demoPollution(el, { mini: true }),
  subRun: (el) => demoSubRun(el),
  subFile: (el) => demoSubFile(el),
  quiz: (el) => demoQuiz(el, QUIZ),
};
