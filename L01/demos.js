// L01 demos. Code panels and printed outputs (CODE, OUT) are copied from csc4801/notes/L01-llms.md
// (checked by csc4801/tools/check.py). The JS twins below repeat the notes' Python step for step,
// with the same seeded generator, so the sampling demo prints the same answers as the notes.

// Generated from csc4801/notes/L01-llms.md (checked by csc4801/tools/check.py). Do not edit by hand.
const CODE = {
  tokenize: `VOCAB = ["LLMs", " are", " Large", " Language", " Model", "s",
         "print", "(", '"', "hello", " world", "!", ")", ";",
         "_e", "ig", "ens", "ystem"]


def tokenize(text):
    """Greedy longest match: at each position take the longest piece in VOCAB."""
    tokens = []
    i = 0
    while i < len(text):
        piece = max((v for v in VOCAB if text.startswith(v, i)), key=len, default=text[i])
        tokens.append(piece)
        i += len(piece)
    return tokens


for text in ["LLMs are Large Language Models", 'print("hello world!");', "_eigensystem"]:
    tokens = tokenize(text)
    print(len(tokens), tokens)`,
  tokenIds: `print([VOCAB.index(t) for t in tokenize("LLMs are Large Language Models")])`,
  nextTable: `NEXT = {
    "are": {"Large": 1.0},
    "Large": {"Language": 1.0},
    "Language": {"Models": 1.0},
    "Models": {"[END]": 1.0},
    "Computing?": {"Turing": 0.6, "It": 0.4},
    "It": {"is": 1.0},
    "is": {"Turing": 1.0},
    "Turing": {"Award": 0.5, "Home": 0.2, "Machine": 0.3},
    "Award": {"[END]": 1.0},
    "Home": {"[END]": 1.0},
    "Machine": {"[END]": 1.0},
}


def greedy(probs):
    """Pick the most likely token."""
    return max(probs, key=probs.get)


def generate(prompt, pick, show=False):
    """Predict one token at a time until [END]; return the answer."""
    tokens = prompt.split()
    while True:
        token = pick(NEXT[tokens[-1]])
        if show:
            print(f"{' '.join(tokens)!r:49} -> {token}")
        if token == "[END]":
            return " ".join(tokens[len(prompt.split()):])
        tokens.append(token)


print(generate("LLMs are", greedy, show=True))
print(generate("What is Nobel Prize of Computing?", greedy, show=True))`,
  sampler: `def make_rng(seed):
    """A tiny random number generator (Park-Miller). Same seed, same numbers."""
    state = seed

    def rand():
        nonlocal state
        state = state * 16807 % 2147483647
        return state / 2147483647

    return rand


def with_temperature(probs, t):
    """Sharpen (t < 1) or flatten (t > 1) a distribution."""
    weights = {tok: p ** (1 / t) for tok, p in probs.items()}
    total = sum(weights.values())
    return {tok: w / total for tok, w in weights.items()}


def sampler(seed, t=1.0):
    """A pick function that samples from the distribution."""
    rand = make_rng(seed)

    def pick(probs):
        r = rand()
        total = 0.0
        for tok, p in with_temperature(probs, t).items():
            total += p
            if r < total:
                return tok
        return tok

    return pick


question = "What is Nobel Prize of Computing?"
pick = sampler(seed=42)
for _ in range(6):
    print(generate(question, pick))`,
  temperature: `for t in (0.2, 1.0, 3.0):
    print(t, {tok: round(p, 2) for tok, p in with_temperature(NEXT["Turing"], t).items()})`,
  resultEq: `numbers = [1, 2, 3, 4, 5]
result =`,
  pairs: `tokens = tokenize('print("hello world!");')
for k in range(1, 5):
    print(f"{''.join(tokens[:k])!r:16} -> {tokens[k]!r}")`,
  train: `from collections import Counter, defaultdict


def train(corpus):
    """Count next tokens; return a table of probabilities like NEXT."""
    counts = defaultdict(Counter)
    for line in corpus:
        tokens = line.split()
        for prev, nxt in zip(tokens, tokens[1:] + ["[END]"]):
            counts[prev][nxt] += 1
    return {prev: {t: n / sum(c.values()) for t, n in c.items()} for prev, c in counts.items()}


corpus = [
    "result = sum ( numbers )",
    "result = sum ( numbers )",
    "result = max ( numbers )",
    "total = sum ( numbers )",
]
model = train(corpus)
print(model["="])
print(model["("])`,
  printout: `tokens = 15e12
pages = tokens / 1000
km = pages / 100 / 100_000           # 100 pages per cm, 100,000 cm per km
years = pages * 10 / (365 * 24 * 3600)
print(f"{km:,.0f} km thick, {years:,.0f} years to read")`,
  compute: `N = 70e9      # parameters
D = 15e12     # tokens
C = 6 * N * D
print(f"C = {C:.1e} FLOPs")`,
  lossN: `def loss_from_params(n):
    return (n / 8.8e13) ** -0.076


for n in (1e5, 1e7, 1e9):
    print(f"N = {n:.0e}: loss {loss_from_params(n):.2f}")`,
  patternFn: `def function_name(input1, input2):
    return input1 operator input2`,
  divide1: `def divide(a, b):
    return a / b`,
  divide2: `def divide(a, b):
    if b == 0:
        return "Error"
    return a / b`,
  feedback: `def feedback(probs, preferred, rate=0.5):
    """One human preference: boost the preferred answer, then renormalise."""
    boosted = {a: p * (1 + rate) if a == preferred else p for a, p in probs.items()}
    total = sum(boosted.values())
    return {a: p / total for a, p in boosted.items()}


probs = {"A": 1 / 3, "B": 1 / 3, "C": 1 / 3}
for vote in ["B", "B", "C", "B"]:
    probs = feedback(probs, vote)
    print(vote, {a: round(p, 2) for a, p in probs.items()})`,
  ex1: `small = 6 * 7e9 * 2e12
print(f"{small:.1e} FLOPs, {6 * 70e9 * 15e12 / small:.0f} times less")`,
  ex2: `model = train(corpus + ["result = len ( numbers )"] * 2)
print({t: round(p, 2) for t, p in model["="].items()})`,
  ex3: `pick = sampler(seed=7)
counts = Counter(generate(question, pick) for _ in range(1000))
for answer, n in counts.most_common():
    print(f"{answer:22} {n}")`,
};
const OUT = {
  tokenize: `6 ['LLMs', ' are', ' Large', ' Language', ' Model', 's']
9 ['print', '(', '"', 'hello', ' world', '!', '"', ')', ';']
4 ['_e', 'ig', 'ens', 'ystem']`,
  tokenIds: `[0, 1, 2, 3, 4, 5]`,
  nextTable: `'LLMs are'                                        -> Large
'LLMs are Large'                                  -> Language
'LLMs are Large Language'                         -> Models
'LLMs are Large Language Models'                  -> [END]
Large Language Models
'What is Nobel Prize of Computing?'               -> Turing
'What is Nobel Prize of Computing? Turing'        -> Award
'What is Nobel Prize of Computing? Turing Award'  -> [END]
Turing Award`,
  sampler: `Turing Home
Turing Award
It is Turing Award
It is Turing Award
Turing Award
It is Turing Machine`,
  temperature: `0.2 {'Award': 0.92, 'Home': 0.01, 'Machine': 0.07}
1.0 {'Award': 0.5, 'Home': 0.2, 'Machine': 0.3}
3.0 {'Award': 0.39, 'Home': 0.29, 'Machine': 0.33}`,
  pairs: `'print'          -> '('
'print('         -> '"'
'print("'        -> 'hello'
'print("hello'   -> ' world'`,
  train: `{'sum': 0.75, 'max': 0.25}
{'numbers': 1.0}`,
  printout: `1,500 km thick, 4,756 years to read`,
  compute: `C = 6.3e+24 FLOPs`,
  lossN: `N = 1e+05: loss 4.78
N = 1e+07: loss 3.37
N = 1e+09: loss 2.38`,
  feedback: `B {'A': 0.29, 'B': 0.43, 'C': 0.29}
B {'A': 0.24, 'B': 0.53, 'C': 0.24}
C {'A': 0.21, 'B': 0.47, 'C': 0.32}
B {'A': 0.17, 'B': 0.57, 'C': 0.26}`,
  ex1: `8.4e+22 FLOPs, 75 times less`,
  ex2: `{'sum': 0.5, 'max': 0.17, 'len': 0.33}`,
  ex3: `Turing Award           293
It is Turing Award     211
Turing Machine         185
It is Turing Machine   122
Turing Home            115
It is Turing Home      74`,
};

