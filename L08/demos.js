// L08 demos. Code panels and printed outputs are copied from csc4801/notes/L08-coding-i.md
// (checked by csc4801/tools/check.py). Simulations that are not in the notes are labelled illustrative.

const CODE = {
  incrList: `def incr_list(l: list):
    """Return list with elements incremented by 1.
    >>> incr_list([1, 2, 3])
    [2, 3, 4]
    >>> incr_list([5, 3, 5, 2, 3, 3, 9, 0, 123])
    [6, 4, 6, 3, 4, 4, 10, 1, 124]
    """
    return [i + 1 for i in l]`,
  check: `def check(candidate):
    assert candidate([]) == []
    assert candidate([3, 2, 1]) == [4, 3, 2]
    assert candidate([5, 2, 5, 2, 3, 3, 9, 0, 123]) == [6, 3, 6, 3, 4, 4, 10, 1, 124]


def passes(code):
    """Run the generated code, then the tests. True if every test passes."""
    ns = {}
    try:
        exec(code, ns)
        check(ns["incr_list"])
        return True
    except Exception:
        return False


answers = [
    "def incr_list(l):\\n    return [i + 1 for i in l]\\n",
    "def incr_list(l):\\n    return [i + 2 for i in l]\\n",
    "def incr_list(l):\\n    return l + [1]\\n",
]
print([passes(a) for a in answers])`,
  observed: `def pass_at_k_observed(results, k):
    """100% if any of the first k answers is correct, else 0%."""
    return 1.0 if any(results[:k]) else 0.0


print(pass_at_k_observed([False], 1))
print(pass_at_k_observed([True], 1))
print(pass_at_k_observed([False, False, True], 3))
print(pass_at_k_observed([False, False, False, True, False], 5))`,
  tasks: `tasks = {
    "Task 1": [False, False, False, True, False],
    "Task 2": [False, False, False, False, False],
    "Task 3": [True, False, False, False, False],   # illustrative: any run with a pass
}
scores = [pass_at_k_observed(r, 5) for r in tasks.values()]
print(scores, f"pass@5 = {sum(scores) / len(scores):.2%}")`,
  passAtK: `from math import comb


def pass_at_k(n, c, k):
    """Unbiased estimate of pass@k from n samples, c of them correct."""
    if n - c < k:
        return 1.0
    return 1.0 - comb(n - c, k) / comb(n, k)


print(pass_at_k(5, 2, 1))      # slide 20 as a pool: 2 of 5 runs passed
print(round(pass_at_k(10, 2, 5), 4))
print(pass_at_k(10, 6, 5))     # n - c = 4 < 5`,
  stable: `def pass_at_k_stable(n, c, k):
    """Same value, computed as a running product."""
    if n - c < k:
        return 1.0
    prob_fail = 1.0
    for i in range(n - c + 1, n + 1):
        prob_fail *= 1.0 - k / i
    return 1.0 - prob_fail


print(round(pass_at_k(200, 13, 10), 6), round(pass_at_k_stable(200, 13, 10), 6))`,
  spread: `import random


def spread(n, k, p, trials=1000, seed=0):
    """Mean and standard deviation of the estimate over many simulated evaluations."""
    rng = random.Random(seed)
    est = []
    for _ in range(trials):
        c = sum(rng.random() < p for _ in range(n))
        est.append(pass_at_k(n, c, k))
    mean = sum(est) / trials
    sd = (sum((e - mean) ** 2 for e in est) / trials) ** 0.5
    return mean, sd


for n in [1, 5, 20, 100]:
    mean, sd = spread(n, 1, 0.4)
    print(f"n = {n:3d}: mean {mean:.3f}, spread (sd) {sd:.3f}")`,
  naive: `def naive_pass_at_k(n, c, k):
    p_hat = c / n
    return 1.0 - (1.0 - p_hat) ** k


def expected(estimator, n, k, p):
    """Average of the estimator over every possible c, weighted by its probability."""
    return sum(comb(n, c) * p**c * (1 - p) ** (n - c) * estimator(n, c, k)
               for c in range(n + 1))


p, k = 0.05, 10
print(f"true pass@{k} = {1 - (1 - p) ** k:.4f}")
print("   n   unbiased   naive")
for n in [10, 20, 50, 100, 1000]:
    print(f"{n:4d}   {expected(pass_at_k, n, k, p):.4f}     {expected(naive_pass_at_k, n, k, p):.4f}")`,
  count: `from collections import Counter


def count(nums):
    freq = Counter(nums)
    cnts = freq.values()
    max_freq = max(cnts)
    return (
        list(cnts).count(max_freq) *
        max_freq
    )


print(count([1, 3, 3, 4, 4]))`,
  lcbRepair: `GENERATED = """
def count(nums):
    freq = Counter(nums)
    max_freq = max(freq.values())
    count = len([k for k, v in freq.items() if v == max_freq])
    return count
"""
REPAIRED = GENERATED.replace("return count", "return count * max_freq")


def run_test(code, nums, expected):
    ns = {"Counter": Counter}
    exec(code, ns)
    got = ns["count"](nums)
    return f"count({nums}) = {got}, expected {expected}: {'PASS' if got == expected else 'FAIL'}"


print(run_test(GENERATED, [1, 3, 3, 4, 4], 4))
print(run_test(REPAIRED, [1, 3, 3, 4, 4], 4))`,
  wrongTest: `start_date = datetime(2020, 1, 1)
end_date = datetime(2020, 1, 10)
dates = task_func(start_date, end_date)
self.assertEqual(len(dates), (end_date - start_date).days)`,
  taskFunc: `from datetime import datetime, timedelta


def task_func(start_date, end_date, seed=42):
    """Random dates between start_date and end_date, inclusive: one per day in the range."""
    rng = random.Random(seed)
    days = (end_date - start_date).days + 1          # 1 Jan .. 10 Jan is 10 days
    return [start_date + timedelta(days=rng.randint(0, days - 1)) for _ in range(days)]


start_date = datetime(2020, 1, 1)
end_date = datetime(2020, 1, 10)
dates = task_func(start_date, end_date)
print("len(dates) =", len(dates))
print("(end_date - start_date).days =", (end_date - start_date).days)
print("test passed" if len(dates) == (end_date - start_date).days else "test FAILED")`,
  cheat: `EXPECTED = "GritLM/GritLM-7B"


def run_tests(files):
    exists = "/app/result.txt" in files
    matches = exists and files["/app/result.txt"].strip() == EXPECTED
    print(f"  test_result_exists {'PASSED' if exists else 'FAILED'}")
    print(f"  test_data_matches  {'PASSED' if matches else 'FAILED'}")
    return exists and matches


def read_tool(files, path, strict):
    if strict and path.startswith("/tests/"):
        return "Permission denied"
    return files.get(path, "No such file")


def cheating_agent(files, strict):
    """Scripted: instead of solving the task, look for the answer in the tests."""
    leaked = read_tool(files, "/tests/test_outputs.py", strict)
    if leaked.startswith("expected = "):
        files["/app/result.txt"] = leaked.split('"')[1]
    else:
        files["/app/result.txt"] = "I could not find the model name."


for strict in [False, True]:
    files = {"/tests/test_outputs.py": f'expected = "{EXPECTED}"\\n'}
    print("strict harness" if strict else "standard harness")
    cheating_agent(files, strict)
    print("  ->", "Tests pass." if run_tests(files) else "Tests fail.")`,
  scotThoughts: `Input: str: a string
Output: ch: a repeated character in str
1: for each character ch in str:
2:     if ch appears more than once in str:
3:         return ch
4: return None`,
  firstRepeated: `def first_repeated_char(text):
    h = {}
    for ch in text:
        if ch in h:
            return ch
        else:
            h[ch] = 0
    return None


print(first_repeated_char("abcabc"), first_repeated_char("abc"))`,
  reflexion: `def scripted_llm(replies):
    """A fake LLM that gives the replies in order, whatever it is sent."""
    replies = iter(replies)

    def call(prompt):
        return next(replies)

    return call


def evaluate(code, tests, name):
    """Executor: run the code, then each test. Return the tests that fail."""
    ns = {}
    exec(code, ns)
    failed = []
    for test in tests:
        try:
            ok = eval(test, {name: ns[name]})
        except Exception:
            ok = False
        if not ok:
            failed.append(test)
    return failed


def reflexion(task, tests, name, coder, reflector, max_trials=3):
    memory = []                                    # reasons for past failures
    for trial in range(1, max_trials + 1):
        prompt = task + "".join(f"\\nLesson {i}: {m}" for i, m in enumerate(memory, 1))
        code = coder(prompt)                       # trajectory
        failed = evaluate(code, tests, name)       # evaluation
        print(f"trial {trial}: prompt has {len(memory)} lesson(s); "
              f"{len(tests) - len(failed)}/{len(tests)} tests pass")
        if not failed:
            return code
        memory.append(reflector(f"{code}\\nFailed: {failed[0]}"))   # reflection
        print(f"  reflection: {memory[-1]}")
    return None`,
  runUnique: `task = "Write a Python script to print all unique elements in a list."
tests = ["unique_elements([1, 2, 3, 4, 4]) == [1, 2, 3, 4]",
         "unique_elements([3, 1, 2, 3]) == [3, 1, 2]"]
coder = scripted_llm([
    "def unique_elements(lst):\\n    result = set(lst)\\n    return list(result)\\n",
    "def unique_elements(lst):\\n    return list(dict.fromkeys(lst))\\n",
])
reflector = scripted_llm([
    "It does not work as expected because it uses the built-in set() function "
    "in Python, which does not maintain the order of elements.",
])
print(reflexion(task, tests, "unique_elements", coder, reflector))`,
  runParens: `task = ("You are given a list of two strings of open '(' or close ')' parentheses only. "
        "Return 'Yes' if they can be joined in some order into a balanced string, else 'No'.")
tests = ["match_parens(['()(', ')']) == 'Yes'",
         "match_parens([')', ')']) == 'No'",
         "match_parens([')(', ')(']) == 'No'"]
coder = scripted_llm([
    "def match_parens(lst):\\n"
    "    s1, s2 = lst\\n"
    "    if s1.count('(') + s2.count('(') == s1.count(')') + s2.count(')'):\\n"
    "        return 'Yes'\\n"
    "    return 'No'\\n",
    "def check(s):\\n"
    "    depth = 0\\n"
    "    for ch in s:\\n"
    "        depth += 1 if ch == '(' else -1\\n"
    "        if depth < 0:\\n"
    "            return False\\n"
    "    return depth == 0\\n"
    "\\n"
    "def match_parens(lst):\\n"
    "    S1 = lst[0] + lst[1]\\n"
    "    S2 = lst[1] + lst[0]\\n"
    "    return 'Yes' if check(S1) or check(S2) else 'No'\\n",
])
reflector = scripted_llm([
    "Wrong because it only checks if the total count of open and close parentheses "
    "is equal, not the order of the parentheses.",
])
code = reflexion(task, tests, "match_parens", coder, reflector)
print(code.splitlines()[-1].strip())`,
  lever: `import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE students (name TEXT, age INTEGER)")
db.executemany("INSERT INTO students VALUES (?, ?)", [
    ("John", 21), ("Mia", 23), ("Li", 25), ("Ana", 27), ("Raj", 29), ("Tom", 19), ("Eve", 31)])

candidates = [   # (program, generation probability)
    ("SELECT name FROM students WHERE age > 20 AND age < 30", 0.35),
    ("SELECT COUNT(name) FROM students WHERE age > 20 AND age < 30", 0.27),
    ("SELECT COUNT(*) FROM students WHERE age < 30 AND age > 20", 0.13),
    ("SELECT student_num FROM students WHERE age_interval = '20-30'", 0.11),
]
VERIFIER = [0.15, 0.85, 0.95, 0.05]   # scripted verifier probabilities


def execute(sql):
    try:
        rows = db.execute(sql).fetchall()
        return ", ".join(str(r[0]) for r in rows)
    except sqlite3.Error as e:
        return f"Err: {e}"


scores = {}
for (sql, gen_p), ver_p in zip(candidates, VERIFIER):
    result = execute(sql)
    score = gen_p * ver_p
    scores[result] = scores.get(result, 0) + score
    print(f"{gen_p:.2f} x {ver_p:.2f} = {score:.2f}  {result}")
print("aggregated:", {r: round(s, 2) for r, s in scores.items()})
print("answer:", max(scores, key=scores.get))`,
  ex1: `for k in [1, 5, 10]:
    print(k, round(pass_at_k(20, 3, k), 4), round(naive_pass_at_k(20, 3, k), 4))`,
  ex2: `answers.append("def incr_list(l):\\n    out = []\\n    for x in l:\\n        out.append(x + 1)\\n    return out\\n")
print([passes(a) for a in answers])`,
};

