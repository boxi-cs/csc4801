// L09 demos. Code panels are copied from csc4801/notes/L09-coding-ii.md (checked by
// csc4801/tools/check.py): CODE below is generated from the notes' fenced blocks, in order.

const CODE = {
  unfinished: `def main(self, path):
    ...
    # copy image to dir
    utils.copy_img(data, img_dir)
    # downscale images
    utils.downscale(img_dir, config)
    # call COLMAP executable
    >>                                   # complete here`,
  repocoder: `import re

REPO = {
    "utils/images.py": '''def process_imgs(data, img_dir):
    # copy images to dir
    utils.copy_img_list(data, img_dir)
    # downscale images
    utils.downscale(img_dir)
    # save json
    utils.shap_to_json(img_dir)''',
    "utils/colmap.py": '''def run_colmap(
    image_path: Path,
    colmap_path: Path,
    camera_model: Model,
    gpu: bool = True,
):''',
    "utils/config.py": '''def load_config(path):
    with open(path) as f:
        return json.load(f)''',
}

UNFINISHED = '''def main(self, path):
    # copy image to dir
    utils.copy_img(data, img_dir)
    # downscale images
    utils.downscale(img_dir, config)
    # call COLMAP executable
'''


def tokens(code):
    """The set of words in a piece of code, lower-cased."""
    return set(re.findall(r"[a-z]+", code.lower()))


def similarity(a, b):
    """Jaccard similarity: shared words / all words."""
    ta, tb = tokens(a), tokens(b)
    return len(ta & tb) / len(ta | tb)


def retrieve(query):
    """Return the repository file most similar to the query, and its score."""
    best = max(REPO, key=lambda f: similarity(query, REPO[f]))
    return best, similarity(query, REPO[best])


def fake_code_lm(prompt):
    """A stand-in for the code LM, scripted with the two answers on the slide."""
    if "def run_colmap(" in prompt:
        return 'run_colmap(image_path=path["image"], colmap_path=path["colmap"], camera_model=self.model, gpu=True)'
    return 'COLMAP(colmap_path=path["colmap"], model_path=path["model"], train_path=path["train"], test_path=path["test"])'


def window(code, lines=2):
    """The last few lines of code: what the retriever searches with."""
    return "\\n".join(code.strip().splitlines()[-lines:])


def repocoder(unfinished, iterations=2):
    query = window(unfinished)
    for i in range(1, iterations + 1):
        name, score = retrieve(query)                       # retrieve
        prompt = f"# {name}\\n{REPO[name]}\\n\\n{unfinished}"
        completion = fake_code_lm(prompt)                   # generate
        print(f"iteration {i}: retrieved {name} (similarity {score:.2f})")
        print(f"    {completion}")
        query = window(unfinished + completion)             # search again with the draft
    return completion


final = repocoder(UNFINISHED)`,
  repocoderOut: `iteration 1: retrieved utils/images.py (similarity 0.21)
    COLMAP(colmap_path=path["colmap"], model_path=path["model"], train_path=path["train"], test_path=path["test"])
iteration 2: retrieved utils/colmap.py (similarity 0.21)
    run_colmap(image_path=path["image"], colmap_path=path["colmap"], camera_model=self.model, gpu=True)`,
  sim: `draft = fake_code_lm(UNFINISHED)          # the wrong first completion
for name in REPO:
    s1 = similarity(window(UNFINISHED), REPO[name])
    s2 = similarity(window(UNFINISHED + draft), REPO[name])
    print(f"{name:16}  iteration 1: {s1:.2f}   iteration 2: {s2:.2f}")`,
  simOut: `utils/images.py   iteration 1: 0.21   iteration 2: 0.00
utils/colmap.py   iteration 1: 0.06   iteration 2: 0.21
utils/config.py   iteration 1: 0.06   iteration 2: 0.06`,
  imports: `import ast
import difflib

PACKAGE_INDEX = {"pandas", "numpy", "requests", "matplotlib", "scipy"}   # a stand-in for PyPI


def check_imports(code):
    """Report every imported package that is not in the index, with a suggestion."""
    for node in ast.walk(ast.parse(code)):
        if isinstance(node, ast.Import):
            for alias in node.names:
                name = alias.name.split(".")[0]
                if name in PACKAGE_INDEX:
                    print(f"{name}: ok")
                else:
                    guess = difflib.get_close_matches(name, PACKAGE_INDEX, n=1)
                    print(f"{name}: not in the index; did you mean {guess[0] if guess else '?'}?")


check_imports("import pandes\\nimport numpy\\n")`,
  importsOut: `pandes: not in the index; did you mean pandas?
numpy: ok`,
  sop: `SOP = [
    ("Product Manager", "requirement document"),
    ("Architect", "system design"),
    ("Project Manager", "tasks"),
    ("Engineer", "code"),
    ("QA Engineer", "tests"),
]


def role_agent(role, output):
    """A scripted stand-in for one role's LLM: it names what it wrote from what it read."""
    def act(artifact):
        return f"{output} for: {artifact.split(' for: ')[-1]}"
    return act


artifact = "Write a classic and simple Flappy Bird game."
for k, (role, output) in enumerate(SOP, 1):
    artifact = role_agent(role, output)(artifact)
    print(f"{k}. {role:15} -> {artifact}")`,
  sopOut: `1. Product Manager -> requirement document for: Write a classic and simple Flappy Bird game.
2. Architect       -> system design for: Write a classic and simple Flappy Bird game.
3. Project Manager -> tasks for: Write a classic and simple Flappy Bird game.
4. Engineer        -> code for: Write a classic and simple Flappy Bird game.
5. QA Engineer     -> tests for: Write a classic and simple Flappy Bird game.`,
  selfInstruct: `from difflib import SequenceMatcher

seed_tasks = ["Brainstorm a list of possible New Year's resolutions."]

scripted_tasks = iter([
    "Brainstorm creative ideas for designing a conference room.",
    "Brainstorm a list of possible New Year resolutions.",           # a near-copy
    "Write a function that checks whether a string is a palindrome.",
    "Explain what a Python list comprehension does.",
])


def fake_llm_new_task(pool):
    """A stand-in for the LLM: shown a few tasks from the pool, it writes one more."""
    return next(scripted_tasks)


def too_similar(task, pool, limit=0.7):
    return any(SequenceMatcher(None, task, old).ratio() > limit for old in pool)


pool = list(seed_tasks)
for step in range(4):
    task = fake_llm_new_task(pool[-3:])
    if too_similar(task, pool):
        print(f"drop: {task}")
    else:
        pool.append(task)
        print(f"keep: {task}")
print(f"pool: {len(seed_tasks)} seed -> {len(pool)} tasks")`,
  selfOut: `keep: Brainstorm creative ideas for designing a conference room.
drop: Brainstorm a list of possible New Year resolutions.
keep: Write a function that checks whether a string is a palindrome.
keep: Explain what a Python list comprehension does.
pool: 1 seed -> 4 tasks`,
  softmax: `import math

LABELS = ["Spam", "Promotion", "Normal"]
teacher_logits = [math.log(90), math.log(8), math.log(2)]


def softmax(logits, T=1.0):
    exps = [math.exp(z / T) for z in logits]
    return [e / sum(exps) for e in exps]


for T in (1, 2, 4):
    probs = softmax(teacher_logits, T)
    print(f"T={T}: " + "  ".join(f"{label} {p:.0%}" for label, p in zip(LABELS, probs)))`,
  softmaxOut: `T=1: Spam 90%  Promotion 8%  Normal 2%
T=2: Spam 69%  Promotion 21%  Normal 10%
T=4: Spam 52%  Promotion 28%  Normal 20%`,
  distill: `def cross_entropy(target, probs):
    return -sum(t * math.log(p) for t, p in zip(target, probs) if t > 0)


def distill_loss(student_logits, T=2.0, true_label=0):
    teacher_matching = cross_entropy(softmax(teacher_logits, T), softmax(student_logits, T))
    hard = [1.0 if k == true_label else 0.0 for k in range(len(LABELS))]
    true_label_loss = cross_entropy(hard, softmax(student_logits))
    return teacher_matching, true_label_loss


for name, logits in [("A", [3.0, 1.0, -0.5]), ("B", [3.0, -0.5, 1.0])]:
    tm, tl = distill_loss(logits)
    print(f"student {name}: teacher-matching {tm:.3f} + true-label {tl:.3f} = {tm + tl:.3f}")`,
  distillOut: `student A: teacher-matching 0.819 + true-label 0.153 = 0.972
student B: teacher-matching 0.896 + true-label 0.153 = 1.050`,
  evol: `EVOLVED = {   # (evolution type, seed) -> the slide's evolved problem
    ("Add Constraints", "1 + 1 = ?"): "How to prove 1 + 1 = 2 in the Goldbach Conjecture?",
    ("Deepening", "1 + 1 = ?"): "In what situation does 1+1 not equal to 2?",
    ("Increase Reasoning", "1 + 1 = ?"): "What is the value of x, if x^3 + 2x + 3 = 7?",
    ("Concretizing", "1 + 1 = ?"): "If you have one apple and someone gives you another banana, how many fruits do you have?",
    ("Complicate Input (Formula)", "1 + 1 = ?"): "1/(sqrt(2) + 4^2) = ?",
    ("In-Breadth Evolving", "1 + 1 = ?"): "What is the speed of light in a vacuum?",
    ("Increase Reasoning", "What is the speed of light in a vacuum?"): "How many times faster is light than sound in a vacuum?",
}


def evolve_prompt(evolution, seed):
    return f"Rewrite the problem using this method: {evolution}.\\nProblem: {seed}"


def fake_llm_evolve(prompt):
    """A stand-in for the LLM, scripted with the evolved problems on the slide."""
    evolution = prompt.split("method: ")[1].split(".\\n")[0]
    seed = prompt.split("Problem: ")[1]
    return EVOLVED[(evolution, seed)]


problem = "1 + 1 = ?"
for evolution in ["In-Breadth Evolving", "Increase Reasoning"]:
    problem = fake_llm_evolve(evolve_prompt(evolution, problem))
    print(f"{evolution:20} -> {problem}")`,
  evolOut: `In-Breadth Evolving  -> What is the speed of light in a vacuum?
Increase Reasoning   -> How many times faster is light than sound in a vacuum?`,
  ossSeed: `learn_model(
    tf_idfSVM, tf_idfNB, target)

def get_clean_review(raw_review):
    letters_only = re.sub(
        "[^a-zA-Z]", " ", raw_review)`,
  oss: `OSS_PROMPT = ("Please gain inspiration from the following random code snippet to create a "
              "high-quality programming problem.\\n\\nCode snippet:\\n{snippet}")

seed_snippet = '''def get_clean_review(raw_review):
    letters_only = re.sub("[^a-zA-Z]", " ", raw_review)'''

prompt = OSS_PROMPT.format(snippet=seed_snippet)
print(prompt.splitlines()[0][:60] + "...")
print(f"prompt: {len(prompt.splitlines())} lines, seed from a real project")`,
  ossOut: `Please gain inspiration from the following random code snipp...
prompt: 5 lines, seed from a real project`,
  bugs: `ORIGINAL = '''def parse_list(lst):
    if isinstance(lst, list):
        item_lst = lst
    else:
        item_lst = lst["users"]
    results = []
    for obj in item_lst:
        results.append(obj.upper())
    return results
'''

TESTS = {
    "test_list": lambda f: f(["ann", "bo"]) == ["ANN", "BO"],
    "test_dict": lambda f: f({"users": ["ann"]}) == ["ANN"],
}

CANDIDATES = {   # bug patches an LLM might sample
    "slide's bug": ('''    if isinstance(lst, list):
        item_lst = lst
    else:
        item_lst = lst["users"]
    results = []
    for obj in item_lst:
''', '''    results = []
    for obj in lst:
        if not obj:
            continue
'''),
    "rename only": ("results", "out"),
    "stale patch": ("for item in items:", "for item in items[1:]:"),
}


def run_tests(source):
    ns = {}
    exec(source, ns)
    return {name: test(ns["parse_list"]) for name, test in TESTS.items()}


before = run_tests(ORIGINAL)
for name, (old, new) in CANDIDATES.items():
    if old not in ORIGINAL:
        print(f"{name:12} git apply fails -> drop")
        continue
    after = run_tests(ORIGINAL.replace(old, new))
    pass_to_fail = [t for t in TESTS if before[t] and not after[t]]
    verdict = "keep: new task instance" if pass_to_fail else "drop"
    print(f"{name:12} PASS_TO_FAIL = {pass_to_fail} -> {verdict}")`,
  bugsOut: `slide's bug  PASS_TO_FAIL = ['test_dict'] -> keep: new task instance
rename only  PASS_TO_FAIL = [] -> drop
stale patch  git apply fails -> drop`,
  disc1: `def discount_price(price):
    return price * 0.8`,
  disc2: `def discount_price(price):
    if (price < 0):
        raise ValueError("Negative")
    return price * 0.8`,
  verifiable: `def check_discount(f):
    assert f(100) == 80
    try:
        f(-1)
    except ValueError:
        return
    raise AssertionError("negative price accepted")


def verifiable_reward(code, test):
    try:
        ns = {}
        exec(compile(code, "<answer>", "exec"), ns)
    except SyntaxError:
        return -1.0, "compilation error"
    try:
        test(ns["discount_price"])
    except Exception as e:
        return -1.0, f"tests fail ({type(e).__name__})"
    return 1.0, "all tests pass"


ANSWERS = {
    "answer 1": "def discount_price(price):\\n    return price * 0.8\\n",
    "answer 2": 'def discount_price(price):\\n    if (price < 0):\\n        raise ValueError("Negative")\\n    return price * 0.8\\n',
    "answer 3": "def discount_price(price)\\n    return price * 0.8\\n",
}
for name, code in ANSWERS.items():
    print(name, verifiable_reward(code, check_discount))`,
  verifiableOut: `answer 1 (-1.0, 'tests fail (AssertionError)')
answer 2 (1.0, 'all tests pass')
answer 3 (-1.0, 'compilation error')`,
  calcSlide: `1: def calculate_metrics(data):
2:   if not data:
3:     return 0                 <--- [ Valid path: Do not penalize ]
4:
5:   total = sum(data)
6:   average = total / len(dta) <--- [ Typo: NameError thrown here! ]
7:   return average             <--- [ Unexecuted: Mask out from penalty ]`,
  lines: `import sys

CALC = '''def calculate_metrics(data):
  if not data:
    return 0

  total = sum(data)
  average = total / len(dta)
  return average
'''


def line_rewards(source, inputs):
    ns = {}
    exec(compile(source, "calc", "exec"), ns)
    ran, error_line = set(), None

    def tracer(frame, event, arg):
        nonlocal error_line
        if frame.f_code.co_filename == "calc":
            if event == "line":
                ran.add(frame.f_lineno)
            if event == "exception" and error_line is None:
                error_line = frame.f_lineno
        return tracer

    for x in inputs:
        sys.settrace(tracer)
        try:
            ns["calculate_metrics"](x)
        except Exception:
            pass
        finally:
            sys.settrace(None)
    for n, text in enumerate(source.splitlines(), 1):
        if not text.strip() or n == 1:
            continue
        label = "penalize" if n == error_line else "ok" if n in ran else "mask"
        print(f"{n}: {text:30} {label}")


line_rewards(CALC, [[], [1, 2, 3]])`,
  linesOut: `2:   if not data:                 ok
3:     return 0                   ok
5:   total = sum(data)            ok
6:   average = total / len(dta)   penalize
7:   return average               mask`,
  lint: `PENALTY = {"error": -10.0, "high": -5.0, "normal": -1.0, "low": -0.2}


def lint(code):
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return [("SyntaxError", "error")]
    findings = []
    for fn in [n for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)]:
        if ast.get_docstring(fn) is None:
            findings.append((f"{fn.name}: missing docstring", "low"))
        stored = {n.id for n in ast.walk(fn) if isinstance(n, ast.Name) and isinstance(n.ctx, ast.Store)}
        loaded = {n.id for n in ast.walk(fn) if isinstance(n, ast.Name) and isinstance(n.ctx, ast.Load)}
        findings += [(f"{fn.name}: {v} unused", "normal") for v in sorted(stored - loaded)]
        for call in [n for n in ast.walk(fn) if isinstance(n, ast.Call)]:
            if getattr(call.func, "attr", "") == "execute" and isinstance(call.args[0], ast.JoinedStr):
                findings.append((f"{fn.name}: SQL built from an f-string", "high"))
    return findings


QUERY = '''def find_user(db, name):
    count = 0
    return db.execute(f"SELECT * FROM users WHERE name = '{name}'")
'''
findings = lint(QUERY)
for finding, severity in findings:
    print(f"{severity:7} {PENALTY[severity]:6}  {finding}")
print("static reward:", sum(PENALTY[s] for _, s in findings))`,
  lintOut: `low       -0.2  find_user: missing docstring
normal    -1.0  find_user: count unused
high      -5.0  find_user: SQL built from an f-string
static reward: -6.2`,
  gate: `def reasoning_reward(prm_score, code_ok):
    """Consistency gate: reasoning counts only if the code works."""
    return prm_score * (1 if code_ok else 0)


print(reasoning_reward(0.8, code_ok=False))
print(reasoning_reward(0.8, code_ok=True))`,
  gateOut: `0.0
0.8`,
  ex1: `print(repocoder(UNFINISHED, iterations=1)[:10])
print(repocoder(UNFINISHED, iterations=3)[:10])`,
  ex1Out: `iteration 1: retrieved utils/images.py (similarity 0.21)
    COLMAP(colmap_path=path["colmap"], model_path=path["model"], train_path=path["train"], test_path=path["test"])
COLMAP(col
iteration 1: retrieved utils/images.py (similarity 0.21)
    COLMAP(colmap_path=path["colmap"], model_path=path["model"], train_path=path["train"], test_path=path["test"])
iteration 2: retrieved utils/colmap.py (similarity 0.21)
    run_colmap(image_path=path["image"], colmap_path=path["colmap"], camera_model=self.model, gpu=True)
iteration 3: retrieved utils/colmap.py (similarity 0.62)
    run_colmap(image_path=path["image"], colmap_path=path["colmap"], camera_model=self.model, gpu=True)
run_colmap`,
  ex2: `old, new = "obj.upper()", "obj.lower()"
after = run_tests(ORIGINAL.replace(old, new))
print([t for t in TESTS if before[t] and not after[t]])`,
  ex2Out: `['test_list', 'test_dict']`,
  ex3: `def combined_reward(code):
    tests, _ = verifiable_reward(code, check_discount)
    static = sum(PENALTY[s] for _, s in lint(code))
    return round(tests + 0.1 * static, 2)


print(combined_reward(ANSWERS["answer 2"]))`,
  ex3Out: `0.98`,
};

