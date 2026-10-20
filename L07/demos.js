// L07 demos. Code panels, outputs and slide texts are copied from csc4801/notes/L07-requirements-exercise.md
// (checked by csc4801/tools/check.py). The JS twins of verify(), missing(), analyze() and
// constitution_check() follow the Python rules line for line, so their printed output matches the notes.

const CODE = {
  ambiguity: `def reject_lt(balance, amount):
    """Reading 1: the balance is insufficient when it is less than the amount."""
    return balance < amount


def reject_le(balance, amount):
    """Reading 2: the balance is insufficient when it is not more than the amount."""
    return balance <= amount


print("balance amount  reading <  reading <=")
for balance, amount in [(50, 80), (80, 80), (100, 80)]:
    a, b = reject_lt(balance, amount), reject_le(balance, amount)
    flag = "   <- they disagree" if a != b else ""
    print(f"{balance:>7} {amount:>6}  {str(a):>9}  {str(b):>10}{flag}")`,
  gate: `GATE = [
    ("Library-First", "Is the feature implemented as a standalone library?"),
    ("TDD Strictly", "Are we prepared to write tests first and ensure they fail?"),
    ("Functional", "Are we using functional programming patterns in the design?"),
]


def constitution_check(answers):
    """The plan may go on only if every principle is answered yes."""
    failed = [name for name, _ in GATE if not answers.get(name)]
    for name, question in GATE:
        print(f"- [{'x' if answers.get(name) else ' '}] {question} ({name})")
    return "PASS" if not failed else "BLOCKED by " + ", ".join(failed)


print(constitution_check({"Library-First": True, "TDD Strictly": True, "Functional": True}))
print(constitution_check({"Library-First": True, "TDD Strictly": False, "Functional": True}))`,
  lint: `constitution_md = """# constitution.md

## Tech Stack
- Frontend: React + TypeScript
- Backend: Node.js + Express
- Database: PostgreSQL

## Principles
- Library-First: all features as standalone modules
- Test-Driven: every feature has tests before implementation
- API-First: define OpenAPI spec before coding

## Security
- No hardcoded credentials
- Input validation on all endpoints
- HTTPS only
"""

spec_md = """# spec.md

## Outcomes
- Students can search, filter, and register for courses
- Professors can manage course rosters
- Admins can configure registration periods

## Boundaries
In scope: Course search, registration, roster management
Out of scope: Payment processing, grades, attendance

## Constraints
- Must support 1000 concurrent users
- Registration period is configurable per semester
- No third-party auth (use university SSO)
"""

plan_md = """# plan.md

## Data Models
Course: { id, name, code, capacity, professor_id }
Student: { id, name, email, major }
Enrollment: { student_id, course_id, status }

## API Endpoints
GET  /api/courses?search=&major=
POST /api/courses/:id/register
GET  /api/professors/:id/roster

## Components
CourseSearch → CourseList → RegistrationForm
ProfessorDashboard → RosterView
"""

REQUIRED = {
    "constitution.md": ["tech stack", "principles", "security", "performance", "convention"],
    "spec.md": ["outcomes", "in scope", "out of scope", "constraints"],
    "plan.md": ["data model", "api", "component"],
}


def missing(name, text):
    """Which required topics does this file never mention?"""
    low = text.lower()
    return [topic for topic in REQUIRED[name] if topic not in low]


for name, text in [("constitution.md", constitution_md), ("spec.md", spec_md), ("plan.md", plan_md)]:
    gaps = missing(name, text)
    print(f"{name:16} {'ok' if not gaps else 'missing: ' + ', '.join(gaps)}")`,
  analyze: `outcomes = {
    "O1": "Students can search, filter, and register for courses",
    "O2": "Professors can manage course rosters",
    "O3": "Admins can configure registration periods",
}
endpoints = {
    "GET  /api/courses?search=&major=": ["O1"],
    "POST /api/courses/:id/register": ["O1"],
    "GET  /api/professors/:id/roster": ["O2"],
}


def analyze(outcomes, endpoints):
    for oid, text in outcomes.items():
        hits = [e for e, refs in endpoints.items() if oid in refs]
        print(f"{oid} {text}")
        print(f"   -> {', '.join(hits) if hits else 'GAP: no endpoint'}")
    covered = {o for refs in endpoints.values() for o in refs}
    return f"{len(covered)} / {len(outcomes)} outcomes have an endpoint"


print(analyze(outcomes, endpoints))`,
  verify: `reqs = {
    "REQ-1": "The system shall control all lights in the house.",
    "REQ-2": "The system shall respond to voice commands.",
    "REQ-3": "The system shall learn user preferences over time.",
    "REQ-4": "The system shall work without internet connection.",
    "REQ-5": "The system shall integrate with Alexa and Google Home.",
    "REQ-6": "The system shall be affordable (under $100).",
}

VAGUE = {
    "all lights": ("Ambiguity", "which lights? which protocols? how many?"),
    "voice commands": ("Ambiguity", "which commands? which languages?"),
    "learn user preferences": ("Unmeasurable", "how much? how fast?"),
    "affordable": ("Ambiguity", "affordable to whom?"),
    "secure": ("Ambiguity", "secure against what?"),
}
CONFLICTS = [("system shall work without internet", "alexa", "Alexa needs internet")]
MUST_MENTION = {
    "security": ("Incomplete", "no security requirement (what if someone hacks it?)"),
    "power outage": ("Missing", "what happens during a power outage?"),
}


def verify(reqs):
    """A toy verifier: it matches words. An LLM verifier reads meaning."""
    issues = []
    for rid, text in reqs.items():
        low = text.lower()
        for phrase, (kind, question) in VAGUE.items():
            if phrase in low:
                issues.append((kind, rid, f'"{phrase}": {question}'))
        if "test:" not in low:
            issues.append(("Untestable", rid, "no test given"))
    for a, b, why in CONFLICTS:
        ra = [r for r, t in reqs.items() if a in t.lower()]
        rb = [r for r, t in reqs.items() if b in t.lower()]
        if ra and rb:
            issues.append(("Conflict", f"{ra[0]} vs {rb[0]}", why))
    every = " ".join(reqs.values()).lower()
    for topic, (kind, question) in MUST_MENTION.items():
        if topic not in every:
            issues.append((kind, "-", question))
    return issues


for kind, where, what in verify(reqs):
    print(f"{kind:12} {where:14} {what}")`,
  loop: `round_2 = {
    "REQ-1": "The system shall turn on, turn off and dim up to 50 Zigbee bulbs. "
             "Test: switch and dim each of 50 bulbs.",
    "REQ-2": "The system shall carry out the 10 commands in Appendix A, spoken in English "
             "or Mandarin. Test: 100 recorded commands, at least 95 carried out.",
    "REQ-3": "After 14 days of use the system shall suggest a lighting schedule; the user "
             "can turn this off. Test: replay 14 days of logs, check the suggestion.",
    "REQ-4": "Light control and schedules shall work without internet connection. "
             "Test: unplug the router, repeat the REQ-1 test.",
    "REQ-5": "When online, the system shall integrate with Alexa and Google Home. "
             "Test: run the REQ-1 test from each assistant.",
    "REQ-6": "The system hardware + software total cost shall not exceed $100 USD at retail "
             "pricing as of the product launch date. Test: Bill of materials review, "
             "price verification.",
    "REQ-7": "After a power outage the system shall restore the last light states within "
             "60 seconds. Test: cut the power for 5 minutes.",
    "REQ-8": "The system shall be secure.",
}
round_3 = dict(round_2)
round_3["REQ-8"] = ("Remote access shall need a per-user password over TLS; security "
                    "updates ship within 30 days. Test: penetration test before launch.")


def verification_loop(versions):
    """write -> check -> fix -> re-check, one round per version."""
    for k, version in enumerate(versions, 1):
        issues = verify(version)
        print(f"round {k}: {len(version)} requirements, {len(issues)} issues")
        for kind, where, what in issues:
            print(f"   {kind:12} {where:6} {what}")


verification_loop([reqs, round_2, round_3])`,
  fast: `VAGUE["fast"] = ("Ambiguity", "how fast? in what unit?")
for kind, where, what in verify({"REQ-9": "The app shall be fast."}):
    print(kind, where, what)`,
};

