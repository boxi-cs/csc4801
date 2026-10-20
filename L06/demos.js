// L06 demos. Code panels and printed outputs are copied from csc4801/notes/L06-requirements.md
// (checked by csc4801/tools/check.py): CODE below is generated from the notes' fenced blocks.
// The JS twins of the Python programs replay the same runs, step by step.

const CODE = {
  elicit: "REQS = {\n    \"REQ1\": 'When the user presses the \"Up\" button on a floor, the Elevator System shall '\n            \"prioritize servicing the requested floor, moving upwards if necessary, \"\n            \"and open its doors upon arrival.\",\n    \"REQ2\": 'When the user presses the \"Down\" button on a floor, the Elevator System shall '\n            \"prioritize servicing the requested floor, moving downwards if necessary, \"\n            \"and open its doors upon arrival.\",\n    \"REQ3\": \"When the user presses any floor button inside the elevator, the Elevator System \"\n            \"shall prioritize servicing the selected floor, moving upwards or downwards as \"\n            \"needed, and open its doors upon arrival.\",\n    \"REQ4\": \"When the overload sensor detects excessive weight in the elevator cabin, the \"\n            \"Elevator System shall prevent further entry, emit an audible alarm, and display \"\n            \"an overload warning. It shall not move until the excess weight is reduced and \"\n            'remain in the \"Overload\" state until the weight is within the acceptable limit.',\n    \"REQ5\": \"When the user presses any floor button inside the elevator while the system is \"\n            'in the \"Overload\" state, the Elevator System shall ignore the button press until '\n            \"the overload condition is resolved.\",\n}\n\n# Scripted user agents: each persona's answer, and the need a (fake) extractor pulls out.\nINTERVIEWS = {\n    \"Children\": (\"I can't reach the buttons at the top.\", \"buttons a child can reach\", \"reach\"),\n    \"The aged\": (\"The doors close before I am inside.\", \"doors that stay open longer\", \"longer\"),\n    \"Workers\": (\"With a full trolley it often says overload.\", \"a clear overload warning\", \"overload\"),\n    \"Managers\": (\"Our electricity bill is high.\", \"save energy when idle\", \"energy\"),\n}\n\n\ndef covered_by(keyword):\n    \"\"\"Which requirements already mention the need? (A crude stand-in for an LLM.)\"\"\"\n    return [rid for rid, text in REQS.items() if keyword in text.lower()]\n\n\nfor persona, (answer, need, keyword) in INTERVIEWS.items():\n    hits = covered_by(keyword)\n    status = \"covered by \" + \", \".join(hits) if hits else \"LATENT need\"\n    print(f\"{persona:8} | {answer}\")\n    print(f\"{'':8} | need: {need} -> {status}\")",  // python
  elicitOut: "Children | I can't reach the buttons at the top.\n         | need: buttons a child can reach -> LATENT need\nThe aged | The doors close before I am inside.\n         | need: doors that stay open longer -> LATENT need\nWorkers  | With a full trolley it often says overload.\n         | need: a clear overload warning -> covered by REQ4, REQ5\nManagers | Our electricity bill is high.\n         | need: save energy when idle -> LATENT need",  // {.text .output}
  ltl: "def holds(f, trace, i=0):\n    \"\"\"Does formula f hold on the trace from step i? Formulas are tuples.\"\"\"\n    op = f[0]\n    if op == \"ap\":                      # an atomic proposition: the light's colour\n        return trace[i] == f[1]\n    if op == \"->\":\n        return not holds(f[1], trace, i) or holds(f[2], trace, i)\n    if op == \"X\":                       # next\n        return i + 1 < len(trace) and holds(f[1], trace, i + 1)\n    if op == \"G\":                       # always (from now on)\n        return all(holds(f[1], trace, j) for j in range(i, len(trace)))\n    if op == \"F\":                       # eventually\n        return any(holds(f[1], trace, j) for j in range(i, len(trace)))\n    raise ValueError(op)\n\n\ndef show(f):\n    if f[0] == \"ap\":\n        return f[1]\n    if f[0] == \"->\":\n        return f\"({show(f[1])} -> {show(f[2])})\"\n    return f\"{f[0]} {show(f[1])}\"\n\n\nred, green = (\"ap\", \"red\"), (\"ap\", \"green\")\nPROPERTIES = [(\"F\", green), (\"G\", (\"->\", red, (\"X\", green)))]\nTRACES = [\n    [\"red\", \"green\", \"yellow\", \"red\", \"green\"],\n    [\"red\", \"red\", \"green\"],\n    [\"yellow\", \"yellow\", \"yellow\"],\n]\nfor trace in TRACES:\n    print(\"trace:\", \" \".join(trace))\n    for f in PROPERTIES:\n        print(f\"  {show(f):20} {holds(f, trace)}\")",  // python
  ltlOut: "trace: red green yellow red green\n  F green              True\n  G (red -> X green)   True\ntrace: red red green\n  F green              True\n  G (red -> X green)   False\ntrace: yellow yellow yellow\n  F green              False\n  G (red -> X green)   True",  // {.text .output}
  nl2spec: "from collections import Counter\n\n# Three tries of a scripted LLM on slide 16's sentence:\n# \"Globally, grant 0 and grant 1 do not hold at the same time until it is allowed.\"\nTRIES = [\n    {\"and\": \"&\", \"until\": \"U\", \"it is allowed\": \"a\",\n     \"do not hold at the same time\": \"~(g0 & g1)\", \"globally\": \"G\",\n     \"grant 0\": \"g0\", \"grant 1\": \"g1\"},\n    {\"do not hold at the same time\": \"~(g0 & g1)\", \"globally\": \"G\",\n     \"grant 0\": \"g0\", \"grant 1\": \"g1\"},\n    {\"grant 0\": \"g0\", \"grant 1\": \"g1\"},\n]\nFINAL = [\"G((!((g0 & g1)) U a))\"] * 3   # the formula each try ends with\n\ncounts = Counter(pair for t in TRIES for pair in t.items())\nfor (phrase, ltl), n in sorted(counts.items(), key=lambda kv: kv[1]):\n    print(f\"{phrase:28} -> {ltl:11} {n / len(TRIES):>7.2%}\")\nformula, n = Counter(FINAL).most_common(1)[0]\nprint(f\"{'Final result':28} -> {formula} {n / len(FINAL):.2%}\")",  // python
  nl2specOut: "and                          -> &            33.33%\nuntil                        -> U            33.33%\nit is allowed                -> a            33.33%\ndo not hold at the same time -> ~(g0 & g1)   66.67%\nglobally                     -> G            66.67%\ngrant 0                      -> g0          100.00%\ngrant 1                      -> g1          100.00%\nFinal result                 -> G((!((g0 & g1)) U a)) 100.00%",  // {.text .output}
  checker: "def check_response(model, start, p, q):\n    \"\"\"Check G (p -> F q) on every execution of the model.\n\n    Returns None if it holds, or a counterexample: a path that reaches p and\n    then never reaches q, because it loops or stops.\n    \"\"\"\n    def search(path, waiting):\n        state = path[-1]\n        if state == q:\n            waiting = None                       # the request got its response\n        elif state == p and waiting is None:\n            waiting = len(path) - 1              # a new request is waiting\n        if waiting is not None and not model[state]:\n            return path                          # stops without a response\n        for nxt in model[state]:\n            if nxt in path:                      # closes a loop\n                loop = path[path.index(nxt):]\n                if waiting is not None and q not in loop:\n                    return path + [nxt]          # the loop repeats forever\n                continue\n            found = search(path + [nxt], waiting)\n            if found:\n                return found\n        return None\n\n    return search([start], None)\n\n\nMODELS = {\n    \"model A\": {\"idle\": [\"request\"], \"request\": [\"busy\"],\n                \"busy\": [\"response\"], \"response\": [\"idle\"]},\n    \"model B\": {\"idle\": [\"request\"], \"request\": [\"busy\"],\n                \"busy\": [\"response\", \"busy\"], \"response\": [\"idle\"]},\n}\nfor name, model in MODELS.items():\n    cex = check_response(model, \"idle\", \"request\", \"response\")\n    if cex is None:\n        print(f\"{name}: G (request -> F response) holds\")\n    else:\n        print(f\"{name}: counterexample {' -> '.join(cex)} -> ...\")",  // python
  checkerOut: "model A: G (request -> F response) holds\nmodel B: counterexample idle -> request -> busy -> busy -> ...",  // {.text .output}
  maxPseudo: "fun max (a, b):\n    if a > b then a else b",  // text
  lean: "def IsMaximum (a b result : Nat) : Prop :=\n    a ≤ result ∧ b ≤ result ∧ (result = a ∨ result = b)",  // lean
  maxSpec: "def is_maximum(a, b, result):\n    \"\"\"Slide 20's IsMaximum, in Python.\"\"\"\n    return a <= result and b <= result and (result == a or result == b)\n\n\ndef max_slides(a, b):          # slide 19: if a > b then a else b\n    return a if a > b else b\n\n\ndef always_big(a, b):\n    return 1_000_000\n\n\ndef first(a, b):\n    return a\n\n\ndef check(spec, impl, n=10):\n    \"\"\"Try every a, b below n. A test of the spec, not a proof.\"\"\"\n    for a in range(n):\n        for b in range(n):\n            if not spec(a, b, impl(a, b)):\n                return f\"fails at a={a}, b={b} (result {impl(a, b)})\"\n    return f\"ok for all a, b < {n}\"\n\n\nfor impl in [max_slides, always_big, first]:\n    print(f\"{impl.__name__:10} {check(is_maximum, impl)}\")",  // python
  maxSpecOut: "max_slides ok for all a, b < 10\nalways_big fails at a=0, b=0 (result 1000000)\nfirst      fails at a=0, b=1 (result 0)",  // {.text .output}
  weakSpec: "def at_least_both(a, b, result):\n    \"\"\"Conditions 1 and 2 only.\"\"\"\n    return a <= result and b <= result\n\n\nfor impl in [max_slides, always_big, first]:\n    print(f\"{impl.__name__:10} {check(at_least_both, impl)}\")",  // python
  weakSpecOut: "max_slides ok for all a, b < 10\nalways_big ok for all a, b < 10\nfirst      fails at a=0, b=1 (result 0)",  // {.text .output}
  jmlFeedback: "User: The JML specifications you generated fail verification with error information as follows:\nInputCode.java: LineNum1: ......\nInputCode.java: LineNum2: ......\nPlease generate again. To fix such error, you may consider <Guidance>",  // text
  specgen: "import re\n\n\ndef verify(spec):\n    \"\"\"Stand-in verifier: does max_slides satisfy the spec for all a, b < 10?\"\"\"\n    for a in range(10):\n        for b in range(10):\n            result = max_slides(a, b)\n            if not eval(spec, {}, {\"a\": a, \"b\": b, \"result\": result}):\n                return f\"fails at a={a}, b={b}\"\n    return \"verified\"\n\n\ndef scripted_llm(replies):\n    \"\"\"A fake LLM that gives the replies in order, whatever it is sent.\"\"\"\n    replies = iter(replies)\n    return lambda prompt: next(replies)\n\n\ndef mutants(spec):\n    \"\"\"Change one comparison operator at a time.\"\"\"\n    ops = [\">=\", \"<=\", \">\", \"<\", \"==\"]\n    out = []\n    for m in re.finditer(r\">=|<=|==|>|<\", spec):\n        for op in ops:\n            if op != m.group():\n                out.append(spec[:m.start()] + op + spec[m.end():])\n    return out\n\n\ndef specgen(llm, rounds=2):\n    prompt = \"Write a specification for max_slides.\"\n    spec = None\n    for k in range(1, rounds + 1):                     # conversation-driven\n        spec = llm(prompt)\n        verdict = verify(spec)\n        print(f\"try {k}: {spec:30} {verdict}\")\n        if verdict == \"verified\":\n            return spec\n        prompt = (f\"The specification you generated fails verification: {verdict}. \"\n                  \"Please generate again.\")\n    print(\"conversation failed -> mutation\")            # mutation-based\n    for m in mutants(spec):\n        verdict = verify(m)\n        print(f\"  mutant: {m:30} {verdict}\")\n        if verdict == \"verified\":\n            return m\n    return None\n\n\nllm = scripted_llm([\"result > a and result > b\", \"result >= a and result > b\"])\nprint(\"selected:\", specgen(llm))",  // python
  specgenOut: "try 1: result > a and result > b      fails at a=0, b=0\ntry 2: result >= a and result > b     fails at a=0, b=0\nconversation failed -> mutation\n  mutant: result <= a and result > b     fails at a=0, b=0\n  mutant: result > a and result > b      fails at a=0, b=0\n  mutant: result < a and result > b      fails at a=0, b=0\n  mutant: result == a and result > b     fails at a=0, b=0\n  mutant: result >= a and result >= b    verified\nselected: result >= a and result >= b",  // {.text .output}
  consistency: "from itertools import combinations\n\n# REQ1-REQ5 as (event, state, action). The reading is ours, not the slides'.\nRULES = [\n    (\"REQ1\", \"Up button on a floor\", \"any\", \"move\"),\n    (\"REQ2\", \"Down button on a floor\", \"any\", \"move\"),\n    (\"REQ3\", \"floor button inside\", \"any\", \"move\"),\n    (\"REQ4\", \"any\", \"Overload\", \"not move\"),\n    (\"REQ5\", \"floor button inside\", \"Overload\", \"ignore press\"),\n]\nCONFLICTS = [{\"move\", \"not move\"}, {\"move\", \"ignore press\"}]\n\n\ndef overlap(x, y):\n    return x == \"any\" or y == \"any\" or x == y\n\n\ndef narrow(x, y):\n    return y if x == \"any\" else x\n\n\nfor (r1, e1, s1, a1), (r2, e2, s2, a2) in combinations(RULES, 2):\n    if overlap(e1, e2) and overlap(s1, s2) and {a1, a2} in CONFLICTS:\n        print(f\"{r1} vs {r2}: {narrow(e1, e2)!r} in state {narrow(s1, s2)}: {a1} / {a2}\")",  // python
  consistencyOut: "REQ1 vs REQ4: 'Up button on a floor' in state Overload: move / not move\nREQ2 vs REQ4: 'Down button on a floor' in state Overload: move / not move\nREQ3 vs REQ4: 'floor button inside' in state Overload: move / not move\nREQ3 vs REQ5: 'floor button inside' in state Overload: move / ignore press",  // {.text .output}
  featureMap: "from graphlib import TopologicalSorter\n\n# Slide 32's feature map for a timer app: feature -> the features it builds on.\nFEATURES = {\n    \"View Timer List\": [\"Create a Timer\"],\n    \"Edit a Timer\": [\"View Timer List\"],\n    \"Delete a Timer\": [\"View Timer List\"],\n    \"Start a Timer\": [\"View Timer List\"],\n    \"Stop the Timer\": [\"Start a Timer\"],\n    \"Pause the Timer\": [\"Start a Timer\"],\n    \"Resume the Timer\": [\"Pause the Timer\"],\n    \"Notify Timer Completion\": [\"Stop the Timer\"],\n    \"View Timer History\": [\"Stop the Timer\"],\n    \"Restart Timers\": [\"View Timer History\"],\n}\norder = TopologicalSorter(FEATURES)\norder.prepare()\nstep = 1\nwhile order.is_active():\n    ready = sorted(order.get_ready())\n    print(f\"round {step}: {', '.join(ready)}\")\n    order.done(*ready)\n    step += 1",  // python
  featureMapOut: "round 1: Create a Timer\nround 2: View Timer List\nround 3: Delete a Timer, Edit a Timer, Start a Timer\nround 4: Pause the Timer, Stop the Timer\nround 5: Notify Timer Completion, Resume the Timer, View Timer History\nround 6: Restart Timers",  // {.text .output}
  ambiguity: "# \"Insufficient user balance reject transactions.\"  Two agents, two readings.\ndef agent_a(balance, amount):\n    return \"reject\" if balance < amount else \"accept\"\n\n\ndef agent_b(balance, amount):\n    return \"reject\" if balance <= amount else \"accept\"\n\n\nprint(\"balance amount  agent A  agent B\")\nfor balance, amount in [(50, 100), (100, 100), (150, 100)]:\n    a, b = agent_a(balance, amount), agent_b(balance, amount)\n    flag = \"   <- they disagree\" if a != b else \"\"\n    print(f\"{balance:7} {amount:6}  {a:7}  {b}{flag}\")",  // python
  ambiguityOut: "balance amount  agent A  agent B\n     50    100  reject   reject\n    100    100  accept   reject   <- they disagree\n    150    100  accept   accept",  // {.text .output}
  ex1: "red_then_green = (\"G\", (\"->\", red, (\"F\", green)))\nfor trace in TRACES:\n    print(f\"{' '.join(trace):26} {holds(red_then_green, trace)}\")",  // python
  ex1Out: "red green yellow red green True\nred red green              True\nyellow yellow yellow       True",  // {.text .output}
  ex2: "def holds2(f, trace, i=0):\n    \"\"\"holds() with sets of propositions per step, `not`, and U (until).\"\"\"\n    op = f[0]\n    if op == \"ap\":\n        return f[1] in trace[i]\n    if op == \"not\":\n        return not holds2(f[1], trace, i)\n    if op == \"and\":\n        return holds2(f[1], trace, i) and holds2(f[2], trace, i)\n    if op == \"G\":\n        return all(holds2(f[1], trace, j) for j in range(i, len(trace)))\n    if op == \"U\":\n        for j in range(i, len(trace)):\n            if holds2(f[2], trace, j):\n                return True\n            if not holds2(f[1], trace, j):\n                return False\n        return False\n    raise ValueError(op)\n\n\ng0, g1, a = (\"ap\", \"g0\"), (\"ap\", \"g1\"), (\"ap\", \"a\")\nspec = (\"G\", (\"U\", (\"not\", (\"and\", g0, g1)), a))\nok = [{\"g0\"}, {\"g1\"}, {\"a\"}, {\"g0\", \"g1\", \"a\"}]\nbad = [{\"g0\"}, {\"g0\", \"g1\"}, {\"a\"}]\nprint(\"ok: \", holds2(spec, ok))\nprint(\"bad:\", holds2(spec, bad))",  // python
  ex2Out: "ok:  True\nbad: False",  // {.text .output}
};