// ---------- a small shared stepper: Reset / Back / Step / Play and ← → keys ----------

function stepControls(el, n, render, { mini = false, every = 1100, playLabel = "Play" } = {}) {
  let i = 0, timer = null;
  const box = document.createElement("div");
  if (!mini) {
    box.className = "controls";
    box.innerHTML = `<button class="cbtn s-reset">⟲ Reset</button><button class="cbtn s-back">◀ Back</button>
      <button class="cbtn s-step on">Step ▶</button><button class="cbtn s-play">${playLabel}</button>
      <span class="spacer"></span><span class="counter s-count"></span>`;
    el.appendChild(box);
  }
  const $ = (q) => box.querySelector(q);
  function draw() {
    render(i);
    if (mini) return;
    $(".s-count").textContent = `step ${i + 1} / ${n}`;
    $(".s-back").disabled = $(".s-reset").disabled = i === 0;
    $(".s-step").disabled = i === n - 1;
  }
  function stop() { clearInterval(timer); timer = null; if (!mini) $(".s-play").textContent = playLabel; }
  function play() {
    if (timer) return stop();
    if (i === n - 1) i = 0;
    if (!mini) $(".s-play").textContent = "Pause";
    timer = setInterval(() => {
      if (!el.isConnected) return stop();
      if (i < n - 1) i++; else if (mini) i = 0; else return stop();
      draw();
    }, every);
  }
  if (!mini) {
    $(".s-reset").onclick = () => { stop(); i = 0; draw(); };
    $(".s-back").onclick = () => { stop(); if (i) i--; draw(); };
    $(".s-step").onclick = () => { stop(); if (i < n - 1) i++; draw(); };
    $(".s-play").onclick = play;
    el.tabIndex = 0;
    el.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); $(".s-step").click(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); $(".s-back").click(); }
    });
  }
  draw();
  if (mini) play();
  return { reset() { stop(); i = 0; draw(); } };
}

