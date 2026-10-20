// L10 demos. Code panels and printed outputs in CODE are copied verbatim from
// csc4801/notes/L10-team.md (checked by csc4801/tools/check.py); the demos replay those runs.

const CODE = {
  rulesFor: `agents_md = {
    ".": {
        "evidence": "Run targeted checks and report exact commands.",
        "diffs": "Keep diffs minimal.",
    },
    "pkg/parser": {
        "evidence": "Regenerate the parser, then run the parser tests.",
    },
}


def folders_of(path):
    """The folders from the root down to the file: '.', 'pkg', 'pkg/parser', ..."""
    parts = path.split("/")[:-1]
    return ["."] + ["/".join(parts[:k]) for k in range(1, len(parts) + 1)]


def rules_for(path):
    """Merge every AGENTS.md on the way down. Deeper files are applied last, so they win."""
    rules, used = {}, []
    for folder in folders_of(path):
        if folder in agents_md:
            rules.update(agents_md[folder])
            used.append(folder + "/AGENTS.md")
    return used, rules


for path in ["README.md", "pkg/parser/parser.y"]:
    used, rules = rules_for(path)
    print(path, "<-", ", ".join(used))
    for key, text in rules.items():
        print(f"    {key}: {text}")`,
  rulesOut: `README.md <- ./AGENTS.md
    evidence: Run targeted checks and report exact commands.
    diffs: Keep diffs minimal.
pkg/parser/parser.y <- ./AGENTS.md, pkg/parser/AGENTS.md
    evidence: Regenerate the parser, then run the parser tests.
    diffs: Keep diffs minimal.`,
  strixMsg: `test: add unit tests for config loader (strix/config/loader.py) (#596)

Co-authored-by: Claude Opus 4.8 <noreply@anthropic.com>`,
  trailers: `def trailers(message):
    """Return the 'Key: value' lines of a commit message's last paragraph."""
    last = message.strip().split("\\n\\n")[-1]
    found = []
    for line in last.splitlines():
        key, sep, value = line.partition(": ")
        if sep and "-" in key and " " not in key:
            found.append((key, value))
    return found


strix = """test: add unit tests for config loader (strix/config/loader.py) (#596)

Co-authored-by: Claude Opus 4.8 <noreply@anthropic.com>"""
print(trailers(strix))`,
  trailersOut: `[('Co-authored-by', 'Claude Opus 4.8 <noreply@anthropic.com>')]`,
  worktreeTree: `REPO ─┬─ main     (primary branch)  → /path/to/repo/main
      ├─ feature  (new feature)     → /path/to/repo/feature-A
      └─ bugfix   (resolved bug)    → /path/to/repo/fix-B

$ git worktree add <new-branch-name> <path>`,
  worktreeAdd: `git worktree add -b fix ../worktree-fix main`,
  claudeWt: `claude --worktree feature-auth
claude --worktree bugfix-123        # in another terminal: a second isolated session`,
  worktreeModel: `class Repo:
    def __init__(self, files):
        self.objects = {"c0": {"files": dict(files), "parent": None, "msg": "initial"}}  # shared
        self.refs = {"main": "c0"}                                                      # shared

    def log(self, branch):
        """Commit messages reachable from a branch, newest first."""
        out, cid = [], self.refs[branch]
        while cid:
            out.append(self.objects[cid]["msg"])
            cid = self.objects[cid]["parent"]
        return out


class Worktree:
    def __init__(self, repo, path, branch, start=None):
        if start:                                   # -b <branch> <start>: make the branch
            repo.refs[branch] = repo.refs[start]
        self.repo, self.path, self.head = repo, path, branch
        snapshot = repo.objects[repo.refs[branch]]["files"]
        self.files = dict(snapshot)                 # own working directory
        self.index = dict(snapshot)                 # own index

    def write(self, name, text):
        self.files[name] = text

    def add(self, name):
        self.index[name] = self.files[name]

    def commit(self, msg):
        cid = f"c{len(self.repo.objects)}"
        parent = self.repo.refs[self.head]
        self.repo.objects[cid] = {"files": dict(self.index), "parent": parent, "msg": msg}
        self.repo.refs[self.head] = cid             # moves a shared ref
        return cid


repo = Repo({"app.py": "v1"})
main = Worktree(repo, "repo", "main")
fix = Worktree(repo, "../worktree-fix", "fix", start="main")
auth = Worktree(repo, ".claude/worktrees/feature-auth", "worktree-feature-auth", start="main")

fix.write("app.py", "v1 + bug fix")
auth.write("auth.py", "OAuth2 login")
for wt in (main, fix, auth):
    print(f"{wt.path:32} {wt.head:22} {wt.files}")`,
  wtOut1: `repo                             main                   {'app.py': 'v1'}
../worktree-fix                  fix                    {'app.py': 'v1 + bug fix'}
.claude/worktrees/feature-auth   worktree-feature-auth  {'app.py': 'v1', 'auth.py': 'OAuth2 login'}`,
  wtCommits: `fix.add("app.py")
print("fix commits", fix.commit("fix: handle missing city"))
auth.add("auth.py")
print("auth commits", auth.commit("feat(auth): add OAuth2 login"))
print("refs:", repo.refs)
print("seen from main:", repo.log("fix"))
print("main's files:", main.files)`,
  wtOut2: `fix commits c1
auth commits c2
refs: {'main': 'c0', 'fix': 'c1', 'worktree-feature-auth': 'c2'}
seen from main: ['fix: handle missing city', 'initial']
main's files: {'app.py': 'v1'}`,
  cas: `import hashlib
import zlib

storage = {}      # "Cloud Storage": hash -> compressed bytes, written once
changesets = []   # "Spanner": small metadata records


def put(text):
    data = text.encode()
    key = hashlib.sha256(data).hexdigest()[:8]
    if key not in storage:
        storage[key] = zlib.compress(data)
    return key


def changeset(author, message, changes):
    record = {
        "author": author,
        "message": message,
        "parents": [changesets[-1]["id"]] if changesets else [],
        "file_changes": {p: ("Deleted" if t is None else put(t)) for p, t in changes.items()},
    }
    record["id"] = hashlib.sha256(repr(record).encode()).hexdigest()[:8]
    changesets.append(record)
    return record


guide = "# Guide\\n" + "Run the build before you push.\\n" * 20
first = changeset("Claude <noreply@anthropic.com>", "docs: add guide",
                  {"docs/guide.md": guide, "src/legacy.rs": "fn old() {}"})
second = changeset("Claude <noreply@anthropic.com>", "scion-cache: serve blobs from the memory tier",
                   {"docs/guide.md": guide, "src/legacy.rs": None,
                    "tools/build.sh": "#!/bin/sh\\ncargo build\\n"})
for cs in changesets:
    print(cs["id"], cs["parents"], cs["file_changes"])
print("blobs stored:", len(storage))
print("guide.md:", len(guide.encode()), "bytes ->", len(storage[put(guide)]), "compressed")`,
  casOut: `9178555b [] {'docs/guide.md': '4fd1739f', 'src/legacy.rs': '8687eab4'}
45b78ca2 ['9178555b'] {'docs/guide.md': '4fd1739f', 'src/legacy.rs': 'Deleted', 'tools/build.sh': 'd9f1c1e6'}
blobs stored: 3
guide.md: 628 bytes -> 52 compressed`,
  results: `results = [  # (command, git seconds, scn seconds), from slide 26
    ("Pull latest", 87, 3.5), ("Checkout", 15, 1.1), ("Rebase", 13, 2.7),
    ("Status", 3.9, 0.019), ("Commit", 1.4, 1.1), ("Diff", 0.407, 0.067),
    ("New worktree (agent)", 7.1 * 60, 5.1), ("Pull latest (agent)", 3.0 * 60, 9.0),
    ("Commit (agent)", 18, 0.761),
]
for name, git, scn in results:
    print(f"{name:22} x{git / scn:.1f}")`,
  resultsOut: `Pull latest            x24.9
Checkout               x13.6
Rebase                 x4.8
Status                 x205.3
Commit                 x1.3
Diff                   x6.1
New worktree (agent)   x83.5
Pull latest (agent)    x20.0
Commit (agent)         x23.7`,
  commitEx1: `✨ feat(auth): add OAuth2 authentication support

Implement OAuth2 flow to support third-party login providers.
This replaces the custom token-based authentication system.`,
  commitEx2: `🐛 fix(api): handle null values in user profile endpoint

Prevent crashes when user profile data contains null fields.
Fixes #123`,
  commitEx3: `📝 docs: update installation guide with Windows instructions

Add step-by-step instructions for Windows users including
PowerShell-specific commands and common troubleshooting tips.`,
  checkCommit: `import re

HEADER = re.compile(r"^(?:\\S+ )?(feat|fix|docs|test|refactor|perf|chore)(\\([\\w-]+\\))?: \\S")


def check_commit(message):
    lines = message.splitlines()
    problems = []
    if not HEADER.match(lines[0]):
        problems.append("header is not 'type(scope): summary'")
    if len(lines[0]) > 72:
        problems.append("header longer than 72 characters")
    if len(lines) > 1 and lines[1] != "":
        problems.append("no blank line after the header")
    return problems or ["ok"]


examples = [
    "✨ feat(auth): add OAuth2 authentication support\\n\\nImplement OAuth2 flow ...",
    "🐛 fix(api): handle null values in user profile endpoint\\n\\nFixes #123",
    "📝 docs: update installation guide with Windows instructions",
    strix,
    "fixed stuff\\nalso some cleanup",
]
for m in examples:
    print(f"{m.splitlines()[0][:44]:46}", check_commit(m))`,
  checkCommitOut: `✨ feat(auth): add OAuth2 authentication supp   ['ok']
🐛 fix(api): handle null values in user profi   ['ok']
📝 docs: update installation guide with Windo   ['ok']
test: add unit tests for config loader (stri   ['ok']
fixed stuff                                    ["header is not 'type(scope): summary'", 'no blank line after the header']`,
  catchBad1: `# Buggy: accidentally uses \`is\` for comparison
if status is "ok":
    process()

# Correct
if status == "ok":
    process()`,
  catchRun1: `ok = "ok"
status = "".join(["o", "k"])     # e.g. read from a network reply
print(status == ok, status is ok)`,
  catchOut1: `True False`,
  catchRun2: `# Hard to read
x = [i for i in range(100) if i % 7 == 0 and i % 5 != 0 or i % 11 == 0]


# Clearer with helper functions
def is_valid(n):
    return (n % 7 == 0 and n % 5 != 0) or n % 11 == 0


y = [i for i in range(100) if is_valid(i)]
print(x == y, len(y))`,
  catchOut2: `True 21`,
  catchRun3: `class Name(str):
    comparisons = 0

    def __eq__(self, other):
        Name.comparisons += 1
        return str.__eq__(self, other)

    __hash__ = str.__hash__


big_list = [Name(f"user{k}") for k in range(1000)]
users = [Name(f"user{k}") for k in range(0, 2000, 20)]     # 100 users, half of them in the list


def process(user):
    pass


Name.comparisons = 0
for user in users:            # O(n*m): unnecessary repeated lookups
    if user in big_list:
        process(user)
print("list:", Name.comparisons, "comparisons")

Name.comparisons = 0
big_set = set(big_list)       # Better: one pass to build the set ...
for user in users:            # ... then O(1) per lookup
    if user in big_set:
        process(user)
print("set: ", Name.comparisons, "comparisons")`,
  catchOut3: `list: 74550 comparisons
set:  50 comparisons`,
  catchBad4: `# Dangerous: executing user input
eval(user_input)

# Safe alternative
import ast
safe_expr = ast.literal_eval(user_input)`,
  catchRun4: `import ast

for user_input in ["[1, 2, 3]", "{'retries': 3}", "__import__('os').getcwd()", "1+2"]:
    try:
        print(f"{user_input:28} -> {ast.literal_eval(user_input)!r}")
    except ValueError as e:
        print(f"{user_input:28} -> rejected ({type(e).__name__})")`,
  catchOut4: `[1, 2, 3]                    -> [1, 2, 3]
{'retries': 3}               -> {'retries': 3}
__import__('os').getcwd()    -> rejected (ValueError)
1+2                          -> rejected (ValueError)`,
  catchBad5: `# Non-standard pattern: accessing by username
user = users_by_username["alice123"]
send_email(user["email"])

# Standard pattern: accessing by user_id
user = users_by_id[user_id]
send_email(user["email"])`,
  catchRun5: `users_by_id = {7: {"username": "alice123", "email": "alice@example.com"}}
users_by_username = {u["username"]: u for u in users_by_id.values()}

saved_name, saved_id = "alice123", 7          # stored by some other part of the program
users_by_id[7]["username"] = "alice"          # Alice renames her account
users_by_username = {u["username"]: u for u in users_by_id.values()}

print("by id:      ", users_by_id[saved_id]["email"])
print("by username:", users_by_username.get(saved_name, "KeyError: user not found"))`,
  catchOut5: `by id:       alice@example.com
by username: KeyError: user not found`,
  workflowYaml: `name: AI PR Review

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write

jobs:
  review:
    # Do not use repository secrets on PRs from forks, to avoid leaking them
    if: github.event.pull_request.head.repo.full_name == github.repository
    runs-on: ubuntu-latest

    steps:
      - name: Checkout base repository
        uses: actions/checkout@v4
        with:
          ref: \${{ github.event.pull_request.base.sha }}
          persist-credentials: false

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install dependencies
        run: pip install requests

      - name: Run review
        env:
          MIMO_BASE_URL: \${{ secrets.MIMO_BASE_URL }}
          MIMO_API_KEY: \${{ secrets.MIMO_API_KEY }}
          MIMO_MODEL: \${{ secrets.MIMO_MODEL }}
          GITHUB_TOKEN: \${{ github.token }}
          REPO: \${{ github.repository }}
          PR_NUMBER: \${{ github.event.pull_request.number }}
          PR_HEAD_SHA: \${{ github.event.pull_request.head.sha }}
        run: python .github/scripts/mimo_review.py`,
  reviewer: `import json

CHECKLIST = ["Logic and correctness", "Readability", "Performance", "Security", "Best practices"]


def should_run(event, repository):
    """The workflow's \`if:\` line."""
    return event["pull_request"]["head"]["repo"]["full_name"] == repository


def build_prompt(diff):
    return ("You are a code reviewer. Check the added lines for: " + ", ".join(CHECKLIST)
            + ". Reply with a JSON list of {line, category, severity, comment}.\\n\\n" + diff)


def fake_llm(prompt):
    """Stand-in for the model: pattern rules from the slides' five examples."""
    rules = [
        (' is "', "Logic and correctness", "High", "Use == to compare strings, not \`is\`."),
        ("eval(", "Security", "High", "eval runs arbitrary code; use ast.literal_eval."),
        ("users_by_username[", "Best practices", "Low", "Look users up by user_id."),
    ]
    diff = prompt.split("\\n\\n", 1)[1]
    found = []
    for n, line in enumerate(diff.splitlines(), 1):
        for pattern, category, severity, comment in rules:
            if line.startswith("+") and pattern in line:
                found.append({"line": n, "category": category,
                              "severity": severity, "comment": comment})
    return json.dumps(found)


def review(diff, llm):
    comments = json.loads(llm(build_prompt(diff)))
    body = [f"AI review: {len(comments)} comment(s)"]
    body += [f"- line {c['line']} [{c['severity']}] {c['category']}: {c['comment']}"
             for c in comments]
    return "\\n".join(body)


diff = """+def handle(status, user_input):
+    if status is "ok":
+        config = eval(user_input)
+        return config
+    return None"""

event = {"pull_request": {"head": {"repo": {"full_name": "team/app"}}}}
fork = {"pull_request": {"head": {"repo": {"full_name": "stranger/app"}}}}
for e in (event, fork):
    if should_run(e, "team/app"):
        print(review(diff, fake_llm))
    else:
        print("skipped: PR from a fork")`,
  reviewOut: `AI review: 2 comment(s)
- line 2 [High] Logic and correctness: Use == to compare strings, not \`is\`.
- line 3 [High] Security: eval runs arbitrary code; use ast.literal_eval.
skipped: PR from a fork`,
  reviewApi: `import os
import requests

reply = requests.post(
    f"{os.environ['MIMO_BASE_URL']}/chat/completions",
    headers={"Authorization": f"Bearer {os.environ['MIMO_API_KEY']}"},
    json={"model": os.environ["MIMO_MODEL"],
          "messages": [{"role": "user", "content": build_prompt(diff)}]},
).json()["choices"][0]["message"]["content"]

requests.post(
    f"https://api.github.com/repos/{os.environ['REPO']}/issues/{os.environ['PR_NUMBER']}/comments",
    headers={"Authorization": f"Bearer {os.environ['GITHUB_TOKEN']}"},
    json={"body": reply},
)`,
  ex2: `class SafeWorktree(Worktree):
    def __init__(self, repo, path, branch, start=None):
        in_use = getattr(repo, "checked_out", set())
        if branch in in_use:
            raise ValueError(f"'{branch}' is already checked out")
        super().__init__(repo, path, branch, start)
        repo.checked_out = in_use | {branch}


repo2 = Repo({"app.py": "v1"})
SafeWorktree(repo2, "repo", "main")
SafeWorktree(repo2, "../worktree-fix", "fix", start="main")
try:
    SafeWorktree(repo2, "../another-fix", "fix")
except ValueError as e:
    print("refused:", e)`,
  ex2Out: `refused: 'fix' is already checked out`,
  ex3: `def fake_llm_perf(prompt):
    found = json.loads(fake_llm(prompt))
    lines = prompt.split("\\n\\n", 1)[1].splitlines()
    for n, line in enumerate(lines, 1):
        inside_loop = any(prev.lstrip("+ ").startswith("for ") for prev in lines[:n - 1])
        if line.startswith("+") and " in big_list" in line and inside_loop:
            found.append({"line": n, "category": "Performance", "severity": "Medium",
                          "comment": "Repeated list lookups; build a set once."})
    return json.dumps(found)


slow = """+for user in users:
+    if user in big_list:
+        process(user)"""
print(review(slow, fake_llm_perf))`,
  ex3Out: `AI review: 1 comment(s)
- line 2 [Medium] Performance: Repeated list lookups; build a set once.`,
  reviewDiff: `+def handle(status, user_input):
+    if status is "ok":
+        config = eval(user_input)
+        return config
+    return None`,
};

