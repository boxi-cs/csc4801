// L05 content, adapted from csc4801/notes/L05-prompts.md (which follows the slides in order).

const demo = (name, title, instr, hint = "") =>
  `<div class="card demo" data-demo="${name}"><div class="head"><span class="title">${title}</span><span>${instr}</span></div>
   <div class="demo-body"></div>${hint ? `<p class="hint">${hint}</p>` : ""}</div>`;
const callout = (kind, label, body) => `<div class="callout ${kind}"><b>${label}</b>${body}</div>`;
const predict = (q, a) => callout("predict", "PREDICT", `<p>${q}</p><details class="reveal"><summary>Show the answer</summary>${a}</details>`);

const VIDEO = "../videos/L05.mp4";

const LECTURE = {
  number: 5,
  title: "How to Write a Prompt",
  tagline: "Specify, then verify",
  lead: "A prompt is a conditional input: the model responds to what you wrote, not to what you meant. Turn a vague request into a complete one, use roles, data tags and examples for what they are good for — and when the output is still wrong, spend extra effort at test time, wisely.",
  heroDemo: "pairsMini",
  heroLabel: "Before and after · prompts from the slides",
  heroCaption: "Each pair is a slide: the vague version, then the one you can check.",
  whyTitle: "Why this lecture matters",
  whySub: "Three habits for every prompt you write this term",
  why: [
    ["Write the intent down", "Keep three questions visible: <b>what should change</b>, <b>what must stay true</b>, <b>how will we know</b>. The model can't read the rest."],
    ["Make it checkable", "A contract with its edge cases, a minimal diff and test evidence: <b>acceptance needs engineering evidence</b>."],
    ["Spend effort where it pays", "Revise with feedback, sample and select, or search — and when facts are missing, <b>ask</b> instead of retrying."],
  ],
  ctaTitle: "Ready to fill in the six boxes?",
  minutes: "About 45–60 minutes",
  videos: { [VIDEO]: "Lecture 5 — How to Write a Prompt (13 min)" },
};

