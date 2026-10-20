// L09 content, adapted from csc4801/notes/L09-coding-ii.md (which follows the slides in order).

const demo = (name, title, instr, hint = "") =>
  `<div class="card demo" data-demo="${name}"><div class="head"><span class="title">${title}</span><span>${instr}</span></div>
   <div class="demo-body"></div>${hint ? `<p class="hint">${hint}</p>` : ""}</div>`;
const callout = (kind, label, body) => `<div class="callout ${kind}"><b>${label}</b>${body}</div>`;
const predict = (q, a) => callout("predict", "PREDICT", `<p>${q}</p><details class="reveal"><summary>Show the answer</summary>${a}</details>`);
const out = (s) => codeBlock(s, "out");
const src = (s) => codeBlock(s, "repl");

const LECTURE = {
  number: 9,
  title: "Coding II",
  tagline: "The harness and the model behind AI coding",
  lead: "How a harness handles a whole repository (retrieval, RepoCoder, hallucinated packages, agents), and how a coding model is made: synthetic data, distillation, training recipes, and the rewards that decide what it learns — every step one click at a time.",
  heroDemo: "repocoderMini",
  heroLabel: "RepoCoder · retrieve, generate, retrieve again",
  heroCaption: "A wrong first draft makes a better search query.",
  whyTitle: "Why this lecture matters",
  whySub: "Two of the three pillars of AI for coding",
  why: [
    ["Context is the bottleneck", "A repository doesn't fit in a prompt. <b>Retrieval</b> finds the few files that matter, and a draft can find more."],
    ["Data makes the model", "<b>Synthetic data</b> and <b>distillation</b> turn a few seeds and a strong teacher into a large training set."],
    ["The reward is the teacher", "In RL a model learns exactly what it is <b>rewarded</b> for: tests, linters, or reasoning, gated by working code."],
  ],
  ctaTitle: "Ready to complete a call in a real repository?",
  minutes: "About 60–75 minutes",
};