// Small helpers shared by the steppers below.
const tagS = (t, style = "") => `<span class="tag" style="${style}">${esc(t)}</span>`;
function stepControls(prefix) {
  return `<div class="controls"><button class="cbtn ${prefix}-reset">⟲ Reset</button><button class="cbtn ${prefix}-back">◀ Back</button>
    <button class="cbtn ${prefix}-step on">Step ▶</button><button class="cbtn ${prefix}-play">Play</button>
    <span class="spacer"></span><span class="counter ${prefix}-count"></span></div>`;
}
// Wires Reset/Back/Step/Play and ← → keys to a render(i) function over n steps.
function wireStepper(el, prefix, n, render, { mini = false, ms = 1100 } = {}) {
  if (el._stopStepper) el._stopStepper();   // a re-mount replaces the previous stepper
  let i = 0, timer = null;
  const $ = (q) => el.querySelector(q);
  function draw() {
    render(i);
    if (mini) return;
    $(`.${prefix}-count`).textContent = `step ${i + 1} / ${n}`;
    $(`.${prefix}-back`).disabled = $(`.${prefix}-reset`).disabled = i === 0;
    $(`.${prefix}-step`).disabled = i === n - 1;
  }
  function stop() { clearInterval(timer); timer = null; if (!mini) $(`.${prefix}-play`).textContent = "Play"; }
  el._stopStepper = stop;
  function play() {
    if (timer) return stop();
    if (i === n - 1) i = 0;
    if (!mini) $(`.${prefix}-play`).textContent = "Pause";
    timer = setInterval(() => {
      if (!el.isConnected) return stop();
      if (i < n - 1) i++; else if (mini) i = 0; else return stop();
      draw();
    }, ms);
  }
  if (!mini) {
    $(`.${prefix}-reset`).onclick = () => { stop(); i = 0; draw(); };
    $(`.${prefix}-back`).onclick = () => { stop(); if (i) i--; draw(); };
    $(`.${prefix}-step`).onclick = () => { stop(); if (i < n - 1) i++; draw(); };
    $(`.${prefix}-play`).onclick = play;
    el.tabIndex = 0;
    if (!el._keys) {
      el._keys = true;
      el.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); $(`.${prefix}-step`).click(); }
        if (e.key === "ArrowLeft") { e.preventDefault(); $(`.${prefix}-back`).click(); }
      });
    }
  }
  draw();
  if (mini) play();
  return { reset: () => { stop(); i = 0; draw(); } };
}