const OUT = {
  ambiguity: `balance amount  reading <  reading <=
     50     80       True        True
     80     80      False        True   <- they disagree
    100     80      False       False`,
  gate: `- [x] Is the feature implemented as a standalone library? (Library-First)
- [x] Are we prepared to write tests first and ensure they fail? (TDD Strictly)
- [x] Are we using functional programming patterns in the design? (Functional)
PASS
- [x] Is the feature implemented as a standalone library? (Library-First)
- [ ] Are we prepared to write tests first and ensure they fail? (TDD Strictly)
- [x] Are we using functional programming patterns in the design? (Functional)
BLOCKED by TDD Strictly`,
  lint: `constitution.md  missing: performance, convention
spec.md          ok
plan.md          ok`,
  analyze: `O1 Students can search, filter, and register for courses
   -> GET  /api/courses?search=&major=, POST /api/courses/:id/register
O2 Professors can manage course rosters
   -> GET  /api/professors/:id/roster
O3 Admins can configure registration periods
   -> GAP: no endpoint
2 / 3 outcomes have an endpoint`,
  verify: `Ambiguity    REQ-1          "all lights": which lights? which protocols? how many?
Untestable   REQ-1          no test given
Ambiguity    REQ-2          "voice commands": which commands? which languages?
Untestable   REQ-2          no test given
Unmeasurable REQ-3          "learn user preferences": how much? how fast?
Untestable   REQ-3          no test given
Untestable   REQ-4          no test given
Untestable   REQ-5          no test given
Ambiguity    REQ-6          "affordable": affordable to whom?
Untestable   REQ-6          no test given
Conflict     REQ-4 vs REQ-5 Alexa needs internet
Incomplete   -              no security requirement (what if someone hacks it?)
Missing      -              what happens during a power outage?`,
  loop: `round 1: 6 requirements, 13 issues
   Ambiguity    REQ-1  "all lights": which lights? which protocols? how many?
   Untestable   REQ-1  no test given
   Ambiguity    REQ-2  "voice commands": which commands? which languages?
   Untestable   REQ-2  no test given
   Unmeasurable REQ-3  "learn user preferences": how much? how fast?
   Untestable   REQ-3  no test given
   Untestable   REQ-4  no test given
   Untestable   REQ-5  no test given
   Ambiguity    REQ-6  "affordable": affordable to whom?
   Untestable   REQ-6  no test given
   Conflict     REQ-4 vs REQ-5 Alexa needs internet
   Incomplete   -      no security requirement (what if someone hacks it?)
   Missing      -      what happens during a power outage?
round 2: 8 requirements, 3 issues
   Ambiguity    REQ-8  "secure": secure against what?
   Untestable   REQ-8  no test given
   Incomplete   -      no security requirement (what if someone hacks it?)
round 3: 8 requirements, 0 issues`,
  fast: `Ambiguity REQ-9 "fast": how fast? in what unit?
Untestable REQ-9 no test given
Incomplete - no security requirement (what if someone hacks it?)
Missing - what happens during a power outage?`,
};

const TXT = {
  constitutionPrompt: `/speckit.constitution This project follows a "Library-First" approach. All features
must be implemented as standalone libraries first. We use TDD strictly. We prefer
functional programming patterns.`,
  constitutionCheck: `## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [ ] Is the feature implemented as a standalone library? (Library-First)
- [ ] Are we prepared to write tests first and ensure they fail? (TDD Strictly)
- [ ] Are we using functional programming patterns in the design?`,
  specifyPrompt: `/speckit.specify Build an application that can help me organize my photos in separate
photo albums. Albums are grouped by date and can be re-organized by dragging and
dropping on the main page. Albums are never in other nested albums. Within each
album, photos are previewed in a tile-like interface.`,
  specChecklist: `## Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified`,
  planPrompt: `/speckit.plan The application uses Vite with minimal number of libraries. Use vanilla
HTML, CSS, and JavaScript as much as possible. Images are not uploaded anywhere
and metadata is stored in a local SQLite database.`,
  planMd: `# Implementation Plan: Photo Organizer
## Technical Context
**Language/Version**: JavaScript (ES6+), HTML5, CSS3, Node.js
**Primary Dependencies**: Vite, \`better-sqlite3\` (or equivalent Node SQLite library)
**Storage**: Local SQLite database for metadata. Local file system for images.
**Testing**: \`vitest\` (for TDD of library and UI)
**Target Platform**: Desktop web browser running against a local server
**Project Type**: Web Application with a local backend / library`,
  checklistMd: `# Unit Tests for Requirements: English
**Review Ownership**: This checklist is a reviewer-owned artifact. Items are left
unchecked for the reviewer to mark when satisfied.

## Requirement Completeness
- [ ] CHK001 - Are all primary user journeys (create/view albums, reorder albums,
      photo preview) documented? [Completeness, Spec §User Scenarios]
- [ ] CHK002 - Are edge cases (missing timestamps, large albums, offline reordering)
      explicitly defined? [Completeness, Spec §Edge Cases]
- [ ] CHK003 - Are non-functional requirements (performance targets for thumbnails)
      specified? [Completeness, Spec §Success Criteria]
- [ ] CHK004 - Is the fallback behavior for photos without timestamps specified and
      actionable? [Completeness, Spec §FR-006]

## Requirement Clarity
- [ ] CHK005 - Is the grouping granularity (by day) stated unambiguously and is
      alternative grouping noted as out-of-scope or a feature toggle? [Clarity, Spec §Assumptions]
- [ ] CHK006 - Is "reorder persists" quantified with a persistence scope (per-user,
      per-device, server)? [Clarity, Spec §FR-007]
- [ ] CHK007 - Are tile preview behavior and lazy-loading expectations described
      clearly enough to drive acceptance tests? [Clarity, Spec §User Story 4]`,
  tasksMd: `# Tasks: Photo Organizer
**Tests**: TDD is strict; tests MUST be written before implementation.
**Organization**: Tasks are grouped by user story to enable independent
implementation and testing of each story.

## Format: \`[ID] [P?] [Story] Description\`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

## Phase 1: Setup (Shared Infrastructure)
- [ ] T001 Create project structure per implementation plan (backend and frontend folders)
- [ ] T002 Initialize Node.js backend project and install better-sqlite3, express, cors
- [ ] T003 Initialize Vite frontend project with Vanilla JS template`,
  analyzeReport: `Specification Analysis Report — Organize Photo Albums
Artifacts analyzed: spec.md, plan.md, tasks.md
Constitution: .specify/memory/constitution.md (authoritative)

Summary metrics
- Total FRs found: 9 (FR-001 … FR-009)
- Total SCs found: 4 (SC-001 … SC-004)
- Total tasks: 24
- Requirements with ≥1 mapped task: 9 / 9 (100%) — see notes about partial coverage below
- Duplication findings: 0
- Ambiguity findings: 3
- Critical issues (constitution violations / blocking gaps): 2
- High-severity issues: 1

Notes on approach
- I mapped each FR / SC to tasks by keyword and by user-story labels in tasks.md.
- I treated constitution rules (MUST/SHOULD) as non-negotiable constraints; any
  deviation is flagged CRITICAL.
- This is read-only analysis; I did not modify any files.`,
  skills: `.agents/skills
├── speckit-agent-context-update
├── speckit-analyze
├── speckit-checklist
├── speckit-clarify
├── speckit-constitution
├── speckit-converge
├── speckit-implement
├── speckit-plan
├── speckit-specify
├── speckit-tasks
└── speckit-taskstoissues`,
  constitutionMd: `# constitution.md

## Tech Stack
- Frontend: React + TypeScript
- Backend: Node.js + Express
- Database: PostgreSQL

## Principles
- Library-First: all features as standalone modules
- Test-Driven: every feature has tests before implementation
- API-First: define OpenAPI spec before coding

## Security
- No hardcoded credentials
- Input validation on all endpoints
- HTTPS only`,
  specMd: `# spec.md

## Outcomes
- Students can search, filter, and register for courses
- Professors can manage course rosters
- Admins can configure registration periods

## Boundaries
In scope: Course search, registration, roster management
Out of scope: Payment processing, grades, attendance

## Constraints
- Must support 1000 concurrent users
- Registration period is configurable per semester
- No third-party auth (use university SSO)`,
  planSample: `# plan.md

## Data Models
Course: { id, name, code, capacity, professor_id }
Student: { id, name, email, major }
Enrollment: { student_id, course_id, status }

## API Endpoints
GET  /api/courses?search=&major=
POST /api/courses/:id/register
GET  /api/professors/:id/roster

## Components
CourseSearch → CourseList → RegistrationForm
ProfessorDashboard → RosterView`,
  smartHome: `REQ-1: The system shall control all lights in the house.
REQ-2: The system shall respond to voice commands.
REQ-3: The system shall learn user preferences over time.
REQ-4: The system shall work without internet connection.
REQ-5: The system shall integrate with Alexa and Google Home.
REQ-6: The system shall be affordable (under $100).`,
  rewriteReq6: `# Before (ambiguous)
REQ-6: The system shall be affordable (under $100).

# After (specific + testable)
REQ-6: The system hardware + software total cost
shall not exceed $100 USD at retail pricing
as of the product launch date.
Test: Bill of materials review, price verification.`,
  verifyPrompt: `Here are the requirements for a Smart Home Controller. List every issue you find.
For each, give the requirement ID, the category (ambiguity, conflict, missing,
unmeasurable, incomplete) and one question that would resolve it. Do not rewrite them.`,
  adminFix: `## Data Models
RegistrationPeriod: { id, semester, opens_at, closes_at }

## API Endpoints
PUT  /api/admin/semesters/:id/registration-period

## Components
AdminDashboard → RegistrationPeriodForm`,
};