const hbar = (label, value, max, text, cls = "", lw = "96px") =>
  `<div class="bar" style="grid-template-columns:${lw} 1fr 52px"><span>${label}</span><div class="track"><div class="fill ${cls}" style="width:${Math.max(0, Math.min(100, (100 * value) / max))}%"></div></div><span class="v">${text}</span></div>`;
const box = (txt, cls = "") => `<div class="frame ${cls}" style="font-size:12.5px;overflow-wrap:anywhere">${txt}</div>`;
const pre = (s) => `<pre class="code nonum" style="margin:6px 0;padding:8px 10px;font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere">${esc(s)}</pre>`;

// ---------- RepoCoder: retrieve, generate, retrieve again ----------

// The same repository, window and Jaccard similarity as the toy in the notes.
const RC_REPO = {
  "utils/images.py": `def process_imgs(data, img_dir):
    # copy images to dir
    utils.copy_img_list(data, img_dir)
    # downscale images
    utils.downscale(img_dir)
    # save json
    utils.shap_to_json(img_dir)`,
  "utils/colmap.py": `def run_colmap(
    image_path: Path,
    colmap_path: Path,
    camera_model: Model,
    gpu: bool = True,
):`,
  "utils/config.py": `def load_config(path):
    with open(path) as f:
        return json.load(f)`,
};
const RC_UNFINISHED = `def main(self, path):
    # copy image to dir
    utils.copy_img(data, img_dir)
    # downscale images
    utils.downscale(img_dir, config)
    # call COLMAP executable
`;
const RC_WRONG = 'COLMAP(colmap_path=path["colmap"], model_path=path["model"], train_path=path["train"], test_path=path["test"])';
const RC_RIGHT = 'run_colmap(image_path=path["image"], colmap_path=path["colmap"], camera_model=self.model, gpu=True)';
const rcTokens = (code) => new Set(code.toLowerCase().match(/[a-z]+/g) || []);
function rcSim(a, b) {
  const ta = rcTokens(a), tb = rcTokens(b);
  const inter = [...ta].filter((t) => tb.has(t)).length;
  return inter / new Set([...ta, ...tb]).size;
}
const rcWindow = (code, lines = 2) => code.trim().split("\n").slice(-lines).join("\n");

function demoRepoCoder(el, { mini = false } = {}) {
  const q1 = rcWindow(RC_UNFINISHED), q2 = rcWindow(RC_UNFINISHED + RC_WRONG);
  const STEPS = [
    { it: 0, msg: "The unfinished code. The retriever searches with a <b>window</b>: its last two lines.", q: q1 },
    { it: 1, msg: "Iteration 1 · <b>retrieve</b>: the most similar file is <code>utils/images.py</code>. It copies and downscales images too.", q: q1, sims: true },
    { it: 1, msg: "Iteration 1 · <b>generate</b>: the code LM guesses a <code>COLMAP(...)</code> call. It is <b>incorrect</b>: no such function or arguments in this repository.", q: q1, sims: true, gen: RC_WRONG, bad: true },
    { it: 2, msg: "The wrong draft joins the query. It brings the words <i>colmap</i>, <i>path</i> and <i>model</i>.", q: q2 },
    { it: 2, msg: "Iteration 2 · <b>retrieve</b> again: now <code>utils/colmap.py</code> wins. It holds the real helper <code>run_colmap</code>.", q: q2, sims: true },
    { it: 2, msg: "Iteration 2 · <b>generate</b>: with the signature in the prompt, the completion is <b>correct</b>.", q: q2, sims: true, gen: RC_RIGHT },
  ];
  el.innerHTML = `<div class="rc-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px">
      <div><div class="counter">UNFINISHED CODE · the query window</div><div class="rc-code"></div></div>
      <div><div class="counter rc-simh">SIMILARITY TO EACH FILE (Jaccard)</div><div class="bars rc-sims"></div><div class="rc-ret"></div></div>
    </div>
    <div class="counter" style="margin-top:8px">COMPLETION</div><div class="rc-gen"></div>
    ${mini ? "" : `<div class="msg rc-msg"></div><div class="counter" style="margin-top:8px">what the toy prints</div><div class="console rc-out"></div>`}`;
  const $ = (q) => el.querySelector(q);
  function render(i) {
    const s = STEPS[i];
    const lines = (s.it === 2 ? RC_UNFINISHED + RC_WRONG : RC_UNFINISHED).trim().split("\n");
    const qn = new Set(s.q.split("\n"));
    $(".rc-code").innerHTML = `<pre class="code nonum" style="margin:4px 0;padding:8px;font-size:11.5px;white-space:pre-wrap;overflow-wrap:anywhere">${lines.map((l) =>
      `<span style="${qn.has(l) ? "background:var(--mark)" : ""}">${esc(l)}</span>`).join("\n")}</pre>`;
    const sims = Object.keys(RC_REPO).map((f) => [f, rcSim(s.q, RC_REPO[f])]);
    const best = sims.reduce((a, b) => (b[1] > a[1] ? b : a));
    $(".rc-sims").innerHTML = s.sims ? sims.map(([f, v]) => hbar(f.replace("utils/", ""), v, 0.3, v.toFixed(2), f === best[0] ? "amber" : "")).join("") : `<div class="hint">—</div>`;
    $(".rc-ret").innerHTML = s.sims ? `<div class="counter" style="margin-top:6px">RETRIEVED · ${best[0]}</div>${pre(RC_REPO[best[0]])}` : "";
    $(".rc-gen").innerHTML = s.gen ? box(`${s.bad ? "✗" : "✓"} <code>${esc(s.gen)}</code>`, s.bad ? "" : "top") : `<div class="hint">—</div>`;
    if (s.gen) $(".rc-gen .frame").style.boxShadow = `inset 3px 0 0 var(--${s.bad ? "red" : "green"})`;
    if (mini) return;
    $(".rc-msg").innerHTML = s.msg;
    $(".rc-msg").className = "msg rc-msg" + (i === STEPS.length - 1 ? " good" : "");
    const out = [];
    if (i >= 2) out.push(`iteration 1: retrieved utils/images.py (similarity ${rcSim(q1, RC_REPO["utils/images.py"]).toFixed(2)})`, `    ${RC_WRONG}`);
    if (i >= 5) out.push(`iteration 2: retrieved utils/colmap.py (similarity ${rcSim(q2, RC_REPO["utils/colmap.py"]).toFixed(2)})`, `    ${RC_RIGHT}`);
    $(".rc-out").textContent = out.join("\n");
  }
  stepControls(el, STEPS.length, render, { mini, every: mini ? 1800 : 1300 });
}