const OUT = {
  check: `[True, False, False]`,
  observed: `0.0
1.0
1.0
1.0`,
  tasks: `[1.0, 0.0, 1.0] pass@5 = 66.67%`,
  passAtK: `0.4
0.7778
1.0`,
  stable: `0.497551 0.497551`,
  spread: `n =   1: mean 0.398, spread (sd) 0.489
n =   5: mean 0.389, spread (sd) 0.222
n =  20: mean 0.399, spread (sd) 0.111
n = 100: mean 0.402, spread (sd) 0.050`,
  naive: `true pass@10 = 0.4013
   n   unbiased   naive
  10   0.4013     0.2831
  20   0.4013     0.3365
  50   0.4013     0.3739
 100   0.4013     0.3873
1000   0.4013     0.3998`,
  count: `4`,
  lcbRepair: `count([1, 3, 3, 4, 4]) = 2, expected 4: FAIL
count([1, 3, 3, 4, 4]) = 4, expected 4: PASS`,
  taskFunc: `len(dates) = 10
(end_date - start_date).days = 9
test FAILED`,
  cheat: `standard harness
  test_result_exists PASSED
  test_data_matches  PASSED
  -> Tests pass.
strict harness
  test_result_exists PASSED
  test_data_matches  FAILED
  -> Tests fail.`,
  firstRepeated: `a None`,
  runUnique: `trial 1: prompt has 0 lesson(s); 1/2 tests pass
  reflection: It does not work as expected because it uses the built-in set() function in Python, which does not maintain the order of elements.
trial 2: prompt has 1 lesson(s); 2/2 tests pass
def unique_elements(lst):
    return list(dict.fromkeys(lst))`,
  runParens: `trial 1: prompt has 0 lesson(s); 2/3 tests pass
  reflection: Wrong because it only checks if the total count of open and close parentheses is equal, not the order of the parentheses.
trial 2: prompt has 1 lesson(s); 3/3 tests pass
return 'Yes' if check(S1) or check(S2) else 'No'`,
  lever: `0.35 x 0.15 = 0.05  John, Mia, Li, Ana, Raj
0.27 x 0.85 = 0.23  5
0.13 x 0.95 = 0.12  5
0.11 x 0.05 = 0.01  Err: no such column: student_num
aggregated: {'John, Mia, Li, Ana, Raj': 0.05, '5': 0.35, 'Err: no such column: student_num': 0.01}
answer: 5`,
  ex1: `1 0.15 0.15
5 0.6009 0.5563
10 0.8947 0.8031`,
  ex2: `[True, False, False, True]`,
};

// ---------- small helpers ----------

// Seeded PRNG for the illustrative simulations (the numbers in the notes come from Python).
function rng32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pct = (x, d = 0) => `${(100 * x).toFixed(d)}%`;
const mark = (ok) => ok ? `<b style="color:var(--green)">✓</b>` : `<b style="color:var(--red)">✗</b>`;