// Text areas and small helpers shared by the demos below.
const TA = "width:100%;box-sizing:border-box;min-height:150px;font:13px/1.45 var(--mono);background:var(--code-bg);color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:10px;resize:vertical";
const pyBool = (b) => (b ? "True" : "False");
const store = {
  get(k) { try { return localStorage.getItem(`csc4801-L07-${k}`) || ""; } catch { return ""; } },
  set(k, v) { try { localStorage.setItem(`csc4801-L07-${k}`, v); } catch { /* storage unavailable */ } },
};
function stepControls(p) {
  return `<div class="controls"><button class="cbtn ${p}-reset">⟲ Reset</button><button class="cbtn ${p}-back">◀ Back</button>
    <button class="cbtn on ${p}-step">Step ▶</button><button class="cbtn ${p}-play">Play</button>
    <span class="spacer"></span><span class="counter ${p}-count"></span></div>`;
}
// A Reset / Back / Step / Play player over steps 0..last. render(i) draws step i.
function player(el, p, last, render, { mini = false, ms = 1100 } = {}) {
  let i = 0, timer = null;
  const $ = (q) => el.querySelector(q);
  function draw() {
    render(i);
    if (mini) return;
    $(`.${p}-count`).textContent = `step ${i} / ${last}`;
    $(`.${p}-back`).disabled = $(`.${p}-reset`).disabled = i === 0;
    $(`.${p}-step`).disabled = i === last;
  }
  function stop() { clearInterval(timer); timer = null; if (!mini) $(`.${p}-play`).textContent = "Play"; }
  function play() {
    if (timer) return stop();
    if (i === last) i = 0;
    if (!mini) $(`.${p}-play`).textContent = "Pause";
    timer = setInterval(() => {
      if (!el.isConnected) return stop();
      if (i < last) i++; else if (mini) i = 0; else return stop();
      draw();
    }, ms);
  }
  if (!mini) {
    $(`.${p}-reset`).onclick = () => { stop(); i = 0; draw(); };
    $(`.${p}-back`).onclick = () => { stop(); if (i) i--; draw(); };
    $(`.${p}-step`).onclick = () => { stop(); if (i < last) i++; draw(); };
    $(`.${p}-play`).onclick = play;
    el.tabIndex = 0;
    el.addEventListener("keydown", (e) => {
      if (e.target.closest("textarea,input,select")) return;
      if (e.key === "ArrowRight") { e.preventDefault(); $(`.${p}-step`).click(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); $(`.${p}-back`).click(); }
    });
  }
  draw();
  if (mini) play();
}

// ---------- 1. Ambiguity: two readings of one requirement ----------

const AMB_CASES = [[50, 80], [80, 80], [100, 80]];
const ambLine = (b, a) => {
  const x = b < a, y = b <= a;
  return `${String(b).padStart(7)} ${String(a).padStart(6)}  ${pyBool(x).padStart(9)}  ${pyBool(y).padStart(10)}${x !== y ? "   <- they disagree" : ""}`;
};

function demoAmbiguity(el, { mini = false } = {}) {
  el.innerHTML = `
    <div style="text-align:center;margin-bottom:8px"><span class="tag">requirement</span> <em>Insufficient user balance reject transactions.</em></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="am-a"></div><div class="am-b"></div></div>
    <div class="msg am-msg"></div>
    ${mini ? "" : `<div class="controls">
      <label>balance <input type="range" class="am-bal" min="0" max="150" step="10" value="80"> <b class="mono am-balv"></b></label>
      <label>amount <input type="range" class="am-amt" min="10" max="150" step="10" value="80"> <b class="mono am-amtv"></b></label></div>
    ${stepControls("am")}
    <div class="counter" style="margin-top:10px">what the program prints, one case per step</div><div class="console am-out"></div>`}`;
  const $ = (q) => el.querySelector(q);
  function show(b, a) {
    const card = (name, op, rej) => `<div class="frame ${rej ? "err" : "ret"}"><span class="fname">${name}</span> <span class="vars">reject if balance ${op} amount</span>
      <div class="status">${b} ${op} ${a} is ${pyBool(rej)} → ${rej ? "REJECT" : "accept"}</div></div>`;
    $(".am-a").innerHTML = card("Reading 1", "&lt;", b < a);
    $(".am-b").innerHTML = card("Reading 2", "&lt;=", b <= a);
    const differ = (b < a) !== (b <= a);
    $(".am-msg").className = "msg am-msg" + (differ ? " bad" : "");
    $(".am-msg").innerHTML = differ
      ? `Balance ${b}, amount ${a}: the two readings <b>disagree</b>. An agent has to pick one, and it will not ask.`
      : `Balance ${b}, amount ${a}: both readings agree. ${mini ? "" : "Try a balance equal to the amount."}`;
    if (!mini) { $(".am-bal").value = b; $(".am-amt").value = a; $(".am-balv").textContent = b; $(".am-amtv").textContent = a; }
  }
  if (!mini) {
    const free = () => show(+$(".am-bal").value, +$(".am-amt").value);
    $(".am-bal").oninput = free; $(".am-amt").oninput = free;
  }
  player(el, "am", AMB_CASES.length, (i) => {
    const [b, a] = i ? AMB_CASES[i - 1] : [80, 80];
    show(b, a);
    if (!mini) $(".am-out").textContent = ["balance amount  reading <  reading <=", ...AMB_CASES.slice(0, i).map(([x, y]) => ambLine(x, y))].join("\n");
  }, { mini, ms: 1600 });
}

// ---------- 2. The Spec Kit lifecycle ----------