// ---------- Repo-level prompt generation: which context goes in the prompt? ----------

function demoRepoPrompt(el) {
  const PROPOSALS = [
    { p: 0, name: "default context only", src: "the code before the hole in AffinityPropagation.java", ok: false },
    { p: 14, name: "imported file", src: "MaximizingGibbsSampler.java (imported by the current file)", ok: true,
      text: "class MaximizingGibbsSampler {\n  public void InitializeToAssignment(int[] a) {\n    CurrentAssignment_ = a.clone();\n    ...\n  }" },
    { p: 3, name: "a sibling file", src: "another file in sampler/ (illustrative)", ok: false, text: "class GibbsParameters { ... }" },
  ];
  let pick = null;
  el.innerHTML = `<p class="hint" style="margin-top:0">The cursor is at the <b>target hole</b>: <code>mg.▮</code>, a call on a <code>MaximizingGibbsSampler</code>. Choose where the prompt takes its extra context from, or let the classifier choose.</p>
    <div class="controls rp-pick" style="margin-top:0"></div>
    <div class="rp-body"></div>`;
  function render() {
    el.querySelector(".rp-pick").innerHTML = PROPOSALS.map((x, k) => `<button class="cbtn ${pick === k ? "on" : ""}" data-k="${k}">p = ${x.p} · ${x.name}</button>`).join("") +
      `<button class="cbtn rp-auto">Ask the classifier</button>`;
    el.querySelectorAll("[data-k]").forEach((b) => { b.onclick = () => { pick = +b.dataset.k; render(); }; });
    el.querySelector(".rp-auto").onclick = () => { pick = 1; render(true); };
    if (pick === null) { el.querySelector(".rp-body").innerHTML = `<div class="msg">Pick a proposal.</div>`; return; }
    const x = PROPOSALS[pick];
    const prompt = (x.text ? `// context from: ${x.src}\n${x.text}\n\n` : "") +
      "// default context: AffinityPropagation.java\nimport sampler.MaximizingGibbsSampler;\n...\nMaximizingGibbsSampler mg = new MaximizingGibbsSampler(numVars_);\nmg.▮";
    el.querySelector(".rp-body").innerHTML = `<div class="counter" style="margin-top:6px">PROMPT COMPOSER → CODEX</div>${pre(prompt)}
      <div class="msg ${x.ok ? "good" : ""}">${x.ok
        ? `Codex sees the method and fills the hole: <code>InitializeToAssignment(CurrentAssignments());</code>`
        : `The method's name is not in the prompt, so the model has to guess it.`}</div>`;
  }
  render();
  el.insertAdjacentHTML("beforeend", `<p class="hint">p = 0 and p = 14 are from the slide (the classifier picks 14); the sibling-file proposal is illustrative.</p>`);
}

// ---------- hallucinated imports ----------

// Similarity ratio 2·M / T with M = longest-common-subsequence length: close to difflib's ratio.
function ratio(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return (2 * dp[a.length][b.length]) / (a.length + b.length || 1);
}

function demoImports(el) {
  const INDEX = ["pandas", "numpy", "requests", "matplotlib", "scipy"];
  el.innerHTML = `<p class="hint" style="margin-top:0">The package index here is the same five-name stand-in for PyPI as in the toy.</p>
    <textarea class="im-code mono" rows="4" style="width:100%;box-sizing:border-box;font-size:13px">import pandes
import numpy</textarea>
    <div class="controls"><button class="cbtn on im-go">Check imports</button>
      <button class="cbtn" data-ex="import pandes&#10;import numpy">slide example</button>
      <button class="cbtn" data-ex="import reqests&#10;import matplotlib.pyplot&#10;import sklearn">try others</button></div>
    <div class="console im-out"></div>`;
  const $ = (q) => el.querySelector(q);
  function check() {
    const out = [];
    $(".im-code").value.split("\n").forEach((line) => {
      const m = line.match(/^\s*import\s+([\w.]+)/);
      if (!m) return;
      const name = m[1].split(".")[0];
      if (INDEX.includes(name)) { out.push(`${name}: ok`); return; }
      const scored = INDEX.map((p) => [p, ratio(name, p)]).filter(([, r]) => r >= 0.6).sort((a, b) => b[1] - a[1]);
      out.push(`${name}: not in the index; did you mean ${scored.length ? scored[0][0] : "?"}?`);
    });
    $(".im-out").textContent = out.join("\n") || "(no import lines)";
  }
  $(".im-go").onclick = check;
  el.querySelectorAll("[data-ex]").forEach((b) => { b.onclick = () => { $(".im-code").value = b.dataset.ex; check(); }; });
  check();
}

// ---------- MetaGPT: the SOP ----------

function demoMetaGPT(el, { mini = false } = {}) {
  const TASK = "Write a classic and simple Flappy Bird game.";
  const STEPS = [
    { who: "Human", stage: "one-line requirement", art: TASK },
    { who: "Product Manager", stage: "1/5 Define", art: "requirement document" },
    { who: "Architect", stage: "2/5 Design", art: "system design" },
    { who: "Project Manager", stage: "3/5 Plan", art: "tasks" },
    { who: "Engineer", stage: "3/5 Code", art: "code" },
    { who: "QA Engineer", stage: "4/5 Test", art: "tests" },
    { who: "Human", stage: "5/5 Acceptance check", art: "Pretty good! I can directly use the interface and keyboard to play Flappy Bird." },
  ];
  el.innerHTML = `<div class="mg-row" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(${mini ? 90 : 100}px,1fr));gap:6px"></div>
    ${mini ? "" : `<div class="msg mg-msg"></div><div class="counter" style="margin-top:8px">what the toy prints</div><div class="console mg-out"></div>`}`;
  function render(i) {
    el.querySelector(".mg-row").innerHTML = STEPS.map((s, k) => `<div class="frame ${k === i ? "top" : ""}" style="font-size:12px;${k > i ? "opacity:.3" : ""}">
      <span class="counter">${s.stage}</span><br><b>${s.who}</b><br>${k > 0 && k < 6 ? `→ ${s.art}` : ""}</div>`).join("");
    if (mini) return;
    const s = STEPS[i];
    el.querySelector(".mg-msg").innerHTML = i === 0 ? `The human gives a one-line requirement: <em>“${TASK}”</em>`
      : i === 6 ? `The human makes the acceptance check: <em>“${s.art}”</em>`
      : `<b>${s.who}</b> reads the previous artifact and writes the <b>${s.art}</b>.`;
    el.querySelector(".mg-msg").className = "msg mg-msg" + (i === 6 ? " good" : "");
    el.querySelector(".mg-out").textContent = STEPS.slice(1, Math.min(i, 5) + 1).map((x, k) =>
      `${k + 1}. ${x.who.padEnd(15)} -> ${x.art} for: ${TASK}`).join("\n");
  }
  stepControls(el, STEPS.length, render, { mini, every: mini ? 1000 : 1100 });
}

// ---------- Self-Instruct ----------