const lines = (s) => s.split("\n");

// A step player: Reset / Back / Step / Play, ← → keys. render(i) draws step i of n.
function player(el, n, render, { mini = false, ms = 900, ctl = null } = {}) {
  let i = 0, timer = null;
  const box = ctl || el;
  if (!mini) {
    box.insertAdjacentHTML("beforeend", `<div class="controls"><button class="cbtn p-reset">⟲ Reset</button><button class="cbtn p-back">◀ Back</button>
      <button class="cbtn p-step on">Step ▶</button><button class="cbtn p-play">Play</button>
      <span class="spacer"></span><span class="counter p-count"></span></div>`);
  }
  const $ = (q) => box.querySelector(q);
  function draw() {
    render(i);
    if (mini) return;
    $(".p-count").textContent = `step ${i + 1} / ${n()}`;
    $(".p-back").disabled = $(".p-reset").disabled = i === 0;
    $(".p-step").disabled = i >= n() - 1;
  }
  function stop() { clearInterval(timer); timer = null; if (!mini) $(".p-play").textContent = "Play"; }
  function play() {
    if (timer) return stop();
    if (i >= n() - 1) i = 0;
    if (!mini) $(".p-play").textContent = "Pause";
    timer = setInterval(() => {
      if (!el.isConnected) return stop();
      if (i < n() - 1) i++; else if (mini) i = 0; else return stop();
      draw();
    }, ms);
  }
  if (!mini) {
    $(".p-reset").onclick = () => { stop(); i = 0; draw(); };
    $(".p-back").onclick = () => { stop(); if (i) i--; draw(); };
    $(".p-step").onclick = () => { stop(); if (i < n() - 1) i++; draw(); };
    $(".p-play").onclick = play;
    el.tabIndex = 0;
    el.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
      if (e.key === "ArrowRight") { e.preventDefault(); $(".p-step").click(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); $(".p-back").click(); }
    });
  }
  draw();
  if (mini) play();
  return { reset: () => { stop(); i = 0; draw(); }, redraw: draw, go: (k) => { stop(); i = k; draw(); } };
}