const STAGES = ["Constitution", "Specify", "Plan", "Tasks", "Implement"];
const STAGE_GOAL = ["Set guardrails", "Define “What”", "Design “How”", "Atomic units", "Just do it"];
const SDD = [
  { name: "1 Constitution", stage: 0, cmd: "/speckit.constitution", files: [".specify/memory/constitution.md"],
    what: "Sets the principles for the project: tech stack and architecture, security and compliance, performance benchmarks. It stays in the project folder.",
    input: TXT.constitutionPrompt, out: TXT.constitutionCheck, outLabel: "each principle becomes a gate in .specify/templates/plan-template.md (slide 12)" },
  { name: "2 Specify", stage: 1, cmd: "/speckit.specify", files: ["spec.md", "checklists/requirements.md"],
    what: "Defines the What: outcomes, boundaries (in and out of scope), constraints. No languages or frameworks.",
    input: TXT.specifyPrompt, out: TXT.specChecklist, outLabel: "the spec quality checklist written with spec.md (slide 15)" },
  { name: "3 Plan", stage: 2, cmd: "/speckit.plan", files: ["plan.md", "data-model.md", "contracts/api.md", "research.md", "quickstart.md"],
    what: "Designs the How: data models, API contracts, component architecture, tech stack. The bridge between intent and code.",
    input: TXT.planPrompt, out: TXT.planMd, outLabel: "plan.md (slide 18, abridged)" },
  { name: "4 Checklist", stage: -1, cmd: "/speckit.checklist", files: [],
    what: "“Unit tests for your requirements”: is the spec complete, clear and consistent before the work is broken down? A reviewer ticks the boxes.",
    input: "", out: TXT.checklistMd, outLabel: "slide 20 (abridged)" },
  { name: "5 Tasks", stage: 3, cmd: "/speckit.tasks", files: ["tasks.md"],
    what: "Breaks the plan into atomic units: one testable change at a time, checked against the spec.",
    input: "", out: TXT.tasksMd, outLabel: "tasks.md (slide 22, abridged)" },
  { name: "6 Analyze", stage: -1, cmd: "/speckit.analyze", files: [],
    what: "Reports conflicts, gaps and ambiguities across spec.md, plan.md and tasks.md. Read-only: it changes no file.",
    input: "", out: TXT.analyzeReport, outLabel: "slide 25 (abridged)" },
  { name: "7 Implement", stage: 4, cmd: "/speckit.implement", files: ["…the code"],
    what: "The agent takes tasks.md and writes the code, one task at a time.",
    input: "", out: "", outLabel: "" },
];

function stageBar(active, checkStep) {
  return `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px">${STAGES.map((s, k) => {
    const on = k === active;
    return `<div style="flex:1 1 90px;padding:6px 8px;border-radius:6px;font-size:12.5px;border:1.5px solid ${on ? "var(--amber)" : "var(--line)"};background:${on ? "var(--mark)" : k < active ? "var(--teal-soft)" : "var(--card)"}">
      <b>${s}</b><br><span style="color:var(--ink-2)">${STAGE_GOAL[k]}</span></div>`;
  }).join("")}</div>${checkStep ? `<div class="msg" style="margin:0 0 8px">A check step between the stages: <b>${checkStep}</b></div>` : ""}`;
}

function demoLifecycle(el, { mini = false } = {}) {
  el.innerHTML = `<div class="lc-bar"></div><div class="lc-body"></div>${mini ? "" : stepControls("lc")}`;
  const $ = (q) => el.querySelector(q);
  player(el, "lc", SDD.length, (i) => {
    if (i === 0) {
      $(".lc-bar").innerHTML = stageBar(-1);
      $(".lc-body").innerHTML = `<div class="msg">The photo organizer from the slides, one Spec Kit command at a time. ${mini ? "" : "Press Step."}</div>`;
      return;
    }
    const s = SDD[i - 1];
    let stage = s.stage;
    if (stage < 0) stage = SDD.slice(0, i).filter((x) => x.stage >= 0).pop().stage;
    $(".lc-bar").innerHTML = stageBar(stage, s.stage < 0 ? s.name : "");
    const files = SDD.slice(0, i).flatMap((x) => x.files);
    if (mini) {
      $(".lc-body").innerHTML = `<div class="frame top"><span class="fname">${s.name}</span> <code>${s.cmd}</code><div class="status">${esc(s.what)}</div></div>`;
      return;
    }
    $(".lc-body").innerHTML = `<div class="frame top"><span class="fname">${s.name}</span> <code>${s.cmd}</code><div class="status">${esc(s.what)}</div></div>
      ${s.input ? `<div class="counter" style="margin-top:8px">you type</div>${codeBlock(s.input, "out")}` : ""}
      ${s.out ? `<div class="counter" style="margin-top:8px">${esc(s.outLabel)}</div><div style="max-height:260px;overflow:auto">${codeBlock(s.out, "out")}</div>` : ""}
      <div class="counter" style="margin-top:8px">feature folder so far</div>
      <div class="tags">${files.map((f) => `<span class="tag">${esc(f)}</span>`).join("") || "<span class='hint'>—</span>"}</div>`;
  }, { mini, ms: mini ? 1500 : 1800 });
}

// ---------- 2b. The constitution gate ----------

const GATE = [
  ["Library-First", "Is the feature implemented as a standalone library?"],
  ["TDD Strictly", "Are we prepared to write tests first and ensure they fail?"],
  ["Functional", "Are we using functional programming patterns in the design?"],
];
function gateRun(answers) {
  const lines = GATE.map(([n, q]) => `- [${answers[n] ? "x" : " "}] ${q} (${n})`);
  const failed = GATE.filter(([n]) => !answers[n]).map(([n]) => n);
  lines.push(failed.length ? "BLOCKED by " + failed.join(", ") : "PASS");
  return lines;
}

function demoGate(el) {
  el.innerHTML = `<p class="hint" style="margin-top:0">A plan for the photo organizer comes in. Tick what it does, then see whether it may go on.</p>
    <div class="controls" style="margin-top:0">${GATE.map(([n, q]) => `<label title="${q}"><input type="checkbox" class="gt" data-n="${n}" checked> ${n}</label>`).join("")}</div>
    <div class="controls"><button class="cbtn gt-ex1">Example 1: all yes</button><button class="cbtn gt-ex2">Example 2: no tests first</button><button class="cbtn on gt-both">Run both, as in the notes</button></div>
    <div class="console gt-out" style="margin-top:10px"></div><div class="msg gt-msg"></div>`;
  const $ = (q) => el.querySelector(q);
  const read = () => Object.fromEntries([...el.querySelectorAll(".gt")].map((c) => [c.dataset.n, c.checked]));
  const set = (a) => el.querySelectorAll(".gt").forEach((c) => { c.checked = a[c.dataset.n]; });
  function render(lines) {
    const last = lines[lines.length - 1];
    $(".gt-out").textContent = lines.join("\n");
    $(".gt-msg").className = "msg gt-msg " + (last === "PASS" ? "good" : "bad");
    $(".gt-msg").innerHTML = last === "PASS" ? "PASS: the plan goes on to research and design." : `${esc(last)}: fix the plan (or change the constitution) first.`;
  }
  el.querySelectorAll(".gt").forEach((c) => { c.onchange = () => render(gateRun(read())); });
  const EX1 = { "Library-First": true, "TDD Strictly": true, Functional: true };
  const EX2 = { "Library-First": true, "TDD Strictly": false, Functional: true };
  $(".gt-ex1").onclick = () => { set(EX1); render(gateRun(EX1)); };
  $(".gt-ex2").onclick = () => { set(EX2); render(gateRun(EX2)); };
  $(".gt-both").onclick = () => { set(EX2); render([...gateRun(EX1), ...gateRun(EX2)]); };
  render(gateRun(read()));
}

// ---------- 3. Checklist: unit tests for requirements ----------

const CHK = [
  ["CHK001", "Are all primary user journeys (create/view albums, reorder albums, photo preview) documented?", true,
    "Mostly yes: the prompt names albums, drag-and-drop reordering and tile previews."],
  ["CHK002", "Are edge cases (missing timestamps, large albums, offline reordering) explicitly defined?", false,
    "No: the prompt says nothing about photos without a date, very large albums or working offline."],
  ["CHK003", "Are non-functional requirements (performance targets for thumbnails) specified?", false,
    "No: there is no speed or size target at all."],
  ["CHK004", "Is the fallback behavior for photos without timestamps specified and actionable?", false,
    "No: albums are “grouped by date”, but a photo with no date has nowhere to go."],
  ["CHK005", "Is the grouping granularity (by day) stated unambiguously and is alternative grouping noted as out-of-scope or a feature toggle?", false,
    "No: “grouped by date” could mean by day, month or year."],
  ["CHK006", "Is “reorder persists” quantified with a persistence scope (per-user, per-device, server)?", false,
    "No: albums “can be re-organized”, but where is the new order saved?"],
  ["CHK007", "Are tile preview behavior and lazy-loading expectations described clearly enough to drive acceptance tests?", false,
    "No: “a tile-like interface” names a layout, nothing more."],
];

