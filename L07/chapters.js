// L07 content, adapted from csc4801/notes/L07-requirements-exercise.md (which follows the slides in order).
// Lecture 07 is an in-class exercise: the exercise chapters (4 and 5) are guided tasks with hints and
// sample answers that open only on demand.

const demo = (name, title, instr, hint = "") =>
  `<div class="card demo" data-demo="${name}"><div class="head"><span class="title">${title}</span><span>${instr}</span></div>
   <div class="demo-body"></div>${hint ? `<p class="hint">${hint}</p>` : ""}</div>`;
const callout = (kind, label, body) => `<div class="callout ${kind}"><b>${label}</b>${body}</div>`;
const predict = (q, a) => callout("predict", "PREDICT", `<p>${q}</p><details class="reveal"><summary>Show the answer</summary>${a}</details>`);
const txt = (s) => codeBlock(s, "out");

const LECTURE = {
  number: 7,
  title: "Requirements Exercise",
  tagline: "Write the spec first, then check it again",
  lead: "An in-class exercise in spec-driven development. See how GitHub Spec Kit turns a one-paragraph idea into a constitution, a spec, a plan and tasks — then write the files for a course registration system yourself, and find and fix the issues in six requirements for a smart home controller. Hints and sample answers open only when you ask.",
  heroDemo: "ambiguityMini",
  heroLabel: "One requirement, two programs · Insufficient user balance reject transactions",
  heroCaption: "When the balance equals the amount, the two readings disagree. An agent picks one.",
  whyTitle: "Why this lecture matters",
  whySub: "Lecture 06 asked what requirements are worth when an agent writes the code. Here is one answer, to practise",
  why: [
    ["Agents don't ask", "Informal requirements are ambiguous, and a coding agent <b>quietly picks a reading</b>. The spec is where you decide instead."],
    ["Spec first, code second", "<b>Spec-driven development</b>: constitution, spec, plan, tasks, then code — with checks in between."],
    ["A loop, not a draft", "Find the issues, rewrite, and <b>check again</b>: write → check → fix → re-check."],
  ],
  ctaTitle: "Ready to see why “insufficient” is not enough?",
  minutes: "About 60–90 minutes with the exercises",
};