// ---------- the requirement engineering cycle (slides 7 and 33) ----------

const ACTS = [
  { name: "Elicitation", slides: "8–12", def: "AI extracts latent needs from unstructured meeting transcripts and user review.",
    ai: "Agents simulate users (children, the aged, workers, managers) and are interviewed; latent needs are extracted from the answers." },
  { name: "Modeling", slides: "13–21", def: "AI identifies entities/relationships to construct UML or formal specifications.",
    ai: "Translate requirements into LTL (nl2spec) or Lean 4; a model checker returns counterexamples." },
  { name: "Specification", slides: "22–25", def: "Requirements are determined and documented.",
    ai: "Call an LLM to write specifications (e.g. JML) and send verifier errors back; SpecGen adds mutation." },
  { name: "Validation", slides: "26–29", def: "AI scores requirements against rules.",
    ai: "Check consistency; rate requirements as unambiguous, understandable, correct, verifiable. (Section slide 26 is titled Verification.)" },
  { name: "Management", slides: "30–32", def: "AI refines and adapts requirements.",
    ai: "Four-layer change detection for revised legal texts; a feature map of dependencies across features." },
];
const ACT_COLOR = ["var(--amber)", "var(--green)", "var(--teal)", "var(--green)", "var(--red)"];

function cycleSVG(active) {
  const cx = 200, cy = 140, r = 105;
  const pos = ACTS.map((_, k) => {
    const t = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
    return [cx + r * Math.cos(t), cy + r * Math.sin(t)];
  });
  let g = `<svg viewBox="0 0 400 280" role="img" aria-label="Requirement engineering cycle">
    <defs><marker id="ca" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="var(--stone)"/></marker></defs>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--line)" stroke-width="10"/>`;
  pos.forEach(([x, y], k) => {
    const [nx, ny] = pos[(k + 1) % 5];
    const mx = (x + nx) / 2, my = (y + ny) / 2;
    const dx = nx - x, dy = ny - y, L = Math.hypot(dx, dy);
    g += `<path d="M ${mx - (dx / L) * 6} ${my - (dy / L) * 6} L ${mx + (dx / L) * 6} ${my + (dy / L) * 6}" stroke="var(--stone)" stroke-width="1.5" marker-end="url(#ca)"/>`;
  });
  pos.forEach(([x, y], k) => {
    const on = k === active;
    g += `<rect x="${x - 58}" y="${y - 17}" width="116" height="34" rx="8" fill="${on ? "var(--mark)" : "var(--card)"}" stroke="${on ? "var(--amber)" : ACT_COLOR[k]}" stroke-width="${on ? 3 : 1.6}" data-act="${k}" style="cursor:pointer"/>
      <text x="${x}" y="${y + 5}" text-anchor="middle" font-size="13" font-weight="${on ? 700 : 500}" fill="var(--ink)" pointer-events="none">${ACTS[k].name}</text>`;
  });
  return g + `<text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="12" fill="var(--stone)">requirements</text></svg>`;
}

function demoCycle(el, { mini = false } = {}) {
  el.innerHTML = `<div class="svgbox cy-svg"></div>${mini ? "" : `<div class="msg cy-msg"></div>`}`;
  const N = 6;
  const p = player(el, () => N, (i) => {
    const k = i % 5;
    el.querySelector(".cy-svg").innerHTML = cycleSVG(k);
    if (mini) return;
    const a = ACTS[k];
    el.querySelector(".cy-msg").innerHTML = i === 5
      ? `<b>Back to Elicitation.</b> Management feeds new needs into the next round: requirements are never finished.`
      : `<b>${i + 1}. ${a.name}</b> <span class="counter">slides ${a.slides}</span><br><em>“${a.def}”</em><br>What AI does here: ${a.ai}`;
    el.querySelectorAll("[data-act]").forEach((n) => { n.onclick = () => p.go(+n.dataset.act); });
  }, { mini, ms: mini ? 1500 : 1600 });
}

// ---------- which activity? (classify AI tasks into the deck's five activities) ----------

const TASKS = [
  ["Read meeting transcripts and user reviews to find needs nobody wrote down.", 0, "Slide 8: elicitation extracts latent needs from unstructured transcripts and reviews."],
  ["Interview simulated children, the aged, workers and managers about an elevator.", 0, "Slides 9–12: agents simulate users to understand requirements."],
  ["Identify the entities and relationships, and draw a UML diagram.", 1, "Slide 13: modeling constructs UML or formal specifications."],
  ["Translate “Globally, grant 0 and grant 1 do not hold at the same time until it is allowed.” into LTL.", 1, "Slides 14–16: translating the conversation into a formal spec (nl2spec) is modeling."],
  ["Write JML annotations for a Java class, and regenerate them when the verifier fails.", 2, "Slides 23–25: generating and documenting specifications (SpecGen)."],
  ["Check REQ1–REQ5 for requirements that contradict each other.", 3, "Slide 27: check consistencies — validation (the section slide says Verification)."],
  ["Rate an SRS as unambiguous, understandable, correct and verifiable.", 3, "Slides 26 and 28: AI scores requirements against rules."],
  ["Find what changed between the old and the new version of a law.", 4, "Slide 31: four-layer change detection for revising specifications."],
  ["Work out which timer features depend on which.", 4, "Slide 32: a feature map tracks dependencies across features."],
];