function demoSelfInstruct(el) {
  const SEED = "Brainstorm a list of possible New Year's resolutions.";
  const NEW = [
    ["Brainstorm creative ideas for designing a conference room.", 0.32],
    ["Brainstorm a list of possible New Year resolutions.", 0.98],
    ["Write a function that checks whether a string is a palindrome.", 0.38],
    ["Explain what a Python list comprehension does.", 0.44],
  ];
  el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px">
    <div><div class="counter">THE LLM WRITES A NEW TASK</div><div class="si-new"></div></div>
    <div><div class="counter si-ph">TASK POOL</div><div class="si-pool" style="display:grid;gap:5px;margin-top:6px"></div></div></div>
    <div class="msg si-msg"></div><div class="console si-out"></div>`;
  function render(i) {
    const pool = [SEED], out = [];
    let last = null;
    for (let k = 0; k < i; k++) {
      const [t, r] = NEW[k];
      const keep = r <= 0.7;
      if (keep) pool.push(t);
      out.push(`${keep ? "keep" : "drop"}: ${t}`);
      last = { t, r, keep };
    }
    if (i === NEW.length) out.push(`pool: 1 seed -> ${pool.length} tasks`);
    el.querySelector(".si-new").innerHTML = last ? box(esc(last.t)) + hbar("max similarity", last.r, 1, last.r.toFixed(2), last.keep ? "" : "red", "110px") : `<div class="hint">—</div>`;
    el.querySelector(".si-pool").innerHTML = pool.map((t, k) => box((k === 0 ? "🌱 " : "") + esc(t), k === pool.length - 1 && last && last.keep ? "top" : "")).join("");
    el.querySelector(".si-msg").innerHTML = !last ? "The pool starts with one human-written seed task."
      : last.keep ? `Similarity ${last.r.toFixed(2)} ≤ 0.7 to everything in the pool: <b>keep</b> it.`
      : `Similarity ${last.r.toFixed(2)} > 0.7: a near-copy of a task already in the pool. <b>Drop</b> it.`;
    el.querySelector(".si-out").textContent = out.join("\n");
  }
  stepControls(el, NEW.length + 1, render);
  el.insertAdjacentHTML("beforeend", `<p class="hint">The new tasks are the scripted fake LLM's; the scores are Python's <code>SequenceMatcher</code> ratios from the toy. Alpaca did this at scale: 175 seeds → 52K examples.</p>`);
}

// ---------- knowledge distillation: temperature and the two-part loss ----------

const KD_LABELS = ["Spam", "Promotion", "Normal"];
const KD_TEACHER = [Math.log(90), Math.log(8), Math.log(2)];
const softmax = (z, T = 1) => { const e = z.map((v) => Math.exp(v / T)); const s = e.reduce((a, b) => a + b); return e.map((v) => v / s); };
const xent = (t, p) => -t.reduce((a, ti, k) => a + (ti > 0 ? ti * Math.log(p[k]) : 0), 0);

function demoDistill(el, { mini = false } = {}) {
  const STUDENTS = { A: [3.0, 1.0, -0.5], B: [3.0, -0.5, 1.0] };
  el.innerHTML = `<p class="hint" style="margin-top:0">“You won a free phone — claim it now!”</p>
    <div class="controls" style="margin-top:0"><label>temperature T <input type="range" class="kd-t" min="1" max="6" step="0.5" value="${mini ? 1 : 2}"> <b class="kd-tv mono"></b></label>
    ${mini ? "" : `<label><input type="checkbox" class="kd-hard"> show the hard label</label>`}</div>
    <div class="counter">TEACHER (large model)</div><div class="bars kd-teacher"></div>
    ${mini ? "" : `<div class="controls"><span class="counter">STUDENT</span><button class="cbtn on" data-s="A">A: Promotion &gt; Normal</button><button class="cbtn" data-s="B">B: Normal &gt; Promotion</button></div>
    <div class="bars kd-student"></div><div class="stats kd-loss"></div><p class="hint">The student logits are ours, as in the notes. The toy's output is for T = 2.</p>`}`;
  let who = "A";
  const $ = (q) => el.querySelector(q);
  function render() {
    const T = +$(".kd-t").value;
    $(".kd-tv").textContent = T;
    const hard = !mini && $(".kd-hard").checked;
    const tp = hard ? [1, 0, 0] : softmax(KD_TEACHER, T);
    $(".kd-teacher").innerHTML = tp.map((p, k) => hbar(KD_LABELS[k], p, 1, `${Math.round(p * 100)}%`, k ? "amber" : "")).join("");
    if (mini) return;
    el.querySelectorAll("[data-s]").forEach((b) => b.classList.toggle("on", b.dataset.s === who));
    const sz = STUDENTS[who];
    const sp = softmax(sz, T);
    $(".kd-student").innerHTML = sp.map((p, k) => hbar(KD_LABELS[k], p, 1, `${Math.round(p * 100)}%`, k ? "amber" : "")).join("");
    const tm = xent(softmax(KD_TEACHER, T), sp), tl = xent([1, 0, 0], softmax(sz));
    $(".kd-loss").innerHTML = `<div class="stat"><small>teacher-matching (T = ${T})</small><b>${tm.toFixed(3)}</b></div>
      <div class="stat"><small>true-label (Spam)</small><b>${tl.toFixed(3)}</b></div>
      <div class="stat"><small>loss</small><b>${(tm + tl).toFixed(3)}</b></div>`;
  }
  $(".kd-t").oninput = render;
  if (!mini) {
    $(".kd-hard").onchange = render;
    el.querySelectorAll("[data-s]").forEach((b) => { b.onclick = () => { who = b.dataset.s; render(); }; });
    render();
  } else {
    let up = true;
    render();
    const t = setInterval(() => {
      if (!el.isConnected) return clearInterval(t);
      const s = $(".kd-t"); let v = +s.value + (up ? 0.5 : -0.5);
      if (v >= 6 || v <= 1) up = !up;
      s.value = Math.max(1, Math.min(6, v)); render();
    }, 700);
  }
}

// ---------- Evol-Instruct: the slide's tree ----------

const EVOL = {
  root: { q: "1 + 1 = ?", kids: { "Add Constraints": "goldbach", "Deepening": "not2", "Increase Reasoning": "cubic", "Concretizing": "apple", "Complicate Input (Formula)": "formula", "In-Breadth Evolving": "light" } },
  goldbach: { q: "How to prove 1 + 1 = 2 in the Goldbach Conjecture?" },
  not2: { q: "In what situation does 1+1 not equal to 2?" },
  cubic: { q: "What is the value of x, if x^3 + 2x + 3 = 7?" },
  apple: { q: "If you have one apple and someone gives you another banana, how many fruits do you have?" },
  formula: { q: "1/(sqrt(2) + 4^2) = ?", kids: { "Complicate Input (Code)": "code" } },
  code: { q: "import math\nimport random\n\n# choose a random integer between 1 and 10\nx = random.randint(1, 10)\n1/(math.sqrt(x) + x^2) = ?" },
  light: { q: "What is the speed of light in a vacuum?", kids: { "Increase Reasoning": "faster", "Deepening": "measured" } },
  measured: { q: "How is the speed of light in a vacuum measured and defined?" },
  faster: { q: "How many times faster is light than sound in a vacuum?", kids: { "Complicate Input (Table)": "table", "In-Breadth Evolving": "photo" } },
  table: { q: "Please fill in the table below with the approximate values of the speed of light in each medium.\n\nMedium | Speed of light (km/s)\nAir    |\nWater  |\nGlass  |" },
  photo: { q: "The process of plant photosynthesis is commonly written as:\n6CO2 + 6H2O → C6H12O6 + 6O2\nPlease explain the main role of chlorophyll in above formula." },
};

function demoEvol(el) {
  let path = ["root"], via = [];
  el.innerHTML = `<div class="counter">CURRENT PROBLEM</div><div class="ev-q"></div>
    <div class="counter" style="margin-top:8px">EVOLVE IT WITH…</div><div class="controls ev-kids" style="margin-top:4px"></div>
    <div class="counter" style="margin-top:8px">THE PATH SO FAR</div><div class="ev-path" style="display:grid;gap:5px;margin-top:4px"></div>
    <div class="controls"><button class="cbtn ev-back">◀ Back</button><button class="cbtn ev-reset">⟲ Back to 1 + 1 = ?</button><span class="spacer"></span><span class="counter ev-depth"></span></div>`;
  const $ = (q) => el.querySelector(q);
  function render() {
    const node = EVOL[path[path.length - 1]];
    $(".ev-q").innerHTML = pre(node.q);
    const kids = Object.entries(node.kids || {});
    $(".ev-kids").innerHTML = kids.length ? kids.map(([t, id]) => `<button class="cbtn ${t === "In-Breadth Evolving" ? "" : "on"}" data-id="${id}" data-t="${t}">${t}</button>`).join("")
      : `<span class="hint">The slide's tree ends here.</span>`;
    el.querySelectorAll("[data-id]").forEach((b) => { b.onclick = () => { path.push(b.dataset.id); via.push(b.dataset.t); render(); }; });
    $(".ev-path").innerHTML = path.map((id, k) => box(`${k ? `<span class="tag">${via[k - 1]}</span> ` : `<span class="tag">initial</span> `}${esc(EVOL[id].q.split("\n")[0])}${EVOL[id].q.includes("\n") ? " …" : ""}`, k === path.length - 1 ? "top" : "")).join("");
    $(".ev-depth").textContent = `${path.length - 1} evolution${path.length === 2 ? "" : "s"}`;
    $(".ev-back").disabled = $(".ev-reset").disabled = path.length === 1;
  }
  $(".ev-back").onclick = () => { if (path.length > 1) { path.pop(); via.pop(); } render(); };
  $(".ev-reset").onclick = () => { path = ["root"]; via = []; render(); };
  render();
  el.insertAdjacentHTML("beforeend", `<p class="hint">Every problem here is from the slide's tree (WizardLM). Filled buttons make a problem deeper; In-Breadth Evolving makes a new one on another topic.</p>`);
}