function demoChecklist(el, { mini = false } = {}) {
  if (mini) {
    el.innerHTML = `<div class="ck-list" style="display:grid;gap:5px"></div>`;
    player(el, "ck", CHK.length, (i) => {
      el.querySelector(".ck-list").innerHTML = CHK.map(([id, q, yes], k) => `<div class="frame ${k === i - 1 ? "top" : ""}" style="font-size:12px">
        <span class="mono">[${k < i ? (yes ? "x" : "!") : " "}]</span> <b>${id}</b> ${esc(q.length > 70 ? q.slice(0, 68) + "…" : q)}</div>`).join("");
    }, { mini: true, ms: 1000 });
    return;
  }
  let k = 0, right = 0, answered = [];
  el.innerHTML = `<p class="hint" style="margin-top:0">Read the one-paragraph <code>/speckit.specify</code> prompt (above). For each item of slide 20's checklist: does the prompt alone answer it?</p>
    <div class="ck-card"></div>
    <div class="controls"><button class="cbtn ck-yes">The prompt answers it</button><button class="cbtn ck-no">The prompt is silent</button>
      <span class="spacer"></span><button class="cbtn ck-reset">⟲ Start again</button><button class="cbtn on ck-next">Next ▶</button></div>
    <div class="msg ck-msg"></div><div class="tags ck-done" style="margin-top:8px"></div>
    <p class="hint">The answers are our reading of the prompt only. The full spec.md may answer more; the slides show only part of it.</p>`;
  const $ = (q) => el.querySelector(q);
  function render() {
    const [id, q] = CHK[k];
    $(".ck-card").innerHTML = `<div class="frame top"><span class="fname">${id}</span> <span class="counter">${k + 1} / ${CHK.length}</span><div style="margin-top:4px">${esc(q)}</div></div>`;
    const a = answered[k];
    $(".ck-yes").disabled = $(".ck-no").disabled = a !== undefined;
    $(".ck-next").disabled = a === undefined || k === CHK.length - 1;
    if (a === undefined) { $(".ck-msg").className = "msg ck-msg"; $(".ck-msg").textContent = "Your call?"; }
    else {
      const ok = a === CHK[k][2];
      $(".ck-msg").className = "msg ck-msg " + (ok ? "good" : "bad");
      $(".ck-msg").innerHTML = `${ok ? "Agreed." : "We read it differently."} ${esc(CHK[k][3])}`;
    }
    $(".ck-done").innerHTML = answered.map((x, j) => x === undefined ? "" : `<span class="tag" style="background:${x === CHK[j][2] ? "var(--green-soft)" : "var(--red-soft)"}">${CHK[j][0]}</span>`).join("") +
      (answered.filter((x) => x !== undefined).length === CHK.length ? ` <span class="counter">${right} / ${CHK.length} as we read it. Six of seven items are open: that is what the checklist is for.</span>` : "");
  }
  const answer = (yes) => { answered[k] = yes; if (yes === CHK[k][2]) right++; render(); };
  $(".ck-yes").onclick = () => answer(true);
  $(".ck-no").onclick = () => answer(false);
  $(".ck-next").onclick = () => { if (k < CHK.length - 1) k++; render(); };
  $(".ck-reset").onclick = () => { k = 0; right = 0; answered = []; render(); };
  render();
}

// ---------- 4. Guided exercise tasks: try, hints, sample answer ----------

const ROUNDS = [
  {
    "REQ-1": "The system shall control all lights in the house.",
    "REQ-2": "The system shall respond to voice commands.",
    "REQ-3": "The system shall learn user preferences over time.",
    "REQ-4": "The system shall work without internet connection.",
    "REQ-5": "The system shall integrate with Alexa and Google Home.",
    "REQ-6": "The system shall be affordable (under $100).",
  },
  {
    "REQ-1": "The system shall turn on, turn off and dim up to 50 Zigbee bulbs. Test: switch and dim each of 50 bulbs.",
    "REQ-2": "The system shall carry out the 10 commands in Appendix A, spoken in English or Mandarin. Test: 100 recorded commands, at least 95 carried out.",
    "REQ-3": "After 14 days of use the system shall suggest a lighting schedule; the user can turn this off. Test: replay 14 days of logs, check the suggestion.",
    "REQ-4": "Light control and schedules shall work without internet connection. Test: unplug the router, repeat the REQ-1 test.",
    "REQ-5": "When online, the system shall integrate with Alexa and Google Home. Test: run the REQ-1 test from each assistant.",
    "REQ-6": "The system hardware + software total cost shall not exceed $100 USD at retail pricing as of the product launch date. Test: Bill of materials review, price verification.",
    "REQ-7": "After a power outage the system shall restore the last light states within 60 seconds. Test: cut the power for 5 minutes.",
    "REQ-8": "The system shall be secure.",
  },
];
ROUNDS.push({ ...ROUNDS[1], "REQ-8": "Remote access shall need a per-user password over TLS; security updates ship within 30 days. Test: penetration test before launch." });
const reqText = (r) => Object.entries(r).map(([k, v]) => `${k}: ${v}`).join("\n");

const NOTES_ISSUES = `<p><b>Contradictions</b> (from the slide 34 speaker notes)</p><ol>
  <li><b>REQ-2 vs REQ-5.</b> Alexa and Google Home already provide voice control. Does the system need its own voice engine, or does it delegate to them?</li>
  <li><b>REQ-2/5 vs REQ-4.</b> Alexa and Google Home integrations typically need the internet; REQ-4 demands full offline operation. Offline voice recognition also needs processing power, which pulls against REQ-6.</li>
  <li><b>REQ-3 vs REQ-4/6.</b> Learning preferences implies machine learning; learning on the device (for offline mode) needs hardware that is hard to fit under $100.</li></ol>
  <p><b>Ambiguity</b></p><ol start="4">
  <li><b>REQ-1.</b> All lights of what kind? Which protocols (Zigbee, Z-Wave, Wi-Fi, Bluetooth)? On/off only, dimming, colour? How many at most?</li>
  <li><b>REQ-2.</b> Which languages and accents? Background noise? Accuracy and response time? Wake word or push-to-talk?</li>
  <li><b>REQ-3.</b> What counts as a preference? Over what time frame? Testable? Can the user opt out (privacy)?</li>
  <li><b>REQ-6.</b> $100 for the device alone, or the total cost of ownership (subscriptions, hubs, batteries)? Retail, bill-of-materials or street price?</li></ol>
  <p>Slide 35 adds two things that are <em>not there</em>: what happens during a power outage, and any security requirement.</p>`;