// ---------- 1 Teams and agents (slides 6–7) ----------

// Illustrative: what four agents write for "add input validation", with and without a shared rule.
const TEAM = [
  ["Alice", "raise ValueError(\"bad city\")"],
  ["Bob", "return -1  # error code"],
  ["Chen", "print(\"bad city\"); continue"],
  ["Dana", "assert city, \"bad city\""],
];
const SHARED_RULE = "Validate inputs by raising ValueError.";

function teamSVG(k, shared, mini) {
  const W = 640, H = 300;
  let g = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="four teammates, four agents, one code base">
    <defs><marker id="ta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="var(--stone)"/></marker></defs>`;
  TEAM.forEach(([name], j) => {
    const y = 30 + j * 65, on = j < k, cur = j === k - 1;
    g += `<circle cx="40" cy="${y + 15}" r="15" fill="var(--green-soft)" stroke="var(--green)"/>
      <text x="40" y="${y + 50}" text-anchor="middle" font-size="11" fill="var(--ink)">${name}</text>
      <path d="M 60 ${y + 15} L 150 ${y + 15}" stroke="var(--stone)" stroke-width="1.3" marker-end="url(#ta)"/>
      <rect x="155" y="${y}" width="70" height="30" rx="8" fill="var(--teal-soft)" stroke="${cur ? "var(--amber)" : "var(--teal)"}" stroke-width="${cur ? 2.5 : 1.3}"/>
      <text x="190" y="${y + 19}" text-anchor="middle" font-size="12" fill="var(--ink)">agent</text>
      <path d="M 228 ${y + 15} L 420 150" stroke="${on ? "var(--teal)" : "var(--line)"}" stroke-width="${on ? 1.8 : 1.2}" marker-end="url(#ta)"/>`;
  });
  if (shared) {
    g += `<rect x="250" y="${H - 30}" width="150" height="24" rx="6" fill="var(--mark)" stroke="var(--amber)"/>
      <text x="325" y="${H - 14}" text-anchor="middle" font-size="11" fill="var(--ink)">AGENTS.md (shared)</text>`;
    TEAM.forEach((_, j) => { g += `<path d="M 300 ${H - 30} L 195 ${62 + j * 65}" stroke="var(--amber)" stroke-dasharray="3 3" stroke-width="1"/>`; });
  }
  g += `<rect x="425" y="95" width="200" height="${mini ? 110 : 120}" rx="8" fill="var(--card)" stroke="var(--line)"/>
    <text x="525" y="114" text-anchor="middle" font-size="12" font-weight="600" fill="var(--ink)">one code base</text>`;
  TEAM.slice(0, k).forEach(([, code], j) => {
    const line = shared ? "raise ValueError(\"bad city\")" : code;
    g += `<text x="435" y="${136 + j * 20}" font-size="10.5" font-family="var(--mono)" fill="var(--ink-2)">${esc(line)}</text>`;
  });
  return g + `</svg>`;
}