const CHAPTERS = [
  {
    slug: "1-specify", nav: "Specify & verify", title: "Specify and Verify",
    subtitle: "Two key parts, three questions, six boxes",
    abstract: "Every prompt has two jobs: say what you want, and set up how you'll know you got it. The model responds to the context it has, not your unspoken intent.",
    tags: ["specify", "verify", "conditional input", "checklist"],
    hero: "builderMini", heroCaption: "From a vague goal to a complete request, one field at a time.",
    sections: [
      { id: "map", title: "Prompt is all you need", html: `
        <p>The course map puts the <b>prompt</b> at the start of everything a coding agent does: it goes through context management to the agent, which uses skills, RAG, MCP, a sandbox and subagents. This lecture is about that first box.</p>
        <p>Slide 3 is a joke title, <em>Prompt Is All You Need</em>, by <em>All students in CSC 4801</em>. (It plays on the transformer paper <em>Attention Is All You Need</em>; that gloss is ours.) Every student already writes prompts. The questions are how to write them well, and how to tell whether the result is right.</p>` },
      { id: "two", title: "Two key parts", html: `
        <table><tr><th>SPECIFY</th><th>VERIFY</th></tr>
        <tr><td>Goal and completion</td><td>Workflow and tools</td></tr>
        <tr><td>Context and examples</td><td>Tests and iteration</td></tr></table>
        <p>Followed along one task, the two parts become one path:</p>
        <table><tr><th>Specify side</th><th>Verify side</th></tr>
        <tr><td>Human intent</td><td>Review and execution</td></tr>
        <tr><td>Task specification</td><td>Observed behavior</td></tr>
        <tr><td>Model-generated candidate</td><td>Accept or revise</td></tr></table>
        <p>Your intent becomes a task specification; the model produces a <b>candidate</b>; you review and run it, observe what it does, and accept it or revise.</p>
        ${callout("pattern", "PROMPT QUALITY MATTERS; ACCEPTANCE STILL NEEDS ENGINEERING EVIDENCE", `<p>A better prompt gives you better candidates. Whether you accept one is decided by evidence: review, execution, tests.</p>`)}` },
      { id: "questions", title: "Three questions and a conditional input", html: `
        <p>Before writing a long prompt, write down three questions: <b>What should change? What must stay true? How will we know?</b></p>
        <p>A prompt has two kinds of content: <b>instructions</b> describe what to do and how to respond; <b>context</b> supplies facts, examples, and evidence.</p>
        ${callout("pitfall", "PITFALL", `<p><b>The model responds to the available context, not your unspoken intent.</b> Whatever you know but did not write down, the model has to guess.</p>`)}` },
      { id: "checklist", title: "A starting point: six boxes", html: `
        <table><tr><th>Box</th><th>Question</th></tr>
        <tr><td>GOAL</td><td>What should change?</td></tr><tr><td>CONTEXT</td><td>Which facts matter?</td></tr>
        <tr><td>INPUT</td><td>What should be processed?</td></tr><tr><td>CONSTRAINTS</td><td>What must stay true?</td></tr>
        <tr><td>OUTPUT</td><td>What should be delivered?</td></tr><tr><td>CHECKS</td><td>How will we know?</td></tr></table>
        <p>The slide is careful: <em>this is a classroom checklist, not a universal named framework.</em> Use it to spot what is missing. Here it is as a few lines of Python (ours). <code>build_prompt</code> joins the fields in the order of the template on slide 27 and leaves empty ones out; <code>unanswered</code> lists the checklist questions a prompt leaves open.</p>
        ${codeBlock(CODE.buildPrompt)}
        ${codeBlock(CODE.buildPromptOut, "out")}
        <p>Four of the five questions are open, and even the goal is vague.</p>
        ${demo("builder", "Demo 1 · The prompt builder", "toggle the parts", "Start from the vague prompt, then add fields. The field texts are the slide-12 request, sorted into the template by us.")}` },
      { id: "video", title: "Watch the lecture video", html: `
        <p>The video follows the same slides in the same order. Watch it first, or use it to review after the demos.</p>
        <div class="card video" data-video="${VIDEO}"></div>` },
    ],
    takeaways: ["Specify, then verify.", "What should change? What must stay true? How will we know?", "The model sees only what you wrote."],
  },
  {
    slug: "2-request", nav: "Complete request", title: "A Complete Request",
    subtitle: "Verb and object, a contract, and a checkable outcome",
    abstract: "The running example: fix empty-list handling in stats.average(xs). A clear scope, observable behaviors, and a request short enough to check.",
    tags: ["verb + object", "contract", "edge case", "stats.average"],
    hero: "code:average", heroCaption: "The function from slide 11",
    sections: [
      { id: "verb", title: "Verb and object", html: `
        <table><tr><th>VAGUE</th><th>SPECIFIC</th></tr>
        <tr><td>Help with my Python code.<br>Make it better.</td><td>Fix empty-list handling in <code>stats.average(xs)</code>.</td></tr></table>
        <p>The specific version has a <b>verb</b> (<em>fix</em>) and an <b>object</b> (one function, one case). A clear scope reduces accidental work and hidden choices.</p>
        ${demo("pairs", "Demo 2 · Before and after, slide by slide", "step through the pairs", "Every pair is from the slides. Before you step, ask what the left side leaves open.")}` },
      { id: "contract", title: "Define observable behaviors", html: `
        <table><tr><th>INPUT CONTRACT</th><th>OUTPUT CONTRACT</th></tr>
        <tr><td><code>xs</code> is a list of finite numbers.<br>Empty lists are allowed.</td><td><code>[]</code> returns <code>None</code>.<br>Otherwise return the mean.</td></tr></table>
        <p>Here is the function from slide 11:</p>
        ${codeBlock(CODE.average)}
        ${predict("What does <code>average([])</code> do?", `<p><code>len([])</code> is 0, so Python raises <code>ZeroDivisionError</code>:</p>${codeBlock(CODE.averageRun)}${codeBlock(CODE.averageRunOut, "out")}`)}
        <p>A contract is something you can check. <code>check_contract</code> runs three examples (ours: the slides mention three examples but do not show them) and also checks that the input list is not changed:</p>
        ${codeBlock(CODE.checkContract)}
        ${codeBlock(`FAIL  average([]) -> 'ZeroDivisionError', want None
PASS  average([2, 4, 9]) -> 5.0, want 5.0
PASS  average([5]) -> 5.0, want 5.0`, "out")}
        <p>Without the contract, <em>“fix empty lists”</em> leaves a choice open: return 0? raise a clearer error? return <code>None</code>? <code>average_guess</code> is one guess a model could make (illustrative); <code>average_fixed</code> follows the contract.</p>
        ${demo("contract", "Demo 3 · Check three versions against the contract", "pick a version, run the cases")}
        ${callout("pattern", "AN EDGE CASE IS PART OF THE REQUIREMENT", `<p>An edge case is part of the requirement, not a model preference. If you don't state what <code>[]</code> must return, the model picks something, and its pick may not be yours.</p>`)}` },
      { id: "complete", title: "Prompt: a complete request", html: `
        ${codeBlock(`Fix stats.average(xs) for empty lists.
Input: a list of finite numbers.
Return None for []; otherwise the mean.
Preserve the signature and input list.
Use only the Python standard library.
Return a minimal diff and test evidence.`, "out")}
        <p>Alongside it: <em>attach <code>stats.py</code>; include the three examples; state if tests cannot run.</em> Short, concrete, and tied to a checkable outcome.</p>
        <p>The same request fits the checklist. Sorting its lines into the template's fields is our mapping:</p>
        ${codeBlock(CODE.request)}
        ${codeBlock(CODE.requestOut, "out")}
        <p>Go back to Demo 1 and press <em>Complete request</em>: it is this prompt.</p>` },
    ],
    takeaways: ["A verb and an object.", "Edge cases belong in the contract.", "Ask for a diff and test evidence."],
  },
  {
    slug: "3-context", nav: "Roles & data", title: "Roles, Data and Context",
    subtitle: "What a role does, where data goes, how much code to give",
    abstract: "A role sets the perspective but grants no expertise; a method does the work. Keep instructions apart from data, and give the minimal code region that decides the answer.",
    tags: ["role prompt", "method", "delimiter tags", "minimal code region"],
    hero: "code:withData", heroCaption: "Instructions first, then the data in its own tags",
    sections: [
      { id: "roles", title: "Role prompts", html: `
        <table><tr><th>ROLE ONLY</th><th>ROLE + METHOD</th></tr>
        <tr><td>You are a senior engineer.<br>Review this code carefully.</td><td>Check input boundaries.<br>Find one concrete failure.<br>Cite the relevant line.</td></tr></table>
        ${callout("pitfall", "PITFALL", `<p><b>A role can guide style and perspective; it does not grant expertise.</b> Saying “senior engineer” does not make the model one. A method tells it what a careful review consists of.</p>`)}
        <p>Real system prompts do both. Slide 15 shows one of Claude Code's agent prompts, the reviewer of <b>auto mode</b> classifier rules (from a public collection, linked under Further reading). Step through its structure:</p>
        ${demo("anatomy", "Demo 4 · Anatomy of a real system prompt", "step through the parts")}
        <p>The role is one line. The method does the work.</p>` },
      { id: "data", title: "Separate instructions and data", html: `
        <table><tr><th>TASK</th><th>DATA</th></tr>
        <tr><td>Summarize the incident.<br>Use only the supplied log.</td><td><code>&lt;incident_log&gt;</code><br><code>...log text...</code><br><code>&lt;/incident_log&gt;</code></td></tr></table>
        <p>Put the instructions first and the material inside its own tags, so the model can tell what to do from what to work on. A sketch (ours; the three log lines are made up):</p>
        ${codeBlock(CODE.withData)}
        ${codeBlock(CODE.withDataOut, "out")}
        ${demo("tags", "Demo 5 · Where do the instructions end?", "toggle the tags", "Added, not on the slides: tags also help when the data contains text that reads like an instruction. They lower that risk; they do not remove it.")}` },
      { id: "region", title: "Minimal code region", html: `
        <table><tr><th>WHERE</th><th>WHY + HOW TO CHECK</th></tr>
        <tr><td>Target path and function</td><td>Expected behavior</td></tr>
        <tr><td>Relevant caller or interface</td><td>Minimal failing example</td></tr>
        <tr><td>Runtime / dependency version</td><td>Relevant test command</td></tr></table>
        <p>Give enough context to distinguish the intended patch from a guess. For our example: <code>stats.py</code>, <code>average(xs)</code>; expected behavior from the contract; the failing example <code>average([])</code>; and the test command.</p>` },
    ],
    takeaways: ["A role sets style; a method does the work.", "Data goes inside its own tags.", "Give the code that decides the answer."],
  },
  {
    slug: "4-examples", nav: "Zero & few-shot", title: "Examples: Zero-shot and Few-shot",
    subtitle: "Try an instruction first; add examples for a boundary or a format",
    abstract: "Zero-shot: instructions only. Few-shot: show worked examples, chosen for coverage, not for count.",
    tags: ["zero-shot", "few-shot", "decision boundary", "coverage"],
    hero: "code:fewShot", heroCaption: "Slide 22's few-shot prompt, built from data",
    sections: [
      { id: "zero", title: "Zero-shot prompting", html: `
        <table><tr><th>Prompt</th><th>Issue and expected label</th></tr>
        <tr><td>Classify the issue as: BUG / FEATURE / QUESTION. Return one label.</td><td>Issue: "How do I export CSV?" Expected: QUESTION</td></tr></table>
        <p>Try a clear instruction before adding examples. The second zero-shot example (slide 20) is harder:</p>
        ${codeBlock(`Extract the drink order from the message below. Output JSON.

"A large iced latte, less sugar, with an extra shot of espresso"`, "out")}
        ${predict("What field names will the JSON have? <code>size</code> or <code>cup</code>? Is sugar a word or a number?", `<p>The prompt doesn't say, so the model has to invent a format.</p>`)}` },
      { id: "few", title: "Few-shot prompting", html: `
        <table><tr><th>Examples</th><th>New case</th></tr>
        <tr><td>"Crashes on startup" -&gt; BUG<br>"Add CSV export" -&gt; FEATURE<br>"Where is export?" -&gt; QUESTION</td><td>Now classify: "CSV export is missing rows"<br>Expected: BUG</td></tr></table>
        <p>Examples can communicate a <b>decision boundary</b> (a missing row is a bug, even though the issue mentions a feature) or a <b>local convention</b> (field names, formats). Slide 22 does the same for the drink order. Here the prompt is built from data (our code; the instruction and examples are the slide's):</p>
        ${codeBlock(CODE.fewShot)}
        ${codeBlock(`Extract the drink order from the message. Follow the example format exactly; keep field names in English.

Message: "hot americano, medium"
Output: {"size": "medium", "drink": "americano", "temp": "hot", "sugar": "normal", "extras": []}

Message: "large iced latte, no sugar, oat milk"
Output: {"size": "large", "drink": "latte", "temp": "iced", "sugar": "none", "extras": ["oat milk"]}

Message: "A large iced latte, less sugar, with an extra shot of espresso"
Output:`, "out")}
        <p>The examples fix the format, so a program can check a reply against them. The two replies are illustrative, written by hand:</p>
        ${codeBlock(CODE.sameFormat)}
        ${codeBlock(CODE.sameFormatOut, "out")}
        ${demo("shots", "Demo 6 · Zero-shot or few-shot?", "turn the examples on and off")}` },
      { id: "coverage", title: "Select examples for coverage", html: `
        <table><tr><th>WEAK SET</th><th>STRONGER CANDIDATE SET</th></tr>
        <tr><td>Three obvious BUG reports<br>Same wording every time<br>No borderline case</td><td>One example per label<br>An ambiguous-looking case<br>Consistent output format</td></tr></table>
        <p>Optimize coverage on your task, not an arbitrary example count. One part of coverage is easy to check in code (the weak set's three reports are ours):</p>
        ${codeBlock(CODE.labelsMissing)}
        ${codeBlock(CODE.labelsMissingOut, "out")}
        ${demo("coverage", "Demo 7 · Build an example set", "pick examples")}
        <p>The other two parts, an ambiguous-looking case and a consistent format, need your judgement.</p>` },
    ],
    takeaways: ["Instruction first.", "Examples show a boundary or a format.", "Coverage beats count."],
  },
  {
    slug: "5-structure", nav: "Plans & structure", title: "Reasoning, Plans and Structure",
    subtitle: "Chain-of-thought, plans with decisions, and output a program can read",
    abstract: "More text is not proof; a plan should name what each step resolves; structured output can be checked. Then a template to adapt, and the habit worth keeping.",
    tags: ["chain-of-thought", "planning", "structured output", "template"],
    hero: "code:parseReview", heroCaption: "Reject a reply that isn't the JSON you asked for",
    sections: [
      { id: "cot", title: "Chain-of-thought prompting", html: `
        <p><em>“Let's think step by step.”</em> (Lecture 2 met it as zero-shot CoT.)</p>
        ${callout("pitfall", "THE LIMIT", `<p>Results depend on the model and the task setting. <b>More text is not proof.</b> Historical prompting results are evidence to test, not guarantees.</p>`)}` },
      { id: "plan", title: "Planning prompting", html: `
        <table><tr><th>PLAN TOO VAGUE</th><th>PLAN WITH DECISIONS</th></tr>
        <tr><td>1. Understand<br>2. Implement<br>3. Test</td><td>Read empty-input contract.<br>Add only an empty-list guard.<br>Run edge and regression tests.</td></tr></table>
        <p>A good plan names what each step will resolve. “Implement” could mean anything; “add only an empty-list guard” also says what <em>not</em> to do.</p>` },
      { id: "structured", title: "Structured output prompting", html: `
        <p>Structured output facilitates output processing: a program can read the reply and reject one that does not fit. The three replies are illustrative, written by hand:</p>
        ${codeBlock(CODE.parseReview)}
        ${codeBlock(CODE.parseReviewOut, "out")}
        ${demo("structured", "Demo 8 · Read the reply with a program", "step through the replies")}
        <p>Some model APIs can also enforce a JSON schema on the reply; the slide links Anthropic's <a href="https://platform.claude.com/docs/en/build-with-claude/structured-outputs" target="_blank" rel="noopener">structured outputs</a> documentation.</p>` },
      { id: "template", title: "A template to adapt, not blindly copy", html: `
        ${codeBlock(`Goal: <observable change>
Context / input: <current material>
Constraints: <what must stay true>
Deliverable: <usable output>
Checks: <acceptance evidence>
If blocked: <report the missing fact>`, "out")}
        <p><b>Optional additions:</b> a relevant example; a short staged workflow; a source / version; a budget or stopping rule.</p>
        <p>Delete fields that add no value to your actual task. (<code>build_prompt</code> does this for empty fields; Demo 1 lets you add the optional ones.) Note the last line: <em>if blocked, report the missing fact</em> instead of guessing.</p>
        <table><tr><th colspan="2">The habit worth keeping</th></tr>
        <tr><td><b>Make intent explicit.</b></td><td>Check the artifact.</td></tr>
        <tr><td><b>Bring the right evidence.</b></td><td>Revise from the failure.</td></tr></table>
        ${callout("pattern", "A GOOD PROMPT STARTS A RELIABLE HANDOFF", `<p>A good prompt starts a reliable handoff; verification completes it.</p>`)}` },
    ],
    takeaways: ["More text is not proof.", "A plan names its decisions.", "Ask for JSON; check it in code."],
  },
  {
    slug: "6-scaling", nav: "Test-time scaling", title: "Test-time Scaling",
    subtitle: "When the output is still wrong after several attempts",
    abstract: "A fixed model can spend more effort on one task: go deeper, sample more candidates, or search. Which one pays depends on the task and the verifier.",
    tags: ["test-time compute", "sequential", "parallel", "search", "allocation"],
    hero: "parallelMini", heroCaption: "Slide 35: more candidates, more chances one is right (illustration: p = 0.25, independent samples).",
    sections: [
      { id: "compute", title: "A fixed model can spend more effort per task", html: `
        <p>What if the output is still incorrect after several attempts? (Slide 30: <em>Game Over</em>.) Not yet.</p>
        <table><tr><th>TRAINING-TIME COMPUTE</th><th>TEST-TIME COMPUTE</th></tr>
        <tr><td>Training data + optimization</td><td>One new task + extra inference</td></tr>
        <tr><td>Update model weights</td><td>Keep model weights fixed</td></tr>
        <tr><td>Amortize cost across future tasks</td><td>Spend extra effort on this task</td></tr></table>
        <p>Test-time scaling increases inference compute; it does not require updating model weights.</p>
        <table><tr><th>SEQUENTIAL</th><th>PARALLEL</th><th>SEARCH</th></tr>
        <tr><td>Reason longer</td><td>Sample candidates</td><td>Expand promising steps</td></tr>
        <tr><td>Revise after feedback</td><td>Vote or score outputs</td><td>Prune or backtrack</td></tr>
        <tr><td>One path, more steps</td><td>More paths to compare</td><td>Choose where to explore</td></tr></table>
        <p>More depth, more candidates, and better search are different allocation choices.</p>` },
      { id: "sequential", title: "Sequential scaling", html: `
        <table><tr><th>DRAFT</th><th>FEEDBACK</th><th>REVISE + RETEST</th></tr>
        <tr><td>All customers pay 80%</td><td>Nonmember: expected 100, got 80</td><td>Only members receive the discount</td></tr></table>
        <p>In code (ours): the “model” is a list of versions in order, as in Lecture 2's scripted LLM. Every attempt runs the tests again on <em>that</em> version.</p>
        ${codeBlock(CODE.sequential)}
        ${codeBlock(CODE.sequentialOut, "out")}
        ${demo("sequential", "Demo 9 · Draft, feedback, revise, retest", "step")}
        ${callout("pitfall", "PITFALL", `<p><b>A later test must run on the revised code, not reuse an old result.</b> Extra steps help when they produce new evidence or correct a specific mistake.</p>`)}` },
      { id: "parallel", title: "Parallel scaling", html: `
        <p>Generate several candidates, then select one. <b>Self-consistency</b>: vote on answers. <b>Best-of-N</b>: rank with a verifier. Both depend on selection quality.</p>
        <p>If each candidate is correct with probability <code>p</code>, and candidates are independent, then P(at least one correct) = 1 − (1 − p)<sup>N</sup>. The slide's illustration uses p = 0.25:</p>
        ${codeBlock(CODE.parallel)}
        ${codeBlock(CODE.parallelOut, "out")}
        ${predict("With 8 candidates, a correct one is in the pool 90% of the time. How often do you end up with a correct answer?",
          `<p>It depends on the selector. A simulation (ours, fixed seed) compares a perfect verifier with picking a candidate at random:</p>${codeBlock(CODE.simulate)}${codeBlock(CODE.simulateOut, "out")}`)}
        ${demo("parallel", "Demo 10 · Sample, then select", "change p, N and the selector")}
        <p>A correct candidate in the pool is useful only if the selector can identify it.</p>` },
      { id: "search", title: "Search: explore branches", html: `
        <p>A search controller generates a few branches, evaluates intermediate states, expands or backtracks, and stops when the budget is exhausted. A toy controller (ours); the scores stand in for an evaluator and are made up:</p>
        ${codeBlock(CODE.search)}
        ${codeBlock(CODE.searchOut, "out")}
        ${demo("search", "Demo 11 · Expand, prune, stop", "step; change the budget")}
        <p>Search spends compute on promising intermediate states, not just complete answers.</p>` },
      { id: "allocate", title: "Allocate effort by difficulty", html: `
        <table><tr><th>CLEAR + EASY</th><th>HARD + CHECKABLE</th><th>MISSING INFORMATION</th></tr>
        <tr><td>One attempt</td><td>Try diverse candidates</td><td>Retrieve facts or ask</td></tr>
        <tr><td>Run a cheap check</td><td>Use informative feedback</td><td>Change the approach</td></tr>
        <tr><td>Stop if acceptance is met</td><td>Reserve budget to verify</td><td>Stop blind retries</td></tr></table>
        <p>The best use of extra compute depends on the task and the available verifier. When information is missing, more samples of the same prompt can't supply it.</p>
        ${demo("allocate", "Demo 12 · Which column?", "pick for each task")}
        <p><b>Still does not work?</b> The deck's last answer is a joke: <em>you may need AGI</em>. Until then, go back to specify and verify.</p>` },
    ],
    takeaways: ["Same weights, more inference.", "Retest the revised code.", "A pool helps only with a good selector."],
  },
  {
    slug: "7-summary", nav: "Summary", title: "Summary and Practice",
    subtitle: "Check yourself, then rewrite one of your own prompts",
    abstract: "A map of the lecture, five self-check questions, and four exercises with solutions.",
    tags: ["knowledge map", "self-check", "exercises"],
    hero: "toc",
    sections: [
      { id: "map", title: "Knowledge map", html: `<div class="map">
        <div class="card"><h3>Specify and verify</h3><ul><li>Goal, context, examples → workflow, tests</li><li>Three questions visible</li><li>The model sees only what you wrote</li></ul></div>
        <div class="card"><h3>Complete request</h3><ul><li>Verb and object</li><li>Input / output contract, edge cases</li><li>Minimal diff + test evidence</li></ul></div>
        <div class="card"><h3>Roles and data</h3><ul><li>Role sets style, not expertise</li><li>Add a method</li><li>Data in tags; minimal code region</li></ul></div>
        <div class="card"><h3>Examples</h3><ul><li>Zero-shot first</li><li>Few-shot: boundary or format</li><li>Coverage, not count</li></ul></div>
        <div class="card"><h3>Plans and structure</h3><ul><li>CoT: more text is not proof</li><li>Plans name decisions</li><li>Structured output; adapt the template</li></ul></div>
        <div class="card"><h3>Test-time scaling</h3><ul><li>Sequential: retest the revision</li><li>Parallel: selection quality</li><li>Search; allocate by difficulty</li></ul></div></div>` },
      { id: "check", title: "Check your understanding", html: `<div data-demo="quiz"><div class="demo-body"></div></div>` },
      { id: "exercises", title: "Exercises", html: `
        <h3>Exercise 1 ★ (fill the boxes)</h3>
        <p>Take a prompt you wrote this week. Put each sentence into <code>request</code>-style fields and run <code>unanswered</code>. Which box was empty? Rewrite the prompt.</p>
        <h3>Exercise 2 ★ (modify)</h3>
        <p>Add a check to <code>check_contract</code> that <code>average</code> still accepts one argument: call <code>inspect.signature(f)</code> and fail if it does not have exactly one parameter. Which line of the complete request does this check?</p>
        <details class="reveal"><summary>Solution</summary>${codeBlock(`import inspect


def check_signature(f):
    params = list(inspect.signature(f).parameters)
    print("PASS" if params == ["xs"] else "FAIL", f"{f.__name__}{inspect.signature(f)}")


check_signature(average_fixed)
check_signature(lambda xs, default=None: default)`)}${codeBlock(`PASS average_fixed(xs)
FAIL <lambda>(xs, default=None)`, "out")}<p>It checks <em>“Preserve the signature”</em>. <code>check_contract</code> already checks <em>“and input list”</em>.</p></details>
        <h3>Exercise 3 ★★ (coverage)</h3>
        <p>Extend <code>labels_missing</code> into a <code>coverage_report</code> that also warns when all examples share their first word (the slide's <em>“same wording every time”</em>). Run it on <code>weak</code> and <code>stronger</code>.</p>
        <details class="reveal"><summary>Solution</summary>${codeBlock(`def coverage_report(examples):
    notes = [f"no {label} example" for label in labels_missing(examples)]
    first_words = {text.split()[0].lower() for text, _ in examples}
    if len(first_words) == 1:
        notes.append(f"every example starts with {first_words.pop()!r}")
    return notes or ["looks varied"]


print("weak:    ", coverage_report(weak))
print("stronger:", coverage_report(stronger))`)}${codeBlock(`weak:     ['no FEATURE example', 'no QUESTION example', "every example starts with 'crashes'"]
stronger: ['looks varied']`, "out")}<p>A check like this catches only the obvious problems; an ambiguous-looking case still needs you.</p></details>
        <h3>Exercise 4 ★★ (allocate)</h3>
        <p>For each task, pick a column of slide 37 and say what you would do: (a) rename a variable in one file; (b) a flaky test that fails one run in ten, with a test suite you can run; (c) “make the export match what the customer wants”, with no spec.</p>
        <details class="reveal"><summary>Solution</summary><p>(a) Clear + easy: one attempt, run the tests once, stop. (b) Hard + checkable: try several candidate fixes, run the test many times on each, keep budget to verify. (c) Missing information: ask the customer (or find the spec) before generating anything; retries won't supply the facts.</p></details>` },
      { id: "terms", title: "Key terms and further reading", html: `
        <p class="tags">${["specify", "verify", "conditional input", "instructions", "context", "contract", "edge case", "complete request", "role prompt", "delimiter tags", "minimal code region", "zero-shot", "few-shot", "decision boundary", "coverage", "chain-of-thought", "planning prompt", "structured output", "template", "test-time compute", "sequential scaling", "parallel scaling", "self-consistency", "best-of-N", "verifier", "search"].map((t) => `<span class="tag">${t}</span>`).join("")}</p>
        <ul><li>Anthropic, <em>Structured outputs</em>. <a href="https://platform.claude.com/docs/en/build-with-claude/structured-outputs" target="_blank" rel="noopener">platform.claude.com</a></li>
        <li>Claude Code system prompts (collection; the auto mode rule reviewer is on slide 15). <a href="https://github.com/Piebald-AI/claude-code-system-prompts" target="_blank" rel="noopener">github.com/Piebald-AI</a></li>
        <li>C. Snell et al., <em>Scaling LLM Test-Time Compute Optimally can be More Effective than Scaling Model Parameters</em>. <a href="https://arxiv.org/abs/2408.03314" target="_blank" rel="noopener">arXiv:2408.03314</a></li>
        <li>N. Muennighoff et al., <em>s1: Simple test-time scaling</em>. <a href="https://arxiv.org/abs/2501.19393" target="_blank" rel="noopener">arXiv:2501.19393</a></li>
        <li>X. Wang et al., <em>Self-Consistency Improves Chain of Thought Reasoning in Language Models</em>. <a href="https://arxiv.org/abs/2203.11171" target="_blank" rel="noopener">arXiv:2203.11171</a></li>
        <li>S. Yao et al., <em>Tree of Thoughts: Deliberate Problem Solving with Large Language Models</em>. <a href="https://arxiv.org/abs/2305.10601" target="_blank" rel="noopener">arXiv:2305.10601</a></li>
        <li>T. Kojima et al., <em>Large Language Models are Zero-Shot Reasoners</em>. <a href="https://arxiv.org/abs/2205.11916" target="_blank" rel="noopener">arXiv:2205.11916</a></li></ul>` },
    ],
    takeaways: ["Specify: intent, contract, context, examples.", "Verify: tests, structure, evidence.", "Extra effort pays only with a verifier."],
  },
];

const QUIZ = [
  { q: "Which is <b>not</b> one of the three questions the slides say to keep visible?",
    opts: ["What should change?", "What must stay true?", "How will we know?", "Which role should the model play?"],
    a: 3, why: "The three questions are what should change, what must stay true, and how will we know. A role guides style; it isn't one of them." },
  { q: "The slides' contract says <code>[]</code> returns <code>None</code>. A model's fix returns <code>0</code> for <code>[]</code>. What went wrong, if the prompt only said “fix empty lists”?",
    opts: ["Nothing: 0 is the mean of nothing", "The prompt left the edge case to the model's preference", "The model ignored the standard library", "The fix changed the signature"],
    a: 1, why: "An edge case is part of the requirement, not a model preference. State what [] must return and check it." },
  { q: "What does adding “You are a senior engineer.” to a prompt do, according to the slides?",
    opts: ["Grants senior-level expertise", "Guides style and perspective, but grants no expertise", "Turns on chain-of-thought", "Nothing at all"],
    a: 1, why: "A role can guide style and perspective; it does not grant expertise. Add a method: check input boundaries, find one concrete failure, cite the line." },
  { q: "When do the slides suggest adding few-shot examples?",
    opts: ["Always: more examples are always better", "After a clear instruction is not enough, to show a decision boundary or a convention", "Only for classification tasks", "Never: zero-shot is always enough"],
    a: 1, why: "Try a clear instruction first. Examples communicate a decision boundary or a local convention, and they should be chosen for coverage, not count." },
  { q: "Each of 8 independent candidates is correct with p = 0.25. Why might you still get a wrong answer most of the time?",
    opts: ["Because 1 − 0.75⁸ is about 10%", "Because a correct candidate helps only if the selector can identify it", "Because parallel sampling changes the weights", "Because N must be at least 16"],
    a: 1, why: "A correct one is in the pool about 90% of the time, but a selector that picks blindly is still right only 25% of the time." },
];