// ---------- OSS-Instruct ----------

function demoOSS(el) {
  const STEPS = [
    ["Open-source codebase", "PosNeg.py · Log.cpp · Program.cs · Strength.swift · GrantInfo.ts · …", "Real projects in many languages."],
    ["Seed code snippet", 'learn_model(\n    tf_idfSVM, tf_idfNB, target)\n\ndef get_clean_review(raw_review):\n    letters_only = re.sub(\n        "[^a-zA-Z]", " ", raw_review)', "A random snippet from PosNeg.py."],
    ["Prompt (details omitted)", "Please gain inspiration from the following code snippet to create a high-quality programming problem…", "The snippet goes into a fixed prompt."],
    ["Generated problem (details omitted)", "You are working on a natural language processing (NLP) project and need to create a program to preprocess and classify movie reviews…\nYour program should be able to preprocess new movie reviews, train the model, and classify new reviews accurately.", "The language model writes a new problem…"],
    ["Generated solution (details omitted)", "from sklearn.feature_extraction.text import TfidfVectorizer ...\ndef get_clean_review(raw_review): ...\ndef train_model(tf_idfSVM, tf_idfNB, reviews, labels): ...\ndef classify_review(clean_review, tf_idfSVM, tf_idfNB): ...", "…and its solution: one ⟨debiased problem, solution⟩ pair."],
  ];
  el.innerHTML = `<div class="os-flow" style="display:grid;gap:6px"></div><div class="msg os-msg"></div>`;
  function render(i) {
    el.querySelector(".os-flow").innerHTML = STEPS.slice(0, i + 1).map(([h, t], k) =>
      `<div class="frame ${k === i ? "top" : ""}" style="font-size:12.5px"><span class="counter">${h}</span>${pre(t)}</div>`).join("");
    el.querySelector(".os-msg").innerHTML = STEPS[i][2];
  }
  stepControls(el, STEPS.length, render);
  el.insertAdjacentHTML("beforeend", `<p class="hint">Texts from the Magicoder figure on the slide; the paper omits details, and so do we.</p>`);
}

// ---------- two coding models, one shape ----------

function demoPipelines(el, { mini = false } = {}) {
  const M = {
    "Composer 2": ["Base model (Kimi 2.5)", "Continued pretraining", "Reinforcement Learning", "Data", "Cursor env"],
    "Qwen3-Coder-Next": ["Base model (Qwen3-Next)", "Mid-training", "Reinforcement Learning", "Data", "GitHub PRs + Docker"],
  };
  let who = "Composer 2";
  el.innerHTML = `${mini ? "" : `<div class="controls" style="margin-top:0">${Object.keys(M).map((k) => `<button class="cbtn" data-m="${k}">${k}</button>`).join("")}</div>`}
    <div class="counter pl-name"></div><div class="pl-row" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:6px"></div>`;
  function render() {
    const [a, b, c, d1, d2] = M[who];
    el.querySelector(".pl-name").textContent = who;
    el.querySelectorAll("[data-m]").forEach((x) => x.classList.toggle("on", x.dataset.m === who));
    const cell = (t, bg, note) => `<div><div class="hint" style="text-align:center;min-height:18px;font-size:12px">${note ? "💬 " + note : ""}</div><div class="frame" style="text-align:center;font-size:12px;padding:8px 4px;overflow-wrap:anywhere;background:var(--${bg})">${t}</div></div>`;
    el.querySelector(".pl-row").innerHTML = cell(a, "mark", "") + cell(b, "green-soft", d1) + cell(c, "teal-soft", d2);
  }
  el.querySelectorAll("[data-m]").forEach((x) => { x.onclick = () => { who = x.dataset.m; render(); }; });
  render();
  if (mini) {
    const t = setInterval(() => { if (!el.isConnected) return clearInterval(t); who = who === "Composer 2" ? "Qwen3-Coder-Next" : "Composer 2"; render(); }, 2200);
  }
}

// ---------- the bug-synthesis pipeline ----------

function demoBugs(el) {
  const C = {
    "slide's bug": { old: "    if isinstance(lst, list):\n        item_lst = lst\n    else:\n        item_lst = lst[\"users\"]\n    results = []\n    for obj in item_lst:", new: "    results = []\n    for obj in lst:\n        if not obj:\n            continue", applies: true, after: { test_list: true, test_dict: false } },
    "rename only": { old: "results", new: "out", applies: true, after: { test_list: true, test_dict: true } },
    "stale patch": { old: "for item in items:", new: "for item in items[1:]:", applies: false },
    "upper → lower (Exercise 2)": { old: "obj.upper()", new: "obj.lower()", applies: true, after: { test_list: false, test_dict: false } },
  };
  let who = "slide's bug";
  el.innerHTML = `<div class="controls bg-pick" style="margin-top:0">${Object.keys(C).map((k) => `<button class="cbtn" data-c="${k}">${k}</button>`).join("")}</div>
    <div class="bg-body"></div><div class="msg bg-msg"></div><div class="bg-ctl"></div>`;
  const STAGES = ["① Repository collection", "② Bug sampling", "③ git apply or not", "③ Run the tests before and after", "④ Issue generation"];
  let ctl;
  function render(i) {
    el.querySelectorAll("[data-c]").forEach((b) => b.classList.toggle("on", b.dataset.c === who));
    const c = C[who];
    const stop = !c.applies ? 2 : (c.after.test_list && c.after.test_dict) ? 3 : 4;
    const s = Math.min(i, stop);
    let body = `<div class="tags" style="margin-bottom:6px">${STAGES.map((t, k) => `<span class="tag" style="${k === s ? "background:var(--mark)" : k > s ? "opacity:.35" : ""}">${t}</span>`).join("")}</div>`;
    let msg = "";
    if (s === 0) { body += pre(CODE.bugs.split("\n").slice(0, 9).join("\n").replace("ORIGINAL = '''", "")); msg = "A function cut out of a real codebase by the AST parser (here, a small <code>parse_list</code> like the slide's)."; }
    if (s >= 1) body += `<div class="counter">BUG PATCH</div>${pre(c.old.split("\n").map((l) => "- " + l).join("\n") + "\n" + c.new.split("\n").map((l) => "+ " + l).join("\n"))}`;
    if (s === 1) msg = "An LLM samples a bug: a patch that rewrites part of the function.";
    if (s === 2 && !c.applies) msg = "<code>git apply</code> fails: the old text is not in the file. <b>Drop.</b>";
    if (s === 2 && c.applies) msg = "<code>git apply</code> succeeds.";
    if (s >= 3) {
      body += `<table><tr><th>test</th><th>before</th><th>after</th></tr>${Object.keys(c.after).map((t) => `<tr><td><code>${t}</code></td><td>pass</td><td>${c.after[t] ? "pass" : "<b>FAIL</b>"}</td></tr>`).join("")}</table>`;
      const p2f = Object.keys(c.after).filter((t) => !c.after[t]);
      msg = `PASS_TO_FAIL = [${p2f.map((t) => `'${t}'`).join(", ")}], len = ${p2f.length}. ` + (p2f.length ? "<b>Keep</b> the bug." : "No test notices the change. <b>Drop.</b>");
    }
    if (s === 4) {
      const issue = who.startsWith("upper") ? "parse_list returns lower-case names instead of upper-case ones."
        : "parse_list returns the wrong items when it is given a dict with a “users” key.";
      body += `<div class="counter">NEW TASK INSTANCE</div>${box(`<b>problem statement</b> (written by an LLM from the patch and the log; illustrative): <em>${issue}</em>`)}
        ${box("<b>oracle patch</b>: the bug patch, reversed (− and + swapped).")}`;
      msg = "An LLM writes the issue. The reverse of the bug patch is the oracle patch. A new task: here is the repository and the issue — fix it.";
    }
    el.querySelector(".bg-body").innerHTML = body;
    el.querySelector(".bg-msg").innerHTML = msg + (i > stop ? ` <span class="counter">(the pipeline stopped here)</span>` : "");
    el.querySelector(".bg-msg").className = "msg bg-msg" + (s === 4 ? " good" : "");
  }
  el.querySelectorAll("[data-c]").forEach((b) => { b.onclick = () => { who = b.dataset.c; ctl.reset(); }; });
  ctl = stepControls(el.querySelector(".bg-ctl"), STAGES.length, render);
}