// ---------- JS twins of the Python in the notes (same data, same order of operations) ----------

const VOCAB = ["LLMs", " are", " Large", " Language", " Model", "s",
  "print", "(", '"', "hello", " world", "!", ")", ";",
  "_e", "ig", "ens", "ystem"];

function tokenize(text) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    let piece = null;
    for (const v of VOCAB) if (text.startsWith(v, i) && (!piece || v.length > piece.length)) piece = v;
    piece = piece || text[i];
    tokens.push(piece);
    i += piece.length;
  }
  return tokens;
}

const NEXT = {
  are: { Large: 1.0 },
  Large: { Language: 1.0 },
  Language: { Models: 1.0 },
  Models: { "[END]": 1.0 },
  "Computing?": { Turing: 0.6, It: 0.4 },
  It: { is: 1.0 },
  is: { Turing: 1.0 },
  Turing: { Award: 0.5, Home: 0.2, Machine: 0.3 },
  Award: { "[END]": 1.0 },
  Home: { "[END]": 1.0 },
  Machine: { "[END]": 1.0 },
};
const QUESTION = "What is Nobel Prize of Computing?";

function greedy(probs) {
  let best = null;
  for (const t in probs) if (best === null || probs[t] > probs[best]) best = t;
  return best;
}

function makeRng(seed) {
  let state = seed;
  return () => { state = state * 16807 % 2147483647; return state / 2147483647; };
}

function withTemperature(probs, t) {
  const w = {};
  for (const k in probs) w[k] = Math.pow(probs[k], 1 / t);
  let total = 0;
  for (const k in w) total += w[k];
  const out = {};
  for (const k in w) out[k] = w[k] / total;
  return out;
}

function samplePick(probs, r) {
  let total = 0, tok = null;
  for (tok in probs) { total += probs[tok]; if (r < total) return tok; }
  return tok;
}