function demoClassify(el) {
  let k = 0, right = 0, answered = false;
  el.innerHTML = `<div class="frame cl-task" style="font-size:15px"></div>
    <div class="controls cl-opts"></div><div class="msg cl-msg"></div>
    <div class="controls"><button class="cbtn cl-reset">⟲ Start again</button><button class="cbtn on cl-next">Next ▶</button><span class="spacer"></span><span class="counter cl-n"></span></div>`;
  const $ = (q) => el.querySelector(q);
  function render() {
    const done = k >= TASKS.length;
    $(".cl-task").innerHTML = done ? `<b>Done.</b> ${right} / ${TASKS.length} right.` : `<span class="counter">task ${k + 1}</span><br>${esc(TASKS[k][0])}`;
    $(".cl-opts").innerHTML = done ? "" : ACTS.map((a, j) => `<button class="cbtn" data-j="${j}">${a.name}</button>`).join("");
    $(".cl-msg").innerHTML = done ? (right === TASKS.length ? "All right — every activity has its AI task." : "Reread the activities you mixed up in Demo 1.") : "Which activity of the cycle is this?";
    $(".cl-msg").className = "msg cl-msg" + (done ? (right === TASKS.length ? " good" : "") : "");
    $(".cl-n").textContent = `${Math.min(k + 1, TASKS.length)} / ${TASKS.length} · ${right} right`;
    $(".cl-next").disabled = !answered && !done;
    $(".cl-next").style.display = done ? "none" : "";
    el.querySelectorAll("[data-j]").forEach((b) => {
      b.onclick = () => {
        if (answered) return;
        answered = true;
        const j = +b.dataset.j, ok = j === TASKS[k][1];
        if (ok) right++;
        el.querySelectorAll("[data-j]").forEach((x) => { x.disabled = true; if (+x.dataset.j === TASKS[k][1]) x.classList.add("on"); });
        $(".cl-msg").innerHTML = `${ok ? "Right." : `Not quite: it is <b>${ACTS[TASKS[k][1]].name}</b>.`} ${TASKS[k][2]}`;
        $(".cl-msg").className = "msg cl-msg " + (ok ? "good" : "bad");
        $(".cl-next").disabled = false;
        $(".cl-n").textContent = `${k + 1} / ${TASKS.length} · ${right} right`;
      };
    });
  }
  $(".cl-next").onclick = () => { k++; answered = false; render(); };
  $(".cl-reset").onclick = () => { k = 0; right = 0; answered = false; render(); };
  render();
}

// ---------- elicitation: the elevator requirements and simulated interviews ----------

const REQS = {
  REQ1: 'When the user presses the "Up" button on a floor, the Elevator System shall prioritize servicing the requested floor, moving upwards if necessary, and open its doors upon arrival.',
  REQ2: 'When the user presses the "Down" button on a floor, the Elevator System shall prioritize servicing the requested floor, moving downwards if necessary, and open its doors upon arrival.',
  REQ3: "When the user presses any floor button inside the elevator, the Elevator System shall prioritize servicing the selected floor, moving upwards or downwards as needed, and open its doors upon arrival.",
  REQ4: 'When the overload sensor detects excessive weight in the elevator cabin, the Elevator System shall prevent further entry, emit an audible alarm, and display an overload warning. It shall not move until the excess weight is reduced and remain in the "Overload" state until the weight is within the acceptable limit.',
  REQ5: 'When the user presses any floor button inside the elevator while the system is in the "Overload" state, the Elevator System shall ignore the button press until the overload condition is resolved.',
};
const INTERVIEWS = [
  ["Children", "I can't reach the buttons at the top.", "buttons a child can reach", "reach"],
  ["The aged", "The doors close before I am inside.", "doors that stay open longer", "longer"],
  ["Workers", "With a full trolley it often says overload.", "a clear overload warning", "overload"],
  ["Managers", "Our electricity bill is high.", "save energy when idle", "energy"],
];

function demoReqsMini(el) {
  el.innerHTML = `<div class="rq-list" style="display:grid;gap:5px"></div>`;
  player(el, () => 5, (i) => {
    el.querySelector(".rq-list").innerHTML = Object.entries(REQS).map(([id, t], k) =>
      `<div class="frame ${k === i ? "top" : ""}" style="font-size:12px;${k === i ? "" : "opacity:.55"}"><b>${id}</b> ${esc(k === i ? t : t.slice(0, 58) + "…")}</div>`).join("");
  }, { mini: true, ms: 2200 });
}

function demoInterview(el) {
  const OUT = lines(CODE.elicitOut);
  el.innerHTML = `<p class="hint" style="margin-top:0">Four scripted user agents are interviewed. Their answers are made up for illustration; the requirements are slide 12's.</p>
    <div class="controls iv-who" style="margin-top:0">${INTERVIEWS.map((p, k) => `<button class="cbtn" data-p="${k}">${p[0]}</button>`).join("")}</div>
    <div class="iv-stage" style="display:grid;gap:6px;margin-top:8px"></div>
    <div class="iv-reqs" style="display:grid;gap:4px;margin-top:8px"></div>
    <div class="msg iv-msg"></div>
    <div class="counter" style="margin-top:10px">what the program prints</div><div class="console iv-out"></div>`;
  const STAGES = ["Interview", "Extract the need", "Check REQ1–REQ5"];
  const pl = player(el, () => 12, (i) => {
    const k = Math.floor(i / 3), s = i % 3;
    const [who, answer, need, kw] = INTERVIEWS[k];
    el.querySelectorAll("[data-p]").forEach((b) => b.classList.toggle("on", +b.dataset.p === k));
    el.querySelector(".iv-stage").innerHTML = STAGES.map((t, j) => `<div class="frame ${j === s ? "top" : ""}" style="font-size:13px;${j > s ? "opacity:.3" : ""}">
      <b>${t}.</b> ${j === 0 ? `Interviewer → ${who}: <em>What difficulties do you face?</em> ${who}: “${esc(answer)}”`
        : j === 1 ? `Scripted extractor → need: <b>${esc(need)}</b> (keyword <code>${kw}</code>)`
        : `<code>covered_by("${kw}")</code>`}</div>`).join("");
    const hits = Object.keys(REQS).filter((r) => REQS[r].toLowerCase().includes(kw));
    el.querySelector(".iv-reqs").innerHTML = s < 2 ? "" : Object.entries(REQS).map(([id, t]) => {
      const hit = hits.includes(id);
      const shown = hit ? esc(t).replace(new RegExp(kw, "i"), (m) => `<mark>${m}</mark>`) : esc(t.slice(0, 70)) + "…";
      return `<div class="frame ${hit ? "ret" : ""}" style="font-size:12px;${hit ? "" : "opacity:.5"}"><b>${id}</b> ${shown}</div>`;
    }).join("");
    const msg = el.querySelector(".iv-msg");
    if (s < 2) { msg.className = "msg iv-msg"; msg.innerHTML = s === 0 ? `The interviewer asks <b>${who}</b>.` : "An LLM would pull the need out of the answer; here it is scripted."; }
    else {
      msg.className = "msg iv-msg " + (hits.length ? "good" : "bad");
      msg.innerHTML = hits.length ? `Already covered by ${hits.join(", ")}.` : `No requirement mentions it: a <b>latent need</b> to add to the list.`;
    }
    el.querySelector(".iv-out").textContent = OUT.slice(0, 2 * (k + (s === 2 ? 1 : 0))).join("\n");
  });
  el.querySelectorAll("[data-p]").forEach((b) => { b.onclick = () => pl.go(+b.dataset.p * 3); });
}

// ---------- LTL on finite traces ----------

function holdsJS(f, tr, i = 0) {
  const op = f[0];
  if (op === "ap") return tr[i] === f[1];
  if (op === "->") return !holdsJS(f[1], tr, i) || holdsJS(f[2], tr, i);
  if (op === "X") return i + 1 < tr.length && holdsJS(f[1], tr, i + 1);
  if (op === "G") { for (let j = i; j < tr.length; j++) if (!holdsJS(f[1], tr, j)) return false; return true; }
  if (op === "F") { for (let j = i; j < tr.length; j++) if (holdsJS(f[1], tr, j)) return true; return false; }
  throw new Error(op);
}
function showF(f) {
  if (f[0] === "ap") return f[1];
  if (f[0] === "->") return `(${showF(f[1])} -> ${showF(f[2])})`;
  return `${f[0]} ${showF(f[1])}`;
}
const RED = ["ap", "red"], GREEN = ["ap", "green"];
const LTL_PROPS = [
  ["F", GREEN],
  ["G", ["->", RED, ["X", GREEN]]],
  ["G", ["->", RED, ["F", GREEN]]],
];
const LTL_TRACES = [
  ["red", "green", "yellow", "red", "green"],
  ["red", "red", "green"],
  ["yellow", "yellow", "yellow"],
];
const LIGHT = { red: "var(--red)", green: "var(--green)", yellow: "var(--amber)" };