// ---------- rewards: reward model vs verifiable ----------

function demoRewards(el) {
  const A = {
    "answer 1": { code: "def discount_price(price):\n    return price * 0.8", rm: "0.2", v: [-1.0, "tests fail (AssertionError)"], row: 1 },
    "answer 2": { code: 'def discount_price(price):\n    if (price < 0):\n        raise ValueError("Negative")\n    return price * 0.8', rm: "0.8", v: [1.0, "all tests pass"], row: 0 },
    "answer 3": { code: "def discount_price(price)\n    return price * 0.8", rm: "— (not on the slide)", v: [-1.0, "compilation error"], row: 2 },
  };
  const ROWS = [["All tests pass", "+1.0", "Perfect functional correctness"], ["Some / all tests fail", "−1.0", "Logic error or edge case failure"],
    ["Compilation error", "−1.0", "Invalid syntax"], ["Timeout / memory exceeded", "−1.0", "Inefficient algorithmic complexity"]];
  let who = "answer 1";
  el.innerHTML = `<p class="hint" style="margin-top:0">Task: <em>Implement a discount calculation function.</em></p>
    <div class="controls" style="margin-top:0">${Object.keys(A).map((k) => `<button class="cbtn" data-a="${k}">${k}</button>`).join("")}</div>
    <div class="rw-code"></div><div class="stats rw-stats"></div><div class="rw-table"></div>`;
  function render() {
    const a = A[who];
    el.querySelectorAll("[data-a]").forEach((b) => b.classList.toggle("on", b.dataset.a === who));
    el.querySelector(".rw-code").innerHTML = codeBlock(a.code);
    el.querySelector(".rw-stats").innerHTML = `<div class="stat"><small>implicit · reward model</small><b>${a.rm}</b></div>
      <div class="stat"><small>verifiable · run the tests</small><b>${a.v[0] > 0 ? "+" : ""}${a.v[0].toFixed(1)}</b></div><div class="stat"><small>why</small><b style="font-size:14px">${a.v[1]}</b></div>`;
    el.querySelector(".rw-table").innerHTML = `<table><tr><th>Execution outcome</th><th>Reward</th><th>Interpretation</th></tr>${ROWS.map((r, k) =>
      `<tr style="${k === a.row ? "background:var(--mark)" : ""}"><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("")}</table>`;
  }
  el.querySelectorAll("[data-a]").forEach((b) => { b.onclick = () => { who = b.dataset.a; render(); }; });
  render();
  el.insertAdjacentHTML("beforeend", `<p class="hint">Reward-model scores 0.2 and 0.8 are the slide's. The verifiable rewards are what the toy <code>verifiable_reward</code> prints.</p>`);
}

// ---------- sparse reward ----------

function demoSparse(el) {
  el.innerHTML = `<p class="hint" style="margin-top:0">A 500-line program with one off-by-one error. Move the error.</p>
    <div class="controls" style="margin-top:0"><label>error on line <input type="range" class="sp-l" min="1" max="500" value="499"> <b class="sp-v mono"></b></label>
    <label><input type="checkbox" class="sp-fine"> fine-grained feedback</label></div>
    <div class="sp-strip" style="display:grid;grid-template-columns:repeat(50,1fr);gap:1px;margin-top:8px"></div>
    <div class="msg sp-msg"></div><p class="hint">Illustrative: each cell is 10 lines.</p>`;
  const $ = (q) => el.querySelector(q);
  function render() {
    const L = +$(".sp-l").value, fine = $(".sp-fine").checked;
    $(".sp-v").textContent = L;
    const cellOf = Math.floor((L - 1) / 10);
    $(".sp-strip").innerHTML = Array.from({ length: 50 }, (_, k) => {
      const bg = fine ? (k === cellOf ? "var(--red)" : k > cellOf ? "var(--line)" : "var(--green-soft)") : "var(--red)";
      return `<div style="height:22px;background:${bg};opacity:${fine ? 1 : 0.55}"></div>`;
    }).join("");
    $(".sp-msg").innerHTML = fine
      ? `Lines before ${L} ran fine: no penalty. Line ${L} is <b>penalized</b>. Lines after it never ran: <b>masked</b>. The model learns <em>where</em> it failed.`
      : `Reward <b>−1.0</b> for the whole program, wherever the error is. No partial credit, no information about where it failed.`;
  }
  $(".sp-l").oninput = render; $(".sp-fine").onchange = render;
  render();
}

// ---------- fine-grained: which lines ran? ----------

function demoLines(el) {
  const SRC = ["def calculate_metrics(data):", "  if not data:", "    return 0", "", "  total = sum(data)", "  average = total / len(dta)", "  return average"];
  const RUNS = { "[]": { ran: [2, 3], err: null }, "[1, 2, 3]": { ran: [2, 5, 6], err: 6 } };
  el.innerHTML = `<div class="controls" style="margin-top:0"><span class="counter">RUN ON</span>${Object.keys(RUNS).map((k) => `<label><input type="checkbox" class="ln-in" data-k="${k}" checked> <code>${k}</code></label>`).join("")}</div>
    <div class="ln-tbl"></div><div class="msg ln-msg"></div>`;
  function render() {
    const on = [...el.querySelectorAll(".ln-in")].filter((c) => c.checked).map((c) => RUNS[c.dataset.k]);
    const ran = new Set(on.flatMap((r) => r.ran)), err = on.map((r) => r.err).find((x) => x);
    const lab = (n) => n === err ? ["penalize", "red"] : ran.has(n) ? ["ok", "green"] : ["mask", "stone"];
    el.querySelector(".ln-tbl").innerHTML = `<pre class="code nonum" style="padding:8px 10px;font-size:12.5px;white-space:pre-wrap">${SRC.map((t, k) => {
      const n = k + 1;
      if (n === 1 || !t) return `<span style="display:block">${n}: ${esc(t)}</span>`;
      const [l, c] = lab(n);
      return `<span style="display:flex;justify-content:space-between;gap:8px;${l === "penalize" ? "background:var(--mark)" : ""}"><span>${n}: ${esc(t)}</span><b style="color:var(--${c})">${l}</b></span>`;
    }).join("")}</pre>`;
    el.querySelector(".ln-msg").innerHTML = !on.length ? "Pick at least one input." : err
      ? `Line ${err} raised <code>NameError</code> (<code>dta</code>): only it is penalized. ${ran.has(3) ? "Line 3 ran on <code>[]</code> and was fine." : "Line 3 never ran on this input, so it is masked too."}`
      : "No error on this input: nothing to penalize. Lines 5–7 never ran, so they are masked.";
  }
  el.querySelectorAll(".ln-in").forEach((c) => { c.onchange = render; });
  render();
  el.insertAdjacentHTML("beforeend", `<p class="hint">With both inputs checked this is exactly what <code>line_rewards</code> prints, and it matches the slide's three labels.</p>`);
}

// ---------- static analysis as reward ----------