const CHAPTERS = [
  {
    slug: "1-repo", nav: "Repo-level code", title: "The Harness: Repository-Level Code",
    subtitle: "Too long, too connected, too particular",
    abstract: "The first pillar today is the harness. A real repository is too long for one prompt, its files depend on each other, and it has its own conventions. Retrieval brings in the parts that matter.",
    tags: ["three pillars", "RAG", "RepoCoder"],
    hero: "repocoderMini", heroCaption: "RepoCoder on the slides' COLMAP example.",
    sections: [
      { id: "pillars", title: "Three pillars, and the challenges", html: `
        ${callout("pattern", "THREE PILLARS", `<p><b>Model</b>: how to teach LLMs coding knowledge. <b>Harness</b>: how to use LLMs efficiently. <b>Benchmarks</b>: how to evaluate performance. (The questions are from Lecture 08.) Lecture 08 started with benchmarks; this lecture starts with the <b>harness</b>.</p>`)}
        <p>The first question: <b>how do we tackle repository-level and long-context code?</b> Writing one function from a docstring is easy compared with adding a line to a real project. The challenges:</p>
        <ul><li><b>Too long context.</b> The repository does not fit in one prompt.</li>
        <li><b>File dependencies.</b> The line you are writing may call <b>shared utilities</b> or read <b>configurations</b> defined in other files.</li>
        <li><b>Repo structures.</b> Each repository has its own <b>naming conventions</b> and <b>coding styles</b>.</li></ul>` },
      { id: "rlpg", title: "Repo-level prompt generation", html: `
        <p><b>Repo-Level Prompt Generation</b> generates <em>repository-level prompts</em> that integrate the repository's structure with the relevant context across all files. In the paper's example the cursor is at a <b>target hole</b> in <code>AffinityPropagation.java</code>, inside a call on an object <code>mg</code> of class <code>MaximizingGibbsSampler</code>. The method it needs is defined in <em>another</em> file, the one that the current file imports.</p>
        <table><tr><th>Part</th><th>What it does</th></tr>
        <tr><td>Repo-level prompt proposals</td><td>A prompt engineer lists places to take context from (p = 0 … M): the imported file, sibling files, and so on.</td></tr>
        <tr><td>Prompt proposal classifier</td><td>Looks at the hole and the repository, and predicts the most useful proposal (on the slide, p = 14).</td></tr>
        <tr><td>Prompt composer</td><td>Puts the context from that proposal in front of the default context (the code before the hole).</td></tr>
        <tr><td>Codex</td><td>The code model completes the hole: <code>InitializeToAssignment(CurrentAssignments());</code></td></tr></table>
        ${demo("repoPrompt", "Demo 1 · Which context goes into the prompt?", "pick a proposal")}
        <p><b>RAG is used.</b> RAG (retrieval-augmented generation) means: first <em>retrieve</em> the relevant text, then <em>generate</em> with it in the prompt.</p>` },
      { id: "repocoder", title: "RepoCoder: iterative retrieval and generation", html: `
        <p><b>RepoCoder</b> streamlines repository-level code completion by incorporating a <b>similarity-based retriever</b> and a <b>pre-trained code language model</b>, and runs them in a loop: the retrieved snippets go to the generator, and the generator's output goes back to the retriever for a second iteration. RAG is used again!</p>
        <p>The slide's example. The unfinished code in the target file:</p>
        ${codeBlock(CODE.unfinished)}
        <table><tr><th>Iteration</th><th>Retrieved code</th><th>Completion</th></tr>
        <tr><td>1</td><td><code>def process_imgs(...)</code>: copy images, downscale, save json</td><td><code>COLMAP(colmap_path=..., model_path=..., train_path=..., test_path=...)</code> ✗ incorrect</td></tr>
        <tr><td>2</td><td><code>def run_colmap(image_path: Path, colmap_path: Path, camera_model: Model, gpu: bool = True</code></td><td><code>run_colmap(image_path=path["image"], colmap_path=path["colmap"], camera_model=self.model, gpu=True)</code> ✓ correct</td></tr></table>
        ${predict("The first completion is wrong. Why does it still help?",
          `<p>It names the right thing (COLMAP, its paths, a model), so as a <em>search query</em> it is much closer to the real helper <code>run_colmap</code> than the unfinished code alone. The second retrieval finds it.</p>`)}
        ${demo("repocoder", "Demo 2 · RepoCoder, one step at a time", "← → keys step", "This replays the toy below: the same three files, the same two-line window and the same Jaccard similarity, computed live.")}` },
      { id: "toy", title: "A toy RepoCoder", html: `
        <p>The repository has three files. The retriever compares sets of words with <b>Jaccard similarity</b> (shared words divided by all words) and searches with the last two lines of code, a small <em>sliding window</em> (RepoCoder uses windows of lines too; the sizes here are ours). The “code LM” is fake: it is scripted with the two completions from the slide, and uses the <code>run_colmap</code> signature only when it can see it.</p>
        ${codeBlock(CODE.repocoder)}${out(CODE.repocoderOut)}
        <p>Why the second search finds <code>run_colmap</code>: the draft brings the words <em>colmap</em>, <em>path</em> and <em>model</em>, and drops the image-processing words of the first window.</p>
        ${codeBlock(CODE.sim)}${out(CODE.simOut)}` },
    ],
    takeaways: ["Repos: too long, connected, particular.", "RAG: retrieve, then generate.", "RepoCoder: retrieve again with the draft."],
  },
  {
    slug: "2-agents", nav: "Hallucination & agents", title: "Hallucination and Agents",
    subtitle: "Packages that don't exist, and who decides what to look at",
    abstract: "Generated code can import packages that do not exist. Check the names. Then: agents now dominate these techniques, and MetaGPT runs a whole team of them.",
    tags: ["hallucination", "package index", "MetaGPT", "SOP"],
    hero: "metagptMini", heroCaption: "MetaGPT's SOP: one role after another.",
    sections: [
      { id: "halluc", title: "Hallucinated packages", html: `
        <p><b>LLM-generated code may use packages or functions that do not exist.</b> This is <b>hallucination</b>, and it is prevalent. The slide shows a figure from a USENIX Security 2025 study of the hallucination rates of 16 code models, for Python and JavaScript. Every model in the figure invents packages; the GPT models have the lowest rates, and for most models JavaScript is worse than Python.</p>
        ${callout("pitfall", "PITFALL", `<p><b>A hallucinated package name is a security risk, not just a build error</b> (added; this is the study's point). Anyone can publish a real package under a name that models tend to invent. Code that installs it runs the attacker's code.</p>`)}
        <p><b>Fixing.</b> The slide's example: the model writes <code>import pandes</code>. Check the name against the <b>Python Package Index</b> (PyPI): there is no such package, but there is <code>pandas</code>. In the toy a small set stands in for the index, and <code>difflib</code> suggests the closest real name.</p>
        ${codeBlock(CODE.imports)}${out(CODE.importsOut)}
        ${demo("imports", "Demo 3 · Check the imports", "edit and check")}` },
      { id: "agents", title: "Autonomous agents and MetaGPT", html: `
        <p>All these techniques (retrieval, checking names, retrying) have one thing in common: something decides <em>what to look at next</em>. Today <b>autonomous agents dominate these techniques</b>: the agent from Lecture 02 searches the repository, reads the files it needs, and runs the code, all as tools in its loop.</p>
        <p><b>MetaGPT</b> uses <b>multiple agents for the software engineering development cycle</b>. Each agent plays a role in a company and follows a standard operating procedure (SOP):</p>
        <table><tr><th>Stage</th><th>Role</th><th>Produces</th></tr>
        <tr><td>1/5 Define</td><td>Product Manager</td><td>Requirement document</td></tr>
        <tr><td>2/5 Design</td><td>Architect</td><td>System design</td></tr>
        <tr><td>3/5 Plan &amp; Code</td><td>Project Manager, Engineer</td><td>Tasks, then code</td></tr>
        <tr><td>4/5 Test</td><td>QA Engineer</td><td>Tests</td></tr>
        <tr><td>5/5</td><td>(human)</td><td>Acceptance check</td></tr></table>
        <p>The human gives a one-line requirement, <em>“Write a classic and simple Flappy Bird game.”</em>, and at the end makes the acceptance check.</p>
        ${demo("metagpt", "Demo 4 · MetaGPT's SOP", "← → keys step", "The roles and stages are the slide's; the artifacts are only named, as in the toy.")}
        <p>A toy SOP: each role is a scripted fake LLM that turns the previous artifact into the next one.</p>
        ${codeBlock(CODE.sop)}${out(CODE.sopOut)}
        <p>Each role only reads the artifact before it, so each step's prompt stays short: one way around the “too long context” challenge.</p>` },
    ],
    takeaways: ["Check every generated import.", "Agents fold retrieval and checks into a loop.", "MetaGPT: roles + SOP."],
  },
  {
    slug: "3-data", nav: "Synthetic data", title: "The Model: High-Quality Data",
    subtitle: "Benchmarks are good but scarce; models can write more",
    abstract: "Now the second pillar, the model, and the data it needs. Human-made data is high quality but labor-intensive. Self-Instruct lets a model write its own training problems.",
    tags: ["synthetic data", "Self-Instruct", "Alpaca"],
    hero: "code:selfInstruct", heroCaption: "A toy Self-Instruct loop",
    sections: [
      { id: "need", title: "We require high-quality data", html: `
        <p>The slide's chart (Stanford AI Index 2026, data from Epoch AI) plots the training dataset size of notable AI models from 2010 to 2025 on a log scale: it grows by many orders of magnitude, with recent models trained on trillions of tokens.</p>
        <p>How to obtain high-quality data? Human-made data, such as a <b>benchmark</b>, is <b>high quality</b>, but it is <b>labor-intensive</b> to build and may raise <b>privacy concerns</b>. The answer on the slides: <b>synthetic data</b>, data generated by models.</p>` },
      { id: "self", title: "Self-Instruct and Alpaca", html: `
        <p>Give a model a <b>seed problem</b>. It writes a new <b>⟨problem, solution⟩</b> pair. The pairs can be used to <b>train itself</b> or to <b>train others</b>.</p>
        <p><b>Alpaca</b> is a model fine-tuned from <b>LLaMA 7B</b> this way:</p>
        <ol><li>Start from <b>175 self-instruct seed tasks</b> written by humans (e.g. <em>“Brainstorm a list of possible New Year's resolutions.”</em>).</li>
        <li><b>Text-davinci-003</b> generates new tasks with a modified Self-Instruct prompt: <b>52K instruction-following examples</b> (e.g. <em>“Brainstorm creative ideas for designing a conference room.”</em>).</li>
        <li><b>Supervised fine-tuning</b> of Meta's LLaMA 7B on them gives <b>Alpaca 7B</b>.</li></ol>
        <p>A toy Self-Instruct loop. The fake LLM is scripted with four new tasks, one of them a near-copy. The filter that drops near-copies is from the Self-Instruct paper (it uses ROUGE-L; we use <code>difflib</code>; added).</p>
        ${codeBlock(CODE.selfInstruct)}${out(CODE.selfOut)}
        ${demo("selfInstruct", "Demo 5 · Grow the task pool", "← → keys step")}` },
    ],
    takeaways: ["Good data is scarce and costly.", "Synthetic data: models write problems.", "Alpaca: 175 seeds → 52K examples."],
  },
  {
    slug: "4-distill", nav: "Distillation", title: "Knowledge Distillation",
    subtitle: "A small student learns a large teacher's whole pattern of guesses",
    abstract: "Train a small model on a large model's soft scores, not just its answers. The spam e-mail example, temperature, and a loss with two parts.",
    tags: ["teacher / student", "soft labels", "temperature", "loss"],
    hero: "distillMini", heroCaption: "Higher temperature, softer scores.",
    sections: [
      { id: "spam", title: "Example: is this email spam?", html: `
        <p>Training a small model on a large model's outputs is <b>knowledge distillation</b>: a <b>teacher model</b> distills its knowledge, which is transferred to a <b>student model</b>; both see the same data.</p>
        <ul><li>Input: <em>“You won a free phone — claim it now!”</em></li>
        <li><b>Teacher</b> (large model): <b>Spam 90% | Promotion 8% | Normal 2%</b>.</li>
        <li><b>Student</b> (small model): learns the teacher's <em>full pattern of guesses</em>. “Promotion” is a closer alternative than “Normal”.</li>
        <li>A <b>hard label</b> would only say: Spam.</li>
        <li>The teacher's <b>softer scores</b> explain how it reached that answer.</li></ul>` },
      { id: "how", title: "How the student learns", html: `
        <ol><li>Train the teacher on examples with correct labels.</li><li>Ask the teacher for scores on many inputs.</li>
        <li><b>Soften the scores with a higher temperature (T).</b></li>
        <li>Train the student to match those scores and the true labels. <b>Loss = teacher-matching loss + true-label loss.</b></li></ol>
        <p>Result: one compact model that imitates useful teacher behaviour.</p>
        <p>Temperature works through the <b>softmax</b>, which turns raw scores (logits) into probabilities: <span class="math">p<sub>i</sub> = e<sup>z<sub>i</sub>/T</sup> / Σ<sub>j</sub> e<sup>z<sub>j</sub>/T</sup></span>. A higher T makes the distribution flatter, so the small scores become easier to learn from. We pick teacher logits that give exactly the slide's 90 / 8 / 2 at T = 1:</p>
        ${codeBlock(CODE.softmax)}${out(CODE.softmaxOut)}
        <p>Now the loss. Both parts are cross-entropies: the teacher-matching loss compares the student's softened scores with the teacher's; the true-label loss checks the hard label, Spam. Two students predict Spam equally strongly, but student A ranks Promotion above Normal, like the teacher, and student B doesn't. (The logits are ours. Hinton et al. also multiply the teacher-matching part by T²; we leave that out to keep the sum as on the slide.)</p>
        ${codeBlock(CODE.distill)}${out(CODE.distillOut)}
        <p>The true-label loss cannot tell them apart; the teacher-matching loss prefers A. That is the extra knowledge in the soft scores.</p>
        ${demo("distill", "Demo 6 · Temperature and the two-part loss", "drag T, switch students")}` },
      { id: "what", title: "What to learn, and why distill", html: `
        <p>From the survey by Gou et al. (2021), the student can learn three kinds of knowledge:</p>
        <table><tr><th>Kind</th><th>Knowledge</th></tr>
        <tr><td><b>Response-based</b></td><td>the teacher's outputs (the output layer)</td></tr>
        <tr><td><b>Feature-based</b></td><td>the teacher's intermediate layers (“hint layers”)</td></tr>
        <tr><td><b>Relation-based</b></td><td>relationships between different parts of the teacher: between layers, or between different data samples</td></tr></table>
        <p><b>Why distill? What to watch for.</b></p>
        <ul><li>Useful when serving a large model is <b>too slow or expensive</b>.</li>
        <li>The student can be <b>smaller, faster, and easier to deploy</b>.</li>
        <li>It may still <b>lose some capability</b>; distillation is not a guarantee.</li>
        <li>A student can also <b>copy teacher mistakes or bias</b>.</li>
        <li><b>For coding:</b> teach a small code model from a stronger model's solutions and confidence.</li></ul>` },
    ],
    takeaways: ["Soft scores carry more than a hard label.", "Higher T: flatter, easier to learn.", "Loss = teacher-matching + true-label."],
  },
  {
    slug: "5-evol", nav: "Evol & OSS-Instruct", title: "Harder and More Varied Data",
    subtitle: "Evol-Instruct and OSS-Instruct",
    abstract: "Self-Instruct makes more problems. Evol-Instruct makes harder ones, step by step from 1 + 1 = ?. OSS-Instruct starts from real open-source code to make them more varied.",
    tags: ["Evol-Instruct", "OSS-Instruct", "Magicoder"],
    hero: "code:evol", heroCaption: "A toy Evol-Instruct",
    sections: [
      { id: "evol", title: "Evol-Instruct", html: `
        <p><b>Evol-Instruct</b> (WizardLM) takes a <b>seed problem</b> and an <b>evolution type</b> and writes an <b>evolved problem</b> (and its solution). It <b>incrementally transforms simple instructions into more complex variants</b>: make the instructions more complicated. The slide's tree starts from <code>1 + 1 = ?</code>:</p>
        <table><tr><th>Evolution type</th><th>Evolved problem</th></tr>
        <tr><td>Add Constraints</td><td>How to prove 1 + 1 = 2 in the Goldbach Conjecture?</td></tr>
        <tr><td>Deepening</td><td>In what situation does 1+1 not equal to 2?</td></tr>
        <tr><td>Increase Reasoning</td><td>What is the value of x, if x^3 + 2x + 3 = 7?</td></tr>
        <tr><td>Concretizing</td><td>If you have one apple and someone gives you another banana, how many fruits do you have?</td></tr>
        <tr><td>Complicate Input (Formula)</td><td>1/(sqrt(2) + 4^2) = ?</td></tr>
        <tr><td>In-Breadth Evolving</td><td>What is the speed of light in a vacuum?</td></tr></table>
        <p>Evolutions repeat. The first five types make a problem <em>deeper</em>; In-Breadth Evolving makes a <em>new</em> problem on another topic.</p>
        ${demo("evol", "Demo 7 · Walk the evolution tree", "pick an evolution")}
        <p>A toy: the evolution prompt is a template; the fake LLM is scripted with the slide's results.</p>
        ${codeBlock(CODE.evol)}${out(CODE.evolOut)}` },
      { id: "oss", title: "OSS-Instruct", html: `
        <p><b>OSS-Instruct</b> (Magicoder) starts from real code instead: a <b>seed code snippet</b> from an open-source codebase. The LLM writes a <b>⟨debiased problem, solution⟩</b> pair. Because the seeds come from many real projects in many languages, the problems are more varied and less biased than problems an LLM invents from nothing.</p>
        ${demo("oss", "Demo 8 · From a code snippet to a problem", "← → keys step")}
        <p>The second slide shows the result on <b>HumanEval</b> and <b>HumanEval+</b> (pass@1, the metric from Lecture 08): MagicoderS-CL, a 7B model, scores 70.7 on HumanEval and 66.5 on HumanEval+, above GPT-3.5 Turbo's 65.9 on HumanEval+ and above other models of its size.</p>
        ${codeBlock(CODE.oss)}${out(CODE.ossOut)}
        ${callout("pattern", "THREE WAYS TO MAKE SYNTHETIC DATA", `<p><b>Self-Instruct</b>: seed problem → ⟨problem, solution⟩ (more data). <b>Evol-Instruct</b>: seed problem + evolution type → evolved problem (harder data). <b>OSS-Instruct</b>: seed code snippet → ⟨debiased problem, solution⟩ (more varied data).</p>`)}` },
    ],
    takeaways: ["Evol-Instruct: harder problems.", "OSS-Instruct: seeds from real code.", "More, harder, more varied."],
  },
  {
    slug: "6-training", nav: "Training", title: "Training Coding LLMs",
    subtitle: "Base model, more training, then reinforcement learning",
    abstract: "Training from scratch is super expensive, so coding models start from a base model. Composer 2 and Qwen3-Coder-Next share one shape, and RL needs many tasks: Qwen3-Coder-Next synthesizes them from real repositories.",
    tags: ["Composer 2", "Qwen3-Coder-Next", "bug synthesis", "RL"],
    hero: "pipelinesMini", heroCaption: "Two coding models, one shape.",
    sections: [
      { id: "shape", title: "Two models, one shape", html: `
        <p>Now let's come to the model part. <b>Training an LLM from scratch is super expensive.</b> The practical way is to <b>fine-tune a base model</b>:</p>
        <table><tr><th>Model</th><th>Base model</th><th>Stage 2 (with data)</th><th>Stage 3</th></tr>
        <tr><td><b>Composer 2</b> (the model in Cursor)</td><td>Kimi 2.5</td><td>Continued pretraining</td><td>Reinforcement learning in the <b>Cursor env</b></td></tr>
        <tr><td><b>Qwen3-Coder-Next</b></td><td>Qwen3-Next</td><td>Mid-training</td><td>Reinforcement learning on <b>GitHub PRs + Docker</b></td></tr></table>
        ${demo("pipelines", "Demo 9 · Compare the two recipes", "switch models")}` },
      { id: "bugs", title: "Synthesizing tasks: the bug pipeline", html: `
        <p>RL needs many tasks with tests. Qwen3-Coder-Next synthesizes bugs to scale up the number of software engineering tasks:</p>
        <ol><li><b>Repository collection.</b> Take a codebase; a language-specific AST parser (tree-sitter) cuts its code files into functions and classes.</li>
        <li><b>Bug sampling.</b> An LLM rewrites a function to plant a bug: a <em>bug patch</em>.</li>
        <li><b>Bug validation and evaluation.</b> Does the patch apply (<code>git apply</code> or not)? Run the tests in Docker before and after. If <code>len(PASS_TO_FAIL) == 0</code>, throw it away. If <code>len(PASS_TO_FAIL) &gt; 0</code>, keep the bug patch and its evaluation log.</li>
        <li><b>Issue generation.</b> An LLM writes a <b>problem statement</b> from the bug patch and log. The <b>reverse</b> of the bug patch is the <b>oracle patch</b>. Together: a <b>new task instance</b>.</li></ol>
        ${demo("bugs", "Demo 10 · Keep or drop a bug", "pick a bug, then step")}
        <p>A toy version of step 3, with a small <code>parse_list</code> like the one on the slide. Each candidate bug patch is an <code>(old, new)</code> text replacement; “applies” means the old text is found.</p>
        ${codeBlock(CODE.bugs)}${out(CODE.bugsOut)}` },
      { id: "rl", title: "Reinforcement learning", html: `
        <ul><li>We have a lot of <b>RL algorithms</b> for LLMs: <b>PPO, DPO, GRPO, GSPO</b>.</li>
        <li>There are mature <b>RL training frameworks</b>: <a href="https://github.com/verl-project/verl" target="_blank" rel="noopener">verl</a>, <a href="https://github.com/OpenRLHF/OpenRLHF" target="_blank" rel="noopener">OpenRLHF</a>, <a href="https://github.com/huggingface/trl" target="_blank" rel="noopener">TRL</a>.</li>
        <li><b>For SE tasks, rewards are critical.</b></li></ul>
        <p>In RL the model tries an answer, gets a <b>reward</b>, and is updated to make high-reward answers more likely (added; a one-line summary). So the reward decides what the model learns.</p>` },
    ],
    takeaways: ["Start from a base model.", "Keep a bug only if a test notices.", "In RL, rewards are critical."],
  },
  {
    slug: "7-rewards", nav: "Rewards", title: "Rewards for Code",
    subtitle: "Judges, tests, lines, linters and reasoning",
    abstract: "Implicit rewards ask another model; verifiable rewards run the code. A pass/fail reward is sparse, so we add finer signals — and gate the reasoning on working code.",
    tags: ["reward model", "verifiable", "sparse", "fine-grained", "static analysis", "PRM"],
    hero: "code:gate", heroCaption: "The consistency gate",
    sections: [
      { id: "two", title: "Implicit and verifiable rewards", html: `
        <table><tr><th>Kind</th><th>How</th></tr>
        <tr><td><b>Implicit rewards</b></td><td>Use another LLM to judge (a <b>reward model</b>).</td></tr>
        <tr><td><b>Verifiable rewards</b></td><td>Execution result feedback: run the code.</td></tr></table>
        <p><b>Reward model.</b> Task: <em>“Implement a discount calculation function.”</em> The model writes two answers; a reward model scores the first <b>0.2</b> and the second <b>0.8</b>:</p>
        ${codeBlock(CODE.disc1)}${codeBlock(CODE.disc2)}
        <p class="hint">The slide writes <code>“Negative"</code> with a curly opening quote; the notes use straight quotes so the code runs.</p>
        <p><b>Verifiable rewards.</b> +1.0 if all tests pass; −1.0 if some or all tests fail, on a compilation error, or on a timeout or memory limit. A toy reward function (no real time or memory limits; a sandbox would add those):</p>
        ${codeBlock(CODE.verifiable)}${out(CODE.verifiableOut)}
        ${demo("rewards", "Demo 11 · Score an answer two ways", "pick an answer")}
        ${predict("Answer 1 is one <code>if</code> away from correct; answer 3 doesn't even parse. Both get −1.0. What does the model learn from that?",
          `<p>Not much: the reward can't tell “almost right” from “nonsense”. That is the sparse-reward problem, next.</p>`)}` },
      { id: "sparse", title: "Sparse reward and fine-grained feedback", html: `
        <p><b>The problem:</b> this is known as a <b>sparse reward</b>. If the LLM generates a 500-line program and makes a single off-by-one error on line 499, it receives a −1.0. It gets no partial credit and no information about <em>where</em> it failed, making exploration incredibly difficult.</p>
        ${demo("sparse", "Demo 12 · One error in 500 lines", "move the error")}
        <p><b>Multi-granularity and fine-grained feedback.</b> Instead of a reward on the final result, provide <b>step-by-step rewards</b>. If an error occurs on line 6, the model is penalized specifically for the tokens that led to that error, while unexecuted branches are <b>masked</b> so perfectly valid syntax is preserved. The slide's function:</p>
        ${src(CODE.calcSlide)}
        <p>The toy runs it on two inputs (an empty list and <code>[1, 2, 3]</code>), records which lines ran with <code>sys.settrace</code>, and labels each line.</p>
        ${codeBlock(CODE.lines)}${out(CODE.linesOut)}
        ${demo("lines", "Demo 13 · Which lines ran?", "choose the inputs")}` },
      { id: "static", title: "Static analysis as reward", html: `
        <p>A linter (e.g. Ruff for Python, Cppcheck for C/C++) can score code without running it. The slide maps each finding's severity to a penalty:</p>
        <table><tr><th>Linter finding</th><th>Severity</th><th>Reward penalty</th></tr>
        <tr><td>SyntaxError (code won't run)</td><td>error</td><td>−10.0</td></tr>
        <tr><td>SQL injection vulnerability</td><td>high</td><td>−5.0</td></tr>
        <tr><td>Variable declared but unused</td><td>normal</td><td>−1.0</td></tr>
        <tr><td>Missing docstring / bad spacing</td><td>low</td><td>−0.2</td></tr></table>
        <p>A toy linter with Python's <code>ast</code> module finds three of these kinds (the checks are ours and much cruder than Ruff's):</p>
        ${codeBlock(CODE.lint)}${out(CODE.lintOut)}
        ${demo("lint", "Demo 14 · Fix the findings, watch the reward", "toggle the fixes")}` },
      { id: "cot", title: "Reasoning process reward (CoT)", html: `
        <ol><li><b>Evaluate reasoning</b> with a <b>process reward model (PRM)</b>: score +0.8 (highly logical).</li>
        <li><b>Evaluate final code</b>: fails compilation, outcome 0.</li>
        <li><b>Final reward</b>: (+0.8) × (0) = <b>0.0</b>.</li></ol>
        <p>The speaker notes explain why it is a product. The PRM scores the intermediate reasoning steps for factual accuracy, logical rigour and coherence. To stop the model from writing beautiful logic but terrible code (<b>reward hacking</b>), a <b>consistency gate</b> is used: if the final code fails the unit tests, the reasoning reward is multiplied by zero, forcing the model's thoughts and actions to align.</p>
        ${codeBlock(CODE.gate)}${out(CODE.gateOut)}
        ${demo("gate", "Demo 15 · The consistency gate", "slide and toggle")}
        ${callout("pitfall", "REWARD HACKING", `<p>A model optimizes exactly the reward it is given. Reward only the reasoning and you get beautiful reasoning; reward only “tests pass” and a model may learn to special-case the tests (added example). Design rewards so that the easy way to score is the right way.</p>`)}` },
    ],
    takeaways: ["Implicit (judge) vs verifiable (run).", "Pass/fail is sparse; add finer signals.", "Gate reasoning on working code."],
  },
  {
    slug: "8-help", nav: "Does it help?", title: "Does It Really Help?",
    subtitle: "General vs coding models, speed vs quality",
    abstract: "Which model to use, and what the evidence says: faster on easy tasks, much less on hard ones, and more bugs.",
    tags: ["general vs coding", "leaderboards", "McKinsey", "Uplevel"],
    hero: "efficiency", heroCaption: "Three snapshots from the slides.",
    sections: [
      { id: "models", title: "General models vs coding models", html: `
        <p>Which to use? The speaker note: <b>for your specific task, a fine-tuned model would be effective. For general SE tasks, general models are best.</b></p>
        <p>The slide shows a leaderboard snapshot (onyx.app) with two rankings. “Best at Software Engineering” is led by Claude Opus 4.6 (80.8%), MiniMax M2.5 (80.2%) and Claude Sonnet 4.6 (79.6%); “Best for Code Generation” by Kimi K2.5 (99.0%), Claude Opus 4.6 (95.0%) and Grok 3 (94.5%). The two rankings differ: Grok 3 is third for code generation but near the bottom (49.0%) for software engineering. Leaderboards change often; check the current one.</p>` },
      { id: "eff", title: "Does the LLM really improve efficiency?", html: `
        <p><b>McKinsey</b> (on the slide): <em>generative AI can increase developer speed, but less so for complex tasks.</em> Time saved with generative AI:</p>
        <table><tr><th>Task</th><th>Time saved</th></tr>
        <tr><td>Code documentation</td><td>45–50%</td></tr><tr><td>Code generation</td><td>35–45%</td></tr>
        <tr><td>Code refactoring</td><td>20–30%</td></tr><tr><td>High-complexity tasks</td><td>&lt; 10%</td></tr></table>
        <p><b>Uplevel</b>: developers with Copilot access saw a <b>41% higher bug rate</b>, while their issue throughput remained the same. The report suggests that engineering leaders put guardrails in place for the responsible use of generative AI.</p>
        ${demo("efficiency", "Demo 16 · The evidence", "switch views")}
        ${predict("Put the two results together. Faster on easy tasks, more bugs, same throughput. What should a team that adopts a coding model also invest in?",
          `<p>Review and testing: the checks that catch the extra bugs. That is the topic of later lectures (testing and verification, repair).</p>`)}` },
    ],
    takeaways: ["Specific task: fine-tune; general SE: general model.", "Big savings on easy tasks only.", "Speed is not quality."],
  },
  {
    slug: "9-summary", nav: "Summary", title: "Summary and Practice",
    subtitle: "Check yourself, then change the toys",
    abstract: "A map of the lecture, self-check questions, and three exercises with solutions.",
    tags: ["knowledge map", "self-check", "exercises"],
    hero: "toc",
    sections: [
      { id: "map", title: "Knowledge map", html: `<div class="map">
        <div class="card"><h3>Repo-level code</h3><ul><li>Too long, dependencies, structures</li><li>RAG: retrieve, then generate</li><li>RepoCoder: retrieve again with the draft</li></ul></div>
        <div class="card"><h3>Hallucination &amp; agents</h3><ul><li>Invented packages: check the index</li><li>Agents dominate these techniques</li><li>MetaGPT: roles + SOP</li></ul></div>
        <div class="card"><h3>Synthetic data</h3><ul><li>Benchmarks: good but costly</li><li>Self-Instruct, Alpaca</li><li>Evol-Instruct (harder), OSS-Instruct (varied)</li></ul></div>
        <div class="card"><h3>Distillation</h3><ul><li>Teacher's soft scores</li><li>Temperature softens</li><li>Loss = matching + true label</li></ul></div>
        <div class="card"><h3>Training</h3><ul><li>Base → more training → RL</li><li>Composer 2, Qwen3-Coder-Next</li><li>Keep bugs with PASS_TO_FAIL &gt; 0</li></ul></div>
        <div class="card"><h3>Rewards &amp; evidence</h3><ul><li>Judge vs tests; sparse reward</li><li>Lines, linters, gated reasoning</li><li>Faster on easy tasks; more bugs</li></ul></div></div>` },
      { id: "check", title: "Check your understanding", html: `<div data-demo="quiz"><div class="demo-body"></div></div>` },
      { id: "exercises", title: "Exercises", html: `
        <h3>Exercise 1 ★ (trace)</h3>
        <p>Run the RepoCoder toy with <code>iterations=1</code> and with <code>iterations=3</code>. What does each return? Why does a third iteration change nothing?</p>
        <details class="reveal"><summary>Solution</summary>${codeBlock(CODE.ex1)}${out(CODE.ex1Out)}
          <p>One iteration returns the wrong <code>COLMAP(...)</code> call. From the second iteration on, the query contains the draft, the retriever keeps finding <code>utils/colmap.py</code> (in iteration 3 the draft is the correct call, so the similarity rises to 0.62), and the completion no longer changes: the loop has converged.</p></details>
        <h3>Exercise 2 ★ (modify)</h3>
        <p>Add a candidate bug patch to the bug pipeline that changes <code>obj.upper()</code> to <code>obj.lower()</code>. Which tests move from pass to fail? Is it kept?</p>
        <details class="reveal"><summary>Solution</summary>${codeBlock(CODE.ex2)}${out(CODE.ex2Out)}
          <p>Both tests fail, so <code>len(PASS_TO_FAIL) = 2 &gt; 0</code> and the bug is kept as a new task instance.</p></details>
        <h3>Exercise 3 ★★ (design)</h3>
        <p>Combine the rewards: give the answer +1/−1 from the tests, plus the static-analysis penalty scaled by 0.1. Score <code>answer 2</code> from the discount example. Then argue whether a model could “hack” your combined reward.</p>
        <details class="reveal"><summary>Solution</summary>${codeBlock(CODE.ex3)}${out(CODE.ex3Out)}
          <p>The only finding is the missing docstring (−0.2 × 0.1). A model could gain a little by adding empty or useless docstrings, and the tests here are few, so it could also special-case them. More tests and a stronger linter make hacking harder; no reward makes it impossible.</p></details>` },
      { id: "terms", title: "Key terms and further reading", html: `
        <p class="tags">${["three pillars", "repository-level code", "RAG", "retriever", "RepoCoder", "iterative retrieval", "Jaccard similarity", "hallucination", "package index", "autonomous agent", "MetaGPT", "SOP", "synthetic data", "Self-Instruct", "Alpaca", "knowledge distillation", "teacher / student", "soft label", "temperature", "Evol-Instruct", "OSS-Instruct", "base model", "continued pretraining", "mid-training", "reinforcement learning", "PASS_TO_FAIL", "oracle patch", "implicit reward", "reward model", "verifiable reward", "sparse reward", "fine-grained feedback", "static analysis", "process reward model", "consistency gate", "reward hacking"].map((t) => `<span class="tag">${t}</span>`).join("")}</p>
        <ul><li>D. Shrivastava et al., <em>Repository-Level Prompt Generation for Large Language Models of Code</em>. <a href="https://arxiv.org/abs/2206.12839" target="_blank" rel="noopener">arXiv:2206.12839</a></li>
        <li>F. Zhang et al., <em>RepoCoder: Repository-Level Code Completion Through Iterative Retrieval and Generation</em>. <a href="https://arxiv.org/abs/2303.12570" target="_blank" rel="noopener">arXiv:2303.12570</a></li>
        <li>J. Spracklen et al., <em>We Have a Package for You! A Comprehensive Analysis of Package Hallucinations by Code Generating LLMs</em> (USENIX Security 2025). <a href="https://www.usenix.org/system/files/usenixsecurity25-spracklen.pdf" target="_blank" rel="noopener">usenix.org</a></li>
        <li>S. Hong et al., <em>MetaGPT: Meta Programming for a Multi-Agent Collaborative Framework</em>. <a href="https://arxiv.org/abs/2308.00352" target="_blank" rel="noopener">arXiv:2308.00352</a></li>
        <li>Stanford CRFM, <em>Alpaca: A Strong, Replicable Instruction-Following Model</em>. <a href="https://crfm.stanford.edu/2023/03/13/alpaca.html" target="_blank" rel="noopener">crfm.stanford.edu</a></li>
        <li>J. Gou et al., <em>Knowledge Distillation: A Survey</em>, IJCV 129 (2021) 1789–1819.</li>
        <li>C. Xu et al., <em>WizardLM: Empowering Large Language Models to Follow Complex Instructions</em> (Evol-Instruct). <a href="https://arxiv.org/abs/2304.12244" target="_blank" rel="noopener">arXiv:2304.12244</a></li>
        <li>Y. Wei et al., <em>Magicoder: Empowering Code Generation with OSS-Instruct</em>. <a href="https://arxiv.org/abs/2312.02120" target="_blank" rel="noopener">arXiv:2312.02120</a></li>
        <li>Composer 2 Technical Report. <a href="https://arxiv.org/abs/2603.24477" target="_blank" rel="noopener">arXiv:2603.24477</a></li>
        <li>Qwen3-Coder-Next. <a href="https://arxiv.org/abs/2603.00729" target="_blank" rel="noopener">arXiv:2603.00729</a></li></ul>` },
    ],
    takeaways: ["Harness: retrieve the right context.", "Model: data, training, rewards.", "Measure the real effect."],
  },
];

const QUIZ = [
  { q: "Which is <b>not</b> one of the slides' challenges of repository-level code?",
    opts: ["Too long context", "File dependencies (shared utilities, configurations)", "Repo structures (naming conventions, coding styles)", "Python is too slow"],
    a: 3, why: "The slides list too long context, file dependencies and repo structures. Speed of the language is not the problem." },
  { q: "In RepoCoder's second iteration, what does the retriever search with?",
    opts: ["Only the unfinished code", "The unfinished code plus the first, incorrect completion", "The whole repository", "The user's question"],
    a: 1, why: "The draft names COLMAP, its paths and a model, so it finds run_colmap, which the unfinished code alone did not." },
  { q: "The model writes <code>import pandes</code>. What should happen before the code runs?",
    opts: ["Install pandes from PyPI", "Check the name against the package index and correct it to pandas", "Ignore it; imports are harmless", "Ask the model to repeat the import"],
    a: 1, why: "pandes does not exist. Installing an invented name is risky: anyone could publish a package under it." },
  { q: "Which method makes training problems <b>harder</b>, step by step?",
    opts: ["Self-Instruct", "Evol-Instruct", "OSS-Instruct", "Knowledge distillation"],
    a: 1, why: "Evol-Instruct applies an evolution type (add constraints, deepening, …) to a seed problem. OSS-Instruct makes problems more varied." },
  { q: "In distillation, what does a higher temperature T do to the teacher's scores?",
    opts: ["Makes them sharper: Spam closer to 100%", "Makes them flatter, so Promotion and Normal carry more signal", "Removes the true label", "Nothing"],
    a: 1, why: "At T = 1: 90/8/2. At T = 4: about 52/28/20. The student can learn the teacher's whole pattern of guesses." },
  { q: "In Qwen3-Coder-Next's pipeline, a planted bug is <b>kept</b> when…",
    opts: ["git apply fails", "len(PASS_TO_FAIL) == 0", "len(PASS_TO_FAIL) > 0", "the LLM says so"],
    a: 2, why: "At least one test that passed before fails after: the bug is real and testable, so it becomes a new task instance." },
  { q: "A PRM scores the reasoning +0.8, but the final code fails compilation. With the consistency gate, the reward is…",
    opts: ["0.8", "0.0", "−1.0", "1.8"],
    a: 1, why: "(+0.8) × (0) = 0.0. Good reasoning only counts if the code works; this prevents reward hacking." },
];

// The lecture video (added after the page was built).
LECTURE.videos = { "../videos/L09.mp4": "Lecture 9 — Coding II (15 min)" };
CHAPTERS[0].sections.push({
  id: "video", title: "Watch the lecture video",
  html: `<p>The video follows the same slides in the same order. Watch it first, or use it to review after the demos.</p>
    <div class="card video" data-video="../videos/L09.mp4"></div>`,
});