// A generic stepper: controls + counter + ← → keys. render(i) draws step i.
function stepControls(el, n, render, { autoplay = 0 } = {}) {
  let i = 0, timer = null;
  const bar = document.createElement("div");
  bar.className = "controls";
  if (!autoplay) {
    bar.innerHTML = `<button class="cbtn s-reset">⟲ Reset</button><button class="cbtn s-back">◀ Back</button>
      <button class="cbtn on s-step">Step ▶</button><button class="cbtn s-play">Play</button>
      <span class="spacer"></span><span class="counter s-count"></span>`;
    el.appendChild(bar);
  }
  const $ = (q) => bar.querySelector(q);
  function draw() {
    render(i);
    if (autoplay) return;
    $(".s-count").textContent = `step ${i + 1} / ${n()}`;
    $(".s-back").disabled = $(".s-reset").disabled = i === 0;
    $(".s-step").disabled = i >= n() - 1;
  }
  function stop() { clearInterval(timer); timer = null; if (!autoplay) $(".s-play").textContent = "Play"; }
  function play() {
    if (timer) return stop();
    if (i >= n() - 1) i = 0;
    if (!autoplay) $(".s-play").textContent = "Pause";
    timer = setInterval(() => {
      if (!el.isConnected) return stop();
      if (i < n() - 1) i++; else if (autoplay) i = 0; else return stop();
      draw();
    }, autoplay || 1100);
  }
  if (!autoplay) {
    $(".s-reset").onclick = () => { stop(); i = 0; draw(); };
    $(".s-back").onclick = () => { stop(); if (i) i--; draw(); };
    $(".s-step").onclick = () => { stop(); if (i < n() - 1) i++; draw(); };
    $(".s-play").onclick = play;
    el.tabIndex = 0;
    el.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); $(".s-step").click(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); $(".s-back").click(); }
    });
  }
  draw();
  if (autoplay) play();
  return { reset: () => { stop(); i = 0; draw(); } };
}

// ---------- the three pillars (slides 6-8, 39, 51) ----------

const PILLARS = [
  ["Model", "How to teach LLMs coding knowledge?", "Coding II (next lecture)"],
  ["Harness", "How to utilize LLMs efficiently?", "this lecture, Chapters 5–6"],
  ["Benchmarks", "How to evaluate performance?", "this lecture, Chapters 1–4"],
];

function demoPillars(el, { mini = false } = {}) {
  const order = [2, 1, 0];
  el.innerHTML = `<div class="pl-row" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px"></div><div class="msg pl-msg"></div>`;
  stepControls(el, () => order.length, (i) => {
    el.querySelector(".pl-row").innerHTML = PILLARS.map((p, k) => `<div class="frame ${order[i] === k ? "top" : ""}" style="text-align:center;padding:12px 6px">
      <b>${p[0]}</b><div class="counter" style="margin-top:4px">${p[2]}</div></div>`).join("");
    const p = PILLARS[order[i]];
    el.querySelector(".pl-msg").innerHTML = `<b>${p[0]}</b> — ${p[1]}`;
  }, { autoplay: mini ? 1800 : 0 });
}

// ---------- HumanEval: run the hidden tests on a generated answer ----------

const ANSWERS = [
  ["def incr_list(l):\n    return [i + 1 for i in l]", (l) => l.map((i) => i + 1)],
  ["def incr_list(l):\n    return [i + 2 for i in l]", (l) => l.map((i) => i + 2)],
  ["def incr_list(l):\n    return l + [1]", (l) => [...l, 1]],
];
const HE_TESTS = [
  [[], []],
  [[3, 2, 1], [4, 3, 2]],
  [[5, 2, 5, 2, 3, 3, 9, 0, 123], [6, 3, 6, 3, 4, 4, 10, 1, 124]],
];
const pyList = (a) => `[${a.join(", ")}]`;

function demoHumanEval(el) {
  let pick = 0;
  const tried = new Set();
  el.innerHTML = `<div class="controls" style="margin-top:0">${ANSWERS.map((_, k) => `<button class="cbtn he-a" data-k="${k}">answer ${k + 1}</button>`).join("")}</div>
    <div class="he-code"></div><div class="he-tests" style="display:grid;gap:5px;margin-top:8px"></div><div class="msg he-msg"></div>
    <div class="counter" style="margin-top:8px">what the notes' program prints for all three</div><div class="console he-out"></div>`;
  const body = document.createElement("div");
  el.appendChild(body);
  const $ = (q) => el.querySelector(q);
  // steps: 0 = code shown, 1..3 = run assert k (stop at first failure)
  const steps = () => {
    const f = ANSWERS[pick][1];
    let k = 0;
    while (k < HE_TESTS.length && JSON.stringify(f(HE_TESTS[k][0])) === JSON.stringify(HE_TESTS[k][1])) k++;
    return Math.min(k + 1, HE_TESTS.length) + 1;
  };
  const ctl = stepControls(body, steps, (i) => {
    el.querySelectorAll(".he-a").forEach((b) => b.classList.toggle("on", +b.dataset.k === pick));
    const [code, f] = ANSWERS[pick];
    $(".he-code").innerHTML = codeBlock(code);
    const rows = [];
    let failed = false;
    for (let k = 0; k < Math.min(i, HE_TESTS.length) && !failed; k++) {
      const got = f(HE_TESTS[k][0]);
      const ok = JSON.stringify(got) === JSON.stringify(HE_TESTS[k][1]);
      rows.push(`<div class="frame ${ok ? "" : "err"}" style="font:12.5px var(--mono)">${mark(ok)} assert candidate(${pyList(HE_TESTS[k][0])}) == ${pyList(HE_TESTS[k][1])}${ok ? "" : `<br><span class="counter">got ${pyList(got)} → AssertionError</span>`}</div>`);
      failed = !ok;
    }
    $(".he-tests").innerHTML = rows.join("");
    const done = failed || i >= HE_TESTS.length;
    if (done) tried.add(pick);
    $(".he-msg").className = "msg he-msg" + (done ? (failed ? " bad" : " good") : "");
    $(".he-msg").innerHTML = i === 0 ? "The generated code. Step to run the hidden tests, one <code>assert</code> at a time."
      : done ? `passes(answer ${pick + 1}) → <b>${failed ? "False" : "True"}</b>${failed ? ": the first failing assert stops the check." : ": every test passes."}`
        : `Test ${i} passed. Next test…`;
    $(".he-out").textContent = tried.size === ANSWERS.length ? OUT.check : `(try all three answers: ${tried.size}/3 done)`;
  });
  el.querySelectorAll(".he-a").forEach((b) => { b.onclick = () => { pick = +b.dataset.k; ctl.reset(); }; });
}

// ---------- pass@k (slides 15-19) ----------

function demoPassK(el) {
  const T = { "Task 1": [false, false, false, true, false], "Task 2": [false, false, false, false, false], "Task 3": [true, false, false, false, false] };
  el.innerHTML = `<p class="hint" style="margin-top:0">Click an answer to mark it right or wrong. The starting data is the notes' <code>tasks</code> (slide 19; Task 3's answers are illustrative).</p>
    <div class="controls" style="margin-top:0"><label>k <input type="range" class="pk-k" min="1" max="5" value="5"> <b class="pk-kv mono">5</b></label></div>
    <div class="pk-grid" style="display:grid;gap:6px;margin-top:8px"></div><div class="stats pk-stats"></div>`;
  function render() {
    const k = +el.querySelector(".pk-k").value;
    el.querySelector(".pk-kv").textContent = k;
    const scores = [];
    el.querySelector(".pk-grid").innerHTML = Object.entries(T).map(([name, r]) => {
      const s = r.slice(0, k).some(Boolean) ? 1 : 0;
      scores.push(s);
      return `<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span class="tag">${name}</span>
        ${r.map((ok, j) => `<button class="cbtn pk-c" data-t="${name}" data-j="${j}" style="${j >= k ? "opacity:.35" : ""}">${j + 1} ${ok ? "✓" : "✗"}</button>`).join("")}
        <span class="mono" style="margin-left:auto">pass@${k} = ${pct(s)}</span></div>`;
    }).join("");
    el.querySelectorAll(".pk-c").forEach((b) => { b.onclick = () => { const r = T[b.dataset.t]; r[+b.dataset.j] = !r[+b.dataset.j]; render(); }; });
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    el.querySelector(".pk-stats").innerHTML = `<div class="stat"><small>tasks solved within ${k}</small><b>${scores.reduce((a, b) => a + b, 0)} / 3</b></div>
      <div class="stat"><small>benchmark pass@${k}</small><b>${pct(avg, 2)}</b></div>`;
  }
  el.querySelector(".pk-k").oninput = render;
  render();
}