const GUIDED = {
  constitution: {
    file: "constitution.md", slide: 31,
    task: "Create a <code>constitution.md</code> for the course registration system. Include: technical stack &amp; architecture principles; security &amp; compliance standards; performance benchmarks; coding conventions.",
    hints: [
      "One heading per item in the task, so a reader can see at once what is missing.",
      "A principle should be something a plan can be checked against. “Test-Driven: every feature has tests before implementation” can be checked; “good code” cannot.",
      "A performance benchmark needs a number.",
    ],
    sample: () => `<p>The slides' sample:</p>${codeBlock(TXT.constitutionMd, "out")}<p>Compare it with the task: it has no performance benchmarks and no coding conventions. Check your own with the file checker below.</p>`,
  },
  spec: {
    file: "spec.md", slide: 32,
    task: "Using your extracted requirements, write <code>spec.md</code>. Define <b>outcomes</b> (what should the system achieve?), <b>boundaries</b> (in scope vs. out of scope) and <b>constraints</b> (technical limits, deadlines).",
    hints: [
      "Write the outcomes per user: students, professors, admins.",
      "Out of scope is as important as in scope: name what an agent might add on its own, such as payments or grades.",
      "Keep the tech stack out of the spec. It belongs in the constitution and the plan.",
    ],
    sample: () => `<p>The slides' sample:</p>${codeBlock(TXT.specMd, "out")}`,
  },
  plan: {
    file: "plan.md", slide: 33,
    task: "Bridge business intent to code: write <code>plan.md</code> with data models / schemas, API contracts / endpoints, component architecture, and the task breakdown.",
    hints: [
      "Every outcome in the spec should lead to at least one endpoint and one component.",
      "Every noun in the outcomes (course, student, roster, registration period) is a candidate data model.",
      "In Spec Kit the task breakdown is its own file, tasks.md (step 5).",
    ],
    sample: () => `<p>The slides' sample:</p>${codeBlock(TXT.planSample, "out")}<p>Now run the analysis below on it: one outcome has no endpoint.</p>`,
  },
  issues: {
    file: "my issues", slide: 34,
    task: `Read the requirements for a “Smart Home Controller”. Find as many issues as you can.${codeBlock(TXT.smartHome, "out")}`,
    hints: [
      "For each requirement ask: how would I test it? If you can't say, it is vague.",
      "Compare requirements in pairs. Can REQ-4 and REQ-5 both be true? REQ-2 and REQ-5?",
      "Ask what is <em>not</em> there: what if the power goes out, or someone breaks in?",
    ],
    sample: () => NOTES_ISSUES,
  },
  rewrite: {
    file: "my rewrite", slide: 36,
    task: "Fix each issue by making the requirements <b>specific</b> (measurable criteria), <b>consistent</b> (resolve conflicts explicitly), <b>complete</b> (add missing requirements) and <b>testable</b> (every requirement has a clear test). Write a <code>Test:</code> for each.",
    hints: [
      "Start from the slide's REQ-6: “The system hardware + software total cost shall not exceed $100 USD at retail pricing as of the product launch date. Test: Bill of materials review, price verification.”",
      "Resolve REQ-4 vs REQ-5 by saying <em>which</em> features must work offline.",
      "Put a number on every vague word, and add new requirements for the power outage and for security, each with its own test.",
    ],
    sample: () => `<p>REQ-6 is the slide's (slide 36). The rest, and all their numbers, are our sample answer: round 3 of the verification loop below.</p>${codeBlock(reqText(ROUNDS[2]), "out")}`,
  },
};

function demoGuided(el, key) {
  const G = GUIDED[key];
  let shown = 0, sample = false, warned = false;
  el.innerHTML = `
    <div class="frame top"><span class="fname">Task · slide ${G.slide}</span><div style="margin-top:4px">${G.task}</div></div>
    <div class="counter" style="margin-top:10px">step 1 · try it yourself (${esc(G.file)}; saved in this browser only)</div>
    <textarea class="gd-text" spellcheck="false" style="${TA}" placeholder="Write your answer here first."></textarea>
    <div class="controls"><button class="cbtn gd-hint">Show hint 1 of ${G.hints.length}</button><button class="cbtn gd-sample">Show the sample answer</button>
      <span class="spacer"></span><span class="counter gd-state"></span></div>
    <div class="gd-hints"></div><div class="msg gd-msg" style="display:none"></div><div class="gd-sample-body"></div>`;
  const $ = (q) => el.querySelector(q);
  $(".gd-text").value = store.get(key);
  $(".gd-text").oninput = () => store.set(key, $(".gd-text").value);
  function render() {
    $(".gd-hints").innerHTML = G.hints.slice(0, shown).map((h, j) => `<div class="callout note" style="margin:8px 0"><b>HINT ${j + 1}</b><p>${h}</p></div>`).join("");
    $(".gd-hint").textContent = shown < G.hints.length ? `Show hint ${shown + 1} of ${G.hints.length}` : "All hints shown";
    $(".gd-hint").disabled = shown >= G.hints.length;
    $(".gd-sample").textContent = sample ? "Hide the sample answer" : "Show the sample answer";
    $(".gd-sample-body").innerHTML = sample ? `<div class="callout pattern"><b>SAMPLE ANSWER</b>${G.sample()}</div>` : "";
    $(".gd-state").textContent = `step ${sample ? 3 : shown ? 2 : 1} of 3 · hints ${shown}/${G.hints.length}`;
  }
  $(".gd-hint").onclick = () => { if (shown < G.hints.length) shown++; render(); };
  $(".gd-sample").onclick = () => {
    const msg = $(".gd-msg");
    if (!sample && !$(".gd-text").value.trim() && !warned) {
      warned = true;
      msg.style.display = ""; msg.textContent = "You haven't written anything yet. Try first, or take a hint; click again to see the sample anyway.";
      return;
    }
    msg.style.display = "none";
    sample = !sample; render();
  };
  render();
}

// ---------- 4b. Check your files ----------

const REQUIRED = {
  "constitution.md": ["tech stack", "principles", "security", "performance", "convention"],
  "spec.md": ["outcomes", "in scope", "out of scope", "constraints"],
  "plan.md": ["data model", "api", "component"],
};
const SAMPLES = { "constitution.md": TXT.constitutionMd, "spec.md": TXT.specMd, "plan.md": TXT.planSample };
const DRAFT_KEY = { "constitution.md": "constitution", "spec.md": "spec", "plan.md": "plan" };
const missingTopics = (name, text) => REQUIRED[name].filter((t) => !text.toLowerCase().includes(t));
const lintLine = (name, text) => { const g = missingTopics(name, text); return `${name.padEnd(16)} ${g.length ? "missing: " + g.join(", ") : "ok"}`; };

function demoLint(el) {
  el.innerHTML = `<div class="controls" style="margin-top:0"><label>file <select class="ln-file">${Object.keys(REQUIRED).map((f) => `<option>${f}</option>`).join("")}</select></label>
      <button class="cbtn ln-sample">Load the slide sample</button><button class="cbtn ln-draft">Load my draft</button></div>
    <textarea class="ln-text" spellcheck="false" style="${TA};margin-top:8px"></textarea>
    <div class="tags ln-topics" style="margin-top:6px"></div>
    <div class="controls"><button class="cbtn ln-all">Check all three slide samples</button></div>
    <div class="console ln-out" style="margin-top:8px"></div>
    <p class="hint">The check is as crude as the Python one: it only looks for the words. A file can mention “performance” and still have no benchmark.</p>`;
  const $ = (q) => el.querySelector(q);
  const name = () => $(".ln-file").value;
  function check() {
    const text = $(".ln-text").value, gaps = missingTopics(name(), text);
    $(".ln-topics").innerHTML = REQUIRED[name()].map((t) => `<span class="tag" style="background:${gaps.includes(t) ? "var(--red-soft)" : "var(--green-soft)"}">${gaps.includes(t) ? "✗" : "✓"} ${t}</span>`).join("");
    $(".ln-out").textContent = lintLine(name(), text);
  }
  $(".ln-file").onchange = () => { $(".ln-text").value = SAMPLES[name()]; check(); };
  $(".ln-sample").onclick = () => { $(".ln-text").value = SAMPLES[name()]; check(); };
  $(".ln-draft").onclick = () => {
    const d = store.get(DRAFT_KEY[name()]);
    $(".ln-text").value = d;
    check();
    if (!d) $(".ln-out").textContent = `No draft yet: write one in the ${name()} task above.`;
  };
  $(".ln-text").oninput = check;
  $(".ln-all").onclick = () => { $(".ln-out").textContent = Object.keys(REQUIRED).map((f) => lintLine(f, SAMPLES[f])).join("\n"); };
  $(".ln-text").value = SAMPLES[name()];
  check();
}

// ---------- 4c. Analyze across spec.md and plan.md ----------

const OUTCOMES = [
  ["O1", "Students can search, filter, and register for courses"],
  ["O2", "Professors can manage course rosters"],
  ["O3", "Admins can configure registration periods"],
];
const ENDPOINTS = [
  ["GET  /api/courses?search=&major=", ["O1"]],
  ["POST /api/courses/:id/register", ["O1"]],
  ["GET  /api/professors/:id/roster", ["O2"]],
];
const ADMIN_FIX = ["PUT  /api/admin/semesters/:id/registration-period", ["O3"]];