function demoTeam(el, { mini = false } = {}) {
  let shared = false;
  el.innerHTML = `${mini ? "" : `<div class="controls" style="margin-top:0"><label><input type="checkbox" class="tm-shared"> share one AGENTS.md</label></div>`}
    <div class="svgbox tm-svg"></div>${mini ? "" : `<div class="msg tm-msg"></div>${stepControls("tm")}
    <p class="hint">Illustrative: the four code lines are made up to show the idea of slides 6–7, not taken from the slides.</p>`}`;
  const n = TEAM.length + 1;
  const ctl = wireStepper(el, "tm", n, (i) => {
    const sh = mini ? Math.floor(Date.now() / 6000) % 2 === 1 : shared;
    el.querySelector(".tm-svg").innerHTML = teamSVG(i, sh, mini);
    if (mini) return;
    const m = el.querySelector(".tm-msg");
    if (i === 0) { m.className = "msg tm-msg"; m.innerHTML = `Task for everyone: <em>add input validation</em>. Step to send each teammate's agent to work.`; return; }
    const [name] = TEAM[i - 1];
    if (i < n - 1) { m.className = "msg tm-msg"; m.innerHTML = `${name}'s agent writes its change${shared ? `, following the shared rule <em>“${SHARED_RULE}”</em>` : " in its own style"}.`; return; }
    const styles = shared ? 1 : TEAM.length;
    m.className = "msg tm-msg " + (shared ? "good" : "bad");
    m.innerHTML = shared ? `One style across the code base: every agent read the same <code>AGENTS.md</code>.`
      : `${styles} different error-handling styles in one code base. Each change looks fine alone. Tick <b>share one AGENTS.md</b> and replay.`;
  }, { mini, ms: mini ? 1200 : 1100 });
  if (!mini) el.querySelector(".tm-shared").onchange = (e) => { shared = e.target.checked; ctl.reset(); };
}

// ---------- 2 AGENTS.md precedence (JS twin of rules_for in the notes) ----------

function demoRules(el) {
  const ROOT = { evidence: "Run targeted checks and report exact commands.", diffs: "Keep diffs minimal." };
  const DEEP = { evidence: "Regenerate the parser, then run the parser tests." };
  const PATHS = ["README.md", "pkg/parser/parser.y", "pkg/parser/lexer.go", "pkg/planner/core.go"];
  el.innerHTML = `<div class="controls" style="margin-top:0">${PATHS.map((p, k) => `<button class="cbtn ${k === 1 ? "on" : ""}" data-p="${p}">${p}</button>`).join("")}</div>
    <div class="controls"><label><input type="checkbox" class="ru-deep" checked> pkg/parser/AGENTS.md exists</label></div>
    <div style="display:grid;grid-template-columns:minmax(0,1fr);gap:12px;margin-top:10px">
      <div><div class="counter">REPOSITORY</div><div class="ru-tree" style="font:12.5px var(--mono);line-height:1.7;margin-top:4px"></div></div>
      <div><div class="counter">rules_for(path) prints</div><div class="console ru-out"></div></div></div>
    <div class="msg ru-msg"></div>`;
  let path = PATHS[1];
  const $ = (q) => el.querySelector(q);
  function render() {
    const deep = $(".ru-deep").checked;
    const md = { ".": ROOT };
    if (deep) md["pkg/parser"] = DEEP;
    const parts = path.split("/").slice(0, -1);
    const folders = ["."].concat(parts.map((_, k) => parts.slice(0, k + 1).join("/")));
    const rules = {}, used = [];
    folders.forEach((f) => { if (md[f]) { Object.assign(rules, md[f]); used.push(f + "/AGENTS.md"); } });
    const lines = [`${path} <- ${used.join(", ")}`].concat(Object.entries(rules).map(([k, v]) => `    ${k}: ${v}`));
    $(".ru-out").textContent = lines.join("\n");
    const onPath = (f) => folders.includes(f);
    const row = (indent, txt, hl, kind) => `<div style="padding-left:${indent * 16}px;${hl ? "background:var(--mark);border-radius:4px" : ""}">${kind === "md" ? "📄" : kind === "dir" ? "📁" : "·"} ${esc(txt)}</div>`;
    $(".ru-tree").innerHTML = row(0, "AGENTS.md", used.includes("./AGENTS.md"), "md") + row(0, "README.md", path === "README.md") +
      row(0, "pkg/", onPath("pkg"), "dir") + row(1, "parser/", onPath("pkg/parser"), "dir") +
      (deep ? row(2, "AGENTS.md", used.includes("pkg/parser/AGENTS.md"), "md") : "") +
      row(2, "parser.y", path.endsWith("parser.y")) + row(2, "lexer.go", path.endsWith("lexer.go")) +
      row(1, "planner/", onPath("pkg/planner"), "dir") + row(2, "core.go", path.endsWith("core.go"));
    const over = used.length > 1;
    $(".ru-msg").className = "msg ru-msg" + (over ? " good" : "");
    $(".ru-msg").innerHTML = over ? `Two files apply. The deeper one is merged last, so its <code>evidence</code> rule wins for everything under <code>pkg/parser/</code>; <code>diffs</code> still comes from the root.`
      : `Only the root <code>AGENTS.md</code> applies: its rules are the repository-wide defaults.`;
    el.querySelectorAll("[data-p]").forEach((b) => b.classList.toggle("on", b.dataset.p === path));
  }
  el.querySelectorAll("[data-p]").forEach((b) => { b.onclick = () => { path = b.dataset.p; render(); }; });
  $(".ru-deep").onchange = render;
  render();
}