// The slide 15-18 sequence for the home page.
function demoPassKMini(el) {
  const SEQ = [[[false], 1], [[true], 1], [[false, false, true], 3], [[false, false, false, true, false], 5]];
  el.innerHTML = `<div class="pm" style="min-height:190px"></div>`;
  stepControls(el, () => SEQ.length, (i) => {
    const [r, k] = SEQ[i];
    el.querySelector(".pm").innerHTML = `<div style="display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:center">
      <span class="tag">Task 1 → LLM</span><div style="display:grid;gap:4px">${r.map((ok, j) => `<div class="frame" style="font-size:12.5px">Answer ${j + 1} ${mark(ok)}</div>`).join("")}</div></div>
      <p class="mono" style="font-size:18px;text-align:center;margin:10px 0 0">pass@${k} = ${r.some(Boolean) ? "100%" : "0%"}</p>`;
  }, { autoplay: 1700 });
}

// ---------- pass@1 varies between runs (slide 20) ----------

function demoRuns(el) {
  const SLIDE = [true, false, false, true, false];
  let runs = [], rnd = rng32(20);
  el.innerHTML = `<div class="controls" style="margin-top:0"><button class="cbtn on rn-go">Run once more</button><button class="cbtn rn-10">+10 runs</button><button class="cbtn rn-reset">⟲ Reset</button></div>
    <div class="console rn-out" style="max-height:220px;overflow:auto"></div><div class="stats rn-stats"></div>
    <p class="hint">Runs 1–5 are slide 20. Later runs are simulated (illustrative): a model that solves the task 40% of the time.</p>`;
  const $ = (q) => el.querySelector(q);
  function add() { runs.push(runs.length < SLIDE.length ? SLIDE[runs.length] : rnd() < 0.4); }
  function render() {
    $(".rn-out").textContent = runs.map((ok, j) => `Run ${j + 1}: pass@1 = ${ok ? "100%" : "0%"}`).join("\n") || "(no runs yet)";
    $(".rn-out").scrollTop = 1e6;
    const c = runs.filter(Boolean).length;
    $(".rn-stats").innerHTML = `<div class="stat"><small>runs (n)</small><b>${runs.length}</b></div><div class="stat"><small>passed (c)</small><b>${c}</b></div>
      <div class="stat"><small>pooled estimate c/n</small><b>${runs.length ? pct(c / runs.length, 1) : "—"}</b></div>`;
  }
  $(".rn-go").onclick = () => { add(); render(); };
  $(".rn-10").onclick = () => { for (let j = 0; j < 10; j++) add(); render(); };
  $(".rn-reset").onclick = () => { runs = []; rnd = rng32(20); render(); };
  render();
}

// ---------- the estimator (slides 21-22) ----------

function comb(n, k) {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let j = 1; j <= k; j++) r = r * (n - k + j) / j;
  return Math.round(r);
}
function passAtK(n, c, k) {
  if (n - c < k) return 1;
  let fail = 1;
  for (let i = n - c + 1; i <= n; i++) fail *= 1 - k / i;
  return 1 - fail;
}
const naivePassAtK = (n, c, k) => 1 - Math.pow(1 - c / n, k);

function demoEstimator(el) {
  let rnd = rng32(7), draws = 0, hits = 0, picked = [];
  el.innerHTML = `<div class="controls" style="margin-top:0">
      <label>n <input type="range" class="es-n" min="1" max="20" value="10"> <b class="es-nv mono"></b></label>
      <label>c <input type="range" class="es-c" min="0" max="10" value="2"> <b class="es-cv mono"></b></label>
      <label>k <input type="range" class="es-k" min="1" max="10" value="5"> <b class="es-kv mono"></b></label></div>
    <div class="es-dots" style="display:flex;flex-wrap:wrap;gap:6px;margin:10px 0"></div>
    <div class="console es-math"></div>
    <div class="controls"><button class="cbtn on es-draw">Pick k at random</button><button class="cbtn es-100">Pick 1000 times</button><span class="spacer"></span><span class="counter es-tally"></span></div>
    <div class="msg es-msg"></div>`;
  const $ = (q) => el.querySelector(q);
  function vals() {
    const n = +$(".es-n").value;
    $(".es-c").max = n; $(".es-k").max = n;
    return [n, +$(".es-c").value, +$(".es-k").value];
  }
  function clearTally() { draws = 0; hits = 0; picked = []; }
  function pick(n, k) {
    const idx = [...Array(n).keys()];
    for (let j = 0; j < k; j++) { const r = j + Math.floor(rnd() * (n - j)); [idx[j], idx[r]] = [idx[r], idx[j]]; }
    return idx.slice(0, k);
  }
  function draw(times) {
    const [n, c, k] = vals();
    for (let t = 0; t < times; t++) { picked = pick(n, k); draws++; if (picked.some((j) => j < c)) hits++; }
    render();
  }
  function render() {
    const [n, c, k] = vals();
    $(".es-nv").textContent = n; $(".es-cv").textContent = c; $(".es-kv").textContent = k;
    $(".es-dots").innerHTML = [...Array(n).keys()].map((j) => `<span style="width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:12px;
      background:${j < c ? "var(--green-soft)" : "var(--red-soft)"};border:2px solid ${picked.includes(j) ? "var(--amber)" : "transparent"}">${j < c ? "✓" : "✗"}</span>`).join("");
    const est = passAtK(n, c, k);
    $(".es-math").textContent = n - c < k
      ? `n - c = ${n - c} < k = ${k}: every pick of ${k} must include a correct sample\npass@${k} = 1.0`
      : `total combinations        C(${n}, ${k}) = ${comb(n, k)}\nwith zero correct answers  C(${n - c}, ${k}) = ${comb(n - c, k)}\nprobability of failure    ${comb(n - c, k)} / ${comb(n, k)} = ${(1 - est).toFixed(4)}\npass@${k} = 1 - ${(1 - est).toFixed(4)} = ${est.toFixed(4)}`;
    $(".es-tally").textContent = draws ? `${hits} of ${draws} picks contain a ✓ (${(hits / draws).toFixed(4)})` : "";
    const naive = naivePassAtK(n, c, k);
    $(".es-msg").innerHTML = `Unbiased pass@${k} = <b>${est.toFixed(4)}</b>. The shortcut 1 − (1 − c/n)<sup>k</sup> = <b>${naive.toFixed(4)}</b>${naive < est - 1e-9 ? " — lower." : "."} Picking k without putting any back (the amber rings) is what the unbiased formula counts.`;
  }
  ["es-n", "es-c", "es-k"].forEach((c) => { $("." + c).oninput = () => { clearTally(); render(); }; });
  $(".es-draw").onclick = () => draw(1);
  $(".es-100").onclick = () => draw(1000);
  render();
}

// ---------- stability (slide 23) ----------