function demoAnalyze(el) {
  el.innerHTML = `<div class="controls" style="margin-top:0"><label><input type="checkbox" class="an-fix"> apply Exercise 3's fix (add the admin endpoint)</label></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:10px;margin-top:8px">
      <div><div class="counter">spec.md · outcomes</div><div class="an-o" style="display:grid;gap:6px;margin-top:6px"></div></div>
      <div><div class="counter">plan.md · endpoints</div><div class="an-e" style="display:grid;gap:6px;margin-top:6px"></div></div></div>
    <div class="msg an-msg"></div>
    ${stepControls("an")}
    <div class="counter" style="margin-top:10px">what the program prints</div><div class="console an-out"></div>`;
  const $ = (q) => el.querySelector(q);
  let at = 0;
  $(".an-fix").onchange = () => draw(at);
  player(el, "an", OUTCOMES.length + 1, (i) => { at = i; draw(i); });
  function draw(i) {
    const eps = $(".an-fix").checked ? [...ENDPOINTS, ADMIN_FIX] : ENDPOINTS;
    const cur = i >= 1 && i <= OUTCOMES.length ? OUTCOMES[i - 1][0] : null;
    $(".an-o").innerHTML = OUTCOMES.map(([id, t], k) => {
      const hits = eps.filter(([, r]) => r.includes(id));
      const seen = k < i;
      const cls = !seen ? "" : hits.length ? (id === cur ? "top" : "ret") : "err";
      return `<div class="frame ${cls}" style="font-size:12.5px;${seen ? "" : "opacity:.5"}"><b>${id}</b> ${esc(t)}${seen ? `<div class="status">${hits.length ? `${hits.length} endpoint${hits.length > 1 ? "s" : ""}${id === "O2" ? " · partial: read only" : ""}` : "GAP: no endpoint"}</div>` : ""}</div>`;
    }).join("");
    $(".an-e").innerHTML = eps.map(([e, r]) => `<div class="frame ${cur && r.includes(cur) ? "top" : ""}" style="font-size:12px"><code style="overflow-wrap:anywhere">${esc(e)}</code><div class="status">→ ${r.join(", ")}</div></div>`).join("");
    const lines = [];
    OUTCOMES.slice(0, Math.min(i, OUTCOMES.length)).forEach(([id, t]) => {
      const hits = eps.filter(([, r]) => r.includes(id)).map(([e]) => e);
      lines.push(`${id} ${t}`, `   -> ${hits.length ? hits.join(", ") : "GAP: no endpoint"}`);
    });
    const covered = new Set(eps.flatMap(([, r]) => r));
    if (i > OUTCOMES.length) lines.push(`${covered.size} / ${OUTCOMES.length} outcomes have an endpoint`);
    $(".an-out").textContent = lines.join("\n");
    const msg = $(".an-msg");
    msg.className = "msg an-msg";
    if (i === 0) msg.textContent = "Step through the outcomes. For each one, which endpoints serve it?";
    else if (i <= OUTCOMES.length) {
      const id = OUTCOMES[i - 1][0], n = eps.filter(([, r]) => r.includes(id)).length;
      msg.innerHTML = n ? (id === "O2" ? "O2 maps to one endpoint, but it is a GET: you can read a roster, not manage it. Partial coverage." : `${id} maps to ${n} endpoint${n > 1 ? "s" : ""}.`) : `<b>${id} has no endpoint.</b> Nothing in the plan lets an admin set a registration period.`;
      if (!n) msg.className = "msg an-msg bad";
    } else {
      msg.className = "msg an-msg " + (covered.size === OUTCOMES.length ? "good" : "bad");
      msg.textContent = covered.size === OUTCOMES.length ? "Every outcome now has an endpoint. O2 is still only partly covered." : "One outcome has no endpoint, and one is only partly covered. That is what /speckit.analyze is for.";
    }
  }
}

// ---------- 5. Categorize the issues ----------

const CATS = ["Ambiguity", "Conflict", "Missing", "Unmeasurable", "Incomplete"];
const SORT = [
  ["REQ-4 (no internet) vs REQ-5 (Alexa needs internet)", ["Conflict"], "slide 35"],
  ["“affordable”: affordable to whom?", ["Ambiguity"], "slide 35"],
  ["“learn user preferences”: how much? how fast?", ["Unmeasurable"], "slide 35"],
  ["What happens during a power outage?", ["Missing"], "slide 35"],
  ["No security requirement (what if someone hacks it?)", ["Incomplete"], "slide 35"],
  ["REQ-2 vs REQ-5: its own voice engine, or delegate to Alexa / Google Home?", ["Conflict"], "speaker notes"],
  ["REQ-1: “all lights” of what kind? which protocols? how many?", ["Ambiguity"], "speaker notes"],
  ["REQ-3 vs REQ-4/6: learning on the device needs hardware hard to fit under $100", ["Conflict"], "speaker notes"],
  ["REQ-2: which languages? what accuracy and response time?", ["Ambiguity", "Unmeasurable"], "speaker notes"],
];

function demoCategorize(el) {
  el.innerHTML = `<p class="hint" style="margin-top:0">Pick a category for each issue, then check.</p>
    <div class="ct-rows" style="display:grid;gap:6px"></div>
    <div class="controls"><button class="cbtn on ct-check">Check</button><button class="cbtn ct-reset">⟲ Clear</button><span class="spacer"></span><span class="counter ct-score"></span></div>`;
  const $ = (q) => el.querySelector(q);
  function rows() {
    $(".ct-rows").innerHTML = SORT.map(([t, , src], k) => `<div class="frame ct-row" data-k="${k}" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between">
      <span style="flex:1 1 240px;font-size:13.5px">${esc(t)} <span class="counter">(${src})</span></span>
      <select class="ct-sel"><option value="">category…</option>${CATS.map((c) => `<option>${c}</option>`).join("")}</select>
      <div class="status ct-why" style="flex-basis:100%;display:none"></div></div>`).join("");
    $(".ct-score").textContent = "";
  }
  $(".ct-check").onclick = () => {
    let right = 0, done = 0;
    el.querySelectorAll(".ct-row").forEach((r) => {
      const [, ok] = SORT[+r.dataset.k];
      const v = r.querySelector(".ct-sel").value;
      const why = r.querySelector(".ct-why");
      r.classList.remove("ret", "err");
      if (!v) { why.style.display = "none"; return; }
      done++;
      const good = ok.includes(v);
      if (good) right++;
      r.classList.add(good ? "ret" : "err");
      why.style.display = "";
      why.textContent = good ? `✓ ${ok.length > 1 ? "Either " + ok.join(" or ") + " fits." : ok[0] + "."}` : `✗ We'd say ${ok.join(" or ")}.`;
    });
    $(".ct-score").textContent = `${right} / ${done} right${done < SORT.length ? ` · ${SORT.length - done} not picked yet` : ""}`;
  };
  $(".ct-reset").onclick = rows;
  rows();
}

// ---------- 5b. The verification loop ----------

const VAGUE = [
  ["all lights", "Ambiguity", "which lights? which protocols? how many?"],
  ["voice commands", "Ambiguity", "which commands? which languages?"],
  ["learn user preferences", "Unmeasurable", "how much? how fast?"],
  ["affordable", "Ambiguity", "affordable to whom?"],
  ["secure", "Ambiguity", "secure against what?"],
];
const CONFLICTS = [["system shall work without internet", "alexa", "Alexa needs internet"]];
const MUST_MENTION = [
  ["security", "Incomplete", "no security requirement (what if someone hacks it?)"],
  ["power outage", "Missing", "what happens during a power outage?"],
];