function demoLint(el) {
  const PEN = { error: -10.0, high: -5.0, normal: -1.0, low: -0.2 };
  el.innerHTML = `<div class="controls" style="margin-top:0">
      <label><input type="checkbox" class="lt" data-k="doc"> add a docstring</label>
      <label><input type="checkbox" class="lt" data-k="count"> remove <code>count = 0</code></label>
      <label><input type="checkbox" class="lt" data-k="param"> use a parameterized query</label>
      <label><input type="checkbox" class="lt" data-k="syntax"> drop the colon after <code>def</code></label></div>
    <div class="lt-code"></div><div class="console lt-out"></div>`;
  function render() {
    const o = {}; el.querySelectorAll(".lt").forEach((c) => { o[c.dataset.k] = c.checked; });
    const lines = [`def find_user(db, name)${o.syntax ? "" : ":"}`];
    if (o.doc) lines.push('    """Return the user with this name."""');
    if (!o.count) lines.push("    count = 0");
    lines.push(o.param ? '    return db.execute("SELECT * FROM users WHERE name = ?", (name,))'
      : `    return db.execute(f"SELECT * FROM users WHERE name = '{name}'")`);
    el.querySelector(".lt-code").innerHTML = codeBlock(lines.join("\n"));
    let f = [];
    if (o.syntax) f = [["SyntaxError", "error"]];
    else {
      if (!o.doc) f.push(["find_user: missing docstring", "low"]);
      if (!o.count) f.push(["find_user: count unused", "normal"]);
      if (!o.param) f.push(["find_user: SQL built from an f-string", "high"]);
    }
    const total = f.reduce((a, [, s]) => a + PEN[s], 0);
    el.querySelector(".lt-out").textContent = f.map(([t, s]) => `${s.padEnd(7)} ${String(PEN[s].toFixed(1)).padStart(6)}  ${t}`).join("\n") +
      `${f.length ? "\n" : ""}static reward: ${Math.round(total * 10) / 10}`;
  }
  el.querySelectorAll(".lt").forEach((c) => { c.onchange = render; });
  render();
  el.insertAdjacentHTML("beforeend", `<p class="hint">Findings follow the toy <code>lint</code> (our crude checks, not Ruff); penalties are the slide's table.</p>`);
}

// ---------- reasoning reward with a consistency gate ----------

function demoGate(el) {
  el.innerHTML = `<div class="controls" style="margin-top:0"><label>PRM score for the reasoning <input type="range" class="gt-p" min="0" max="1" step="0.1" value="0.8"> <b class="gt-pv mono"></b></label>
    <label><input type="checkbox" class="gt-ok"> the final code compiles and passes</label>
    <label><input type="checkbox" class="gt-off"> turn the gate off</label></div>
    <div class="stats gt-stats"></div><div class="msg gt-msg"></div>`;
  const $ = (q) => el.querySelector(q);
  function render() {
    const p = +$(".gt-p").value, ok = $(".gt-ok").checked, off = $(".gt-off").checked;
    $(".gt-pv").textContent = p.toFixed(1);
    const outcome = ok ? 1 : 0, r = off ? p : p * outcome;
    $(".gt-stats").innerHTML = `<div class="stat"><small>step 1 · reasoning (PRM)</small><b>+${p.toFixed(1)}</b></div>
      <div class="stat"><small>step 2 · final code</small><b>${outcome}</b></div><div class="stat"><small>final reward</small><b>${off ? `${r.toFixed(1)}` : `${p.toFixed(1)} × ${outcome} = ${r.toFixed(1)}`}</b></div>`;
    $(".gt-msg").innerHTML = off && !ok && p > 0 ? "Without the gate, beautiful reasoning earns a reward even though the code is broken: <b>reward hacking</b>."
      : ok ? "The code works, so the reasoning reward counts." : "The code fails, so the reasoning reward is multiplied by zero.";
    $(".gt-msg").className = "msg gt-msg" + (off && !ok && p > 0 ? "" : ok ? " good" : "");
  }
  el.querySelectorAll("input").forEach((c) => { c.oninput = render; c.onchange = render; });
  render();
}

// ---------- does it really help? ----------

function demoEfficiency(el) {
  const MCK = [["Code documentation", 45, 50], ["Code generation", 35, 45], ["Code refactoring", 20, 30], ["High-complexity tasks", 0, 10]];
  const LB = {
    "Software engineering": [["Claude Opus 4.6", 80.8], ["MiniMax M2.5", 80.2], ["Claude Sonnet 4.6", 79.6], ["Gemini 3.1 Pro", 78.0], ["GLM-5", 77.8], ["Kimi K2.5", 76.8], ["Qwen 3.5", 76.4], ["Step-3.5-Flash", 74.4], ["MiMo-V2-Flash", 73.4], ["DeepSeek V3.2", 67.8], ["GPT-oss 120B", 62.4], ["DeepSeek R1", 49.2], ["Grok 3", 49.0], ["DeepSeek V3", 38.8]],
    "Code generation": [["Kimi K2.5", 99.0], ["Claude Opus 4.6", 95.0], ["Grok 3", 94.5], ["Gemini 3.1 Pro", 93.0], ["Claude Sonnet 4.6", 92.1], ["Mistral Large", 92.0], ["DeepSeek R1", 90.2], ["GLM-5", 90.0], ["MiniMax M2.5", 89.6], ["GPT-oss 120B", 88.3], ["MiMo-V2-Flash", 84.8], ["Step-3.5-Flash", 81.1], ["Llama 4 Maverick", 62.0]],
  };
  let view = "mck", board = "Software engineering", hi = "Grok 3";
  el.innerHTML = `<div class="controls" style="margin-top:0"><button class="cbtn" data-v="mck">Time saved (McKinsey)</button><button class="cbtn" data-v="lb">Leaderboard snapshot</button><button class="cbtn" data-v="bug">Bug rate (Uplevel)</button></div>
    <div class="ef-body"></div>`;
  function render() {
    el.querySelectorAll("[data-v]").forEach((b) => b.classList.toggle("on", b.dataset.v === view));
    let h = "";
    if (view === "mck") {
      h = `<p class="hint">Time saved with generative AI, by task (ranges from the slide's chart).</p><div class="bars">${MCK.map(([t, a, b]) =>
        `<div class="bar"><span>${t}</span><div class="track" style="position:relative"><div class="fill" style="position:absolute;left:${a * 2}%;width:${(b - a) * 2}%"></div></div><span class="v">${a ? `${a}–${b}%` : `< ${b}%`}</span></div>`).join("")}</div>
        <div class="msg">Big savings on documentation and generation; under 10% on high-complexity tasks.</div>`;
    } else if (view === "lb") {
      h = `<div class="controls" style="margin-top:0">${Object.keys(LB).map((k) => `<button class="cbtn ${k === board ? "on" : ""}" data-b="${k}">${k}</button>`).join("")}</div>
        <div class="bars">${LB[board].map(([m, v]) => `<div style="cursor:pointer" data-h="${m}">${hbar(m, v, 100, v.toFixed(1) + "%", m === hi ? "amber" : "", "128px")}</div>`).join("")}</div>
        <p class="hint">Click a model to follow it across both rankings. A snapshot from onyx.app on the slide; leaderboards change often.</p>`;
    } else {
      h = `<div class="stats"><div class="stat"><small>bug rate, developers with Copilot access</small><b>+41%</b></div><div class="stat"><small>issue throughput</small><b>about the same</b></div></div>
        <div class="msg">The report suggests digging into the PRs with bugs and putting guardrails in place for the responsible use of generative AI.</div>`;
    }
    el.querySelector(".ef-body").innerHTML = h;
    el.querySelectorAll("[data-b]").forEach((b) => { b.onclick = () => { board = b.dataset.b; render(); }; });
    el.querySelectorAll("[data-h]").forEach((b) => { b.onclick = () => { hi = b.dataset.h; render(); }; });
  }
  el.querySelectorAll("[data-v]").forEach((b) => { b.onclick = () => { view = b.dataset.v; render(); }; });
  render();
}

// ---------- quiz (as in L02) ----------

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
  repocoder: (el) => demoRepoCoder(el),
  repocoderMini: (el) => demoRepoCoder(el, { mini: true }),
  repoPrompt: (el) => demoRepoPrompt(el),
  imports: (el) => demoImports(el),
  metagpt: (el) => demoMetaGPT(el),
  metagptMini: (el) => demoMetaGPT(el, { mini: true }),
  selfInstruct: (el) => demoSelfInstruct(el),
  distill: (el) => demoDistill(el),
  distillMini: (el) => demoDistill(el, { mini: true }),
  evol: (el) => demoEvol(el),
  oss: (el) => demoOSS(el),
  pipelines: (el) => demoPipelines(el),
  pipelinesMini: (el) => demoPipelines(el, { mini: true }),
  bugs: (el) => demoBugs(el),
  rewards: (el) => demoRewards(el),
  sparse: (el) => demoSparse(el),
  lines: (el) => demoLines(el),
  lint: (el) => demoLint(el),
  gate: (el) => demoGate(el),
  efficiency: (el) => demoEfficiency(el),
  quiz: (el) => demoQuiz(el, QUIZ),
};
