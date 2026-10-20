// L06 content, adapted from csc4801/notes/L06-requirements.md (which follows the slides in order).

const demo = (name, title, instr, hint = "") =>
  `<div class="card demo" data-demo="${name}"><div class="head"><span class="title">${title}</span><span>${instr}</span></div>
   <div class="demo-body"></div>${hint ? `<p class="hint">${hint}</p>` : ""}</div>`;
const callout = (kind, label, body) => `<div class="callout ${kind}"><b>${label}</b>${body}</div>`;
const predict = (q, a) => callout("predict", "PREDICT", `<p>${q}</p><details class="reveal"><summary>Show the answer</summary>${a}</details>`);
const quote = (s) => `<blockquote style="margin:10px 0;padding:8px 14px;border-left:3px solid var(--amber);color:var(--ink-2)">${s}</blockquote>`;
const out = (s) => codeBlock(s, "out");

const LECTURE = {
  number: 6,
  title: "Requirements",
  tagline: "Decide what to build before an agent builds it",
  lead: "Vibe coding works for a toy project; a real system needs software engineering, and it starts with requirements. Walk the requirement engineering cycle with the slides' elevator system: simulated interviews, LTL and model checking, Lean specs, SpecGen, consistency checks, feature maps — and the ambiguity that natural language leaves behind.",
  heroDemo: "cycleMini",
  heroLabel: "The requirement engineering cycle",
  heroCaption: "Elicitation, modeling, specification, validation, management — and round again.",
  whyTitle: "Why this lecture matters",
  whySub: "Three ideas to carry into every project you hand to an agent",
  why: [
    ["Beyond vibe coding", "One prompt builds a 2048 game. A <b>real-world complex project</b> needs software engineering, and requirements come first."],
    ["Precise enough to check", "Formal specs (<b>LTL</b>, <b>Lean 4</b>) let a machine check behaviour and hand back a <b>counterexample</b>."],
    ["Words hide bugs", "<em>Insufficient user balance</em>: is that <code>&lt;</code> or <code>&lt;=</code>? Ambiguity lives at the boundary."],
  ],
  ctaTitle: "Ready to walk the cycle?",
  minutes: "About 45–60 minutes",
};