// The steps Python's all()/any() take: one per position, stopping early.
function ltlSteps(f, tr) {
  const steps = [];
  if (f[0] === "F") {
    for (let j = 0; j < tr.length; j++) {
      const ok = holdsJS(f[1], tr, j);
      steps.push({ j, ok, why: ok ? `step ${j} is green: F green holds, any() stops here` : `step ${j} is ${tr[j]}, not green` });
      if (ok) return { steps, result: true };
    }
    return { steps, result: false, end: "the trace ends without green: F green is False" };
  }
  const inner = f[1];
  for (let j = 0; j < tr.length; j++) {
    const isRed = tr[j] === "red";
    const ok = holdsJS(inner, tr, j);
    let why;
    if (!isRed) why = `step ${j} is ${tr[j]}: not red, so the implication holds (vacuously)`;
    else if (inner[2][0] === "X") why = j + 1 < tr.length ? `step ${j} is red; step ${j + 1} is ${tr[j + 1]}: ${ok ? "green next ✓" : "not green ✗"}` : `step ${j} is red and it is the last step: no next step ✗`;
    else why = `step ${j} is red; ${ok ? "green comes later ✓" : "no green after it ✗"}`;
    steps.push({ j, ok, why });
    if (!ok) return { steps, result: false };
  }
  return { steps, result: true, end: "every step passed: G holds" };
}

function demoLtl(el, { mini = false } = {}) {
  let tr = [...LTL_TRACES[0]], fk = 1;
  el.innerHTML = mini ? `<div class="lt-cells" style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin:8px 0"></div><div class="msg lt-msg"></div>` : `
    <div class="controls" style="margin-top:0"><span class="counter">trace</span>${LTL_TRACES.map((t, k) => `<button class="cbtn" data-t="${k}">${k + 1}</button>`).join("")}
      <span class="counter" style="margin-left:8px">property</span><select class="lt-f">${LTL_PROPS.map((f, k) => `<option value="${k}">${showF(f)}</option>`).join("")}</select></div>
    <p class="hint">Click a light to change its colour.</p>
    <div class="lt-cells" style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0"></div>
    <div class="msg lt-msg"></div>
    <div class="counter" style="margin-top:10px">what holds() returns</div><div class="console lt-out"></div>`;
  const $ = (q) => el.querySelector(q);
  let run = null, pl = null;
  function compute() { run = ltlSteps(LTL_PROPS[fk], tr); }
  function draw(i) {
    if (mini) { const cyc = Math.floor(i / 7) % 2; if (tr.join() !== LTL_TRACES[cyc].join()) { tr = [...LTL_TRACES[cyc]]; compute(); } i = i % 7; }
    const shown = run.steps.slice(0, i);
    $(".lt-cells").innerHTML = tr.map((c, j) => {
      const st = shown.find((s) => s.j === j);
      const mark = st ? (st.ok ? "✓" : "✗") : "";
      return `<div data-c="${j}" style="cursor:${mini ? "default" : "pointer"};text-align:center;min-width:46px">
        <div style="width:34px;height:34px;margin:0 auto;border-radius:50%;background:${LIGHT[c]};border:3px solid ${st && st.j === shown[shown.length - 1].j ? "var(--ink)" : "transparent"}"></div>
        <div class="counter">${j}</div><div style="font-weight:700;color:${st ? (st.ok ? "var(--green)" : "var(--red)") : "inherit"}">${mark}</div></div>`;
    }).join("");
    const last = shown[shown.length - 1];
    const finished = i >= run.steps.length;
    const m = $(".lt-msg");
    m.className = "msg lt-msg" + (finished ? (run.result ? " good" : " bad") : "");
    m.innerHTML = `<code>${showF(LTL_PROPS[fk])}</code> on <code>${tr.join(" ")}</code><br>` +
      (i === 0 ? "Step through the positions." : last.why) +
      (finished ? `<br><b>Result: ${run.result ? "True" : "False"}</b>${run.end ? ` — ${run.end}` : ""}` : "");
    if (mini) return;
    $(".lt-out").textContent = finished ? `trace: ${tr.join(" ")}\n  ${showF(LTL_PROPS[fk]).padEnd(20)} ${run.result ? "True" : "False"}` : "";
    el.querySelectorAll("[data-c]").forEach((n) => {
      n.onclick = () => { const order = ["red", "green", "yellow"]; tr[+n.dataset.c] = order[(order.indexOf(tr[+n.dataset.c]) + 1) % 3]; compute(); pl.reset(); };
    });
    el.querySelectorAll("[data-t]").forEach((b) => b.classList.toggle("on", tr.join() === LTL_TRACES[+b.dataset.t].join()));
  }
  compute();
  pl = player(el, () => (mini ? 14 : run.steps.length + 1), draw, { mini, ms: mini ? 900 : 1000 });
  if (!mini) {
    el.querySelectorAll("[data-t]").forEach((b) => { b.onclick = () => { tr = [...LTL_TRACES[+b.dataset.t]]; compute(); pl.reset(); }; });
    $(".lt-f").value = String(fk);
    $(".lt-f").onchange = () => { fk = +$(".lt-f").value; compute(); pl.reset(); };
  }
}

// ---------- nl2spec: subtranslations and confidence ----------

const NL_TRIES = [
  [["and", "&"], ["until", "U"], ["it is allowed", "a"], ["do not hold at the same time", "~(g0 & g1)"], ["globally", "G"], ["grant 0", "g0"], ["grant 1", "g1"]],
  [["do not hold at the same time", "~(g0 & g1)"], ["globally", "G"], ["grant 0", "g0"], ["grant 1", "g1"]],
  [["grant 0", "g0"], ["grant 1", "g1"]],
];

function demoNl2spec(el) {
  const rows = NL_TRIES[0];
  let confirmed = new Set();
  el.innerHTML = `<div class="frame" style="font-size:14px"><span class="counter">Translate this sentence to LTL</span><br>Globally, grant 0 and grant 1 do not hold at the same time until it is allowed.</div>
    <div class="nl-try msg"></div>
    <div class="nl-rows" style="display:grid;gap:5px;margin-top:8px"></div>
    <div class="msg nl-final"></div>
    <div class="counter" style="margin-top:10px">what the program prints (after 3 tries)</div><div class="console nl-out"></div>`;
  const $ = (q) => el.querySelector(q);
  function draw(i) {
    const tries = NL_TRIES.slice(0, Math.min(i, 3));
    $(".nl-try").innerHTML = i === 0 ? "Number of tries: 3. Step to run the scripted LLM." : i <= 3 ? `<b>Try ${i}</b> decomposes the sentence into ${NL_TRIES[i - 1].length} subtranslations.` : "<b>User confirmation.</b> Click a row to confirm it; low confidence tells you where to look first.";
    const sorted = [...rows].sort((x, y) => cnt(x, NL_TRIES) - cnt(y, NL_TRIES));
    $(".nl-rows").innerHTML = sorted.map(([ph, l]) => {
      const n = cnt([ph, l], tries), pct = (100 * n) / 3;
      const isNew = i >= 1 && i <= 3 && NL_TRIES[i - 1].some((p) => p[0] === ph);
      const ok = confirmed.has(ph);
      return `<div class="frame ${isNew ? "new" : ""}" data-ph="${esc(ph)}" style="display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr) 64px;gap:8px;align-items:center;font-size:13px;cursor:${i > 3 ? "pointer" : "default"};${n ? "" : "opacity:.35"}">
        <span>${ok ? "✔ " : ""}${esc(ph)}</span><code>${esc(l)}</code>
        <span class="mono" style="text-align:right">${pct.toFixed(2)}%</span>
        <div style="grid-column:1/-1;height:5px;border-radius:3px;background:var(--card-2)"><div style="height:5px;border-radius:3px;width:${pct}%;background:${pct > 99 ? "var(--green)" : pct > 50 ? "var(--teal)" : "var(--amber)"}"></div></div></div>`;
    }).join("");
    $(".nl-final").innerHTML = i >= 4 ? `<b>Final result</b> <code>G((!((g0 &amp; g1)) U a))</code> — all 3 tries end with it: 100.00%. ${confirmed.size === rows.length ? "Every subtranslation confirmed." : `${confirmed.size} / ${rows.length} confirmed.`}` : "Final result: after the tries.";
    $(".nl-final").className = "msg nl-final" + (i >= 4 ? " good" : "");
    $(".nl-out").textContent = i >= 4 ? CODE.nl2specOut : "";
    if (i > 3) el.querySelectorAll("[data-ph]").forEach((r) => { r.onclick = () => { const ph = r.dataset.ph.replace(/&amp;/g, "&"); confirmed.has(ph) ? confirmed.delete(ph) : confirmed.add(ph); draw(i); }; });
  }
  const cnt = ([ph, l], tries) => tries.filter((t) => t.some(([p, x]) => p === ph && x === l)).length;
  player(el, () => 5, draw, { ms: 1300 });
}