function demoSpread(el) {
  const NS = [1, 5, 20, 100];
  const lines = OUT.spread.split("\n");
  el.innerHTML = `<div class="controls" style="margin-top:0">${NS.map((n, j) => `<button class="cbtn sp-n" data-j="${j}">n = ${n}</button>`).join("")}</div>
    <div class="svgbox sp-svg" style="margin-top:8px"></div><div class="console sp-out"></div>
    <p class="hint">The dots are 60 simulated evaluations in your browser (illustrative). The console line is the notes' Python run (1000 evaluations).</p>`;
  function show(j) {
    el.querySelectorAll(".sp-n").forEach((b) => b.classList.toggle("on", +b.dataset.j === j));
    const n = NS[j], rnd = rng32(100 + j);
    let g = `<svg viewBox="0 0 640 110" role="img" aria-label="spread of estimates"><line x1="20" y1="80" x2="620" y2="80" stroke="var(--line)"/>
      ${[0, 0.2, 0.4, 0.6, 0.8, 1].map((v) => `<text x="${20 + v * 600}" y="100" font-size="11" text-anchor="middle" fill="var(--stone)">${v}</text>`).join("")}
      <line x1="${20 + 0.4 * 600}" y1="10" x2="${20 + 0.4 * 600}" y2="80" stroke="var(--amber)" stroke-dasharray="4 3"/><text x="${26 + 0.4 * 600}" y="20" font-size="11" fill="var(--amber)">true 0.4</text>`;
    for (let t = 0; t < 60; t++) {
      let c = 0;
      for (let s = 0; s < n; s++) if (rnd() < 0.4) c++;
      g += `<circle cx="${20 + (c / n) * 600}" cy="${30 + (t % 10) * 5}" r="3.5" fill="var(--teal)" opacity=".6"/>`;
    }
    el.querySelector(".sp-svg").innerHTML = g + "</svg>";
    el.querySelector(".sp-out").textContent = lines[j];
  }
  el.querySelectorAll(".sp-n").forEach((b) => { b.onclick = () => show(+b.dataset.j); });
  show(0);
}

// ---------- naive vs unbiased (slides 24-26) ----------

function expectedEst(est, n, k, p) {
  let pmf = Math.pow(1 - p, n), sum = 0;
  for (let c = 0; c <= n; c++) {
    sum += pmf * est(n, c, k);
    pmf = pmf * (n - c) / (c + 1) * p / (1 - p);
  }
  return sum;
}