const CHAPTERS = [
  {
    slug: "1-why", nav: "Why requirements", title: "From Toy Projects to Software Engineering",
    subtitle: "Vibe coding is cool — but how do we handle complex systems?",
    abstract: "An agent can build a toy project from one prompt. Real-world complex projects need software engineering, and its first stage is requirement engineering: a cycle of five activities.",
    tags: ["vibe coding", "five stages", "the RE cycle"],
    hero: "cycleMini", heroCaption: "Slide 7: the requirement engineering cycle.",
    sections: [
      { id: "vibe", title: "Vibe coding", html: `
        <p>An agent can take a <b>toy project</b> from one prompt to working code. Type <em>“Implement a 2048 game.”</em> and a few minutes later you have a game. This is <b>vibe coding</b>, and it is cool. But how do we handle <b>complex systems</b>, real-world projects with many users and many features? To get from the agent to a real-world complex project, we need <b>software engineering</b>.</p>
        <p>AI-assisted software engineering, as this course covers it, runs in five stages:</p>
        <table><tr><th>Stage</th><th></th></tr>
        <tr><td><b>Requirement engineering</b></td><td>today</td></tr><tr><td>Coding</td><td></td></tr><tr><td>Testing / Verification</td><td></td></tr><tr><td>Repair</td><td></td></tr><tr><td>AIOps</td><td></td></tr></table>
        <p>Today is the first stage: deciding <em>what</em> to build.</p>` },
      { id: "cycle", title: "The requirement engineering cycle", html: `
        ${callout("pattern", "THE REQUIREMENT ENGINEERING CYCLE", `<p>Requirement engineering is a cycle of five activities (slide 7):</p>
          <ol><li><b>Elicitation</b>: AI extracts latent needs from unstructured meeting transcripts and user review.</li>
          <li><b>Modeling</b>: AI identifies entities/relationships to construct UML or formal specifications.</li>
          <li><b>Specification</b>: requirements are determined and documented.</li>
          <li><b>Validation</b> (the section slide says <em>Verification</em>): AI scores requirements against rules.</li>
          <li><b>Management</b>: AI refines and adapts requirements.</li></ol><p>Then back to elicitation: requirements are never finished.</p>`)}
        ${demo("cycle", "Demo 1 · Walk the cycle", "step, or click an activity", "Each activity's one-line definition is the slide's own; the second line previews what the later chapters show.")}` },
    ],
    takeaways: ["Vibe coding: fine for a toy project.", "Real systems need software engineering.", "RE is a cycle of five activities."],
  },
  {
    slug: "2-elicitation", nav: "Elicitation", title: "Elicitation",
    subtitle: "Find the needs nobody wrote down",
    abstract: "AI extracts latent needs from transcripts and reviews, and agents can simulate users to be interviewed. The running example: an elevator control system.",
    tags: ["latent needs", "simulated users", "elevator REQ1–REQ5"],
    hero: "reqsMini", heroCaption: "Slide 12: the elevator system's five requirements.",
    sections: [
      { id: "latent", title: "Latent needs and simulated users", html: `
        ${quote("AI extracts latent needs from unstructured meeting transcripts and user review.")}
        <p>A <b>latent need</b> is one that users have but don't say out loud. It hides in long, messy text: meeting transcripts, user reviews. A second idea: <b>we could use agents to simulate users</b> to understand requirements.</p>
        <p>Slide 11 shows a framework for this (arXiv:2404.16045) in four stages:</p>
        <table><tr><th>Stage</th><th>What happens</th></tr>
        <tr><td>Agent generation</td><td>Create many user agents, serially or in parallel, with <em>diversity sampling</em> so they differ.</td></tr>
        <tr><td>Product experience generation</td><td>Each agent writes its experience step by step: action, observation, challenge.</td></tr>
        <tr><td>Agent interview</td><td>An interviewer asks each agent question <em>k</em>, appending earlier questions and answers.</td></tr>
        <tr><td>Latent needs identification</td><td>Extract needs from each interview, keep those that meet the latent-need criteria, generate a report.</td></tr></table>` },
      { id: "elevator", title: "The running example: an elevator", html: `
        <p>For an <b>elevator control system</b> (slide 12), agents play four kinds of user: <b>children</b>, <b>the aged</b>, <b>workers</b> and <b>managers</b>. Each one is interviewed. The result is a list of requirements in natural language:</p>
        <table><tr><th></th><th>Requirement (slide 12)</th></tr>
        ${Object.entries(REQS).map(([id, t]) => `<tr><td><b>${id}</b></td><td>${esc(t)}</td></tr>`).join("")}</table>` },
      { id: "toy", title: "A toy interview", html: `
        <p>Here is the last stage as a toy. The user agents are scripted: their answers are made up for illustration, not taken from the slides. A real system would ask an LLM whether a need is already covered; <code>covered_by</code> just looks for a keyword.</p>
        ${demo("interview", "Demo 2 · Interview the simulated users", "← → keys step, or pick a user")}
        ${codeBlock(CODE.elicit)}${out(CODE.elicitOut)}
        <p>Three of the four needs are not in REQ1–REQ5. That is the point of interviewing many different users: each one brings needs the others don't have.</p>` },
    ],
    takeaways: ["Latent needs: had, but not said.", "Agents can simulate users to interview.", "Many users, many needs."],
  },
  {
    slug: "3-modeling", nav: "Modeling", title: "Modeling",
    subtitle: "From a conversation to a formal specification",
    abstract: "Natural language is easy to write but hard to check. LTL describes behaviour over time, a model checker finds counterexamples, and Lean 4 proves specifications.",
    tags: ["LTL", "nl2spec", "model checker", "Lean 4"],
    hero: "ltlMini", heroCaption: "G (red -> X green) on two traces of a traffic light.",
    sections: [
      { id: "translate", title: "How to translate?", html: `
        ${quote("AI identifies entities/relationships to construct UML or formal specifications.")}
        <p><b>How to translate?</b> A conversation (our REQ list) goes to an agent, and specifications come out. The person on the slide is confused: natural language is easy to write but hard to check. A <b>formal</b> specification can be checked by a machine. The slides show two formal languages: linear temporal logic and Lean 4.</p>` },
      { id: "ltl", title: "Linear temporal logic", html: `
        <p><b>LTL (Linear Temporal Logic)</b> is a way to write rules about how a system behaves over time. Imagine a traffic light. Ordinary logic can say, <em>“the light is red now.”</em> LTL can say things like:</p>
        <table><tr><th>Formula</th><th>Meaning</th></tr>
        <tr><td><code>G red -&gt; ...</code></td><td>Whenever the light is red, … (<b>G</b> means <em>always</em>)</td></tr>
        <tr><td><code>F green</code></td><td>The light will eventually be green (<b>F</b> means <em>eventually</em>)</td></tr>
        <tr><td><code>G (red -&gt; X green)</code></td><td>Whenever it's red, it's green in the next step (<b>X</b> means <em>next</em>)</td></tr></table>
        <p>Here is a small evaluator. A trace is a list of states, one per step. One simplification is ours: real LTL talks about executions that go on forever; we check finite traces, so <code>X</code> fails at the last step and <code>F</code> must happen before the trace ends.</p>
        ${codeBlock(CODE.ltl)}${out(CODE.ltlOut)}
        ${demo("ltl", "Demo 3 · Check a formula on a trace", "pick a trace and a property, then step", "The third property is Exercise 1's. Python's all() and any() stop early; so does this demo.")}
        ${predict("The light never turns red in the third trace. Why does <code>G (red -&gt; X green)</code> still hold there?",
          `<p>An implication is true whenever its left side is false. The light is never red, so “whenever it is red, …” is never tested, and the rule holds <em>vacuously</em>. A rule that only says what happens <em>after</em> red can't catch a light that is stuck on yellow; you need another rule, such as <code>F green</code>.</p>`)}` },
      { id: "nl2spec", title: "From English to LTL: nl2spec", html: `
        <p>Writing LTL by hand is hard. <b>nl2spec</b> (slide 16; <a href="https://github.com/realChrisHahn2/nl2spec" target="_blank" rel="noopener">github.com/realChrisHahn2/nl2spec</a>, arXiv:2303.04864) lets an LLM translate a sentence. The slide's sentence is <em>“Globally, grant 0 and grant 1 do not hold at the same time until it is allowed.”</em> Two ideas are marked on the slide:</p>
        <ul><li><b>Decompose.</b> The LLM splits the sentence into <em>subtranslations</em>: <code>globally</code> to <code>G</code>, <code>until</code> to <code>U</code>, <code>grant 0</code> to <code>g0</code>, and so on, each with a confidence.</li>
        <li><b>User confirmation.</b> The user checks each subtranslation, edits or deletes it, then asks for the final formula: <code>G((!((g0 &amp; g1)) U a))</code>.</li></ul>
        <p>The slide's settings use 3 tries. The confidence is the share of tries that gave the same subtranslation (nl2spec computes it from how many of the sampled runs agree). In the toy below the three tries are scripted. How each try splits the sentence is our guess, chosen so that the numbers come out as on slide 16.</p>
        ${demo("nl2spec", "Demo 4 · Three tries, then confirm", "step through the tries")}
        ${codeBlock(CODE.nl2spec)}${out(CODE.nl2specOut)}
        <p>Low confidence tells the user where to look first. The human stays in the loop.</p>` },
      { id: "checker", title: "Model checker", html: `
        <p>Give the checker two things:</p>
        <ul><li><b>A model of the system</b>: its possible states and transitions.</li>
        <li><b>An LTL property</b>, such as <code>G (request -&gt; F response)</code> (“every request eventually gets a response”).</li></ul>
        <p>The checker explores the model's possible executions. If the property fails, it returns a <b>counterexample</b>: an execution showing how it can fail.</p>
        <p>The toy checker below handles only this one kind of property, <code>G (p -&gt; F q)</code>. It walks every path; a counterexample reaches <code>p</code> and then never reaches <code>q</code>, because it goes round a loop without <code>q</code> or stops. (Real model checkers handle any LTL formula and much larger models.)</p>
        ${demo("checker", "Demo 5 · Explore every execution", "pick a model, then step", "Amber tags: the part of the path where a request is waiting.")}
        ${codeBlock(CODE.checker)}${out(CODE.checkerOut)}
        <p>Model B can stay <code>busy</code> forever. A test might never hit that path; the checker looks at all of them and hands back the exact execution.</p>` },
      { id: "lean", title: "Lean 4", html: `
        <p><b>Lean 4</b> is a programming language and <b>proof assistant</b>. You can use it to write mathematical statements or software specifications, then write proofs that Lean checks for correctness.</p>
        <p>Slide 19's function (pseudocode), and the <b>specification</b> — the result must be at least as large as both inputs (slide 20):</p>
        ${codeBlock(CODE.maxPseudo, "repl")}${codeBlock(CODE.lean, "repl")}
        <ol><li><code>a ≤ result</code>: the result is at least a.</li><li><code>b ≤ result</code>: the result is at least b.</li><li><code>result = a ∨ result = b</code>: the result is one of the inputs.</li></ol>
        <p>We can't run Lean here, so here is <code>IsMaximum</code> in Python. Lean <em>proves</em> the spec for every natural number; <code>check</code> only tries every <code>a, b</code> below 10. That is a test, not a proof.</p>
        ${codeBlock(CODE.maxSpec)}${out(CODE.maxSpecOut)}
        ${predict("Drop condition 3 and keep only “at least as large as both inputs”, the English on slide 20. Which of the three functions pass now?",
          `${codeBlock(CODE.weakSpec)}${out(CODE.weakSpecOut)}<p><code>always_big</code> returns a million and passes. The English spec was too weak; condition 3 says what we really meant.</p>`)}
        ${demo("maxspec", "Demo 6 · A spec against three functions", "choose a spec and a function, then step", "Hover a cell to see a, b and the result.")}
        <p>A specification is only as good as what it rules out.</p>
        ${callout("pitfall", "PITFALL", `<p><b>A checked spec can still be the wrong spec.</b> The checker proves the code meets the spec. Nothing checks that the spec says what the users wanted. That is why the human confirms each piece in nl2spec, and why validation (Chapter 5) exists.</p>`)}
        <p><b>NL2Lean</b> (slide 21) translates natural-language sentences into Lean 4 statements with an LLM translator, trained with feedback: several reward models score each Lean statement, and the combined reward goes back to the translator.</p>` },
    ],
    takeaways: ["LTL: G always, F eventually, X next.", "A model checker returns a counterexample.", "A spec is as good as what it rules out."],
  },
  {
    slug: "4-specification", nav: "Specification", title: "Specification",
    subtitle: "Requirements are determined and documented",
    abstract: "An LLM writes specifications for code, a verifier checks them, and the errors go back. SpecGen adds a second phase: mutate the candidates and verify again.",
    tags: ["JML", "verifier feedback", "SpecGen", "mutation"],
    hero: "specgenMini", heroCaption: "SpecGen on max: two tries, then mutation.",
    sections: [
      { id: "direct", title: "Directly call LLMs", html: `
        ${quote("Requirements are determined and documented.")}
        <p>The pipeline grows: <b>conversation → agent → specifications → implementation</b>. The person on the slide now sits between the specification and the implementation: the code is checked against the spec.</p>
        <p>The simplest way (slide 24): give an LLM the code and ask it to write the specification as annotations in the code, here for a Java class in <b>JML</b> (the Java Modeling Language; the name is ours, the slide shows <code>//@ spec</code>). A verifier checks them. If it fails, the error goes back to the model:</p>
        ${codeBlock(CODE.jmlFeedback, "out")}` },
      { id: "specgen", title: "Multiple tries: SpecGen", html: `
        <p><b>SpecGen</b> (slide 25; arXiv:2401.08807) has two phases:</p>
        <ol><li><b>Conversation-driven specification generation</b>: prompt + input code go to the LLM; it writes specifications; a verifier checks them; the errors go back in the conversation.</li>
        <li><b>Mutation-based specification generation</b>: if that fails, a <b>mutator</b> makes small changes to the candidates, a <b>selector</b> picks among them, and the <b>verifier</b> checks again.</li></ol>
        <p>The toy below runs both phases on <code>max_slides</code>. The “LLM” is scripted; a spec is a Python expression over <code>a</code>, <code>b</code> and <code>result</code>; the “verifier” is a bounded check (a stand-in for a real verifier). The mutator changes one comparison operator at a time.</p>
        ${demo("specgen", "Demo 7 · Generate, verify, mutate", "← → keys step")}
        ${codeBlock(CODE.specgen)}${out(CODE.specgenOut)}
        <p>Notice what got selected: conditions 1 and 2 of <code>IsMaximum</code>, without condition 3. The verifier accepts it because it is <em>true</em> of the code. Whether it is <em>strong enough</em> is a separate question.</p>` },
    ],
    takeaways: ["LLM writes the spec; a verifier checks it.", "Errors go back: “please generate again”.", "Verified ≠ strong enough."],
  },
  {
    slug: "5-validation", nav: "Validation & management", title: "Validation and Management",
    subtitle: "Score the requirements, then keep them up to date",
    abstract: "LLMs check requirements for consistency and rate them like human graders do. When the world changes, AI detects the changes and a feature map shows what they affect.",
    tags: ["consistency", "SRS qualities", "change detection", "feature map"],
    hero: "featuremapMini", heroCaption: "Slide 32's timer features, in build order.",
    sections: [
      { id: "consistency", title: "Check consistencies", html: `
        ${quote("AI scores requirements against rules.")}
        <p><b>Check consistencies</b> (slide 27; Fantechi et al., RE 2023). An LLM (ChatGPT in that study) reads the requirement list and looks for requirements that contradict each other.</p>
        <p>Look at our own list. REQ3 says: on a floor button inside, move to that floor. REQ5 says: in the Overload state, ignore that button. REQ4 says: in Overload, do not move. The toy below writes each requirement as <em>(event, state, action)</em>. That reading is ours, not the slides'. It then reports every pair that can fire on the same event in the same state with clashing actions.</p>
        ${demo("consistency", "Demo 8 · Check every pair", "← → keys step")}
        ${codeBlock(CODE.consistency)}${out(CODE.consistencyOut)}
        <p>Some of these a human would resolve at once (“REQ5 is the exception to REQ3”). Others are real gaps: nothing says what the Up button on a floor does while the cabin is overloaded. Either way, the list must say so. A check like this hands a human the questions to ask.</p>` },
      { id: "human", title: "Comparable to humans, and a full pipeline", html: `
        <p><b>Comparable performance to human</b> (slide 28, “An evaluation of LLM4RE”, arXiv:2404.17842). The chart compares requirement documents scored by human graders, for each section of a software requirements specification (SRS): <em>functional</em>, <em>performance</em>, <em>design constraints</em>, <em>external interfaces</em> and <em>security requirements</em>. Each is rated on four qualities: <b>unambiguous</b>, <b>understandable</b>, <b>correct</b>, <b>verifiable</b>. The bars are for documents by a human, CodeLlama 34b and GPT-4 (ChatGPT), and they are close. The instructor's note on the <code>.pptx</code>: <em>it evaluates the quality of specification generation, not LLM-based analysis</em>.</p>
        <p><b>Full pipeline</b> (slide 29; Bertram et al., RE 2023, automotive requirements):</p>
        <table><tr><th>Step</th><th></th></tr>
        <tr><td>Natural language specification</td><td></td></tr>
        <tr><td>Transformation to structured English</td><td>guided by example data</td></tr>
        <tr><td>Structured English specification</td><td></td></tr>
        <tr><td>Transformation to TCTL</td><td>guided by specification patterns</td></tr>
        <tr><td>TCTL specification + preconditions and constants</td><td></td></tr>
        <tr><td>Consistency checking</td><td></td></tr>
        <tr><td>Inconsistent requirements</td><td>go to a human, who evaluates them and improves the original text</td></tr></table>
        <p>(TCTL is a timed temporal logic, a relative of LTL with clocks; the expansion is ours.)</p>` },
      { id: "management", title: "Management", html: `
        ${quote("AI refines and adapts requirements.")}
        <p><b>Four-layer change detection for revising specifications</b> (slide 31; Abualhaija et al., RE 2024, the MURCIA approach). When a legal text changes from a base version <b>B</b> to a modified version <b>M</b>, requirements built on it must change too. With a human analyst, an LLM is prompted layer by layer:</p>
        <ol><li><b>Pre-processing</b>: pair the provisions of B and M.</li>
        <li><b>Identify textual changes</b> (<code>prompt_T</code>): which words changed.</li>
        <li><b>Identify semantic changes</b> (<code>prompt_S</code>): what the meaning now is.</li>
        <li><b>Identify deontic changes</b> (<code>prompt_D</code>): what is now required, permitted or forbidden.</li></ol>` },
      { id: "featuremap", title: "Feature map", html: `
        <p><b>Feature map</b> (slide 32; arXiv:2511.02399): dependencies across features. Agents build an overall design (business analyst, architect), then a feature map (feature extractor, feature planner), then develop the features one by one (chief programmer, programmer), passing each one a feature context (business, design and implementation layers). The slide's map is for a timer app. A dependency map tells you the order to build in; Python's <code>graphlib</code> computes it:</p>
        ${codeBlock(CODE.featureMap)}${out(CODE.featureMapOut)}
        ${demo("featuremap", "Demo 9 · Build order and change impact", "step the rounds, or click a feature")}
        <p>Features in the same round don't depend on each other. When a requirement changes, the map also tells you which later features it can affect.</p>
        <p>That closes the cycle: elicitation, modeling, specification, validation, management, and back to elicitation.</p>
        ${demo("classify", "Demo 10 · Which activity is it?", "sort nine AI tasks into the cycle")}` },
    ],
    takeaways: ["LLMs check consistency and rate requirements.", "Change detection: textual, semantic, deontic.", "A feature map orders the work."],
  },
  {
    slug: "6-debate", nav: "Strengths & weaknesses", title: "Strengths and Weaknesses",
    subtitle: "Most important, or not needed at all?",
    abstract: "Requirements make us think before acting and navigate agents. But informal language is ambiguous, specs must be revised often, and switching between code and spec is work.",
    tags: ["debate", "ambiguity", "waterfall", "spec workload"],
    hero: "code:ambiguity", heroCaption: "“Insufficient user balance reject transactions.”",
    sections: [
      { id: "debate", title: "Two views, three strengths", html: `
        <p><b>What are the strengths and weaknesses?</b> Two views (slide 35). In AI-assisted software engineering:</p>
        <ul><li><em>Requirements are the most important.</em></li><li><em>We do not need requirements, as code can be directly generated.</em></li></ul>
        <table><tr><th>Strength</th><th></th></tr>
        <tr><td><b>Thinking before action</b></td><td>Decide what to build before an agent builds it.</td></tr>
        <tr><td><b>Software engineering life cycle</b></td><td>Requirements are the first stage of the cycle, not a one-off prompt.</td></tr>
        <tr><td><b>Navigating AI agents</b></td><td>A requirement tells the agent where to go, and you when it has arrived.</td></tr></table>
        <p>(The slide has the three titles; the second column is our gloss.)</p>` },
      { id: "ambiguity", title: "Informal language incurs ambiguity", html: `
        <p>Slide 37: <em>“Insufficient user balance reject transactions.”</em> The agent must guess: is the balance insufficient when it is <code>&lt;</code> the amount, or <code>&lt;=</code>?</p>
        ${codeBlock(CODE.ambiguity)}${out(CODE.ambiguityOut)}
        ${demo("ambiguity", "Demo 11 · Where do the two readings differ?", "drag the sliders, or step the three cases")}
        <p>Both programs are reasonable readings, and they agree everywhere except at the <b>boundary</b>. That is where ambiguous requirements hide, and where tests rarely look unless someone asks.</p>
        ${callout("pitfall", "PITFALL", `<p><b>The fix is in the words, not the code.</b> Write the boundary into the requirement: <em>“Reject a transaction if its amount is greater than the user's balance.”</em> Now a balance equal to the amount is accepted, and every agent writes the same <code>&lt;</code>.</p>`)}` },
      { id: "revise", title: "Revising specs, and the cost of switching", html: `
        <p><b>We need to frequently revise the specifications</b> (slide 38). In the <b>waterfall model</b> the phases run in order: requirements analysis and specification; design and specification; coding and module testing; integration and system testing; delivery and maintenance. The arrows go back too: every later phase can send you back to change the specification.</p>
        <p><b>Much workload of switching writing code and spec</b> (slide 39). A spec-driven project keeps many documents next to the code. The slide's example folder holds <code>checklists/requirements.md</code>, <code>contracts/api.md</code>, <code>data-model.md</code>, <code>plan.md</code>, <code>quickstart.md</code>, <code>research.md</code>, <code>spec.md</code> and <code>tasks.md</code>. Every change to the code may mean changing several of them. (This layout is the one GitHub Spec Kit generates; the next lecture, <em>Requirements Exercise</em>, works with it.)</p>` },
    ],
    takeaways: ["Strengths: think first, a life cycle, navigation.", "Ambiguity hides at the boundary.", "Specs change; keeping them in step is work."],
  },
  {
    slug: "7-summary", nav: "Summary", title: "Summary and Practice",
    subtitle: "Check yourself, then write some LTL",
    abstract: "A map of the lecture, five self-check questions, and three exercises with solutions.",
    tags: ["knowledge map", "self-check", "exercises"],
    hero: "toc",
    sections: [
      { id: "map", title: "Knowledge map", html: `<div class="map">
        <div class="card"><h3>Why requirements</h3><ul><li>Vibe coding: toy projects</li><li>Real systems: software engineering</li><li>RE: a cycle of five activities</li></ul></div>
        <div class="card"><h3>Elicitation</h3><ul><li>Latent needs from transcripts, reviews</li><li>Agents simulate users</li><li>Elevator REQ1–REQ5</li></ul></div>
        <div class="card"><h3>Modeling</h3><ul><li>LTL: G, F, X (and U)</li><li>nl2spec: decompose, confirm</li><li>Model checker → counterexample; Lean 4</li></ul></div>
        <div class="card"><h3>Specification</h3><ul><li>LLM writes the spec (JML)</li><li>Verifier errors go back</li><li>SpecGen: conversation, then mutation</li></ul></div>
        <div class="card"><h3>Validation & management</h3><ul><li>Consistency checks; SRS qualities</li><li>Four-layer change detection</li><li>Feature map of dependencies</li></ul></div>
        <div class="card"><h3>Strengths & weaknesses</h3><ul><li>Think first; life cycle; navigation</li><li>Ambiguity: <code>&lt;</code> or <code>&lt;=</code>?</li><li>Revising specs; switching work</li></ul></div></div>` },
      { id: "check", title: "Check your understanding", html: `<div data-demo="quiz"><div class="demo-body"></div></div>` },
      { id: "exercises", title: "Exercises", html: `
        <h3>Exercise 1 ★ (write LTL)</h3>
        <p>Write <em>“whenever the light is red, it is eventually green”</em> as a formula tuple for <code>holds</code>, and check it on the three traces in <code>TRACES</code>. Does any trace break it?</p>
        <details class="reveal"><summary>Solution</summary>${codeBlock(CODE.ex1)}${out(CODE.ex1Out)}<p>None of them. The second trace is red twice but turns green in the end, which is all <code>F</code> asks. (The third holds vacuously, as before.) Compare <code>G (red -&gt; X green)</code>, which the second trace breaks. Try it in Demo 3 (Chapter 3), third property.</p></details>
        <h3>Exercise 2 ★★ (modify)</h3>
        <p>nl2spec's final formula uses <b>U</b> (<em>until</em>): <code>p U q</code> holds at step <code>i</code> if <code>q</code> holds at some step <code>j &gt;= i</code>, and <code>p</code> holds at every step from <code>i</code> up to <code>j - 1</code>. Add <code>"U"</code> to <code>holds</code> and check <code>G (no_both U allowed)</code> on two traces, where each state is now a set of what is true.</p>
        <details class="reveal"><summary>Solution</summary>${codeBlock(CODE.ex2)}${out(CODE.ex2Out)}<p>In <code>bad</code>, both grants hold at step 1, before <code>a</code> has happened.</p></details>
        <h3>Exercise 3 ★★ (design)</h3>
        <p>(a) Rewrite REQ3 so that it no longer clashes with REQ4 and REQ5, and say how its row in <code>RULES</code> changes. (b) The consistency check also flags REQ1 vs REQ4. Is that a real gap? Write one new requirement that closes it.</p>
        <details class="reveal"><summary>Solution</summary><p>(a) <em>“When the user presses any floor button inside the elevator and the system is not in the "Overload" state, the Elevator System shall …”</em>. Its state becomes “not Overload”, which does not overlap “Overload” (the toy's <code>overlap</code> would need to learn about “not”; Demo 8's checkbox does this). (b) Yes: nothing says what a call from a floor does during overload. For example: <em>“While the system is in the "Overload" state, the Elevator System shall keep calls from floor buttons and serve them after the overload condition is resolved.”</em> Whether calls are kept or dropped is the users' choice, so ask them.</p></details>` },
      { id: "terms", title: "Key terms and further reading", html: `
        <p class="tags">${["vibe coding", "requirement engineering", "elicitation", "latent need", "modeling", "UML", "formal specification", "linear temporal logic (LTL)", "always (G)", "eventually (F)", "next (X)", "until (U)", "nl2spec", "model checker", "counterexample", "Lean 4", "proof assistant", "specification", "JML", "SpecGen", "mutation", "validation", "verification", "consistency", "SRS", "TCTL", "management", "deontic change", "feature map", "ambiguity", "waterfall model"].map((t) => `<span class="tag">${t}</span>`).join("")}</p>
        <ul><li>M. Ataei et al., <em>Elicitron: An LLM Agent-Based Simulation Framework for Design Requirements Elicitation</em>. <a href="https://arxiv.org/abs/2404.16045" target="_blank" rel="noopener">arXiv:2404.16045</a></li>
        <li>M. Cosler et al., <em>nl2spec: Interactively Translating Unstructured Natural Language to Temporal Logics with Large Language Models</em>. <a href="https://arxiv.org/abs/2303.04864" target="_blank" rel="noopener">arXiv:2303.04864</a></li>
        <li>L. Ma et al., <em>SpecGen: Automated Generation of Formal Program Specifications via Large Language Models</em>. <a href="https://arxiv.org/abs/2401.08807" target="_blank" rel="noopener">arXiv:2401.08807</a></li>
        <li>A. Fantechi et al., <em>Inconsistency detection in natural language requirements using ChatGPT: a preliminary evaluation</em>. RE 2023.</li>
        <li>An evaluation of LLM4RE (slide 28). <a href="https://arxiv.org/abs/2404.17842" target="_blank" rel="noopener">arXiv:2404.17842</a></li>
        <li>V. Bertram et al., <em>Leveraging natural language processing for a consistency checking toolchain of automotive requirements</em>. RE 2023.</li>
        <li>S. Abualhaija et al., <em>AI-enabled regulatory change analysis of legal requirements</em>. RE 2024.</li>
        <li>Feature map (slide 32). <a href="https://arxiv.org/abs/2511.02399" target="_blank" rel="noopener">arXiv:2511.02399</a></li>
        <li>Lean 4: <a href="https://lean-lang.org/" target="_blank" rel="noopener">lean-lang.org</a> (added; not on the slides)</li>
        <li>A. Pnueli, <em>The Temporal Logic of Programs</em>, FOCS 1977, the paper that introduced LTL to computer science (added; not on the slides)</li></ul>` },
    ],
    takeaways: ["Requirements first: what, before how.", "Formal specs let machines check.", "Precise words beat ambiguous ones."],
  },
];

const QUIZ = [
  { q: "Which activity of the requirement engineering cycle comes right after <b>elicitation</b>?",
    opts: ["Specification", "Modeling", "Management", "Validation"],
    a: 1, why: "Slide 7's cycle: elicitation, modeling, specification, validation, management, then back to elicitation." },
  { q: "On the trace <code>red red green</code>, which formula is <b>false</b>?",
    opts: ["F green", "G (red -> X green)", "G (red -> F green)", "All three are true"],
    a: 1, why: "Step 0 is red but step 1 is red too, not green. F green holds (step 2), and so does G (red -> F green)." },
  { q: "A model checker finds that a property can fail. What does it return?",
    opts: ["A proof that the model is wrong", "A counterexample: an execution showing how it fails", "A corrected model", "A confidence score"],
    a: 1, why: "Slide 17: if the property fails, it returns a counterexample — an execution showing how it can fail." },
  { q: "Which function passes the spec “the result is at least as large as both inputs” but <b>fails</b> Lean's <code>IsMaximum</code>?",
    opts: ["max (if a > b then a else b)", "a function that always returns 1,000,000", "a function that returns a", "none of them"],
    a: 1, why: "It is always at least a and b, but it is not one of the inputs. Condition 3 rules it out." },
  { q: "For <em>“Insufficient user balance reject transactions”</em>, where do the <code>&lt;</code> and <code>&lt;=</code> readings disagree?",
    opts: ["When the balance is much smaller", "When the balance equals the amount", "When the balance is much larger", "They never disagree"],
    a: 1, why: "Only at the boundary: with balance = amount, one agent accepts and the other rejects." },
];

// The lecture video (added after the page was built).
LECTURE.videos = { "../videos/L06.mp4": "Lecture 6 — Requirements (14 min)" };
CHAPTERS[0].sections.push({
  id: "video", title: "Watch the lecture video",
  html: `<p>The video follows the same slides in the same order. Watch it first, or use it to review after the demos.</p>
    <div class="card video" data-video="../videos/L06.mp4"></div>`,
});