// ---------- 3 git worktree (replays the toy model in the notes) ----------

const WT_STEPS = [
  { code: `repo = Repo({"app.py": "v1"})\nmain = Worktree(repo, "repo", "main")`, msg: "One repository, one worktree: <code>main</code> at c0." },
  { code: `fix = Worktree(repo, "../worktree-fix", "fix", start="main")`, msg: "Like <code>git worktree add -b fix ../worktree-fix main</code>: a new branch <code>fix</code> at c0, checked out in a new folder." },
  { code: `auth = Worktree(repo, ".claude/worktrees/feature-auth", "worktree-feature-auth", start="main")`, msg: "Like <code>claude --worktree feature-auth</code>: branch <code>worktree-feature-auth</code> under <code>.claude/worktrees/</code>." },
  { code: `fix.write("app.py", "v1 + bug fix")`, msg: "Agent 1 edits <code>app.py</code> in its own working directory. Nobody else sees it." },
  { code: `auth.write("auth.py", "OAuth2 login")`, msg: "Agent 2, at the same time, adds <code>auth.py</code> in its own folder." },
  { code: `for wt in (main, fix, auth): print(...)`, msg: "Three different file states. <b>Current file state is isolated.</b>", out: 0 },
  { code: `fix.add("app.py")\nprint("fix commits", fix.commit("fix: handle missing city"))`, msg: "Stage and commit in <code>fix</code>: a new object c1 in the <b>shared</b> database; the shared ref <code>fix</code> moves.", out: 1 },
  { code: `auth.add("auth.py")\nprint("auth commits", auth.commit("feat(auth): add OAuth2 login"))`, msg: "Agent 2 commits c2 on its branch. No conflict: different branches, different folders.", out: 2 },
  { code: `print("refs:", repo.refs)\nprint("seen from main:", repo.log("fix"))\nprint("main's files:", main.files)`, msg: "From <code>main</code> the new history is already visible (shared refs), but main's files are unchanged until a merge.", out: 3 },
];

function wtState(i) {
  const objects = { c0: { files: { "app.py": "v1" }, parent: null, msg: "initial" } };
  const refs = { main: "c0" };
  const wts = [{ path: "repo", head: "main", files: { "app.py": "v1" }, index: { "app.py": "v1" } }];
  const mk = (path, head) => { refs[head] = refs.main; wts.push({ path, head, files: { "app.py": "v1" }, index: { "app.py": "v1" } }); };
  const commit = (wt, msg) => { const cid = `c${Object.keys(objects).length}`; objects[cid] = { files: { ...wt.index }, parent: refs[wt.head], msg }; refs[wt.head] = cid; };
  if (i >= 1) mk("../worktree-fix", "fix");
  if (i >= 2) mk(".claude/worktrees/feature-auth", "worktree-feature-auth");
  if (i >= 3) wts[1].files["app.py"] = "v1 + bug fix";
  if (i >= 4) wts[2].files["auth.py"] = "OAuth2 login";
  if (i >= 6) { wts[1].index["app.py"] = wts[1].files["app.py"]; commit(wts[1], "fix: handle missing city"); }
  if (i >= 7) { wts[2].index["auth.py"] = wts[2].files["auth.py"]; commit(wts[2], "feat(auth): add OAuth2 login"); }
  return { objects, refs, wts };
}