// JS twin of verify() in the notes: same rules, same order.
function verify(reqs) {
  const issues = [];
  for (const [rid, text] of Object.entries(reqs)) {
    const low = text.toLowerCase();
    for (const [phrase, kind, q] of VAGUE) if (low.includes(phrase)) issues.push([kind, rid, `"${phrase}": ${q}`]);
    if (!low.includes("test:")) issues.push(["Untestable", rid, "no test given"]);
  }
  for (const [a, b, why] of CONFLICTS) {
    const ra = Object.keys(reqs).filter((r) => reqs[r].toLowerCase().includes(a));
    const rb = Object.keys(reqs).filter((r) => reqs[r].toLowerCase().includes(b));
    if (ra.length && rb.length) issues.push(["Conflict", `${ra[0]} vs ${rb[0]}`, why]);
  }
  const every = Object.values(reqs).join(" ").toLowerCase();
  for (const [topic, kind, q] of MUST_MENTION) if (!every.includes(topic)) issues.push([kind, "-", q]);
  return issues;
}
const KIND_COLOR = { Ambiguity: "var(--amber)", Conflict: "var(--red)", Missing: "var(--teal)", Unmeasurable: "var(--amber)", Incomplete: "var(--teal)", Untestable: "var(--stone)" };
const loopLines = (n) => ROUNDS.slice(0, n).flatMap((r, k) => {
  const iss = verify(r);
  return [`round ${k + 1}: ${Object.keys(r).length} requirements, ${iss.length} issues`, ...iss.map(([kd, w, t]) => `   ${kd.padEnd(12)} ${w.padEnd(6)} ${t}`)];
});

function demoVerify(el, { mini = false } = {}) {
  if (mini) {
    el.innerHTML = `<div class="vf-bars" style="display:grid;gap:8px"></div><div class="msg vf-msg"></div>`;
    player(el, "vf", ROUNDS.length, (i) => {
      el.querySelector(".vf-bars").innerHTML = ROUNDS.map((r, k) => {
        const n = verify(r).length;
        return `<div style="display:grid;grid-template-columns:70px 1fr 30px;gap:8px;align-items:center;font-size:13px;${k < i ? "" : "opacity:.25"}">
          <span class="mono">round ${k + 1}</span><div style="height:16px;border-radius:4px;background:${n ? "var(--amber)" : "var(--green)"};width:${Math.max(4, n * 7)}%"></div><b class="mono">${n}</b></div>`;
      }).join("");
      el.querySelector(".vf-msg").textContent = ["write", "check: 13 issues", "fix → re-check: 3 (one new)", "fix → re-check: 0"][i];
    }, { mini: true, ms: 1400 });
    return;
  }
  el.innerHTML = `<div class="vf-reqs" style="display:grid;gap:5px"></div>
    <div class="counter" style="margin-top:10px">issues found</div><div class="vf-iss tags" style="margin-top:4px"></div>
    <div class="msg vf-msg"></div>
    ${stepControls("vf")}
    <div class="counter" style="margin-top:10px">what verification_loop prints</div><div class="console vf-out" style="max-height:300px;overflow:auto"></div>`;
  const $ = (q) => el.querySelector(q);
  const MSG = [
    "Round 1 is slide 34's set. Press Step to check it.",
    "Check: 13 issues. Every requirement lacks a test; four have vague words; REQ-4 and REQ-5 conflict; security and power outages are not mentioned.",
    "Fix → re-check. REQ-6 is the slide's rewrite; the others are ours. REQ-7 covers the outage. But the new REQ-8 “shall be secure” is itself vague: a new issue.",
    "Fix → re-check: 0 issues from the toy. That does not make the set correct: the REQ-3 vs REQ-4/6 conflict from the speaker notes is still there.",
  ];
  player(el, "vf", ROUNDS.length, (i) => {
    const r = ROUNDS[Math.max(0, i - 1)], prev = i > 1 ? ROUNDS[i - 2] : null;
    const iss = i ? verify(r) : [];
    $(".vf-reqs").innerHTML = Object.entries(r).map(([k, v]) => {
      const changed = prev && prev[k] !== v;
      const bad = iss.some(([, w]) => w.split(" vs ").includes(k));
      return `<div class="frame ${changed ? "top" : ""} ${bad ? "err" : i ? "ret" : ""}" style="font-size:12.5px"><b>${k}</b>${changed ? ` <span class="tag">${prev[k] === undefined ? "new" : "changed"}</span>` : ""} ${esc(v)}</div>`;
    }).join("");
    $(".vf-iss").innerHTML = i ? (iss.map(([kd, w, t]) => `<span class="tag" title="${esc(t)}" style="box-shadow:inset 3px 0 0 ${KIND_COLOR[kd]}">${kd} · ${esc(w)}</span>`).join("") || `<span class="tag" style="background:var(--green-soft)">none</span>`) : `<span class="hint">not checked yet</span>`;
    $(".vf-msg").className = "msg vf-msg" + (i === ROUNDS.length ? " good" : "");
    $(".vf-msg").textContent = MSG[i];
    $(".vf-out").textContent = loopLines(i).join("\n");
  }, { ms: 2000 });
}

function demoVerifyYours(el) {
  el.innerHTML = `<p class="hint" style="margin-top:0">One requirement per line, as <code>REQ-n: text</code>. The checker is the toy verifier: it knows a few words, one conflict and two topics.</p>
    <textarea class="vy-text" spellcheck="false" style="${TA}"></textarea>
    <div class="controls"><button class="cbtn on vy-run">Check</button><button class="cbtn vy-r1">Load slide 34's set</button><button class="cbtn vy-mine">Load my rewrite</button><span class="spacer"></span><span class="counter vy-n"></span></div>
    <div class="console vy-out" style="margin-top:8px"></div>`;
  const $ = (q) => el.querySelector(q);
  function parse(text) {
    const reqs = {};
    text.split("\n").forEach((line, k) => {
      const m = line.match(/^\s*([A-Za-z]+-?\d+)\s*:\s*(.+)$/);
      if (m) reqs[m[1]] = m[2].trim(); else if (line.trim()) reqs[`LINE-${k + 1}`] = line.trim();
    });
    return reqs;
  }
  function run() {
    const iss = verify(parse($(".vy-text").value));
    $(".vy-out").textContent = iss.map(([kd, w, t]) => `${kd.padEnd(12)} ${w.padEnd(14)} ${t}`).join("\n") || "(no issues found by the toy; now ask an LLM, and a person)";
    $(".vy-n").textContent = `${iss.length} issue${iss.length === 1 ? "" : "s"}`;
  }
  $(".vy-run").onclick = run;
  $(".vy-r1").onclick = () => { $(".vy-text").value = reqText(ROUNDS[0]); run(); };
  $(".vy-mine").onclick = () => {
    const d = store.get("rewrite");
    $(".vy-text").value = d || reqText(ROUNDS[0]);
    run();
    if (!d) $(".vy-out").textContent = "No rewrite saved yet: write one in Task F above. (Loaded slide 34's set instead.)\n\n" + $(".vy-out").textContent;
  };
  $(".vy-text").value = reqText(ROUNDS[0]);
  run();
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
  ambiguity: (el) => demoAmbiguity(el),
  ambiguityMini: (el) => demoAmbiguity(el, { mini: true }),
  lifecycle: (el) => demoLifecycle(el),
  lifecycleMini: (el) => demoLifecycle(el, { mini: true }),
  gate: (el) => demoGate(el),
  checklist: (el) => demoChecklist(el),
  checklistMini: (el) => demoChecklist(el, { mini: true }),
  guidedConstitution: (el) => demoGuided(el, "constitution"),
  guidedSpec: (el) => demoGuided(el, "spec"),
  guidedPlan: (el) => demoGuided(el, "plan"),
  guidedIssues: (el) => demoGuided(el, "issues"),
  guidedRewrite: (el) => demoGuided(el, "rewrite"),
  lint: (el) => demoLint(el),
  analyze: (el) => demoAnalyze(el),
  categorize: (el) => demoCategorize(el),
  verify: (el) => demoVerify(el),
  verifyMini: (el) => demoVerify(el, { mini: true }),
  verifyYours: (el) => demoVerifyYours(el),
  quiz: (el) => demoQuiz(el, QUIZ),
};