const CHAPTERS = [
  {
    slug: "1-why", nav: "Why specs", title: "Requirements Meet Coding Agents",
    subtitle: "Strengths, one weakness, and a methodology",
    abstract: "Requirements make you think before acting and give an agent a map. But informal language is ambiguous, and an agent will not ask. Spec-driven development puts the spec first.",
    tags: ["strengths", "ambiguity", "SDD"],
    hero: "ambiguityMini", heroCaption: "Two reasonable readings of one sentence.",
    sections: [
      { id: "recap", title: "Where we are", html: `
        <p>Our course follows the software life cycle: <b>requirement engineering</b>, coding, testing / verification, repair, and AIOps. We are still at the first stage. Lecture 06 walked through its cycle — elicitation, modeling, specification, validation and management — and ended with a question: what are the strengths and weaknesses of requirements when an AI agent writes the code?</p>
        <p><b>Strengths.</b> The slides name three:</p>
        <table><tr><th>Strength</th><th>Meaning</th></tr>
        <tr><td>Thinking before action</td><td>You decide what to build before any code exists.</td></tr>
        <tr><td>Software engineering life cycle</td><td>Requirements are the first stage; design, code and tests follow from them.</td></tr>
        <tr><td>Navigating AI agents</td><td>A written requirement tells the agent where to go, and you whether it got there.</td></tr></table>` },
      { id: "weakness", title: "The weakness: ambiguity", html: `
        <p><b>Informal language incurs ambiguity.</b> The slides' example: <em>“Insufficient user balance reject transactions.”</em> An agent reading this must decide what “insufficient” means. Less than the amount (<code>&lt;</code>)? Or not more than it (<code>&lt;=</code>)? Both readings are reasonable, and they disagree on exactly one case. Here are both, side by side (our code):</p>
        ${codeBlock(CODE.ambiguity)}
        ${codeBlock(OUT.ambiguity, "out")}
        ${demo("ambiguity", "Demo 1 · Two readings of one requirement", "step through, or drag the sliders", "The program's three cases come first; then try your own numbers.")}
        ${callout("pitfall", "AN AGENT DOES NOT ASK; IT PICKS", `<p>A human developer might walk over and ask what “insufficient” means. A coding agent usually chooses one reading and writes the code. The ambiguity becomes a bug that nobody decided on, and it shows up only when the balance equals the amount exactly.</p>`)}
        <p>So the question on slide 6: <em>how do we use requirements in coding agents?</em></p>` },
      { id: "sdd", title: "Spec-driven development", html: `
        <p><b>Spec-driven development</b> (SDD) is <em>a methodology to write clear and detailed specification before implementation in the LLM era.</em> Its argument, in the slides' words: <em>specifications are more important than the code.</em></p>
        <p><b>GitHub Spec Kit</b> (<a href="https://github.github.com/spec-kit/" target="_blank" rel="noopener">github.github.com/spec-kit</a>) is a toolkit for SDD. Its home page says: define what to build before building it, with any AI coding agent.</p>
        ${callout("pattern", "THE SDD LIFECYCLE", `<table><tr><th>Stage</th><th>Goal</th></tr>
          <tr><td>Constitution</td><td>Set guardrails</td></tr><tr><td>Specify</td><td>Define “What”</td></tr>
          <tr><td>Plan</td><td>Design “How”</td></tr><tr><td>Tasks</td><td>Atomic units</td></tr><tr><td>Implement</td><td>Just do it</td></tr></table>`)}` },
    ],
    takeaways: ["Requirements: think first, a map for the agent.", "Informal language is ambiguous; agents pick.", "SDD: the spec before the code."],
  },
  {
    slug: "2-speckit", nav: "Spec Kit", title: "Constitution, Spec and Plan",
    subtitle: "Steps 1–3 of Spec Kit, on the slides' photo organizer",
    abstract: "Each step is one command typed into the coding agent, and each writes a file the next step reads: the principles, the What, and the How.",
    tags: ["constitution.md", "spec.md", "plan.md", "gates"],
    hero: "lifecycleMini", heroCaption: "Seven commands, from principles to code.",
    sections: [
      { id: "steps", title: "Seven steps", html: `
        <p>The slides walk through seven steps, each a Spec Kit command run inside the coding agent. Two extra steps check the documents: <em>Checklist</em> after the plan, <em>Analyze</em> after the tasks.</p>
        <table><tr><th>Step</th><th>Command</th><th>Writes</th></tr>
        <tr><td>1 Constitution</td><td><code>/speckit.constitution</code></td><td><code>constitution.md</code></td></tr>
        <tr><td>2 Specify</td><td><code>/speckit.specify</code></td><td><code>spec.md</code></td></tr>
        <tr><td>3 Plan</td><td><code>/speckit.plan</code></td><td><code>plan.md</code> (and <code>data-model.md</code>, <code>contracts/</code>, <code>research.md</code>, <code>quickstart.md</code>)</td></tr>
        <tr><td>4 Checklist</td><td><code>/speckit.checklist</code></td><td><code>checklists/requirements.md</code></td></tr>
        <tr><td>5 Tasks</td><td><code>/speckit.tasks</code></td><td><code>tasks.md</code></td></tr>
        <tr><td>6 Analyze</td><td><code>/speckit.analyze</code></td><td>a report; it changes no file</td></tr>
        <tr><td>7 Implement</td><td><code>/speckit.implement</code></td><td>the code</td></tr></table>
        <p>The command names for steps 4, 6 and 7 are the skill names on slide 27; the slides show the others being typed.</p>
        ${demo("lifecycle", "Demo 2 · The photo organizer, one command at a time", "← → keys step", "Prompts and outputs are the slides' (some abridged). The checklist of step 4 is from a second run of the same example.")}` },
      { id: "constitution", title: "1 The Constitution", html: `
        <p>The constitution sets the <b>principles for your project</b>: technical stack and architecture; security and compliance standards; performance benchmarks. It is <b>persistent in the project folder</b>, as <code>constitution.md</code>, so every later step reads it. The slides' example:</p>
        ${txt(TXT.constitutionPrompt)}
        <p>Each principle becomes a check box in the plan template (<code>.specify/templates/plan-template.md</code>):</p>
        ${txt(TXT.constitutionCheck)}
        <p>A gate means: if any box stays empty, the plan does not go on. A sketch of that rule (our code):</p>
        ${codeBlock(CODE.gate)}
        ${codeBlock(OUT.gate, "out")}
        ${demo("gate", "Demo 3 · The constitution gate", "tick what the plan does")}` },
      { id: "spec", title: "2 Defining the Spec", html: `
        <p>A spec answers three questions:</p>
        <table><tr><th>Part</th><th>Question</th></tr>
        <tr><td><b>Outcomes</b></td><td>What should the system achieve when the work is finished?</td></tr>
        <tr><td><b>Boundaries</b></td><td>What is in scope, and <em>explicitly</em> out of scope? This prevents agent <b>scope creep</b>.</td></tr>
        <tr><td><b>Constraints</b></td><td>Which prior decisions and technical limits must the AI agent respect?</td></tr></table>
        <p>The slides' example:</p>
        ${txt(TXT.specifyPrompt)}
        <p>The prompt says <em>what</em> and <em>why</em>: no language, no framework, no database. Spec Kit writes <code>spec.md</code>, and with it a <b>specification quality checklist</b> (<code>checklists/requirements.md</code>, slide 15), which it ticks itself:</p>
        ${txt(TXT.specChecklist)}` },
      { id: "plan", title: "3 The Technical Plan", html: `
        <p><code>plan.md</code> is <b>the bridge between business intent and raw code</b>. It defines data models and schemas, API contracts and endpoints, the component architecture, and the tech stack. The slides' example:</p>
        ${txt(TXT.planPrompt)}
        <p>The resulting plan (slide 18, abridged) records the <em>how</em> that the spec left out:</p>
        ${txt(TXT.planMd)}
        <p>Note how the constitution shows up: TDD becomes <code>vitest</code>, and <em>Library-First</em> becomes “a local backend / library”.</p>` },
    ],
    takeaways: ["Constitution: principles that gate every plan.", "Spec: outcomes, boundaries, constraints — no tech.", "Plan: the How, in its own file."],
  },
  {
    slug: "3-check", nav: "Check & build", title: "Checklist, Tasks, Analyze, Implement",
    subtitle: "Steps 4–7, and how Spec Kit is built",
    abstract: "Before code, the documents are tested: a checklist for the spec, atomic tasks for the plan, and an analysis across all of them. Then the agent builds, one task at a time.",
    tags: ["unit tests for requirements", "atomic tasks", "analyze", "skills"],
    hero: "checklistMini", heroCaption: "Unit tests for your requirements (slide 20).",
    sections: [
      { id: "checklist", title: "4 Checklist", html: `
        <p>The checklist step generates a custom quality checklist, <em>“unit tests for your requirements”</em>, to confirm the spec is <b>complete, clear, and consistent</b> before the work is broken down. Slide 20 (abridged):</p>
        ${txt(TXT.checklistMd)}
        <p>Unlike the checklist in step 2, these boxes are left empty: a human reviewer ticks them.</p>
        ${predict("Look back at the one-paragraph <code>/speckit.specify</code> prompt in Chapter 2. Which of CHK001–CHK007 does the prompt alone already answer?",
          `<p>Our reading: only CHK001 is mostly answered (albums, reordering and tile previews are all named). “Grouped by date” does not say by day, month or year (CHK005); nothing is said about photos without a date (CHK002, CHK004), about speed (CHK003), about where a reorder is saved (CHK006), or about lazy loading (CHK007). The full <code>spec.md</code> may answer more; the slides show only part of it.</p>`)}
        <p>The prompt again:</p>${txt(TXT.specifyPrompt)}
        ${demo("checklist", "Demo 4 · Be the reviewer", "one item at a time")}` },
      { id: "tasks", title: "5 Tasks", html: `
        <p><code>/speckit.tasks</code> <b>breaks the plan into atomic units</b>. This keeps the AI agent on <em>one testable change at a time</em>, verified against the original spec at every step. From slide 22:</p>
        ${txt(TXT.tasksMd)}
        <p>After these steps the feature folder (slide 23) holds <code>checklists/requirements.md</code>, <code>contracts/api.md</code>, <code>data-model.md</code>, <code>plan.md</code>, <code>quickstart.md</code>, <code>research.md</code>, <code>spec.md</code> and <code>tasks.md</code>.</p>` },
      { id: "analyze", title: "6 Analyze and 7 Implement", html: `
        <p><code>/speckit.analyze</code> <b>reports conflicts, gaps, and ambiguities across <code>spec.md</code>, <code>plan.md</code> and <code>tasks.md</code></b>. The slides' report (slide 25, abridged):</p>
        ${txt(TXT.analyzeReport)}
        <p>(FR: functional requirement. SC: success criterion.) Analyze only reads. And even “9 / 9 (100%)” comes with a warning about <em>partial</em> coverage: a task that mentions a requirement may not fully build it. You will run an analysis yourself in Chapter 4.</p>
        <p><b>7 Implementation.</b> Finally the agent takes <code>tasks.md</code> and writes the code, one task at a time.</p>` },
      { id: "skills", title: "How is SDD implemented?", html: `
        <p>With <b>skills</b> (Lecture 04). Spec Kit installs one skill per step into the project (<code>.agents/skills/</code> on slide 27), each a folder with one <code>SKILL.md</code>:</p>
        ${txt(TXT.skills)}
        <p>So there is no magic: SDD is a set of well-written prompts, plus a rule about which document comes first. (Slide 28 is a live demo in class.)</p>` },
    ],
    takeaways: ["Checklists: unit tests for requirements.", "Tasks: one testable change at a time.", "Analyze reads across files; skills do the work."],
  },
  {
    slug: "4-files", nav: "Exercise: files", title: "Exercise Part 1: Write the Three Files",
    subtitle: "Constitution, spec and plan for a course registration system",
    abstract: "Three guided tasks from slides 31–33. Write each file yourself, take a hint if you are stuck, then compare with the slides' sample — and check the files, alone and against each other.",
    tags: ["Task A", "Task B", "Task C", "check", "analyze"],
    hero: "code:analyze", heroCaption: "Does every outcome have an endpoint?",
    sections: [
      { id: "goal", title: "The exercise", html: `
        <p><em>“You can implement SDD by yourself.”</em> The exercise has two goals: use the Spec Kit workflow to analyze requirements, and find inconsistencies in a set of requirements. Part 1 writes the files for a <b>course registration system</b>; part 2 (Chapter 5) verifies a set of requirements.</p>
        <p>You do not need Spec Kit installed: write the files by hand, or ask your coding agent to draft them and then check each one yourself. Each task below goes in three steps: <b>try</b> it, open a <b>hint</b> if you need one, then the <b>sample answer</b>. Your drafts stay in this browser only.</p>` },
      { id: "task-a", title: "Task A: write the constitution", html: `
        ${demo("guidedConstitution", "Task A · constitution.md", "try · hint · sample")}` },
      { id: "task-b", title: "Task B: write the specification", html: `
        ${demo("guidedSpec", "Task B · spec.md", "try · hint · sample")}` },
      { id: "task-c", title: "Task C: create the technical plan", html: `
        ${demo("guidedPlan", "Task C · plan.md", "try · hint · sample")}` },
      { id: "lint", title: "Check your files", html: `
        <p>Before you hand files to an agent, check that each one covers what its task asked for. A crude check (our code): list the topics each file must mention, and report the ones it never does. Here it runs on the three sample files.</p>
        ${codeBlock(CODE.lint)}
        ${codeBlock(OUT.lint, "out")}
        <p>The slides' own sample constitution leaves out two items its task asks for: performance benchmarks and coding conventions. (The spec's “1000 concurrent users” is a performance target, but it sits in the spec, not the constitution.)</p>
        ${demo("lint", "Demo 5 · Check a file", "load a sample or your draft, then edit")}` },
      { id: "analyze", title: "Analyze across the files", html: `
        <p>Step 6 of Spec Kit checks the files <em>against each other</em>. Do it by hand for the spec and the plan: does every outcome have an endpoint? The mapping below is ours; the code just counts.</p>
        ${codeBlock(CODE.analyze)}
        ${codeBlock(OUT.analyze, "out")}
        ${demo("analyze", "Demo 6 · Map outcomes to endpoints", "← → keys step")}
        ${predict("O2 has an endpoint. Is it fully covered?",
          `<p>Only partly. <em>Manage</em> a roster means more than <em>read</em> it (for example, remove a student), but the plan has only <code>GET</code>. This is the “partial coverage” the slide 25 report warns about: a mapped endpoint is not proof that the outcome is built. The plan also has no data model for a registration period, and no admin component.</p>`)}` },
    ],
    takeaways: ["Write the file, then compare.", "Check each file against its task.", "Check the files against each other."],
  },
  {
    slug: "5-verify", nav: "Exercise: verify", title: "Exercise Part 2: Requirement Verification",
    subtitle: "Find, sort, rewrite and re-check six smart home requirements",
    abstract: "The heart of the exercise (slides 34–37). Find the issues, put them in categories, rewrite the requirements to be testable, and run the check again — the verification loop.",
    tags: ["Task D", "Task E", "Task F", "Task G", "verification loop"],
    hero: "verifyMini", heroCaption: "write → check → fix → re-check.",
    sections: [
      { id: "task-d", title: "Task D: find the issues", html: `
        ${demo("guidedIssues", "Task D · Smart Home Controller", "try · hint · sample", "The sample answer is from the slide 34 speaker notes.")}` },
      { id: "task-e", title: "Task E: categorize the issues", html: `
        <p>Group the issues you found into categories (slide 35). The slide gives one example of each:</p>
        <table><tr><th>Category</th><th>Example</th></tr>
        <tr><td><b>Ambiguity</b></td><td>“affordable”: affordable to whom?</td></tr>
        <tr><td><b>Conflict</b></td><td>REQ-4 (no internet) vs REQ-5 (Alexa needs internet)</td></tr>
        <tr><td><b>Missing</b></td><td>What happens during a power outage?</td></tr>
        <tr><td><b>Unmeasurable</b></td><td>“learn user preferences”: how much? how fast?</td></tr>
        <tr><td><b>Incomplete</b></td><td>No security requirement (what if someone hacks it?)</td></tr></table>
        <p>“Missing” and “incomplete” are close: both are about what the list leaves out. Here <em>missing</em> is a situation nobody thought of (a power outage), and <em>incomplete</em> a whole kind of requirement left out (security).</p>
        ${demo("categorize", "Demo 7 · Sort the issues", "pick a category, then Check", "The first five are the slide's examples, in a new order; the rest are from the speaker notes.")}` },
      { id: "task-f", title: "Task F: rewrite the requirements", html: `
        <p>Fix each issue by making requirements <b>specific</b> (replace vague terms with measurable criteria), <b>consistent</b> (resolve conflicts explicitly), <b>complete</b> (add missing requirements) and <b>testable</b> (every requirement must have a clear test). The slide rewrites REQ-6:</p>
        ${txt(TXT.rewriteReq6)}
        ${demo("guidedRewrite", "Task F · rewrite the six", "try · hint · sample")}` },
      { id: "task-g", title: "Task G: verify again", html: `
        <p>Run the LLM verification again on your rewritten set. Did you introduce new issues? Are all original issues resolved? <em>This is the verification loop: write → check → fix → re-check.</em> The slides do not give the prompt for the LLM. One you could use (ours):</p>
        ${txt(TXT.verifyPrompt)}
        <p>To see the loop work offline, here is a <b>toy verifier</b> (our code). It knows only a handful of words and one conflict, so it is no substitute for an LLM or a careful reader. But the loop around it is the same.</p>
        ${codeBlock(CODE.verify)}
        ${codeBlock(OUT.verify, "out")}
        <p>All five of the slide's categories show up. <em>Untestable</em> is our label for slide 36's last rule: every requirement must have a clear test.</p>
        <p>Now a rewrite. REQ-6 is the slide's; the rest, and all their numbers, are our sample answer. Round 2 adds REQ-7 for the power outage, but makes a classic mistake with REQ-8:</p>
        ${codeBlock(CODE.loop)}
        ${codeBlock(OUT.loop, "out")}
        ${demo("verify", "Demo 8 · The verification loop, round by round", "← → keys step", "Changed requirements are marked; red ones still have an issue.")}
        <p>Round 2 answered <em>did you introduce new issues?</em> with a yes: “The system shall be secure” is a new vague requirement. Round 3 fixes it.</p>
        ${callout("pitfall", "ZERO ISSUES IS NOT “CORRECT”", `<p>The toy finds nothing in round 3, yet the speaker notes' REQ-3 vs REQ-4/6 conflict is still open: can on-device learning fit under $100? A word matcher cannot see that; an LLM might, and a human reviewer should. As the slide 37 notes say: requirement verification is never done once. It is an iterative process.</p>`)}
        ${demo("verifyYours", "Demo 9 · Check your own rewrite", "edit, then Check", "Same rules as the Python verify(). Your Task F draft loads if it uses REQ-n: lines.")}` },
      { id: "kiro", title: "Kiro", html: `
        <p><b>Kiro</b> (<a href="https://kiro.dev/" target="_blank" rel="noopener">kiro.dev</a>) is a coding agent that deeply integrates the SDD workflow. The screenshot on slide 38 shows its three tabs, <em>Requirements</em>, <em>Design</em> and <em>Tasks</em>: the same order as Spec Kit's spec, plan and tasks.</p>` },
    ],
    takeaways: ["Five kinds of issue; look for pairs and gaps.", "Specific, consistent, complete, testable.", "Check again: fixes bring new issues."],
  },
  {
    slug: "6-summary", nav: "Summary", title: "Summary and Practice",
    subtitle: "Check yourself, then run the workflow for real",
    abstract: "A map of the lecture, five self-check questions, and three exercises with solutions.",
    tags: ["knowledge map", "self-check", "exercises"],
    hero: "toc",
    sections: [
      { id: "map", title: "Knowledge map", html: `<div class="map">
        <div class="card"><h3>Why specs</h3><ul><li>Think first; a map for the agent</li><li>Informal language is ambiguous</li><li>An agent picks a reading</li></ul></div>
        <div class="card"><h3>SDD</h3><ul><li>Spec before implementation</li><li>Specs matter more than code</li><li>GitHub Spec Kit; Kiro</li></ul></div>
        <div class="card"><h3>Define (1–3)</h3><ul><li>Constitution: guardrails, gates</li><li>Spec: outcomes, boundaries, constraints</li><li>Plan: the How</li></ul></div>
        <div class="card"><h3>Check and build (4–7)</h3><ul><li>Checklist: unit tests for requirements</li><li>Tasks: atomic, testable</li><li>Analyze across files; implement</li></ul></div>
        <div class="card"><h3>Find and sort</h3><ul><li>Ambiguity · conflict · missing</li><li>Unmeasurable · incomplete</li><li>Compare pairs; ask what is not there</li></ul></div>
        <div class="card"><h3>Fix and re-check</h3><ul><li>Specific, consistent, complete, testable</li><li>write → check → fix → re-check</li><li>Zero issues ≠ correct</li></ul></div></div>` },
      { id: "check", title: "Check your understanding", html: `<div data-demo="quiz"><div class="demo-body"></div></div>` },
      { id: "exercises", title: "Exercises", html: `
        <h3>Exercise 1 ★ (run)</h3>
        <p>Run the Spec Kit workflow, or your own coding agent with the same prompts, on the course registration system. Compare the <code>spec.md</code> it writes with the slide 32 sample: what did it add, and what did it leave out?</p>
        <h3>Exercise 2 ★ (modify)</h3>
        <p>Add a rule to the toy verifier that flags the word <code>"fast"</code> as Ambiguity (“how fast? in what unit?”), and run it on a requirement <code>"The app shall be fast."</code>.</p>
        <details class="reveal"><summary>Solution</summary>${codeBlock(CODE.fast)}${codeBlock(OUT.fast, "out")}<p>The last two lines appear because the verifier checks the whole set, and this set of one says nothing about security or power outages.</p></details>
        <h3>Exercise 3 ★★ (design)</h3>
        <p>Fix the gap that the analysis found in the slide 33 plan: add what an admin needs to configure registration periods (a data model, an endpoint and a component).</p>
        <details class="reveal"><summary>Solution</summary><p>One possible answer (ours):</p>${txt(TXT.adminFix)}<p>Then re-run the analysis (tick “apply Exercise 3's fix” in Demo 6): O3 now maps to an endpoint, so the count becomes 3 / 3. O2 still has only a <code>GET</code>, so it stays partial until the plan adds a way to change a roster.</p></details>` },
      { id: "terms", title: "Key terms and further reading", html: `
        <p class="tags">${["spec-driven development (SDD)", "GitHub Spec Kit", "constitution", "specification", "outcomes", "boundaries", "constraints", "scope creep", "technical plan", "checklist", "atomic task", "analyze", "ambiguity", "conflict", "unmeasurable", "testable requirement", "verification loop", "Kiro"].map((t) => `<span class="tag">${t}</span>`).join("")}</p>
        <ul><li>GitHub Spec Kit: <a href="https://github.github.com/spec-kit/" target="_blank" rel="noopener">github.github.com/spec-kit</a></li>
        <li>Spec Kit source and command reference: <a href="https://github.com/github/spec-kit" target="_blank" rel="noopener">github.com/github/spec-kit</a></li>
        <li>Kiro: <a href="https://kiro.dev/" target="_blank" rel="noopener">kiro.dev</a></li>
        <li>Lecture 06 (Requirements) for the requirement engineering cycle and LLM-based inconsistency checking.</li></ul>` },
    ],
    takeaways: ["Spec first: constitution, spec, plan, tasks.", "Test the documents before the code.", "Verify in a loop, not once."],
  },
];

const QUIZ = [
  { q: "Why is <em>“Insufficient user balance reject transactions”</em> a problem for a coding agent?",
    opts: ["It is too long", "It doesn't say whether a balance equal to the amount is insufficient", "Agents cannot read English", "It has no user"],
    a: 1, why: "“Insufficient” could mean <code>&lt;</code> or <code>&lt;=</code>. The readings disagree when the balance equals the amount, and the agent picks one without asking." },
  { q: "Which file holds the principles that every plan must pass?",
    opts: ["spec.md", "plan.md", "constitution.md", "tasks.md"],
    a: 2, why: "The constitution sets the guardrails; the plan template turns each principle into a gate (the Constitution Check)." },
  { q: "A spec defines outcomes, boundaries and…",
    opts: ["constraints", "endpoints", "data models", "unit tests"],
    a: 0, why: "Outcomes, boundaries (in and out of scope) and constraints. Endpoints and data models belong to the plan." },
  { q: "“REQ-4 (no internet) vs REQ-5 (Alexa needs internet)” is which category?",
    opts: ["Ambiguity", "Missing", "Conflict", "Unmeasurable"],
    a: 2, why: "Two requirements that cannot both be fully true: a conflict (slide 35)." },
  { q: "Your rewrite passes the verifier with zero issues. What next?",
    opts: ["Ship it: verification is done", "Re-check with an LLM and a person: verification is never done once", "Delete the tests", "Remove the constraints"],
    a: 1, why: "A checker finds only what it looks for. The slide 37 notes: requirement verification is an iterative process." },
];

// The lecture video (added after the page was built).
LECTURE.videos = { "../videos/L07.mp4": "Lecture 7 — Requirements Exercise (13 min)" };
CHAPTERS[0].sections.push({
  id: "video", title: "Watch the lecture video",
  html: `<p>The video follows the same slides in the same order. Watch it first, or use it to review after the demos.</p>
    <div class="card video" data-video="../videos/L07.mp4"></div>`,
});