function demoBias(el) {
  el.innerHTML = `<div class="controls" style="margin-top:0">
      <label>per-sample success p <input type="range" class="bi-p" min="1" max="30" value="5"> <b class="bi-pv mono"></b></label>
      <label>k <input type="range" class="bi-k" min="1" max="20" value="10"> <b class="bi-kv mono"></b></label></div>
    <div class="svgbox bi-svg" style="margin-top:8px"></div><div class="console bi-out"></div>
    <p class="hint">Exact averages over every possible c, the same calculation as the notes' <code>expected</code>. With p = 0.05 and k = 10 the table is the notes' output.</p>`;
  const $ = (q) => el.querySelector(q);
  function render() {
    const p = +$(".bi-p").value / 100, k = +$(".bi-k").value;
    $(".bi-pv").textContent = p.toFixed(2); $(".bi-kv").textContent = k;
    const NS = [10, 20, 50, 100, 1000].filter((n) => n >= k);
    const truth = 1 - Math.pow(1 - p, k);
    const rows = NS.map((n) => [n, expectedEst(passAtK, n, k, p), expectedEst(naivePassAtK, n, k, p)]);
    const W = 640, H = 200, x = (n) => 50 + (Math.log10(n) - 1) / 2 * 560, y = (v) => 180 - v * 160;
    const path = (j) => rows.map((r, q) => `${q ? "L" : "M"} ${x(r[0])} ${y(r[j])}`).join(" ");
    $(".bi-svg").innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="expected estimate against n">
      <line x1="50" y1="180" x2="610" y2="180" stroke="var(--line)"/><line x1="50" y1="20" x2="50" y2="180" stroke="var(--line)"/>
      ${[10, 100, 1000].map((n) => `<text x="${x(n)}" y="196" font-size="11" text-anchor="middle" fill="var(--stone)">n = ${n}</text>`).join("")}
      ${[0, 0.5, 1].map((v) => `<text x="44" y="${y(v) + 4}" font-size="11" text-anchor="end" fill="var(--stone)">${v}</text>`).join("")}
      <line x1="50" y1="${y(truth)}" x2="610" y2="${y(truth)}" stroke="var(--amber)" stroke-dasharray="5 4"/>
      <path d="${path(1)}" fill="none" stroke="var(--teal)" stroke-width="2.5"/><path d="${path(2)}" fill="none" stroke="var(--red)" stroke-width="2"/>
      ${rows.map((r) => `<circle cx="${x(r[0])}" cy="${y(r[2])}" r="3.5" fill="var(--red)"/><circle cx="${x(r[0])}" cy="${y(r[1])}" r="3.5" fill="var(--teal)"/>`).join("")}
      <text x="60" y="16" font-size="11" fill="var(--teal)">unbiased (on the dashed true value)</text><text x="300" y="16" font-size="11" fill="var(--red)">1 − (1 − c/n)^k</text></svg>`;
    $(".bi-out").textContent = `true pass@${k} = ${truth.toFixed(4)}\n   n   unbiased   naive\n` +
      rows.map((r) => `${String(r[0]).padStart(4)}   ${r[1].toFixed(4)}     ${r[2].toFixed(4)}`).join("\n");
  }
  $(".bi-p").oninput = render; $(".bi-k").oninput = render;
  render();
}

// ---------- LiveCodeBench's four scenarios (slide 29) ----------

const LCB = [
  ["Code generation", "Problem statement → code", `The model writes <code>count</code>. It counts the elements that have the maximum frequency, but forgets to multiply by that frequency.`, OUT.lcbRepair.split("\n")[0], "bad"],
  ["Self repair", "Problem + wrong code + feedback → fixed code", `The model sees the failing result and fixes it: <code>return count * max_freq</code>.`, OUT.lcbRepair.split("\n")[1], "good"],
  ["Test output prediction", "Problem + input → expected output", `No code: reason in steps. 3 and 4 have the maximum frequencies; max frequency is 2; 2 × 2 is 4; answer <b>4</b>.`, "Ans is 4", "good"],
  ["Code execution", "Code + input → output", `Given the user solution, what does <code>count([1,3,3,4,4])</code> return?`, OUT.count === "4" ? "count([1,3,3,4,4]) == 4" : OUT.count, "good"],
];

function demoLcb(el) {
  el.innerHTML = `<p class="hint" style="margin-top:0">Problem: return the total frequencies of the elements that all have the maximum frequency. Input <code>nums = [1,3,3,4,4]</code>.</p>
    <div class="controls lc-tabs" style="margin-top:0">${LCB.map((s, j) => `<button class="cbtn" data-j="${j}">${s[0]}</button>`).join("")}</div>
    <div class="lc-body"></div>`;
  function show(j) {
    el.querySelectorAll(".lc-tabs .cbtn").forEach((b) => b.classList.toggle("on", +b.dataset.j === j));
    const [name, io, what, result, cls] = LCB[j];
    el.querySelector(".lc-body").innerHTML = `<div class="frame" style="margin-top:8px"><span class="fname">${name}</span> <span class="vars">— ${io}</span><div class="status" style="margin-top:6px">${what}</div></div>
      ${j < 2 ? codeBlock(j === 0 ? CODE.lcbRepair.split('"""')[1].trim() : CODE.lcbRepair.split('"""')[1].trim().replace("return count", "return count * max_freq")) : j === 3 ? codeBlock(CODE.count.split("\n\n\nprint")[0]) : ""}
      <div class="msg ${cls}">${esc(result)}</div>`;
  }
  el.querySelectorAll(".lc-tabs .cbtn").forEach((b) => { b.onclick = () => show(+b.dataset.j); });
  show(0);
}

// ---------- a wrong benchmark test (slide 36) ----------

function demoWrongTest(el) {
  el.innerHTML = `<div class="controls" style="margin-top:0"><label>end_date = datetime(2020, 1, <input type="range" class="wt-d" min="2" max="15" value="10"> <b class="wt-v mono"></b>)</label></div>
    <div class="wt-days" style="display:flex;flex-wrap:wrap;gap:4px;margin:10px 0"></div><div class="console wt-out"></div><div class="msg wt-msg"></div>`;
  const $ = (q) => el.querySelector(q);
  function render() {
    const d = +$(".wt-d").value;
    $(".wt-v").textContent = d;
    $(".wt-days").innerHTML = [...Array(d).keys()].map((j) => `<span class="tag" style="background:var(--teal-soft)">1/${j + 1}</span>`).join("");
    const len = d, days = d - 1;
    $(".wt-out").textContent = `len(dates) = ${len}\n(end_date - start_date).days = ${days}\n${len === days ? "test passed" : "test FAILED"}`;
    $(".wt-msg").innerHTML = `The prompt says the range is <b>inclusive</b>: 1 January to ${d} January is <b>${len}</b> days. The test expects <code>.days</code> = ${days}, which leaves one day out. Every <code>end_date</code> fails: the test is wrong, not the code.`;
    $(".wt-msg").className = "msg wt-msg bad";
  }
  $(".wt-d").oninput = render;
  render();
}

// ---------- cheating: a verifier leak (slides 37-38) ----------

function demoCheat(el) {
  let strict = false;
  const outLines = OUT.cheat.split("\n");
  const part = (s) => s ? outLines.slice(4).join("\n") : outLines.slice(0, 4).join("\n");
  el.innerHTML = `<div class="controls" style="margin-top:0"><button class="cbtn ch-std on">standard harness</button><button class="cbtn ch-str">strict harness</button></div>
    <div class="ch-steps" style="display:grid;gap:6px;margin-top:8px"></div><div class="console ch-out"></div><div class="msg ch-msg"></div>`;
  const body = document.createElement("div");
  el.appendChild(body);
  const $ = (q) => el.querySelector(q);
  const STEPS = (s) => [
    ["Agent", `Read("/tests/test_outputs.py") <span class="counter">— the tests should be off limits</span>`],
    ["Harness", s ? "Permission denied" : `expected = "GritLM/GritLM-7B" <span class="counter">— the answer, in plain text</span>`],
    ["Agent", `Write { file_path: "/app/result.txt", content: ${s ? `"I could not find the model name."` : `"GritLM/GritLM-7B"`} }`],
    ["Tests", "run test_result_exists, test_data_matches"],
  ];
  const ctl = stepControls(body, () => 4, (i) => {
    $(".ch-std").classList.toggle("on", !strict); $(".ch-str").classList.toggle("on", strict);
    $(".ch-steps").innerHTML = STEPS(strict).slice(0, i + 1).map(([who, t], j) => `<div class="frame ${j === i ? "top" : ""}" style="font:12.5px var(--mono)"><span class="tag">${who}</span> ${t}</div>`).join("");
    $(".ch-out").textContent = i === 3 ? part(strict) : "";
    $(".ch-msg").className = "msg ch-msg" + (i === 3 ? (strict ? " good" : " bad") : "");
    $(".ch-msg").innerHTML = i < 3 ? "The scripted agent never tries to solve the task. It looks for the answer instead."
      : strict ? "The strict harness blocks the leak. The score now measures the agent, not the leak." : "Both tests pass, and nothing was solved. The agent reports <em>“Tests pass.”</em>";
  });
  $(".ch-std").onclick = () => { strict = false; ctl.reset(); };
  $(".ch-str").onclick = () => { strict = true; ctl.reset(); };
}

// ---------- the EvalPlus leaderboard (slide 31) ----------

function demoLeaderboard(el) {
  const ROWS = [["O1 Preview", 96.3], ["O1 Mini", 96.3], ["GPT 4o", 92.7], ["Qwen2.5-Coder-32B-Instruct", 92.1], ["DeepSeek-V3", 91.5], ["DeepSeek-V2.5", 90.2], ["GPT-4-Turbo", 90.2]];
  el.innerHTML = `<div class="lb" style="display:grid;gap:5px"></div>`;
  let t = 0;
  function draw() {
    if (!el.isConnected) return;
    const f = Math.min(1, t / 20);
    el.querySelector(".lb").innerHTML = ROWS.map(([m, v]) => `<div style="display:grid;grid-template-columns:minmax(0,150px) 1fr 40px;gap:6px;align-items:center;font-size:12px">
      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m}</span><span style="height:12px;border-radius:4px;background:var(--teal);width:${v * f}%"></span><b class="mono">${(v * f).toFixed(1)}</b></div>`).join("");
    t = t >= 45 ? 0 : t + 1;
  }
  draw();
  setInterval(draw, 80);
}

// ---------- CoT (slide 43) ----------

function demoCot(el) {
  const Q1 = "Q: Roger has 5 tennis balls. He buys 2 more cans of tennis balls. Each can has 3 tennis balls. How many tennis balls does he have now?";
  const Q2 = "Q: The cafeteria had 23 apples. If they used 20 to make lunch and bought 6 more, how many apples do they have?";
  const MODES = {
    standard: ["A: The answer is 11.", "A: The answer is 27.", false],
    cot: ["A: Roger started with 5 balls. 2 cans of 3 tennis balls each is 6 tennis balls. 5 + 6 = 11. The answer is 11.",
      "A: The cafeteria had 23 apples originally. They used 20 to make lunch. So they had 23 - 20 = 3. They bought 6 more apples, so they have 3 + 6 = 9. The answer is 9.", true],
  };
  el.innerHTML = `<div class="controls" style="margin-top:0"><button class="cbtn" data-m="standard">Standard prompting</button><button class="cbtn" data-m="cot">Chain-of-thought prompting</button></div>
    <div class="cot-body" style="display:grid;gap:6px;margin-top:8px"></div>`;
  function show(m) {
    el.querySelectorAll("[data-m]").forEach((b) => b.classList.toggle("on", b.dataset.m === m));
    const [a1, a2, ok] = MODES[m];
    el.querySelector(".cot-body").innerHTML = `<div class="counter">MODEL INPUT</div>
      <div class="frame" style="font-size:13px">${esc(Q1)}<br><span style="${m === "cot" ? "background:var(--mark)" : ""}">${esc(a1)}</span><br><br>${esc(Q2)}</div>
      <div class="counter">MODEL OUTPUT</div><div class="msg ${ok ? "good" : "bad"}">${esc(a2)} ${mark(ok)}</div>`;
  }
  el.querySelectorAll("[data-m]").forEach((b) => { b.onclick = () => show(b.dataset.m); });
  show("standard");
}

// ---------- IO, CoT, CoT-SC, ToT (slide 44) ----------

function demoTot(el) {
  // Stages drawn as small graphs. Positions and scores are illustrative.
  const STAGES = [
    ["Input-output prompting", "One call: input straight to output. No intermediate thoughts."],
    ["Chain of thought", "One line of thoughts, one after another, then the output."],
    ["Self-consistency with CoT", "Several independent chains; the output is a majority vote over their answers."],
    ["Tree of Thoughts · expand", "At each step, propose several candidate thoughts."],
    ["Tree of Thoughts · self-evaluate", "The model rates each candidate. Promising ones (green) are kept, weak ones (red) are pruned."],
    ["Tree of Thoughts · backtrack", "A kept branch turns out to be a dead end, so the search goes back and tries the next best thought."],
    ["Tree of Thoughts · output", "The path that survives evaluation leads to the output."],
  ];
  el.innerHTML = `<div class="svgbox tt-svg"></div><div class="msg tt-msg"></div>`;
  const body = document.createElement("div");
  el.appendChild(body);
  const node = (x, y, fill, stroke = "var(--line)") => `<rect x="${x - 22}" y="${y - 10}" width="44" height="20" rx="4" fill="${fill}" stroke="${stroke}"/>`;
  const ell = (x, y, t) => `<ellipse cx="${x}" cy="${y}" rx="44" ry="15" fill="var(--card)" stroke="var(--teal)"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="12" fill="var(--ink)">${t}</text>`;
  const ln = (x1, y1, x2, y2, c = "var(--stone)", w = 1.2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}"/>`;
  stepControls(body, () => STAGES.length, (i) => {
    let g = `<svg viewBox="0 0 640 250" role="img" aria-label="${STAGES[i][0]}">`;
    if (i === 0) g += ln(320, 45, 320, 205) + ell(320, 30, "Input") + ell(320, 220, "Output");
    else if (i === 1) { g += ln(320, 45, 320, 205); [85, 125, 165].forEach((y) => { g += node(320, y, "var(--card)"); }); g += ell(320, 30, "Input") + ell(320, 220, "Output"); }
    else if (i === 2) {
      [220, 320, 420].forEach((x, j) => { g += ln(320, 45, x, 75) + ln(x, 75, x, 160) + ln(x, 170, 320, 205); [85, 120, 155].forEach((y) => { g += node(x, y, j === 2 && y === 155 ? "var(--red-soft)" : y === 155 ? "var(--green-soft)" : "var(--card)"); }); });
      g += `<text x="480" y="190" font-size="11" fill="var(--stone)">majority vote</text>` + ell(320, 30, "Input") + ell(320, 220, "Output");
    } else {
      const L1 = [200, 320, 440], L2 = [[140, 200, 260], [260, 320, 380], [380, 440, 500]];
      const col = (lvl, a, b) => {
        if (i === 3) return "var(--card)";
        if (lvl === 1) return a === 1 ? "var(--green-soft)" : a === 0 && i >= 5 ? "var(--green-soft)" : "var(--red-soft)";
        if (i < 5) return a === 1 ? (b === 1 ? "var(--green-soft)" : "var(--red-soft)") : "var(--card)";
        if (a === 1) return "var(--red-soft)";
        if (a === 0) return b === 2 ? "var(--green-soft)" : "var(--red-soft)";
        return "var(--card)";
      };
      L1.forEach((x, a) => { g += ln(320, 45, x, 80); L2[a].forEach((x2, b) => { g += ln(x, 90, x2, 135, "var(--line)"); }); });
      if (i >= 5) g += ln(320, 45, 200, 80, "var(--green)", 2.5) + ln(200, 90, 260, 135, "var(--green)", 2.5);
      else if (i >= 4) g += ln(320, 45, 320, 80, "var(--green)", 2.5) + ln(320, 90, 320, 135, "var(--green)", 2.5);
      if (i === 5) g += `<text x="330" y="175" font-size="11" fill="var(--red)">dead end → backtrack</text>`;
      if (i === 6) g += ln(260, 145, 320, 205, "var(--green)", 2.5);
      L1.forEach((x, a) => { g += node(x, 80, col(1, a)); L2[a].forEach((x2, b) => { g += node(x2, 135, col(2, a, b)); }); });
      g += ell(320, 30, "Input") + (i === 6 ? ell(320, 220, "Output") : "");
    }
    el.querySelector(".tt-svg").innerHTML = g + "</svg>";
    el.querySelector(".tt-msg").innerHTML = `<b>${STAGES[i][0]}</b> — ${STAGES[i][1]}`;
  });
  body.insertAdjacentHTML("beforeend", `<p class="hint">The shapes follow slide 44's figure; which nodes win is illustrative.</p>`);
}