// ---------- model checker: G (request -> F response) ----------

const MC_MODELS = {
  "model A": { idle: ["request"], request: ["busy"], busy: ["response"], response: ["idle"] },
  "model B": { idle: ["request"], request: ["busy"], busy: ["response", "busy"], response: ["idle"] },
};

function mcTrace(model, start, p, q) {
  const log = [];
  function search(path, waiting) {
    const s = path[path.length - 1];
    if (s === q) waiting = null;
    else if (s === p && waiting === null) waiting = path.length - 1;
    log.push({ path: [...path], waiting, note: s === q ? "a response: nothing is waiting any more" : s === p ? "a request: now waiting for a response" : `visit ${s}` });
    if (waiting !== null && !model[s].length) { log.push({ path: [...path], waiting, note: "stops without a response", cex: path }); return path; }
    for (const nxt of model[s]) {
      if (path.includes(nxt)) {
        const loop = path.slice(path.indexOf(nxt));
        if (waiting !== null && !loop.includes(q)) {
          const cex = [...path, nxt];
          log.push({ path: cex, waiting, note: `back to ${nxt}: a loop without response, repeated forever`, cex });
          return cex;
        }
        log.push({ path: [...path, nxt], waiting, note: `back to ${nxt}: ${waiting === null ? "nothing is waiting" : "the loop passes response"} — fine, try another branch`, loopback: true });
        continue;
      }
      const found = search([...path, nxt], waiting);
      if (found) return found;
    }
    return null;
  }
  const cex = search([start], null);
  return { log, cex };
}

function mcSVG(model, path, cex) {
  const P = { idle: [70, 110], request: [220, 40], busy: [370, 110], response: [220, 180] };
  const onPath = (a, b) => { for (let k = 0; k + 1 < path.length; k++) if (path[k] === a && path[k + 1] === b) return true; return false; };
  let g = `<svg viewBox="0 0 470 225" role="img" aria-label="state model">
    <defs><marker id="ma" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="var(--stone)"/></marker></defs>`;
  for (const [a, outs] of Object.entries(model)) {
    for (const b of outs) {
      const hot = onPath(a, b);
      const col = hot ? (cex ? "var(--red)" : "var(--amber)") : "var(--stone)";
      if (a === b) {
        const [x, y] = P[a];
        g += `<path d="M ${x + 20} ${y - 18} C ${x + 70} ${y - 60}, ${x + 85} ${y + 10}, ${x + 48} ${y + 4}" fill="none" stroke="${col}" stroke-width="${hot ? 3 : 1.5}" marker-end="url(#ma)"/>`;
        continue;
      }
      const [x1, y1] = P[a], [x2, y2] = P[b];
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
      g += `<path d="M ${x1 + (dx / L) * 50} ${y1 + (dy / L) * 22} L ${x2 - (dx / L) * 52} ${y2 - (dy / L) * 24}" stroke="${col}" stroke-width="${hot ? 3 : 1.5}" marker-end="url(#ma)"/>`;
    }
  }
  for (const [s, [x, y]] of Object.entries(P)) {
    const last = path[path.length - 1] === s, on = path.includes(s);
    g += `<rect x="${x - 46}" y="${y - 17}" width="92" height="34" rx="17" fill="${last ? "var(--mark)" : on ? "var(--teal-soft)" : "var(--card)"}" stroke="${s === "response" ? "var(--green)" : s === "request" ? "var(--amber)" : "var(--line)"}" stroke-width="${last ? 3 : 1.6}"/>
      <text x="${x}" y="${y + 5}" text-anchor="middle" font-size="13" fill="var(--ink)">${s}</text>`;
  }
  return g + "</svg>";
}

function demoChecker(el) {
  let name = "model A", run = mcTrace(MC_MODELS[name], "idle", "request", "response");
  const OUT = lines(CODE.checkerOut);
  el.innerHTML = `<div class="controls" style="margin-top:0">${Object.keys(MC_MODELS).map((m) => `<button class="cbtn" data-m="${m}">${m}</button>`).join("")}
      <span class="counter">property: G (request -> F response)</span></div>
    <div class="svgbox mc-svg"></div>
    <div class="counter">path being explored</div><div class="tags mc-path" style="margin-top:4px"></div>
    <div class="msg mc-msg"></div><div class="console mc-out"></div>`;
  const $ = (q) => el.querySelector(q);
  const pl = player(el, () => run.log.length + 1, (i) => {
    el.querySelectorAll("[data-m]").forEach((b) => b.classList.toggle("on", b.dataset.m === name));
    const done = i >= run.log.length;
    const ev = run.log[Math.min(i, run.log.length - 1)];
    $(".mc-svg").innerHTML = mcSVG(MC_MODELS[name], done && !run.cex ? [] : ev.path, !!(done && run.cex) || !!ev.cex);
    $(".mc-path").innerHTML = (done && !run.cex ? [] : ev.path).map((s, k) => `<span class="tag" style="${ev.waiting !== null && k >= ev.waiting ? "background:var(--mark)" : ""}">${s}</span>`).join(" → ");
    const m = $(".mc-msg");
    if (!done) { m.className = "msg mc-msg" + (ev.cex ? " bad" : ""); m.innerHTML = `${ev.note}.${ev.waiting !== null ? ` <span class="counter">waiting since step ${ev.waiting}</span>` : ""}`; }
    else if (run.cex) { m.className = "msg mc-msg bad"; m.innerHTML = `<b>Counterexample:</b> ${run.cex.join(" → ")} → … The request can wait forever.`; }
    else { m.className = "msg mc-msg good"; m.innerHTML = "Every path explored: each request reaches a response. <b>The property holds.</b>"; }
    $(".mc-out").textContent = done ? OUT[name === "model A" ? 0 : 1] : "";
  }, { ms: 1100 });
  el.querySelectorAll("[data-m]").forEach((b) => { b.onclick = () => { name = b.dataset.m; run = mcTrace(MC_MODELS[name], "idle", "request", "response"); pl.reset(); }; });
}

// ---------- IsMaximum: test a spec against three implementations ----------

const IMPLS = {
  max_slides: (a, b) => (a > b ? a : b),
  always_big: () => 1000000,
  first: (a) => a,
};
const SPECS = {
  "IsMaximum (conditions 1–3)": (a, b, r) => a <= r && b <= r && (r === a || r === b),
  "at_least_both (conditions 1–2)": (a, b, r) => a <= r && b <= r,
};

function demoMaxSpec(el) {
  let spec = Object.keys(SPECS)[0], impl = "max_slides";
  el.innerHTML = `<div class="controls" style="margin-top:0"><label>spec <select class="mx-s">${Object.keys(SPECS).map((s) => `<option>${s}</option>`).join("")}</select></label>
    <label>function <select class="mx-f">${Object.keys(IMPLS).map((s) => `<option>${s}</option>`).join("")}</select></label></div>
    <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start;margin-top:8px">
      <div><div class="counter">rows a = 0…9, columns b = 0…9</div><div class="mx-grid" style="display:grid;grid-template-columns:repeat(10,24px);gap:2px;margin-top:4px"></div></div>
      <div style="flex:1;min-width:200px"><div class="msg mx-msg" style="margin-top:0"></div><div class="console mx-out"></div></div></div>`;
  const $ = (q) => el.querySelector(q);
  function firstFail() {
    for (let a = 0; a < 10; a++) for (let b = 0; b < 10; b++) if (!SPECS[spec](a, b, IMPLS[impl](a, b))) return a * 10 + b;
    return null;
  }
  let fail = firstFail();
  const total = () => (fail === null ? 10 : Math.floor(fail / 10) + 1) + 1;
  const pl = player(el, total, (i) => {
    const upto = fail === null ? i * 10 : Math.min(i * 10, fail + 1);
    $(".mx-grid").innerHTML = Array.from({ length: 100 }, (_, k) => {
      const a = Math.floor(k / 10), b = k % 10, seen = k < upto, r = IMPLS[impl](a, b), ok = SPECS[spec](a, b, r);
      return `<div title="a=${a}, b=${b}, result ${r}" style="height:22px;border-radius:3px;background:${!seen ? "var(--card-2)" : ok ? "var(--green-soft)" : "var(--red)"};${k === fail && seen ? "outline:2px solid var(--ink)" : ""}"></div>`;
    }).join("");
    const done = i >= total() - 1;
    const r = fail !== null ? IMPLS[impl](Math.floor(fail / 10), fail % 10) : null;
    const line = fail === null ? `ok for all a, b < 10` : `fails at a=${Math.floor(fail / 10)}, b=${fail % 10} (result ${r})`;
    const m = $(".mx-msg");
    m.className = "msg mx-msg" + (done ? (fail === null ? " good" : " bad") : "");
    m.innerHTML = i === 0 ? `check(${spec.split(" ")[0]}, ${impl}) tries a = 0…9, b = 0…9 and stops at the first failure.` : done ? `<b>${impl}</b> ${line}` : `rows a = 0…${i - 1} pass.`;
    $(".mx-out").textContent = done ? `${impl.padEnd(10)} ${line}` : "";
  }, { ms: 500 });
  const reset = () => { spec = $(".mx-s").value; impl = $(".mx-f").value; fail = firstFail(); pl.reset(); };
  $(".mx-s").onchange = reset; $(".mx-f").onchange = reset;
}