// Python-style reprs, so consoles match the notes' printed output.
const attr = (s) => esc(s).replace(/"/g, "&quot;");
const pyStr = (s) => (s.includes("'") && !s.includes('"')) ? `"${s}"` : `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
const pyNum = (x) => Number.isInteger(x) ? x + ".0" : String(x);
const pyDict = (d, dp = null) => "{" + Object.entries(d).map(([k, v]) => `${pyStr(k)}: ${pyNum(dp === null ? v : +v.toFixed(dp))}`).join(", ") + "}";

// Horizontal probability bars. hi = highlighted token; marks = {r} draws a marker at r.
function barsHTML(probs, { hi = null, r = null, dp = 2 } = {}) {
  let acc = 0;
  const rows = Object.entries(probs).map(([t, p]) => {
    const from = acc; acc += p;
    const on = t === hi;
    return `<div style="display:grid;grid-template-columns:92px 1fr 52px;gap:8px;align-items:center;margin:3px 0">
      <span class="mono" style="font-size:13px;text-align:right;${on ? "font-weight:700;color:var(--amber)" : ""}">${esc(t)}</span>
      <span style="position:relative;height:18px;background:var(--card-2,var(--paper));border:1px solid var(--line);border-radius:4px;overflow:hidden">
        <span style="position:absolute;left:0;top:0;bottom:0;width:${(p * 100).toFixed(1)}%;background:${on ? "var(--amber)" : "var(--teal)"};opacity:${on ? 0.9 : 0.55}"></span></span>
      <span class="mono" style="font-size:12.5px">${p.toFixed(dp)}</span></div>`;
  }).join("");
  return rows;
}

// Cumulative strip for sampling: each token owns [from, to); the draw r lands in one of them.
function stripHTML(probs, r, hi) {
  let acc = 0;
  const segs = Object.entries(probs).map(([t, p]) => {
    const x = acc; acc += p;
    return `<span title="${esc(t)}" style="position:absolute;left:${x * 100}%;width:${p * 100}%;top:0;bottom:0;background:${t === hi ? "var(--mark)" : "var(--teal-soft)"};border-right:1px solid var(--card);display:grid;place-items:center;font:12px var(--mono);overflow:hidden;white-space:nowrap">${p >= 0.08 ? esc(t) : ""}</span>`;
  }).join("");
  const mark = r === null ? "" : `<span style="position:absolute;left:calc(${r * 100}% - 1px);top:-4px;bottom:-4px;width:3px;background:var(--red);border-radius:2px"></span>`;
  return `<div style="position:relative;height:28px;border:1px solid var(--line);border-radius:5px;margin:8px 0 2px">${segs}${mark}</div>
    <div style="display:flex;justify-content:space-between;font:11px var(--mono);color:var(--stone)"><span>0</span><span>1</span></div>`;
}

// ---------- Demo: tokenizer ----------

function demoTokenize(el) {
  const EX = ["LLMs are Large Language Models", 'print("hello world!");', "_eigensystem"];
  el.innerHTML = `<div class="controls" style="margin-top:0">
      <input type="text" class="tk-in" value="${attr(EX[0])}" style="flex:1;min-width:200px" aria-label="text to tokenize"></div>
    <div class="controls">${EX.map((e) => `<button class="cbtn" data-ex="${attr(e)}">${esc(e)}</button>`).join("")}</div>
    <div class="tk-chips" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px"></div>
    <div class="counter" style="margin-top:10px">what <code>print(len(tokens), tokens)</code> prints</div>
    <div class="console tk-out"></div>`;
  const $ = (q) => el.querySelector(q);
  function render() {
    const tokens = tokenize($(".tk-in").value);
    $(".tk-chips").innerHTML = tokens.map((t) => {
      const id = VOCAB.indexOf(t);
      return `<span style="display:inline-flex;flex-direction:column;align-items:center;border:1.5px ${id < 0 ? "dashed var(--stone)" : "solid var(--teal)"};border-radius:6px;padding:3px 7px;background:${id < 0 ? "transparent" : "var(--teal-soft)"}">
        <span class="mono" style="font-size:14px;white-space:pre">${esc(t.replace(/ /g, "␣"))}</span>
        <span class="mono" style="font-size:10.5px;color:var(--stone)">${id < 0 ? "char" : "id " + id}</span></span>`;
    }).join("") || `<span class="hint">Type something.</span>`;
    $(".tk-out").textContent = `${tokens.length} [${tokens.map(pyStr).join(", ")}]`;
  }
  $(".tk-in").oninput = render;
  el.querySelectorAll("[data-ex]").forEach((b) => { b.onclick = () => { $(".tk-in").value = b.dataset.ex; render(); }; });
  render();
}

// ---------- Demo: next-token prediction, greedy, one step at a time ----------

function greedySteps(prompt) {
  const tokens = prompt.split(" ");
  const steps = [];
  for (;;) {
    const probs = NEXT[tokens[tokens.length - 1]];
    const token = greedy(probs);
    steps.push({ ctx: tokens.join(" "), probs, token });
    if (token === "[END]") break;
    tokens.push(token);
  }
  return steps;
}

function demoNextToken(el, { mini = false } = {}) {
  const PROMPTS = ["LLMs are", QUESTION];
  let p = mini ? 1 : 0, i = 0, timer = null;
  el.innerHTML = `${mini ? "" : `<div class="controls" style="margin-top:0">${PROMPTS.map((q, k) => `<button class="cbtn nt-p" data-k="${k}">${esc(q)}</button>`).join("")}</div>`}
    <div class="nt-rows" style="display:grid;gap:8px;margin-top:10px"></div>
    ${mini ? "" : `<div class="counter" style="margin-top:12px">NEXT-TOKEN DISTRIBUTION · this step</div><div class="nt-bars"></div>
    <div class="msg nt-msg"></div>
    <div class="counter" style="margin-top:10px">what <code>generate(prompt, greedy, show=True)</code> prints</div><div class="console nt-out"></div>
    <div class="controls"><button class="cbtn nt-reset">⟲ Reset</button><button class="cbtn nt-back">◀ Back</button>
      <button class="cbtn on nt-step">Step ▶</button><span class="spacer"></span><span class="counter nt-count"></span></div>`}`;
  const $ = (q) => el.querySelector(q);
  function render() {
    const steps = greedySteps(PROMPTS[p]);
    const shown = steps.slice(0, i + 1);
    $(".nt-rows").innerHTML = shown.map((s, k) => {
      const prev = k ? s.ctx.slice(0, s.ctx.length - steps[k - 1].token.length) : s.ctx;
      const ctx = k ? `${esc(prev)}<b style="color:var(--teal)">${esc(steps[k - 1].token)}</b>` : esc(s.ctx);
      return `<div style="display:grid;grid-template-columns:minmax(0,1fr) auto auto auto;gap:8px;align-items:center;${k === i ? "" : "opacity:.55"}">
        <span style="background:var(--mark);border-radius:5px;padding:4px 8px;font-size:13px">${ctx}</span>
        <span>→</span><span style="background:var(--teal);color:#fff;border-radius:5px;padding:4px 10px;font:700 13px var(--mono)">LLM</span>
        <span style="background:var(--green-soft);border-radius:5px;padding:4px 8px;font:600 13px var(--mono)">→ ${esc(s.token)}</span></div>`;
    }).join("");
    if (mini) return;
    const s = steps[i];
    $(".nt-bars").innerHTML = barsHTML(s.probs, { hi: s.token });
    const done = s.token === "[END]";
    $(".nt-msg").innerHTML = done
      ? `The model predicts <b>[END]</b>: stop. The answer is the tokens it produced: <b>${esc(steps.slice(0, -1).map((x) => x.token).join(" "))}</b>.`
      : `Input: “${esc(s.ctx)}”. The most likely next token is <b>${esc(s.token)}</b> (${s.probs[s.token].toFixed(2)}). It is appended to the input for the next step.`;
    $(".nt-msg").className = "msg nt-msg" + (done ? " good" : "");
    const lines = shown.map((x) => `${pyStr(x.ctx).padEnd(49)} -> ${x.token}`);
    if (done) lines.push(steps.slice(0, -1).map((x) => x.token).join(" "));
    $(".nt-out").textContent = lines.join("\n");
    $(".nt-count").textContent = `step ${i + 1} / ${steps.length}`;
    $(".nt-back").disabled = $(".nt-reset").disabled = i === 0;
    $(".nt-step").disabled = i === steps.length - 1;
    el.querySelectorAll(".nt-p").forEach((b) => b.classList.toggle("on", +b.dataset.k === p));
  }
  if (mini) {
    timer = setInterval(() => {
      const n = greedySteps(PROMPTS[p]).length;
      if (i < n - 1) i++; else { i = 0; p = 1 - p; }
      render();
    }, 1200);
  } else {
    el.querySelectorAll(".nt-p").forEach((b) => { b.onclick = () => { p = +b.dataset.k; i = 0; render(); }; });
    $(".nt-reset").onclick = () => { i = 0; render(); };
    $(".nt-back").onclick = () => { if (i) i--; render(); };
    $(".nt-step").onclick = () => { if (i < greedySteps(PROMPTS[p]).length - 1) i++; render(); };
  }
  render();
}

// ---------- Demo: sampling with temperature and a seed ----------

function demoSample(el) {
  el.innerHTML = `<div class="controls" style="margin-top:0">
      <label>seed <input type="number" class="sm-seed" min="1" max="2147483646" value="42" style="width:110px"></label>
      <label>temperature <input type="range" class="sm-t" min="0.1" max="3" step="0.1" value="1"> <b class="sm-tv mono">1.0</b></label>
      <button class="cbtn sm-greedy" title="the greedy pick, for comparison">greedy</button></div>
    <div class="sm-ctx" style="margin-top:10px;font-size:14px"></div>
    <div class="counter" style="margin-top:10px">DISTRIBUTION AFTER TEMPERATURE · the red line is the random draw r</div>
    <div class="sm-bars"></div><div class="sm-strip"></div>
    <div class="msg sm-msg"></div>
    <div class="counter" style="margin-top:10px">answers so far (what the notes' loop prints)</div><div class="console sm-out"></div>
    <div class="controls"><button class="cbtn sm-reset">⟲ Reset</button><button class="cbtn on sm-step">Next token ▶</button>
      <button class="cbtn sm-ans">Finish answer</button><button class="cbtn sm-six">Ask 6 times</button>
      <span class="spacer"></span><span class="counter sm-n"></span></div>`;
  const $ = (q) => el.querySelector(q);
  let rand, t, tokens, answers, last, draws, isGreedy = false;
  function reset() {
    const seed = Math.min(2147483646, Math.max(1, Math.floor(+$(".sm-seed").value) || 1));
    $(".sm-seed").value = seed;
    t = +$(".sm-t").value;
    $(".sm-tv").textContent = t.toFixed(1);
    rand = makeRng(seed);
    tokens = QUESTION.split(" "); answers = []; last = null; draws = 0;
    render();
  }
  function step() {
    const probs = isGreedy ? NEXT[tokens[tokens.length - 1]] : withTemperature(NEXT[tokens[tokens.length - 1]], t);
    const r = isGreedy ? null : rand();
    const tok = isGreedy ? greedy(probs) : samplePick(probs, r);
    draws += isGreedy ? 0 : 1;
    last = { probs, r, tok, ctx: tokens.join(" ") };
    if (tok === "[END]") {
      answers.push(tokens.slice(QUESTION.split(" ").length).join(" "));
      tokens = QUESTION.split(" ");
    } else tokens.push(tok);
  }
  function finish() { do step(); while (last.tok !== "[END]"); }
  function render() {
    const q = QUESTION.split(" ").length;
    const gen = tokens.slice(q);
    $(".sm-ctx").innerHTML = `<span class="tag">input</span> ${esc(QUESTION)} <b style="color:var(--teal)">${esc(gen.join(" "))}</b><span class="mono" style="color:var(--stone)">${gen.length ? "" : " …"}</span>`;
    const cur = isGreedy ? NEXT[tokens[tokens.length - 1]] : withTemperature(NEXT[tokens[tokens.length - 1]], t);
    if (last && last.tok !== "[END]") {
      $(".sm-bars").innerHTML = barsHTML(last.probs, { hi: last.tok });
      $(".sm-strip").innerHTML = last.r === null ? "" : stripHTML(last.probs, last.r, last.tok);
      $(".sm-msg").innerHTML = last.r === null ? `Greedy: always the top token, <b>${esc(last.tok)}</b>.`
        : `After “…${esc(last.ctx.split(" ").slice(-1)[0])}”: r = <span class="mono">${last.r.toFixed(4)}</span> lands in <b>${esc(last.tok)}</b>.`;
    } else if (last && last.tok === "[END]") {
      $(".sm-bars").innerHTML = barsHTML(last.probs, { hi: "[END]" });
      $(".sm-strip").innerHTML = last.r === null ? "" : stripHTML(last.probs, last.r, "[END]");
      $(".sm-msg").innerHTML = `[END]: answer ${answers.length} is <b>${esc(answers[answers.length - 1])}</b>. The next step starts the question again, with the same generator.`;
    } else {
      $(".sm-bars").innerHTML = barsHTML(cur);
      $(".sm-strip").innerHTML = isGreedy ? "" : stripHTML(cur, null, null);
      $(".sm-msg").innerHTML = isGreedy ? "Greedy mode: no random draws." : `Press <b>Next token</b>: draw r, and pick the token whose slice of [0, 1) it lands in.`;
    }
    $(".sm-msg").className = "msg sm-msg" + (last && last.tok === "[END]" ? " good" : "");
    $(".sm-out").textContent = answers.join("\n");
    $(".sm-n").textContent = `${answers.length} answer${answers.length === 1 ? "" : "s"} · ${draws} draws`;
    $(".sm-greedy").classList.toggle("on", isGreedy);
    $(".sm-t").disabled = isGreedy;
  }
  $(".sm-step").onclick = () => { step(); render(); };
  $(".sm-ans").onclick = () => { finish(); render(); };
  $(".sm-six").onclick = () => { for (let k = 0; k < 6; k++) finish(); render(); };
  $(".sm-reset").onclick = reset;
  $(".sm-seed").onchange = reset;
  $(".sm-t").oninput = reset;
  $(".sm-greedy").onclick = () => { isGreedy = !isGreedy; reset(); };
  reset();
}

// Mini: the Turing distribution, re-sampled at a changing temperature.
function demoTempMini(el) {
  const TS = [0.2, 0.5, 1.0, 2.0, 3.0];
  let k = 2;
  el.innerHTML = `<div class="counter tm-t"></div><div class="tm-bars"></div>`;
  function render() {
    el.querySelector(".tm-t").innerHTML = `After “… Turing” · temperature <b class="mono">${TS[k].toFixed(1)}</b>`;
    el.querySelector(".tm-bars").innerHTML = barsHTML(withTemperature(NEXT.Turing, TS[k]));
  }
  setInterval(() => { k = (k + 1) % TS.length; render(); }, 1300);
  render();
}

// ---------- Demo: the three training stages ----------

const STAGE_INPUTS = ["def divide(a, b):", "User: Write a Python function that divides two numbers."];
const STAGES = [
  { name: "Initial model", sub: "default weights", data: "—", outs: ["sum out ) print (", "( ) hello out sum"], note: "Illustrative: with default weights the output is noise." },
  { name: "Version 1", sub: "after Pre-train", data: "public data from the internet", outs: ["    return a / b", "Assistant: I cannot write it."], note: "It completes code, but has not learned to act as an assistant (slide 40)." },
  { name: "Version 2", sub: "after SFT", data: "annotation data (few, high quality)", outs: ["    return a / b", "Assistant:\ndef divide(a, b):\n    return a / b"], note: "SFT taught it how to answer a user (slide 40)." },
  { name: "Final version", sub: "after RLHF", data: "user response data (preferences)", outs: ["    return a / b", "Assistant:\ndef divide(a, b):\n    if b == 0:\n        return \"Error\"\n    return a / b"], note: "RLHF: people preferred the answer that checks b == 0 (slide 43). No new training data." },
];

function stageSVG(k) {
  const box = (x, label, fill, on) => `<rect x="${x}" y="30" width="120" height="44" rx="10" fill="${fill}" stroke="${on ? "var(--amber)" : "var(--line)"}" stroke-width="${on ? 3 : 1.2}"/>
    <text x="${x + 60}" y="57" text-anchor="middle" font-size="15" fill="var(--ink)">${label}</text>`;
  const ver = (x, label, on) => `<text x="${x}" y="100" text-anchor="middle" font-size="12" fill="${on ? "var(--amber)" : "var(--stone)"}" font-weight="${on ? 700 : 400}">${label}</text>`;
  const arrow = (x1, x2) => `<path d="M ${x1} 52 L ${x2} 52" stroke="var(--stone)" stroke-width="1.4" marker-end="url(#sa)"/>`;
  return `<svg viewBox="0 0 640 112" role="img" aria-label="Pre-train, SFT, RLHF">
    <defs><marker id="sa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="var(--stone)"/></marker></defs>
    ${arrow(42, 88)}${arrow(212, 258)}${arrow(382, 428)}${arrow(552, 598)}
    <circle cx="26" cy="52" r="15" fill="${k === 0 ? "var(--mark)" : "var(--card)"}" stroke="${k === 0 ? "var(--amber)" : "var(--line)"}" stroke-width="2"/>
    <circle cx="614" cy="52" r="15" fill="${k === 3 ? "var(--mark)" : "var(--card)"}" stroke="${k === 3 ? "var(--amber)" : "var(--line)"}" stroke-width="2"/>
    ${box(90, "Pre-train", "var(--mark)", k === 1)}${box(260, "SFT", "var(--green-soft)", k === 2)}${box(430, "RLHF", "var(--teal-soft)", k === 3)}
    ${ver(26, "default", k === 0)}${ver(236, "Version 1", k === 1)}${ver(406, "Version 2", k === 2)}${ver(606, "Final", k === 3)}
    <text x="345" y="16" text-anchor="middle" font-size="11" fill="var(--stone)">alignment: SFT + RLHF</text>
    <path d="M 262 22 L 548 22" stroke="var(--stone)" stroke-dasharray="3 3"/>
  </svg>`;
}

function demoStages(el, { mini = false } = {}) {
  let k = 0;
  el.innerHTML = `<div class="svgbox st-svg"></div>
    <div class="st-io" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px"></div>
    ${mini ? "" : `<div class="msg st-msg"></div>
    <div class="controls"><button class="cbtn st-back">◀ Back</button><button class="cbtn on st-step">Train next stage ▶</button>
    <span class="spacer"></span><span class="counter st-n"></span></div>`}`;
  const $ = (q) => el.querySelector(q);
  function render() {
    const s = STAGES[k];
    $(".st-svg").innerHTML = stageSVG(k);
    $(".st-io").innerHTML = STAGE_INPUTS.map((inp, j) => `<div><div class="counter">input ${j + 1}</div>
      <pre class="code nonum" style="margin:4px 0;padding:8px;font-size:12px;white-space:pre-wrap">${esc(inp)}</pre>
      <div class="counter">${esc(s.name)} answers</div>
      <pre class="code nonum" style="margin:4px 0;padding:8px;font-size:12px;white-space:pre-wrap;background:${k === 0 ? "var(--red-soft)" : "var(--green-soft)"}">${esc(s.outs[j])}</pre></div>`).join("");
    if (mini) return;
    $(".st-msg").innerHTML = `<b>${esc(s.name)}</b> (${esc(s.sub)}) · data: ${esc(s.data)}. ${esc(s.note)}`;
    $(".st-n").textContent = `stage ${k + 1} / ${STAGES.length}`;
    $(".st-back").disabled = k === 0;
    $(".st-step").disabled = k === STAGES.length - 1;
  }
  if (mini) setInterval(() => { k = (k + 1) % STAGES.length; render(); }, 1800);
  else {
    $(".st-back").onclick = () => { if (k) k--; render(); };
    $(".st-step").onclick = () => { if (k < STAGES.length - 1) k++; render(); };
  }
  render();
}

// ---------- Demo: self-supervised pairs and a counting "pre-training" ----------

function trainCounts(lines) {
  const counts = {};
  for (const line of lines) {
    const tokens = line.split(/\s+/).filter(Boolean);
    if (!tokens.length) continue;
    const nexts = tokens.slice(1).concat(["[END]"]);
    tokens.forEach((prev, j) => {
      counts[prev] = counts[prev] || {};
      counts[prev][nexts[j]] = (counts[prev][nexts[j]] || 0) + 1;
    });
  }
  const model = {};
  for (const prev in counts) {
    let total = 0;
    for (const t in counts[prev]) total += counts[prev][t];
    model[prev] = {};
    for (const t in counts[prev]) model[prev][t] = counts[prev][t] / total;
  }
  return { model, counts };
}

const CORPUS = ["result = sum ( numbers )", "result = sum ( numbers )", "result = max ( numbers )", "total = sum ( numbers )"];

function demoSelfSup(el) {
  const toks = tokenize('print("hello world!");');
  let k = 1;
  el.innerHTML = `<div class="counter">PART A · cut one line into training pairs</div>
    <div class="ss-line" style="display:flex;flex-wrap:wrap;gap:4px;margin:8px 0"></div>
    <table class="ss-tab" style="max-width:420px"></table>
    <div class="controls"><button class="cbtn ss-back">◀ Back</button><button class="cbtn on ss-step">Next pair ▶</button><span class="spacer"></span><span class="counter ss-n"></span></div>
    <div class="counter" style="margin-top:16px">PART B · “train” by counting what follows what</div>
    <textarea class="ss-corpus" rows="6" style="width:100%;box-sizing:border-box;font:13px var(--mono);margin-top:6px" aria-label="corpus, one line per example"></textarea>
    <div class="controls"><button class="cbtn ss-notes">Notes' corpus</button><button class="cbtn ss-ex">+ Exercise 2 lines</button>
      <label>next token after <select class="ss-prev"></select></label></div>
    <div class="ss-bars" style="margin-top:6px"></div>
    <div class="counter" style="margin-top:8px">print(model[…]) — rounded to 2 places</div><div class="console ss-out"></div>
    <p class="hint">Tokens here are split on spaces, as in the notes' <code>train</code>. Edit the lines and watch the table change: no one labels anything.</p>`;
  const $ = (q) => el.querySelector(q);
  function renderA() {
    $(".ss-line").innerHTML = toks.map((t, j) => `<span class="mono" style="padding:3px 6px;border-radius:5px;font-size:13px;white-space:pre;border:1px solid var(--line);background:${j < k ? "var(--mark)" : j === k ? "var(--green-soft)" : "transparent"};${j > k ? "opacity:.45" : ""}">${esc(t)}</span>`).join("");
    const rows = [];
    for (let j = 1; j <= k; j++) rows.push(`<tr${j === k ? ' style="font-weight:700"' : ""}><td class="mono">${esc(toks.slice(0, j).join(""))}</td><td class="mono">${esc(toks[j])}</td></tr>`);
    $(".ss-tab").innerHTML = `<tr><th>Input</th><th>Output</th></tr>${rows.join("")}${k === 4 ? `<tr><td>……</td><td></td></tr>` : ""}`;
    $(".ss-n").textContent = `pair ${k} / 4`;
    $(".ss-back").disabled = k === 1;
    $(".ss-step").disabled = k === 4;
  }
  function renderB() {
    const { model, counts } = trainCounts($(".ss-corpus").value.split("\n"));
    const sel = $(".ss-prev");
    const keep = sel.value || "=";
    sel.innerHTML = Object.keys(model).map((p) => `<option${p === keep ? " selected" : ""}>${esc(p)}</option>`).join("");
    const prev = model[keep] ? keep : Object.keys(model)[0];
    if (!prev) { $(".ss-bars").innerHTML = `<p class="hint">Type at least one line.</p>`; $(".ss-out").textContent = ""; return; }
    sel.value = prev;
    $(".ss-bars").innerHTML = barsHTML(model[prev]) + `<p class="hint" style="margin:4px 0 0">counts: ${Object.entries(counts[prev]).map(([t, n]) => `${esc(t)} ×${n}`).join(", ")}</p>`;
    $(".ss-out").textContent = pyDict(model[prev], 2);
  }
  $(".ss-back").onclick = () => { if (k > 1) k--; renderA(); };
  $(".ss-step").onclick = () => { if (k < 4) k++; renderA(); };
  $(".ss-notes").onclick = () => { $(".ss-corpus").value = CORPUS.join("\n"); renderB(); };
  $(".ss-ex").onclick = () => { $(".ss-corpus").value = CORPUS.concat(["result = len ( numbers )", "result = len ( numbers )"]).join("\n"); $(".ss-prev").value = "="; renderB(); };
  $(".ss-corpus").oninput = renderB;
  $(".ss-prev").onchange = renderB;
  $(".ss-corpus").value = CORPUS.join("\n");
  renderA(); renderB();
}

// ---------- Demo: how big is the data, and how much compute ----------

const fmt0 = (x) => x.toLocaleString("en-US", { maximumFractionDigits: 0 });

function demoScale(el) {
  el.innerHTML = `<div class="counter">PRINT IT OUT · 1000 tokens per page, 100 sheets per cm, 10 s per page</div>
    <div class="controls" style="margin-top:6px">
      <label>tokens <input type="range" class="sc-d" min="1" max="40" step="1" value="15"> <b class="sc-dv mono"></b></label>
      <button class="cbtn" data-d="15">LLaMA 3 · 15T</button><button class="cbtn" data-d="32">DeepSeek-V4 · 32T</button></div>
    <div class="stats sc-stats1"></div><div class="console sc-out1" style="margin-top:6px"></div>
    <div class="counter" style="margin-top:18px">COMPUTE · C ≈ 6ND</div>
    <div class="controls" style="margin-top:6px">
      <label>N (billions) <input type="number" class="sc-n" min="0.1" step="0.1" value="70" style="width:80px"></label>
      <label>D (trillions) <input type="number" class="sc-dd" min="0.1" step="0.1" value="15" style="width:80px"></label>
      <button class="cbtn" data-nd="70,15">Llama 3</button><button class="cbtn" data-nd="7,2">Exercise 1</button></div>
    <div class="stats sc-stats2"></div><div class="console sc-out2" style="margin-top:6px"></div>
    <div class="counter" style="margin-top:18px">MODEL SCALING · L = (N / 8.8·10¹³)^−0.076 (slide 34)</div>
    <div class="controls" style="margin-top:6px"><label>N <input type="range" class="sc-ln" min="5" max="9" step="1" value="5"> <b class="sc-lnv mono"></b></label></div>
    <div class="svgbox sc-svg"></div>
    <p class="hint">The loss law is the fitted line on the slide's plot (Kaplan et al.), for N from about 10⁴ to 10⁹ non-embedding parameters.</p>`;
  const $ = (q) => el.querySelector(q);
  const lossN = (n) => Math.pow(n / 8.8e13, -0.076);
  function render() {
    const T = +$(".sc-d").value;
    $(".sc-dv").textContent = T + "T";
    const tokens = T * 1e12, pages = tokens / 1000, km = pages / 100 / 100000, years = pages * 10 / (365 * 24 * 3600);
    $(".sc-stats1").innerHTML = `<div class="stat"><small>pages</small><b>${pages.toExponential(1)}</b></div>
      <div class="stat"><small>stack height</small><b>${fmt0(km)} km</b></div><div class="stat"><small>reading time</small><b>${fmt0(years)} years</b></div>`;
    $(".sc-out1").textContent = `${fmt0(km)} km thick, ${fmt0(years)} years to read`;
    const N = +$(".sc-n").value * 1e9, D = +$(".sc-dd").value * 1e12, C = 6 * N * D, ref = 6 * 70e9 * 15e12;
    $(".sc-stats2").innerHTML = `<div class="stat"><small>C (FLOPs)</small><b>${C.toExponential(1)}</b></div>
      <div class="stat"><small>vs Llama 3</small><b>${C >= ref ? (C / ref).toFixed(1) + "× more" : (ref / C).toFixed(0) + "× less"}</b></div>`;
    $(".sc-out2").textContent = `C = ${C.toExponential(1)} FLOPs`;
    const e = +$(".sc-ln").value;
    $(".sc-lnv").textContent = `1e+0${e}`;
    const W = 600, H = 170, x = (p) => 50 + (p - 4) / 5 * (W - 70), y = (L) => 15 + (6 - L) / 4 * (H - 45);
    let path = "";
    for (let p = 4; p <= 9.001; p += 0.1) path += `${path ? "L" : "M"} ${x(p).toFixed(1)} ${y(lossN(10 ** p)).toFixed(1)} `;
    const L = lossN(10 ** e);
    $(".sc-svg").innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="loss versus parameters">
      <line x1="50" y1="${H - 30}" x2="${W - 20}" y2="${H - 30}" stroke="var(--line)"/><line x1="50" y1="10" x2="50" y2="${H - 30}" stroke="var(--line)"/>
      ${[4, 5, 6, 7, 8, 9].map((p) => `<text x="${x(p)}" y="${H - 12}" text-anchor="middle" font-size="11" fill="var(--stone)">10^${p}</text>`).join("")}
      ${[2, 3, 4, 5, 6].map((v) => `<text x="42" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="var(--stone)">${v}</text>`).join("")}
      <path d="${path}" fill="none" stroke="var(--teal)" stroke-width="2"/>
      <circle cx="${x(e)}" cy="${y(L)}" r="6" fill="var(--amber)"/>
      <text x="${x(e) + 10}" y="${y(L) - 8}" font-size="13" fill="var(--ink)">loss ${L.toFixed(2)}</text>
      <text x="${W - 20}" y="${H - 34}" text-anchor="end" font-size="11" fill="var(--stone)">parameters N (log scale)</text></svg>`;
  }
  el.querySelectorAll("[data-d]").forEach((b) => { b.onclick = () => { $(".sc-d").value = b.dataset.d; render(); }; });
  el.querySelectorAll("[data-nd]").forEach((b) => { b.onclick = () => { const [n, d] = b.dataset.nd.split(","); $(".sc-n").value = n; $(".sc-dd").value = d; render(); }; });
  el.querySelectorAll("input").forEach((i) => { i.oninput = render; });
  render();
}

// ---------- Demo: preferences move the weights (toy RLHF) ----------

const ANSWERS = {
  A: "Of course! You can definitely get a high score—go for it!",
  B: "It's impossible to predict the outcome right now. Tell me the scope of the exam, your current level of understanding, and how much time you have available, and I can help you set priorities.",
  C: "One day is generally not enough to systematically master an entire course.",
};

function feedbackStep(probs, preferred, rate = 0.5) {
  const boosted = {};
  for (const a in probs) boosted[a] = a === preferred ? probs[a] * (1 + rate) : probs[a];
  let total = 0;
  for (const a in boosted) total += boosted[a];
  const out = {};
  for (const a in boosted) out[a] = boosted[a] / total;
  return out;
}

function demoPrefer(el) {
  let probs, log;
  el.innerHTML = `<p style="margin-top:0"><span class="tag">user</span> “I'm only starting to study the day before the exam—is there any hope?”</p>
    <div class="pf-ans" style="display:grid;gap:6px"></div>
    <div class="counter" style="margin-top:12px">THE TOY MODEL'S PROBABILITY OF EACH ANSWER</div><div class="pf-bars"></div>
    <div class="counter" style="margin-top:8px">what the notes' loop prints, one line per vote</div><div class="console pf-out"></div>
    <div class="controls"><button class="cbtn pf-reset">⟲ Reset</button><button class="cbtn pf-notes">Replay the notes' votes: B, B, C, B</button></div>
    <p class="hint">Illustrative only: each vote multiplies the preferred answer by 1.5 and renormalises. No new answer is written.</p>`;
  const $ = (q) => el.querySelector(q);
  function reset() { probs = { A: 1 / 3, B: 1 / 3, C: 1 / 3 }; log = []; render(); }
  function vote(v) { probs = feedbackStep(probs, v); log.push(`${v} ${pyDict(probs, 2)}`); render(); }
  function render() {
    $(".pf-ans").innerHTML = Object.entries(ANSWERS).map(([k, a]) => `<button class="cbtn pf-v" data-v="${k}" style="text-align:left;white-space:normal;line-height:1.4;padding:8px 10px">👍 <b>${k}:</b> ${esc(a)}</button>`).join("");
    el.querySelectorAll(".pf-v").forEach((b) => { b.onclick = () => vote(b.dataset.v); });
    const top = Object.keys(probs).reduce((a, b) => (probs[b] > probs[a] ? b : a));
    $(".pf-bars").innerHTML = barsHTML(probs, { hi: log.length ? top : null });
    $(".pf-out").textContent = log.join("\n");
  }
  $(".pf-reset").onclick = reset;
  $(".pf-notes").onclick = () => { reset(); ["B", "B", "C", "B"].forEach(vote); };
  reset();
}

// ---------- Demo: reinforcement learning, the Go analogy ----------

function demoRL(el) {
  const ROWS = [
    ["Observation", "the board", "the prompt"],
    ["Actor", "AlphaGo", "LLM"],
    ["Action", "the next move, e.g. “5-5”", "the next token"],
    ["Reward", "0 in most cases; +1 win, −1 loss", "a score for the answer (from human preferences in RLHF)"],
  ];
  let side = 0, k = 0;
  el.innerHTML = `<div class="controls" style="margin-top:0"><button class="cbtn rl-s on" data-s="0">Go</button><button class="cbtn rl-s" data-s="1">LLM</button></div>
    <div class="rl-loop" style="display:grid;gap:6px;margin-top:10px"></div>
    <div class="controls"><button class="cbtn rl-reset">⟲ Reset</button><button class="cbtn on rl-step">Step ▶</button><span class="spacer"></span><span class="counter rl-n"></span></div>
    <p class="hint">Goal: find an actor (a policy) that maximises the expected reward.</p>`;
  const $ = (q) => el.querySelector(q);
  function render() {
    $(".rl-loop").innerHTML = ROWS.map((r, j) => `<div class="frame ${j === k ? "top" : ""}" style="font-size:13.5px;${j > k ? "opacity:.3" : ""}"><span class="fname">${r[0]}</span> <span class="vars">— ${esc(r[1 + side])}</span></div>`).join("");
    el.querySelectorAll(".rl-s").forEach((b) => b.classList.toggle("on", +b.dataset.s === side));
    $(".rl-n").textContent = `${k + 1} / ${ROWS.length}`;
    $(".rl-step").disabled = k === ROWS.length - 1;
  }
  el.querySelectorAll(".rl-s").forEach((b) => { b.onclick = () => { side = +b.dataset.s; render(); }; });
  $(".rl-reset").onclick = () => { k = 0; render(); };
  $(".rl-step").onclick = () => { if (k < ROWS.length - 1) k++; render(); };
  render();
}

// ---------- Demo: text tokens vs visual tokens (slide 54) ----------

function demoVisual(el, { mini = false } = {}) {
  const ROWS = [["Text tokens", 110, "LLMs read the code sequentially"], ["Visual tokens", 110, "the code rendered as an image"], ["Compressed visual tokens", 27, "resolution adjusted: 75.5% fewer"]];
  let k = mini ? 0 : 2;
  el.innerHTML = `<div class="vt-rows" style="display:grid;gap:8px"></div>${mini ? "" : `<p class="hint">Numbers from slide 54 (arXiv:2602.01785): one function, three ways.</p>`}`;
  function render() {
    el.querySelector(".vt-rows").innerHTML = ROWS.map(([name, n, sub], j) => `<div style="${j > k ? "opacity:.25" : ""}">
      <div style="display:flex;justify-content:space-between;font-size:13px"><b>${name}</b><span class="mono">${n}</span></div>
      <div style="display:flex;flex-wrap:wrap;gap:2px;margin:4px 0">${Array.from({ length: n }, () => `<span style="width:7px;height:7px;border-radius:2px;background:${j === 0 ? "var(--teal)" : j === 1 ? "var(--sea)" : "var(--green)"}"></span>`).join("")}</div>
      <div class="hint" style="margin:0">${sub}</div></div>`).join("");
  }
  if (mini) setInterval(() => { k = (k + 1) % 3; render(); }, 1300);
  render();
}

// ---------- Demo: black-box, open-source, open-weight ----------

function demoModels(el) {
  const KINDS = {
    "Black-box": { ex: "Gemini, ChatGPT, Claude", has: [false, false, false, false, false], note: "Typically commercial, huge, powerful. You call it as a service; we do not know how f works or how it is produced." },
    "Open-weight": { ex: "Gemma, Mistral, LLaMA, MiMo", has: [true, true, false, false, false], note: "A trade-off: only the parameters are public. We know the internals of f, and can download it and deploy it locally (e.g. with Ollama)." },
    "Open-source": { ex: "Olmo, BLOOM", has: [true, true, true, true, true], note: "You can see the data, data filtering, tokenizer, training code, hyperparameters, checkpoints, logs and evaluation: we know how f is produced." },
  };
  const COLS = ["weights (parameters)", "run on your own machine", "training data & filtering", "training code & hyperparameters", "checkpoints, logs, evaluation"];
  let pick = "Open-weight";
  el.innerHTML = `<div class="controls" style="margin-top:0">${Object.keys(KINDS).map((k) => `<button class="cbtn md-k" data-k="${k}">${k}</button>`).join("")}</div>
    <div class="md-grid" style="display:grid;gap:4px;margin-top:10px"></div><div class="msg md-msg"></div>`;
  function render() {
    const K = KINDS[pick];
    el.querySelectorAll(".md-k").forEach((b) => b.classList.toggle("on", b.dataset.k === pick));
    el.querySelector(".md-grid").innerHTML = COLS.map((c, j) => `<div style="display:flex;gap:10px;align-items:center;font-size:14px">
      <span style="width:22px;height:22px;border-radius:5px;display:grid;place-items:center;font-weight:700;background:${K.has[j] ? "var(--green-soft)" : "var(--red-soft)"};color:${K.has[j] ? "var(--green)" : "var(--red)"}">${K.has[j] ? "✓" : "✗"}</span>${c}</div>`).join("");
    el.querySelector(".md-msg").innerHTML = `<b>${pick}</b> · examples: ${K.ex}. ${K.note}`;
  }
  el.querySelectorAll(".md-k").forEach((b) => { b.onclick = () => { pick = b.dataset.k; render(); }; });
  render();
}

// ---------- quiz (copied from L02) ----------

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
  tokenize: (el) => demoTokenize(el),
  nextToken: (el) => demoNextToken(el),
  nextTokenMini: (el) => demoNextToken(el, { mini: true }),
  sample: (el) => demoSample(el),
  tempMini: (el) => demoTempMini(el),
  stages: (el) => demoStages(el),
  stagesMini: (el) => demoStages(el, { mini: true }),
  selfSup: (el) => demoSelfSup(el),
  scale: (el) => demoScale(el),
  prefer: (el) => demoPrefer(el),
  rl: (el) => demoRL(el),
  visual: (el) => demoVisual(el),
  visualMini: (el) => demoVisual(el, { mini: true }),
  models: (el) => demoModels(el),
  quiz: (el) => demoQuiz(el, QUIZ),
};