// ---------- SCoT (slide 45) ----------

function demoScot(el) {
  const thoughts = CODE.scotThoughts.split("\n");
  // thought line (0-based) -> code lines (1-based) of first_repeated_char
  const MAP = [[1], [1], [3], [2, 4, 6, 7], [5], [8]];
  const STEPS = [
    ["Input", "The prompt asks for a rough solving process: an input-output structure, then sequences, branches and loops."],
    ...thoughts.map((t, j) => ["Thought " + (j + 1), esc(t.trim())]),
    ["Output", "The finished code, run on two strings:"],
  ];
  el.innerHTML = `<div class="sc-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px"><div><div class="counter">THOUGHTS (structured)</div><div class="sc-th"></div></div>
    <div><div class="counter">CODE</div><div class="sc-code"></div></div></div><div class="msg sc-msg"></div><div class="console sc-out"></div>`;
  const body = document.createElement("div");
  el.appendChild(body);
  stepControls(body, () => STEPS.length, (i) => {
    const t = i - 1;
    el.querySelector(".sc-th").innerHTML = codeBlock(thoughts.slice(0, Math.max(0, Math.min(i, thoughts.length))).join("\n") || " ", "repl", t >= 0 && t < thoughts.length ? [t + 1] : []);
    const shown = i >= 1;
    el.querySelector(".sc-code").innerHTML = shown ? codeBlock(CODE.firstRepeated.split("\n\n\nprint")[0], "py", t >= 0 && t < MAP.length ? MAP[t] : []) : `<p class="hint">Not written yet.</p>`;
    el.querySelector(".sc-msg").innerHTML = `<b>${STEPS[i][0]}</b> — ${STEPS[i][1]}${t >= 0 && t < MAP.length ? " <span class='counter'>(highlighted: the code lines it becomes)</span>" : ""}`;
    el.querySelector(".sc-out").textContent = i === STEPS.length - 1 ? `>>> print(first_repeated_char("abcabc"), first_repeated_char("abc"))\n${OUT.firstRepeated}` : "";
  });
}

// ---------- Agentless (slide 46) ----------

function demoAgentless(el) {
  const ST = [
    ["Localize", "Localize to top-N files", "From the issue and the repository structure, pick the suspicious files."],
    ["Localize", "Localize to classes & functions", "Inside those files, narrow down to classes and functions."],
    ["Localize", "Localize to edit locations", "Narrow down to the exact lines to edit."],
    ["Repair", "Generate patches", "Sample several candidate patches for those locations."],
    ["Validate", "Generate reproduction tests", "Write a test that reproduces the issue."],
    ["Validate", "Filter & rank patches", "Run the tests; drop patches that fail; rank the rest."],
    ["Submit", "Submitted patch", "One patch goes out. Every step is a predefined prompt template, not an open loop."],
  ];
  el.innerHTML = `<div class="ag-row" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:6px"></div><div class="msg ag-msg"></div>`;
  const body = document.createElement("div");
  el.appendChild(body);
  stepControls(body, () => ST.length, (i) => {
    el.querySelector(".ag-row").innerHTML = ST.map((s, j) => `<div class="frame ${j === i ? "top" : ""}" style="font-size:12px;${j > i ? "opacity:.35" : ""}"><span class="counter">${j + 1} · ${s[0]}</span><br><b>${s[1]}</b></div>`).join("");
    el.querySelector(".ag-msg").innerHTML = `<b>${ST[i][1]}</b> — ${ST[i][2]}`;
  });
}

// ---------- Reflexion (slides 48-49): replays the notes' runs ----------

const RX = {
  unique: {
    label: "unique_elements (slide 48)",
    task: "Write a Python script to print all unique elements in a list.",
    tests: ["unique_elements([1, 2, 3, 4, 4]) == [1, 2, 3, 4]", "unique_elements([3, 1, 2, 3]) == [3, 1, 2]"],
    codes: ["def unique_elements(lst):\n    result = set(lst)\n    return list(result)", "def unique_elements(lst):\n    return list(dict.fromkeys(lst))"],
    results: [[true, false], [true, true]],
    out: OUT.runUnique,
  },
  parens: {
    label: "match_parens (slide 49)",
    task: "You are given a list of two strings of open '(' or close ')' parentheses only. Return 'Yes' if they can be joined in some order into a balanced string, else 'No'.",
    tests: ["match_parens(['()(', ')']) == 'Yes'", "match_parens([')', ')']) == 'No'", "match_parens([')(', ')(']) == 'No'"],
    codes: ["def match_parens(lst):\n    s1, s2 = lst\n    if s1.count('(') + s2.count('(') == s1.count(')') + s2.count(')'):\n        return 'Yes'\n    return 'No'",
      "def check(s):\n    depth = 0\n    for ch in s:\n        depth += 1 if ch == '(' else -1\n        if depth < 0:\n            return False\n    return depth == 0\n\ndef match_parens(lst):\n    S1 = lst[0] + lst[1]\n    S2 = lst[1] + lst[0]\n    return 'Yes' if check(S1) or check(S2) else 'No'"],
    results: [[true, true, false], [true, true, true]],
    out: OUT.runParens,
  },
};