// ---------- SpecGen: conversation, then mutation ----------

// Evaluate "result >= a and result > b" (comparisons joined by "and") without eval().
function evalSpec(spec, env) {
  return spec.split(" and ").every((part) => {
    const [l, op, r] = part.trim().split(/\s+/);
    const x = env[l], y = env[r];
    return { ">=": x >= y, "<=": x <= y, ">": x > y, "<": x < y, "==": x === y }[op];
  });
}
function verifyJS(spec) {
  for (let a = 0; a < 10; a++) for (let b = 0; b < 10; b++) if (!evalSpec(spec, { a, b, result: IMPLS.max_slides(a, b) })) return `fails at a=${a}, b=${b}`;
  return "verified";
}
function mutantsJS(spec) {
  const ops = [">=", "<=", ">", "<", "=="], out = [];
  for (const m of spec.matchAll(/>=|<=|==|>|</g)) for (const op of ops) if (op !== m[0]) out.push(spec.slice(0, m.index) + op + spec.slice(m.index + m[0].length));
  return out;
}
function specgenEvents() {
  const replies = ["result > a and result > b", "result >= a and result > b"];
  const ev = [];
  let prompt = "Write a specification for max_slides.", spec = null;
  for (let k = 1; k <= 2; k++) {
    spec = replies[k - 1];
    const v = verifyJS(spec);
    ev.push({ phase: 0, prompt, spec, v, line: `try ${k}: ${spec.padEnd(30)} ${v}` });
    if (v === "verified") return ev;
    prompt = `The specification you generated fails verification: ${v}. Please generate again.`;
  }
  ev.push({ phase: 1, line: "conversation failed -> mutation", note: "Two rounds of conversation did not verify. Switch to mutation: change one comparison operator at a time in the last candidate." });
  for (const m of mutantsJS(spec)) {
    const v = verifyJS(m);
    ev.push({ phase: 1, spec: m, v, line: `  mutant: ${m.padEnd(30)} ${v}` });
    if (v === "verified") { ev.push({ phase: 2, spec: m, line: `selected: ${m}` }); return ev; }
  }
  return ev;
}

function demoSpecgen(el, { mini = false } = {}) {
  const EV = specgenEvents();
  el.innerHTML = `<div class="sg-pipe" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px"></div>
    ${mini ? "" : `<div class="msg sg-msg"></div>`}
    <div class="console sg-out" style="margin-top:8px"></div>`;
  const $ = (q) => el.querySelector(q);
  player(el, () => EV.length + 1, (i) => {
    const e = EV[i - 1];
    const ph = e ? e.phase : -1;
    const box = (t, sub, on) => `<div class="frame ${on ? "top" : ""}" style="font-size:12.5px"><b>${t}</b><br><span class="counter">${sub}</span></div>`;
    $(".sg-pipe").innerHTML = box("Conversation-driven", "LLM → specifications → verifier", ph === 0) + box("Mutation-based", "mutator → selector → verifier", ph === 1) + box("Selected spec", e && ph === 2 ? esc(e.spec) : "—", ph === 2);
    $(".sg-out").textContent = EV.slice(0, i).map((x) => x.line).join("\n");
    if (mini) return;
    const m = $(".sg-msg");
    if (!e) { m.className = "msg sg-msg"; m.innerHTML = "Input code: <code>max_slides(a, b)</code> — if a &gt; b then a else b. The LLM is scripted; the verifier is a bounded check."; return; }
    if (e.prompt) {
      const fail = e.v !== "verified" && e.v.match(/a=(\d+), b=(\d+)/);
      m.className = "msg sg-msg" + (e.v === "verified" ? " good" : " bad");
      m.innerHTML = `<span class="counter">prompt</span> ${esc(e.prompt)}<br><span class="counter">LLM</span> <code>${esc(e.spec)}</code><br><span class="counter">verifier</span> ${e.v}` +
        (fail ? ` — max_slides(${fail[1]}, ${fail[2]}) = ${IMPLS.max_slides(+fail[1], +fail[2])}, and the spec is false for it.` : "");
    } else if (e.note) { m.className = "msg sg-msg"; m.innerHTML = e.note; }
    else if (e.phase === 1) { m.className = "msg sg-msg" + (e.v === "verified" ? " good" : ""); m.innerHTML = `Mutant <code>${esc(e.spec)}</code>: ${e.v}.`; }
    else { m.className = "msg sg-msg good"; m.innerHTML = `Selected <code>${esc(e.spec)}</code>: conditions 1 and 2 of IsMaximum. True of the code — but is it strong enough? (Condition 3 is missing.)`; }
  }, { mini, ms: mini ? 1300 : 1100 });
}

// ---------- consistency check over REQ1–REQ5 ----------

const RULES = [
  ["REQ1", "Up button on a floor", "any", "move"],
  ["REQ2", "Down button on a floor", "any", "move"],
  ["REQ3", "floor button inside", "any", "move"],
  ["REQ4", "any", "Overload", "not move"],
  ["REQ5", "floor button inside", "Overload", "ignore press"],
];
const CONFLICTS = [["move", "not move"], ["move", "ignore press"]];

function demoConsistency(el) {
  let fixed = false;
  el.innerHTML = `<label class="hint" style="display:block;margin-top:0"><input type="checkbox" class="cs-fix"> Exercise 3(a): REQ3 only when <b>not Overload</b> (a variant, not in the notes' run)</label>
    <div class="cs-rules" style="display:grid;gap:4px;margin-top:8px"></div>
    <div class="msg cs-msg"></div>
    <div class="counter" style="margin-top:10px">what the program prints</div><div class="console cs-out"></div>`;
  const $ = (q) => el.querySelector(q);
  const rules = () => RULES.map((r) => (fixed && r[0] === "REQ3" ? ["REQ3", r[1], "not Overload", r[3]] : r));
  const overlap = (x, y) => x === "any" || y === "any" || (x === y) || (x.startsWith("not ") && x.slice(4) !== y) || (y.startsWith("not ") && y.slice(4) !== x);
  const narrow = (x, y) => (x === "any" ? y : x);
  function pairs() {
    const R = rules(), out = [];
    for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) {
      const [r1, e1, s1, a1] = R[i], [r2, e2, s2, a2] = R[j];
      const eo = overlap(e1, e2), so = overlap(s1, s2), ac = CONFLICTS.some(([x, y]) => (x === a1 && y === a2) || (x === a2 && y === a1));
      out.push({ i, j, eo, so, ac, hit: eo && so && ac, line: `${r1} vs ${r2}: '${narrow(e1, e2)}' in state ${narrow(s1, s2)}: ${a1} / ${a2}` });
    }
    return out;
  }
  let P = pairs();
  const pl = player(el, () => P.length + 1, (i) => {
    const R = rules(), cur = P[i - 1];
    $(".cs-rules").innerHTML = `<div style="display:grid;grid-template-columns:52px minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr);gap:6px;font-size:12px" class="counter"><span>rule</span><span>event</span><span>state</span><span>action</span></div>` +
      R.map((r, k) => `<div class="frame ${cur && (cur.i === k || cur.j === k) ? (cur.hit ? "err" : "top") : ""}" style="display:grid;grid-template-columns:52px minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr);gap:6px;font-size:12.5px"><b>${r[0]}</b><span>${r[1]}</span><span>${r[2]}</span><span>${r[3]}</span></div>`).join("");
    const m = $(".cs-msg");
    if (!cur) { m.className = "msg cs-msg"; m.innerHTML = `Our reading of REQ1–REQ5 as (event, state, action). Step through all ${P.length} pairs.`; }
    else {
      const yn = (b) => (b ? "yes" : "no");
      m.className = "msg cs-msg" + (cur.hit ? " bad" : "");
      m.innerHTML = `<b>${R[cur.i][0]} vs ${R[cur.j][0]}</b> — events overlap: ${yn(cur.eo)} · states overlap: ${yn(cur.so)} · actions clash: ${yn(cur.ac)}` + (cur.hit ? " → <b>possible conflict</b>" : " → fine");
    }
    $(".cs-out").textContent = P.slice(0, i).filter((p) => p.hit).map((p) => p.line).join("\n");
  }, { ms: 1000 });
  $(".cs-fix").onchange = () => { fixed = $(".cs-fix").checked; P = pairs(); pl.reset(); };
}