function demoWorktree(el, { mini = false } = {}) {
  el.innerHTML = `${mini ? "" : `<div class="counter">PYTHON</div><div class="wt-code"></div>`}
    <div class="frame" style="margin-top:8px;box-shadow:inset 3px 0 0 var(--amber)"><span class="fname">shared</span> <span class="vars">object database + refs</span><div class="wt-shared" style="font:12px var(--mono);margin-top:4px"></div></div>
    <div class="wt-trees" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;margin-top:8px"></div>
    ${mini ? "" : `<div class="msg wt-msg"></div><div class="counter" style="margin-top:10px">what the program prints</div><div class="console wt-out"></div>${stepControls("wt")}`}`;
  const OUTS = [CODE.wtOut1, CODE.wtOut2.split("\n").slice(0, 1).join("\n"), CODE.wtOut2.split("\n").slice(1, 2).join("\n"), CODE.wtOut2.split("\n").slice(2).join("\n")];
  wireStepper(el, "wt", WT_STEPS.length, (i) => {
    const st = wtState(i), s = WT_STEPS[i];
    const show = (o) => esc(JSON.stringify(o).replace(/"/g, "'").replace(/,/g, ", ").replace(/:/g, ": "));
    el.querySelector(".wt-shared").innerHTML = `objects: ${Object.entries(st.objects).map(([k, v]) => `<b>${k}</b> “${esc(v.msg)}”`).join(" · ")}<br>refs: ${show(st.refs)}`;
    el.querySelector(".wt-trees").innerHTML = st.wts.map((w, k) => `<div class="frame ${(i === k && i <= 2) || (i === 3 && k === 1) || (i === 4 && k === 2) || (i === 6 && k === 1) || (i === 7 && k === 2) ? "top" : ""}" style="font-size:12px;overflow-wrap:anywhere;min-width:0">
      <span class="fname">${esc(w.path)}</span><div class="status">HEAD → ${esc(w.head)}</div>
      <div>files: <span class="mono">${show(w.files)}</span></div><div class="vars">index: <span class="mono">${show(w.index)}</span></div></div>`).join("");
    if (mini) return;
    el.querySelector(".wt-code").innerHTML = codeBlock(s.code, "repl");
    el.querySelector(".wt-msg").innerHTML = s.msg;
    el.querySelector(".wt-out").textContent = WT_STEPS.slice(0, i + 1).filter((x) => x.out !== undefined).map((x) => OUTS[x.out]).join("\n");
  }, { mini, ms: mini ? 1500 : 1100 });
}

// ---------- 4 Results: git vs scn (slide 26) ----------

const RESULTS = {
  "Developer environments": [["Pull latest", 87, 3.5, "×25"], ["Checkout", 15, 1.1, "×14"], ["Rebase", 13, 2.7, "×4.8"], ["Status", 3.9, 0.019, "×207"], ["Commit", 1.4, 1.1, "×1.3"], ["Diff", 0.407, 0.067, "×6.1"]],
  "Agent environments": [["New worktree", 426, 5.1, "×84"], ["Pull latest", 180, 9.0, "×20", "3.0 min", "9.0 s"], ["Commit", 18, 0.761, "×24"], ["Status", 4.3, 0.2, "×20+"]],
};
const fmtT = (s) => s >= 60 ? `${(s / 60).toFixed(1)} min` : s < 1 ? `${Math.round(s * 1000)} ms` : `${s} s`;

function demoResults(el, { mini = false } = {}) {
  let env = mini ? "Agent environments" : "Developer environments", scale = "lin";
  el.innerHTML = `${mini ? "" : `<div class="controls" style="margin-top:0">${Object.keys(RESULTS).map((k) => `<button class="cbtn" data-env="${k}">${k}</button>`).join("")}
      <span class="spacer"></span><label><input type="checkbox" class="rs-log"> log scale</label></div>`}
    <div class="svgbox rs-svg"></div>${mini ? "" : `<div class="msg rs-msg"></div><p class="hint">Times from slide 26 (Anthropic, <em>Redesigning source control</em>). Agent “Status” for scn is shown as 0.2 s; the slide says &lt;0.2 s.</p>`}`;
  function render() {
    const rows = RESULTS[env];
    const W = 640, rowH = 46, H = rows.length * rowH + 30, x0 = 120, maxW = W - x0 - 110;
    const max = Math.max(...rows.map((r) => r[1]));
    const len = (v) => scale === "log" ? Math.max(2, maxW * (Math.log10(v * 1000) / Math.log10(max * 1000))) : Math.max(2, maxW * v / max);
    let g = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="git vs scn timings">
      <rect x="${x0}" y="4" width="10" height="10" fill="var(--stone)"/><text x="${x0 + 14}" y="13" font-size="11" fill="var(--ink-2)">git</text>
      <rect x="${x0 + 50}" y="4" width="10" height="10" fill="var(--amber)"/><text x="${x0 + 64}" y="13" font-size="11" fill="var(--ink-2)">scn</text>`;
    rows.forEach((row, k) => {
      const [name, git, scn, fast] = row;
      const y = 26 + k * rowH;
      g += `<text x="${x0 - 8}" y="${y + 20}" text-anchor="end" font-size="12" fill="var(--ink)">${name}</text>
        <rect x="${x0}" y="${y + 4}" width="${len(git)}" height="14" rx="3" fill="var(--stone)"/><text x="${x0 + len(git) + 4}" y="${y + 15}" font-size="11" fill="var(--ink-2)">${row[4] || fmtT(git)}</text>
        <rect x="${x0}" y="${y + 21}" width="${len(scn)}" height="14" rx="3" fill="var(--amber)"/><text x="${x0 + len(scn) + 4}" y="${y + 32}" font-size="11" fill="var(--ink-2)">${env.startsWith("Agent") && name === "Status" ? "&lt;0.2 s" : row[5] || fmtT(scn)}</text>
        <text x="${W - 8}" y="${y + 24}" text-anchor="end" font-size="13" font-weight="600" fill="var(--teal)">${fast}</text>`;
    });
    el.querySelector(".rs-svg").innerHTML = g + `</svg>`;
    if (mini) return;
    el.querySelectorAll("[data-env]").forEach((b) => b.classList.toggle("on", b.dataset.env === env));
    el.querySelector(".rs-msg").innerHTML = env.startsWith("Agent")
      ? `For agents the big win is <b>New worktree</b>: 7.1 minutes before an agent could start, now 5.1 s (×84).`
      : `For people, <b>Status</b> gains most (×207), and <b>Commit</b> least (×1.3). ${scale === "lin" ? "Tick <b>log scale</b> to see the short bars." : ""}`;
  }
  if (!mini) {
    el.querySelectorAll("[data-env]").forEach((b) => { b.onclick = () => { env = b.dataset.env; render(); }; });
    el.querySelector(".rs-log").onchange = (e) => { scale = e.target.checked ? "log" : "lin"; render(); };
  }
  render();
}

// ---------- 4 What to push: content-addressed storage (replays the notes' toy) ----------

const CAS_STEPS = [
  { cs: 1, path: "docs/guide.md", key: "4fd1739f", kind: "new", msg: "Changeset 1, <code>docs/guide.md</code>: hash the bytes → <code>4fd1739f</code>. Not stored yet, so compress and store it." },
  { cs: 1, path: "src/legacy.rs", key: "8687eab4", kind: "new", msg: "<code>src/legacy.rs</code> → <code>8687eab4</code>, a new blob." },
  { cs: 1, rec: "9178555b", msg: "Write the metadata record <code>9178555b</code> to “Spanner”: author, message, parents (none), file → hash." },
  { cs: 2, path: "docs/guide.md", key: "4fd1739f", kind: "dup", msg: "Changeset 2, <code>docs/guide.md</code>: same bytes, same hash <code>4fd1739f</code>. Already stored: <b>deduplicated</b>." },
  { cs: 2, path: "src/legacy.rs", key: "Deleted", kind: "del", msg: "<code>src/legacy.rs</code> is deleted: the record says so; no blob is touched." },
  { cs: 2, path: "tools/build.sh", key: "d9f1c1e6", kind: "new", msg: "<code>tools/build.sh</code> → <code>d9f1c1e6</code>, a new blob." },
  { cs: 2, rec: "45b78ca2", msg: "Record <code>45b78ca2</code>, parent <code>9178555b</code>. Two changesets, five file entries, <b>three blobs</b>." },
];

function demoStore(el) {
  el.innerHTML = `<div style="display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:12px">
      <div><div class="counter">“SPANNER” · metadata</div><div class="cs-meta" style="display:grid;gap:6px;margin-top:6px"></div></div>
      <div><div class="counter">“CLOUD STORAGE” · blobs by hash</div><div class="cs-blobs" style="display:grid;gap:6px;margin-top:6px"></div></div></div>
    <div class="msg cs-msg"></div><div class="counter" style="margin-top:10px">what the program prints</div><div class="console cs-out"></div>${stepControls("cs")}
    <p class="hint">Hashes are the first 8 hex digits of SHA-256, exactly as the toy in the notes prints them. The file contents are made up; the paths and message are the slides'.</p>`;
  const MSGS = { 1: "docs: add guide", 2: "scion-cache: serve blobs from the memory tier" };
  wireStepper(el, "cs", CAS_STEPS.length, (i) => {
    const done = CAS_STEPS.slice(0, i + 1), s = CAS_STEPS[i];
    const blobs = [];
    done.forEach((d) => { if (d.kind === "new") blobs.push(d.key); });
    el.querySelector(".cs-blobs").innerHTML = blobs.map((b) => `<div class="frame ${s.key === b ? (s.kind === "dup" ? "ret" : "top") : ""}" style="font:12px var(--mono)">${b}${s.key === b && s.kind === "dup" ? " ← reused" : ""}</div>`).join("");
    el.querySelector(".cs-meta").innerHTML = [1, 2].filter((c) => done.some((d) => d.cs === c)).map((c) => {
      const files = done.filter((d) => d.cs === c && d.path);
      const rec = done.find((d) => d.cs === c && d.rec);
      return `<div class="frame ${s.cs === c ? "top" : ""}" style="font-size:12px"><span class="fname">${rec ? rec.rec : "(building…)"}</span> <span class="vars">${esc(MSGS[c])}</span>
        <div class="status">author: Claude &lt;noreply@anthropic.com&gt; · parents: ${c === 2 ? "9178555b" : "—"}</div>
        ${files.map((f) => `<div class="mono">${f.path} → ${f.key}</div>`).join("")}</div>`;
    }).join("");
    el.querySelector(".cs-msg").innerHTML = s.msg;
    el.querySelector(".cs-msg").className = "msg cs-msg" + (s.kind === "dup" ? " good" : "");
    const out = CODE.casOut.split("\n");
    el.querySelector(".cs-out").textContent = i >= CAS_STEPS.length - 1 ? out.join("\n") : i >= 2 ? out[0] : "";
  });
}

// ---------- 5 Commit messages (JS twin of check_commit and trailers) ----------

const COMMIT_RE = /^(?:\S+ )?(feat|fix|docs|test|refactor|perf|chore)(\([\w-]+\))?: \S/;
function checkCommitJS(message) {
  const lines = message.split("\n");
  const problems = [];
  if (!COMMIT_RE.test(lines[0])) problems.push("header is not 'type(scope): summary'");
  if ([...lines[0]].length > 72) problems.push("header longer than 72 characters");
  if (lines.length > 1 && lines[1] !== "") problems.push("no blank line after the header");
  return problems.length ? problems : ["ok"];
}
function trailersJS(message) {
  const parts = message.trim().split("\n\n");
  const found = [];
  parts[parts.length - 1].split("\n").forEach((line) => {
    const k = line.indexOf(": ");
    if (k < 0) return;
    const key = line.slice(0, k);
    if (key.includes("-") && !key.includes(" ")) found.push([key, line.slice(k + 2)]);
  });
  return found;
}

function demoCommit(el) {
  const EX = {
    "✨ feat": "✨ feat(auth): add OAuth2 authentication support\n\nImplement OAuth2 flow to support third-party login providers.\nThis replaces the custom token-based authentication system.",
    "🐛 fix": "🐛 fix(api): handle null values in user profile endpoint\n\nPrevent crashes when user profile data contains null fields.\nFixes #123",
    "📝 docs": "📝 docs: update installation guide with Windows instructions\n\nAdd step-by-step instructions for Windows users including\nPowerShell-specific commands and common troubleshooting tips.",
    "strix #596": "test: add unit tests for config loader (strix/config/loader.py) (#596)\n\nCo-authored-by: Claude Opus 4.8 <noreply@anthropic.com>",
    "bad": "fixed stuff\nalso some cleanup",
  };
  el.innerHTML = `<div class="controls" style="margin-top:0">${Object.keys(EX).map((k) => `<button class="cbtn" data-ex="${esc(k)}">${esc(k)}</button>`).join("")}</div>
    <textarea class="cm-text" rows="6" spellcheck="false" style="width:100%;box-sizing:border-box;margin-top:8px;font:13px var(--mono);padding:8px;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--ink)"></textarea>
    <div class="stats cm-stats"></div><div class="msg cm-msg"></div>
    <p class="hint">Try adding a line <code>Co-authored-by: Your Agent &lt;bot@example.com&gt;</code> after a blank line. The checks are the notes' <code>check_commit</code> and <code>trailers</code>.</p>`;
  const $ = (q) => el.querySelector(q);
  function render() {
    const m = $(".cm-text").value;
    const res = checkCommitJS(m), tr = trailersJS(m);
    const head = m.split("\n")[0].match(/^(?:\S+ )?(\w+)(\(([\w-]+)\))?: /);
    $(".cm-stats").innerHTML = `<div class="stat"><small>type</small><b>${head ? esc(head[1]) : "—"}</b></div>
      <div class="stat"><small>scope</small><b>${head && head[3] ? esc(head[3]) : "—"}</b></div>
      <div class="stat"><small>header length</small><b>${[...m.split("\n")[0]].length}</b></div>
      <div class="stat ${tr.length ? "good" : ""}"><small>co-authors</small><b>${tr.filter(([k]) => k.toLowerCase() === "co-authored-by").length}</b></div>`;
    const ok = res[0] === "ok";
    $(".cm-msg").className = "msg cm-msg " + (ok ? "good" : "bad");
    const pyStr = (t) => t.includes("'") ? `"${t}"` : `'${t}'`;   // like Python's repr
    $(".cm-msg").innerHTML = `check_commit → ${esc("[" + res.map(pyStr).join(", ") + "]")}` +
      (tr.length ? `<br>trailers → ${tr.map(([k, v]) => `<code>${esc(k)}: ${esc(v)}</code>`).join(", ")}` : "");
    el.querySelectorAll("[data-ex]").forEach((b) => b.classList.toggle("on", EX[b.dataset.ex] === m));
  }
  el.querySelectorAll("[data-ex]").forEach((b) => { b.onclick = () => { $(".cm-text").value = EX[b.dataset.ex]; render(); }; });
  $(".cm-text").oninput = render;
  $(".cm-text").value = EX["strix #596"];
  render();
}

// ---------- 6 What to catch (slides 35–44) ----------

const CATCH = [
  ["Logic and correctness", "catchBad1", "catchRun1", "catchOut1", "`is` checks identity, not equality. A string built at run time is equal to \"ok\" but not the same object, so the buggy branch is silently skipped."],
  ["Readability", null, "catchRun2", "catchOut2", "Same 21 numbers either way: `and` already binds tighter than `or`. The helper's name and parentheses make the rule readable; a reviewer might still ask for a better name than is_valid."],
  ["Performance", null, "catchRun3", "catchOut3", "Each `in big_list` scans the list: 74,550 comparisons. Building a set once makes each lookup a hash probe: 50 comparisons, one per hit."],
  ["Security", "catchBad4", "catchRun4", "catchOut4", "eval would run the function call. literal_eval rejects anything that is not a literal, including the call (and also 1+2)."],
  ["Best practices", "catchBad5", "catchRun5", "catchOut5", "A username can change; an id cannot. The reference saved by username breaks after a rename."],
];

function demoCatch(el) {
  let cat = 0;
  el.innerHTML = `<div class="controls" style="margin-top:0">${CATCH.map((c, k) => `<button class="cbtn" data-c="${k}">${k + 1}. ${c[0]}</button>`).join("")}</div>
    <div class="ct-body" style="margin-top:8px"></div>${stepControls("ct")}`;
  const STAGES = ["the slide's code", "run it", "the reviewer's comment"];
  function mount() {
    el.querySelectorAll("[data-c]").forEach((b) => b.classList.toggle("on", +b.dataset.c === cat));
    const [name, bad, run, out, why] = CATCH[cat];
    wireStepper(el, "ct", 3, (i) => {
      let h = `<div class="counter">${name.toUpperCase()} · ${STAGES[i]}</div>`;
      h += codeBlock(CODE[bad || run]);
      if (i >= 1 && bad) h += `<div class="counter" style="margin-top:8px">a runnable check</div>` + codeBlock(CODE[run]);
      if (i >= 1) h += codeBlock(CODE[out], "out");
      if (i >= 2) h += `<div class="msg good">${esc(why).replace(/`([^`]+)`/g, "<code>$1</code>")}</div>`;
      el.querySelector(".ct-body").innerHTML = h;
    });
  }
  el.querySelectorAll("[data-c]").forEach((b) => { b.onclick = () => { cat = +b.dataset.c; mount(); }; });
  mount();
}

// ---------- 6 Hierarchy of needs (slide 45) ----------

const NEEDS = [
  ["Style", "Least important. Formatting and naming: linters and AI reviewers catch most of it."],
  ["Find Bugs", "Logic, performance and security slips in the lines that changed."],
  ["Design Discussion", "Is this the right structure? Will it fit what the team builds next?"],
  ["Correct Solution", "Does the change actually solve the problem it was made for?"],
  ["Mental Alignment", "Most important. Does the team understand and agree on what this change is for?"],
];

function demoPyramid(el, { mini = false } = {}) {
  el.innerHTML = `<div class="svgbox py-svg"></div>${mini ? "" : `<div class="msg py-msg"></div>${stepControls("py")}<p class="hint">Click a level, or step from the base up. Levels from slide 45 (Blake Smith); the one-line descriptions are ours.</p>`}`;
  function draw(i) {
    const lvl = 4 - i;   // step 0 = base (Mental Alignment)
    const W = 640, H = 276, top = 20, h = 46, cx = W / 2;
    let g = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="code review hierarchy of needs">`;
    NEEDS.forEach(([name], k) => {
      const y = top + k * h, w0 = 70 + k * 100, w1 = 70 + (k + 1) * 100;
      const on = k === lvl;
      g += `<polygon points="${cx - w0 / 2},${y} ${cx + w0 / 2},${y} ${cx + w1 / 2},${y + h} ${cx - w1 / 2},${y + h}" fill="${on ? "var(--mark)" : "var(--teal-soft)"}" stroke="${on ? "var(--amber)" : "var(--card)"}" stroke-width="${on ? 2.5 : 2}" data-k="${k}" style="cursor:pointer"/>
        <text x="${cx}" y="${y + 29}" text-anchor="middle" font-size="${13 + k}" fill="var(--ink)" pointer-events="none">${name}</text>`;
    });
    g += `<text x="${cx + 50}" y="${top + 12}" font-size="10" fill="var(--stone)">← least important (top)</text><text x="${cx}" y="${top + 5 * h + 16}" text-anchor="middle" font-size="10" fill="var(--stone)">most important (base)</text></svg>`;
    el.querySelector(".py-svg").innerHTML = g;
    if (mini) return;
    el.querySelector(".py-msg").innerHTML = `<b>${NEEDS[lvl][0]}</b> — ${NEEDS[lvl][1]}`;
    el.querySelectorAll("[data-k]").forEach((p) => { p.onclick = () => { const s = 4 - +p.dataset.k; jump(s); }; });
  }
  let jump = () => {};
  const ctl = wireStepper(el, "py", NEEDS.length, draw, { mini, ms: 1200 });
  if (!mini) {
    jump = (s) => { ctl.reset(); for (let k = 0; k < s; k++) el.querySelector(".py-step").click(); };
  }
}

// ---------- 7 The AI PR Review action (slide 53 + the toy reviewer) ----------

const ACTION_STEPS = [
  { lines: [3, 4, 5], msg: "A pull request is opened (or pushed to, or reopened): the workflow starts." },
  { lines: [7, 8, 9], msg: "The job's token may read the code and write PR comments. Nothing else." },
  { lines: [13, 14], gate: true, msg: "" },
  { lines: [18, 19, 20, 21, 22], msg: "Check out the <b>base</b> commit: the review script that runs is the team's, not code from the PR. Don't keep the token on disk." },
  { lines: [24, 25, 26, 27, 29, 30], msg: "Set up Python 3.12 and install <code>requests</code>." },
  { lines: [32, 33, 34, 35, 36, 37, 38, 39, 40, 41], review: true, msg: "Run <code>mimo_review.py</code> with the MiMo key from the repository's secrets and the PR's number and head commit. In the notes' toy, a fake LLM stands in for MiMo." },
  { lines: [], post: true, msg: "The script posts the review as a PR comment. A person still decides whether to merge." },
];

function demoAction(el) {
  let fork = false;
  el.innerHTML = `<div class="controls" style="margin-top:0"><span class="counter">PR comes from</span>
      <button class="cbtn on" data-f="0">team/app (same repo)</button><button class="cbtn" data-f="1">stranger/app (fork)</button></div>
    <div style="display:grid;grid-template-columns:minmax(0,1fr);gap:8px;margin-top:8px">
      <div class="ac-yaml" style="max-height:260px;overflow:auto;position:relative"></div>
      <div><div class="msg ac-msg" style="margin-top:0"></div><div class="counter" style="margin-top:10px">PR conversation</div><div class="console ac-out"></div>
      <div class="counter" style="margin-top:10px">the diff under review</div>${codeBlock(CODE.reviewDiff, "repl")}</div></div>
    ${stepControls("ac")}
    <p class="hint">The review text is the real output of the toy reviewer in the notes (two rule-based comments); a real model's comments would differ.</p>`;
  function mount() {
    el.querySelectorAll("[data-f]").forEach((b) => b.classList.toggle("on", !!+b.dataset.f === fork));
    const n = fork ? 3 : ACTION_STEPS.length;
    wireStepper(el, "ac", n, (i) => {
      const s = ACTION_STEPS[i];
      el.querySelector(".ac-yaml").innerHTML = codeBlock(CODE.workflowYaml, "py", s.lines);
      const hl = el.querySelector(".ac-yaml .hl");
      if (hl) el.querySelector(".ac-yaml").scrollTop = Math.max(0, hl.offsetTop - 40);
      const m = el.querySelector(".ac-msg");
      if (s.gate) {
        m.className = "msg ac-msg " + (fork ? "bad" : "good");
        m.innerHTML = fork ? "<code>head.repo.full_name</code> is <code>stranger/app</code> ≠ <code>team/app</code>: the job is <b>skipped</b>. A stranger's PR never runs with your secrets."
          : "<code>head.repo.full_name == github.repository</code> (<code>team/app</code>): the job runs.";
      } else { m.className = "msg ac-msg"; m.innerHTML = s.msg; }
      const out = el.querySelector(".ac-out");
      if (fork && i >= 2) out.textContent = CODE.reviewOut.split("\n").slice(-1)[0];
      else if (!fork && i >= 6) out.textContent = CODE.reviewOut.split("\n").slice(0, 3).join("\n");
      else out.textContent = "";
    });
  }
  el.querySelectorAll("[data-f]").forEach((b) => { b.onclick = () => { fork = !!+b.dataset.f; mount(); }; });
  mount();
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
  team: (el) => demoTeam(el),
  teamMini: (el) => demoTeam(el, { mini: true }),
  rules: (el) => demoRules(el),
  worktree: (el) => demoWorktree(el),
  worktreeMini: (el) => demoWorktree(el, { mini: true }),
  results: (el) => demoResults(el),
  resultsMini: (el) => demoResults(el, { mini: true }),
  store: (el) => demoStore(el),
  commit: (el) => demoCommit(el),
  catchIt: (el) => demoCatch(el),
  pyramid: (el) => demoPyramid(el),
  pyramidMini: (el) => demoPyramid(el, { mini: true }),
  action: (el) => demoAction(el),
  quiz: (el) => demoQuiz(el, QUIZ),
};