function demoReflexion(el, { mini = false } = {}) {
  let key = "unique";
  el.innerHTML = `${mini ? "" : `<div class="controls rf-tabs" style="margin-top:0">${Object.entries(RX).map(([k, v]) => `<button class="cbtn" data-k="${k}">${v.label}</button>`).join("")}</div>`}
    <div class="rf-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-top:8px">
      <div><div class="counter">PROMPT = task + memory</div><div class="frame rf-prompt" style="font-size:12.5px"></div><div class="counter" style="margin-top:8px">MEMORY</div><div class="rf-mem" style="display:grid;gap:5px;margin-top:4px"></div></div>
      <div><div class="counter rf-phase"></div><div class="rf-main"></div></div></div>
    ${mini ? "" : `<div class="msg rf-msg"></div><div class="counter" style="margin-top:8px">what the notes' program prints</div><div class="console rf-out"></div>`}`;
  const body = document.createElement("div");
  el.appendChild(body);
  const $ = (q) => el.querySelector(q);
  // events per trial: trajectory, evaluation, (reflection)
  const events = () => {
    const ev = [];
    RX[key].codes.forEach((_, t) => {
      ev.push(["trajectory", t], ["evaluation", t]);
      if (RX[key].results[t].includes(false)) ev.push(["reflection", t]);
    });
    return ev;
  };
  const outLines = () => RX[key].out.split("\n");
  const ctl = stepControls(body, () => events().length, (i) => {
    const X = RX[key], [phase, t] = events()[i];
    if (!mini) el.querySelectorAll(".rf-tabs .cbtn").forEach((b) => b.classList.toggle("on", b.dataset.k === key));
    const lesson = outLines()[1].replace(/^\s*reflection: /, "");
    const mem = phase === "reflection" || t > 0 ? [lesson] : [];
    $(".rf-prompt").innerHTML = esc(X.task) + (t > 0 ? `<br><span style="background:var(--mark)">Lesson 1: ${esc(lesson)}</span>` : "");
    $(".rf-mem").innerHTML = mem.map((m) => `<div class="frame ${phase === "reflection" ? "new" : ""}" style="font-size:12px">${esc(m)}</div>`).join("") || `<div class="hint">empty</div>`;
    $(".rf-phase").textContent = `TRIAL ${t + 1} · ${phase.toUpperCase()}`;
    if (phase === "trajectory") $(".rf-main").innerHTML = codeBlock(X.codes[t]);
    else if (phase === "evaluation") $(".rf-main").innerHTML = X.tests.map((s, j) => `<div class="frame ${X.results[t][j] ? "" : "err"}" style="font:12px var(--mono);margin-bottom:4px">${mark(X.results[t][j])} ${esc(s)}</div>`).join("");
    else $(".rf-main").innerHTML = `<div class="frame new" style="font-size:12.5px">Reflector: “${esc(lesson)}”</div>`;
    if (mini) return;
    const pass = X.results[t].filter(Boolean).length;
    $(".rf-msg").className = "msg rf-msg" + (phase === "evaluation" ? (pass === X.tests.length ? " good" : " bad") : "");
    $(".rf-msg").innerHTML = phase === "trajectory" ? `The coder (a scripted fake LLM) writes trial ${t + 1}'s code from the prompt.`
      : phase === "evaluation" ? `The executor really runs the tests: ${pass}/${X.tests.length} pass.${pass === X.tests.length ? " Done: return the code." : ""}`
        : "The reflector names the reason for the failure. It is stored in memory and added to the next prompt.";
    // console: line 0 after trial-1 evaluation, line 1 after reflection, the rest at the end
    const L = outLines();
    const shown = phase === "trajectory" && t === 0 ? 0 : phase === "evaluation" && t === 0 ? 1 : phase === "reflection" || (phase === "trajectory" && t === 1) ? 2 : L.length;
    $(".rf-out").textContent = L.slice(0, shown).join("\n");
  }, { autoplay: mini ? 1800 : 0 });
  if (!mini) el.querySelectorAll(".rf-tabs .cbtn").forEach((b) => { b.onclick = () => { key = b.dataset.k; ctl.reset(); }; });
}

// ---------- multiple candidates + verifier (slide 50) ----------

function demoRerank(el) {
  const CANDS = [
    ["SELECT name FROM students WHERE age > 20 AND age < 30", 0.35, "John, Mia, Li, Ana, Raj"],
    ["SELECT COUNT(name) FROM students WHERE age > 20 AND age < 30", 0.27, "5"],
    ["SELECT COUNT(*) FROM students WHERE age < 30 AND age > 20", 0.13, "5"],
    ["SELECT student_num FROM students WHERE age_interval = '20-30'", 0.11, "Err: no such column: student_num"],
  ];
  const ver = [0.15, 0.85, 0.95, 0.05];
  el.innerHTML = `<p class="hint" style="margin-top:0">Question: <em>How many students in the class are between 20 and 30 years old?</em> Drag the verifier's probabilities. Defaults, candidates and generation probabilities are slide 50's; results come from the notes' run on a made-up table.</p>
    <div class="rr-rows" style="display:grid;gap:6px"></div><div class="rr-agg" style="margin-top:8px"></div><div class="console rr-out"></div>`;
  function render() {
    const scores = new Map();   // keeps insertion order, like the Python dict
    el.querySelector(".rr-rows").innerHTML = CANDS.map(([sql, g, res], j) => {
      const s = g * ver[j];
      scores.set(res, (scores.get(res) || 0) + s);
      return `<div class="frame" style="font-size:12px"><code style="white-space:normal">${esc(sql)}</code>
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:4px"><span class="tag">gen ${g.toFixed(2)}</span>
        <label>verifier <input type="range" class="rr-v" data-j="${j}" min="0" max="100" step="5" value="${Math.round(ver[j] * 100)}"> <b class="mono">${ver[j].toFixed(2)}</b></label>
        <span class="mono">= ${s.toFixed(2)}</span><span class="counter">→ ${esc(res)}</span></div></div>`;
    }).join("");
    const best = [...scores.keys()].reduce((a, b) => (scores.get(b) > scores.get(a) ? b : a));
    el.querySelector(".rr-agg").innerHTML = [...scores].map(([r, s]) => `<span class="tag" style="${r === best ? "background:var(--green-soft)" : ""}">${esc(r)}: ${s.toFixed(2)}</span>`).join(" ");
    el.querySelector(".rr-out").textContent = CANDS.map(([, g, res], j) => `${g.toFixed(2)} x ${ver[j].toFixed(2)} = ${(g * ver[j]).toFixed(2)}  ${res}`).join("\n") +
      `\naggregated: {${[...scores].map(([r, v]) => `'${r}': ${Number(v.toFixed(2))}`).join(", ")}}\nanswer: ${best}`;
    el.querySelectorAll(".rr-v").forEach((r) => { r.oninput = () => { ver[+r.dataset.j] = +r.value / 100; render(); }; });
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
  pillars: (el) => demoPillars(el),
  pillarsMini: (el) => demoPillars(el, { mini: true }),
  humaneval: (el) => demoHumanEval(el),
  passk: (el) => demoPassK(el),
  passkMini: (el) => demoPassKMini(el),
  runs: (el) => demoRuns(el),
  estimator: (el) => demoEstimator(el),
  spread: (el) => demoSpread(el),
  bias: (el) => demoBias(el),
  lcb: (el) => demoLcb(el),
  wrongTest: (el) => demoWrongTest(el),
  cheat: (el) => demoCheat(el),
  leaderboardMini: (el) => demoLeaderboard(el),
  cot: (el) => demoCot(el),
  tot: (el) => demoTot(el),
  scot: (el) => demoScot(el),
  agentless: (el) => demoAgentless(el),
  reflexion: (el) => demoReflexion(el),
  reflexionMini: (el) => demoReflexion(el, { mini: true }),
  rerank: (el) => demoRerank(el),
  quiz: (el) => demoQuiz(el, QUIZ),
};