// ---------- feature map: build order ----------

const FEATURES = {
  "View Timer List": ["Create a Timer"],
  "Edit a Timer": ["View Timer List"],
  "Delete a Timer": ["View Timer List"],
  "Start a Timer": ["View Timer List"],
  "Stop the Timer": ["Start a Timer"],
  "Pause the Timer": ["Start a Timer"],
  "Resume the Timer": ["Pause the Timer"],
  "Notify Timer Completion": ["Stop the Timer"],
  "View Timer History": ["Stop the Timer"],
  "Restart Timers": ["View Timer History"],
};
function featureRounds() {
  const all = new Set(Object.keys(FEATURES));
  Object.values(FEATURES).forEach((ds) => ds.forEach((d) => all.add(d)));
  const done = new Set(), rounds = [];
  while (done.size < all.size) {
    const ready = [...all].filter((f) => !done.has(f) && (FEATURES[f] || []).every((d) => done.has(d))).sort();
    rounds.push(ready);
    ready.forEach((f) => done.add(f));
  }
  return rounds;
}
function dependents(f) {
  const out = new Set(), stack = [f];
  while (stack.length) { const x = stack.pop(); for (const [k, ds] of Object.entries(FEATURES)) if (ds.includes(x) && !out.has(k)) { out.add(k); stack.push(k); } }
  return out;
}

function demoFeatureMap(el, { mini = false } = {}) {
  const R = featureRounds();
  let pick = null;
  el.innerHTML = `<div class="fm-rounds" style="display:grid;gap:6px"></div>${mini ? "" : `<div class="msg fm-msg"></div>
    <div class="counter" style="margin-top:10px">what the program prints</div><div class="console fm-out"></div>`}`;
  const $ = (q) => el.querySelector(q);
  function draw(i) {
    const aff = pick ? dependents(pick) : new Set();
    $(".fm-rounds").innerHTML = R.map((r, k) => `<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
      <span class="counter" style="min-width:58px">round ${k + 1}</span>${r.map((f) => {
        const st = k < i - 1 ? "done" : k === i - 1 ? "ready" : "todo";
        const bg = f === pick ? "var(--amber)" : aff.has(f) ? "var(--red-soft)" : st === "done" ? "var(--green-soft)" : st === "ready" ? "var(--mark)" : "var(--card-2)";
        return `<button class="tag" data-f="${f}" style="border:0;cursor:${mini ? "default" : "pointer"};background:${bg};${st === "todo" && !aff.has(f) && f !== pick ? "opacity:.45" : ""}">${f}</button>`;
      }).join("")}</div>`).join("");
    if (mini) return;
    $(".fm-out").textContent = R.slice(0, i).map((r, k) => `round ${k + 1}: ${r.join(", ")}`).join("\n");
    $(".fm-msg").innerHTML = pick ? `<b>${pick}</b> builds on ${(FEATURES[pick] || []).join(", ") || "nothing"}. A change to it can affect: ${[...aff].join(", ") || "no other feature"}.`
      : i === 0 ? "Step through the build rounds, or click a feature to see what depends on it." : `Round ${i}: ${R[i - 1].join(", ")} — everything they build on is done.`;
    el.querySelectorAll("[data-f]").forEach((b) => { b.onclick = () => { pick = pick === b.dataset.f ? null : b.dataset.f; draw(i); }; });
  }
  player(el, () => R.length + 1, draw, { mini, ms: mini ? 1200 : 1000 });
}

// ---------- ambiguity: < or <= ? ----------

function demoAmbiguity(el) {
  const OUT = lines(CODE.ambiguityOut);
  const CASES = [[50, 100], [100, 100], [150, 100]];
  let precise = false;
  el.innerHTML = `<div class="frame" style="font-size:14px"><span class="counter">requirement</span><br><span class="am-req"></span></div>
    <label class="hint" style="display:block"><input type="checkbox" class="am-fix"> use the precise wording from the pitfall box</label>
    <div class="controls"><label>balance <input type="range" class="am-b" min="0" max="200" step="10" value="100"> <b class="mono am-bv">100</b></label>
      <label>amount <input type="range" class="am-a" min="0" max="200" step="10" value="100"> <b class="mono am-av">100</b></label></div>
    <div class="am-ag" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-top:6px"></div>
    <div class="svgbox am-line"></div>
    <div class="msg am-msg"></div>
    <div class="counter" style="margin-top:10px">step through the notes' three cases</div><div class="console am-out"></div>`;
  const $ = (q) => el.querySelector(q);
  const A = (b, a) => (b < a ? "reject" : "accept");
  const B = (b, a) => (precise ? A(b, a) : b <= a ? "reject" : "accept");
  function show(bal, amt) {
    $(".am-req").innerHTML = precise ? "Reject a transaction if its amount is greater than the user's balance." : "Insufficient user balance reject transactions.";
    $(".am-bv").textContent = bal; $(".am-av").textContent = amt;
    const a = A(bal, amt), b = B(bal, amt);
    const card = (who, op, d) => `<div class="frame ${d === "reject" ? "err" : "ret"}" style="font-size:13px"><b>agent ${who}</b> reads it as <code>balance ${op} amount</code> → reject<br>balance ${bal}, amount ${amt}: <b>${d}</b></div>`;
    $(".am-ag").innerHTML = card("A", "&lt;", a) + card("B", precise ? "&lt;" : "&lt;=", b);
    const x = (v) => 20 + (v / 200) * 400;
    const band = (y, op, lbl) => `<text x="0" y="${y + 12}" font-size="11" fill="var(--stone)">${lbl}</text>
      <rect x="${x(0) + 20}" y="${y}" width="${x(amt) - x(0)}" height="16" fill="var(--red-soft)"/><rect x="${x(amt) + 20}" y="${y}" width="${x(200) - x(amt)}" height="16" fill="var(--green-soft)"/>
      <circle cx="${x(amt) + 20}" cy="${y + 8}" r="5" fill="${op === "<=" ? "var(--red)" : "var(--green)"}" stroke="var(--ink)"/>`;
    $(".am-line").innerHTML = `<svg viewBox="0 0 460 90" role="img" aria-label="reject and accept regions">${band(8, "<", "A")}${band(34, precise ? "<" : "<=", "B")}
      <line x1="${x(bal) + 20}" y1="2" x2="${x(bal) + 20}" y2="58" stroke="var(--amber)" stroke-width="2.5"/>
      <text x="${x(bal) + 20}" y="74" text-anchor="middle" font-size="11" fill="var(--ink)">balance ${bal}</text>
      <text x="440" y="86" text-anchor="end" font-size="10" fill="var(--stone)">red: reject · green: accept · dot at balance = amount</text></svg>`;
    const m = $(".am-msg");
    m.className = "msg am-msg " + (a === b ? "good" : "bad");
    m.innerHTML = a === b ? (bal === amt ? "At the boundary, and the agents agree: the wording says which side it is on." : "They agree here. Try balance = amount.") : "<b>They disagree.</b> Balance equals the amount: the boundary the requirement never pinned down.";
  }
  const pl = player(el, () => 4, (i) => {
    if (i > 0) { const [b, a] = CASES[i - 1]; $(".am-b").value = b; $(".am-a").value = a; }
    show(+$(".am-b").value, +$(".am-a").value);
    $(".am-out").textContent = precise ? "(precise wording: both agents use <, so they never disagree)" : OUT.slice(0, i + 1).join("\n");
  }, { ms: 1300 });
  $(".am-b").oninput = $(".am-a").oninput = () => show(+$(".am-b").value, +$(".am-a").value);
  $(".am-fix").onchange = () => { precise = $(".am-fix").checked; pl.redraw(); };
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
  cycle: (el) => demoCycle(el),
  cycleMini: (el) => demoCycle(el, { mini: true }),
  classify: (el) => demoClassify(el),
  reqsMini: (el) => demoReqsMini(el),
  interview: (el) => demoInterview(el),
  ltl: (el) => demoLtl(el),
  ltlMini: (el) => demoLtl(el, { mini: true }),
  nl2spec: (el) => demoNl2spec(el),
  checker: (el) => demoChecker(el),
  maxspec: (el) => demoMaxSpec(el),
  specgen: (el) => demoSpecgen(el),
  specgenMini: (el) => demoSpecgen(el, { mini: true }),
  consistency: (el) => demoConsistency(el),
  featuremap: (el) => demoFeatureMap(el),
  featuremapMini: (el) => demoFeatureMap(el, { mini: true }),
  ambiguity: (el) => demoAmbiguity(el),
  quiz: (el) => demoQuiz(el, QUIZ),
};
