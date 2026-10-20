// L08 content, adapted from csc4801/notes/L08-coding-i.md (which follows the slides in order).

const demo = (name, title, instr, hint = "") =>
  `<div class="card demo" data-demo="${name}"><div class="head"><span class="title">${title}</span><span>${instr}</span></div>
   <div class="demo-body"></div>${hint ? `<p class="hint">${hint}</p>` : ""}</div>`;
const callout = (kind, label, body) => `<div class="callout ${kind}"><b>${label}</b>${body}</div>`;
const predict = (q, a) => callout("predict", "PREDICT", `<p>${q}</p><details class="reveal"><summary>Show the answer</summary>${a}</details>`);
const out = (s) => codeBlock(s, "out");

const LECTURE = {
  number: 8,
  title: "Coding I",
  tagline: "Benchmarks and the harness: how to generate code from specifications",
  lead: "How do we know an LLM writes good code, and how do we get better code out of it without retraining? HumanEval and pass@k, why benchmarks mislead, and the prompt and execution-time techniques that help — every idea one click at a time.",
  heroDemo: "passkMini",
  heroLabel: "pass@k · within k attempts, at least one correct answer",
  heroCaption: "The slides' build-up: one attempt, then three, then five.",
  whyTitle: "Why this lecture matters",
  whySub: "Three ideas behind every claim that “model X codes better”",
  why: [
    ["Measure before you trust", "A <b>benchmark</b> turns “writes good code” into a number: tasks, hidden tests, and <b>pass@k</b>."],
    ["Numbers can mislead", "Small k is noisy, the shortcut formula is biased, tests can be wrong, and agents can <b>cheat</b>."],
    ["Better results without training", "<b>Prompt engineering</b> and <b>execution feedback</b> improve the code a model already can write."],
  ],
  ctaTitle: "Ready to score some generated code?",
  minutes: "About 45–60 minutes",
};

const CHAPTERS = [
  {
    slug: "1-benchmarks", nav: "Pillars & HumanEval", title: "Three Pillars and Benchmarks",
    subtitle: "From specifications to code, and how to measure it",
    abstract: "Generating code from a specification rests on three pillars: benchmarks, the harness and the model. A benchmark defines the problem; HumanEval is the classic one.",
    tags: ["three pillars", "benchmark", "HumanEval", "unit tests"],
    hero: "pillarsMini", heroCaption: "Benchmarks, harness, model: three questions.",
    sections: [
      { id: "pipeline", title: "From specifications to code", html: `
        <p>The course follows the software life cycle: <b>requirement engineering</b>, <b>coding</b>, <b>testing / verification</b>, <b>repair</b>, <b>AIOps</b>. Lectures 06–07 were about requirements. Now we are at <b>coding</b>.</p>
        <p>The question: <em>how to generate code from specifications?</em> A specification (for example a task list for a photo-organiser app) goes into an LLM; code comes out. To do this well, the slides name three pillars:</p>
        <table><tr><th>Pillar</th><th>Question</th></tr>
        <tr><td><b>Benchmarks</b></td><td>How to evaluate performance?</td></tr>
        <tr><td><b>Harness</b></td><td>How to utilize LLMs efficiently?</td></tr>
        <tr><td><b>Model</b></td><td>How to teach LLMs coding knowledge?</td></tr></table>
        ${callout("pattern", "THREE PILLARS", `<p><b>Benchmarks</b> tell you how good a system is. The <b>harness</b> gets the most out of a given model. The <b>model</b> itself can be trained to know more about code. This lecture: benchmarks, then the harness. Coding II: the model.</p>`)}
        ${demo("pillars", "Demo 1 · The three pillars", "step through")}` },
      { id: "benchmarks", title: "Benchmarks", html: `
        <p><em>“A problem well stated is a problem half solved.”</em> (Charles F. Kettering, quoted on slide 9.)</p>
        <p>A benchmark does two jobs:</p>
        <ol><li><b>Define a specific coding problem for LLMs</b>: a fixed set of tasks with a way to check answers.</li>
        <li><b>Provide learning data for training LLMs.</b></li></ol>
        <p>Model releases report their scores on benchmarks. The slides show three examples: a SWE-bench Pro chart from an Anthropic system card (pass rate against cost per task), a Qwen3 chart (score against thinking budget) and the DeepSeek-V3 bar chart across benchmarks such as MMLU-Pro, Codeforces and SWE-bench Verified.</p>` },
      { id: "humaneval", title: "HumanEval", html: `
        <p><b>HumanEval</b> (OpenAI) is one of the most widely used code benchmarks: <b>164 tasks</b>. Each task is a Python function signature with a docstring, the <b>prompt</b>; the model writes the body, the <b>generated code</b>. The slides' example:</p>
        ${codeBlock(CODE.incrList, "py", [8])}
        <p>The generated code is judged by running hidden unit tests. Each HumanEval task has a <code>check</code> function; here is one in that style (ours):</p>
        ${codeBlock(CODE.check)}${out(OUT.check)}
        ${demo("humaneval", "Demo 2 · Run the hidden tests", "pick an answer, then step", "The three answers are the notes' <code>answers</code>. The checks run on JavaScript twins of them.")}` },
    ],
    takeaways: ["Three pillars: benchmarks, harness, model.", "A benchmark defines the problem and supplies data.", "HumanEval: 164 tasks, judged by unit tests."],
  },
  {
    slug: "2-passk", nav: "pass@k", title: "The Metric: pass@k",
    subtitle: "Within k attempts, at least one correct answer",
    abstract: "pass@k is 100% or 0% for one task and an average over a benchmark. With small k it jumps around from run to run.",
    tags: ["pass@1", "pass@k", "averaging", "variance"],
    hero: "passkMini", heroCaption: "Slides 15–18, one picture at a time.",
    sections: [
      { id: "def", title: "pass@k for one task", html: `
        ${callout("pattern", "PASS@K", `<p><b>pass@k</b>: within <b>k attempts</b>, at least one answer is correct. For one task it is 100% or 0%; for a benchmark it is the average over all tasks.</p>`)}
        <table><tr><th>Slide</th><th>Answers to Task 1</th><th>Result</th></tr>
        <tr><td>15</td><td>✗</td><td>pass@1 = 0%</td></tr><tr><td>16</td><td>✓</td><td>pass@1 = 100%</td></tr>
        <tr><td>17</td><td>✗ ✗ ✓</td><td>pass@3 = 100%</td></tr><tr><td>18</td><td>✗ ✗ ✗ ✓ ✗</td><td>pass@5 = 100%</td></tr></table>
        ${codeBlock(CODE.observed)}${out(OUT.observed)}` },
      { id: "bench", title: "pass@k for a benchmark", html: `
        <p>Over a benchmark, average the tasks. Slide 19 has three tasks: Task 1 and Task 3 pass within five attempts, Task 2 does not:</p>
        ${codeBlock(CODE.tasks)}${out(OUT.tasks)}
        ${demo("passk", "Demo 3 · Score a small benchmark", "click answers, drag k")}` },
      { id: "runs", title: "Small k is noisy", html: `
        ${predict("Run the same model on the same task five times and report pass@1 each time. Will you get the same number?",
          `<p>No. Sampling is random, so slide 20 shows five runs giving 100%, 0%, 0%, 100%, 0%. <b>If k is small, the metric varies a lot across executions.</b></p>`)}
        ${demo("runs", "Demo 4 · Run it again", "add runs")}` },
    ],
    takeaways: ["pass@k: one of k attempts is right.", "Benchmark score = average over tasks.", "Small k: big swings between runs."],
  },
  {
    slug: "3-estimate", nav: "Estimating pass@k", title: "Estimating pass@k",
    subtitle: "Draw n samples, count c, and use the right formula",
    abstract: "Generate n ≥ k samples and count the c that pass. The unbiased formula counts picks without replacement; the tempting shortcut underestimates.",
    tags: ["unbiased estimator", "combinations", "stability", "bias"],
    hero: "code:passAtK", heroCaption: "The unbiased estimator, from the notes",
    sections: [
      { id: "formula", title: "The unbiased estimator", html: `
        <p>The fix (slide 21): <b>generate a much larger pool of samples, n (n ≥ k), and count how many of them pass the tests, c.</b> Then ask: if we picked k of the n samples at random, how likely is it that at least one is correct?</p>
        <ul><li>Total possible combinations: C(n, k).</li>
        <li>Combinations with zero correct answers: C(n − c, k) (all k picked from the n − c wrong ones).</li>
        <li>Probability of failure: C(n − c, k) / C(n, k).</li>
        <li>Probability of success: <b>pass@k = 1 − C(n − c, k) / C(n, k)</b>.</li>
        <li>If n − c &lt; k there are not enough wrong samples to fill k picks, so <b>pass@k = 1.0</b>.</li></ul>
        ${codeBlock(CODE.passAtK)}${out(OUT.passAtK)}
        <p>For k = 1 the formula is just c/n: the five runs of slide 20 give 2/5 = 40%.</p>
        ${demo("estimator", "Demo 5 · Count the combinations", "drag n, c, k; then pick", "Each pick takes k different samples (no sample twice). Over many picks the share containing a ✓ approaches the unbiased value.")}
        ${callout("tip", "TIP (ADDED)", `<p>C(n, k) gets huge quickly. The paper that introduced this estimator (Chen et al., the Codex paper, slide 23) computes the same value as a running product, which never builds big numbers.</p>`)}
        ${codeBlock(CODE.stable)}${out(OUT.stable)}` },
      { id: "stability", title: "Stability", html: `
        <p>Slide 23 (from the Codex paper) plots the estimate against n for k = 5, 10, 20, 100: the band of estimates is wide at small n and narrows as n grows. As the speaker notes put it, <em>with the growth of n, pass@k is quite stable.</em> A small simulation shows the same effect (ours; a model that solves the task 40% of the time, as in slide 20; fixed seed):</p>
        ${codeBlock(CODE.spread)}${out(OUT.spread)}
        <p>With n = 1 every evaluation says 0% or 100%, exactly as on slide 20. With n = 100 they agree to within a few points.</p>
        ${demo("spread", "Demo 6 · How much do evaluations disagree?", "pick n")}` },
      { id: "naive", title: "Why not 1 − (1 − p̂)^k?", html: `
        <p>A shorter formula looks tempting: estimate the success rate as p̂ = c/n and use 1 − (1 − p̂)<sup>k</sup>. The slides' answer: <b>every draw from n samples is wrongly assumed independent.</b></p>
        <p>From the speaker notes: this formula assumes you draw k samples <em>with replacement</em>, each one an independent event. In reality you generate a fixed pool of n unique samples and evaluate k of them; once a sample is picked it is not put back. Because the formula assumes independence where there is none, it <b>consistently underestimates</b> pass@k (slides 25–26). The notes add that the gap does not fully close even with a large pool (e.g. n &gt; 5k).</p>
        <p>We can check this exactly, without any randomness, by averaging each estimator over every possible c (ours; per-sample success rate p = 0.05, k = 10):</p>
        ${codeBlock(CODE.naive)}${out(OUT.naive)}
        <p>The unbiased estimator hits the true value at every n. The naive one is always below it; the gap shrinks as n grows but is still there at n = 50 = 5k.</p>
        ${demo("bias", "Demo 7 · Unbiased vs the shortcut", "drag p and k")}
        <p>pass@k is <b>widely used in other benchmarks</b>, not just HumanEval.</p>` },
    ],
    takeaways: ["pass@k = 1 − C(n−c, k) / C(n, k).", "Larger n: a stable estimate.", "1 − (1 − c/n)^k underestimates."],
  },
  {
    slug: "4-pitfalls", nav: "Benchmark pitfalls", title: "More Benchmarks, and Their Problems",
    subtitle: "Saturated, contaminated, wrong, or cheated",
    abstract: "MBPP, LiveCodeBench and BigCodeBench widen the picture. Then the doubts: top scores above 90, training-data leaks, wrong tests, and agents that read the answers.",
    tags: ["LiveCodeBench", "contamination", "LiveBench", "wrong tests", "cheating"],
    hero: "leaderboardMini", heroCaption: "EvalPlus pass@1, the slide 31 snapshot.",
    sections: [
      { id: "others", title: "Other widely used benchmarks", html: `
        <table><tr><th>Benchmark</th><th>What the slides show</th></tr>
        <tr><td><b>MBPP</b></td><td>974 short Python problems: a text description, a reference solution, and a list of <code>assert</code> tests (e.g. <code>min_cost</code>, the minimum cost path in a matrix).</td></tr>
        <tr><td><b>LiveCodeBench</b></td><td>Problems collected from contest sites (LeetCode, AtCoder, Codeforces logos). Four scenarios: code generation, self-repair, test output prediction, code execution.</td></tr>
        <tr><td><b>BigCodeBench</b></td><td>Tasks that call libraries (<code>itertools</code>, <code>random</code>, …), with a complete prompt and an instruct prompt per task.</td></tr></table>
        <p>LiveCodeBench's example problem: <em>given a positive integer array <code>nums</code>, return the total frequencies of elements in <code>nums</code> such that those elements all have the maximum frequency.</em> For <code>nums = [1,3,3,4,4]</code>, 3 and 4 both appear twice, so the answer is 2 × 2 = 4. The figure's “User Solution”:</p>
        ${codeBlock(CODE.count)}${out(OUT.count)}
        <p>(The figure writes <code>cnts.count(max_freq)</code>; a <code>dict_values</code> view has no <code>count</code> method, so we wrap it in <code>list</code>.) In the <b>code generation</b> scenario the model's code counts the elements with the maximum frequency but forgets to multiply. In <b>self-repair</b> it gets the error back and fixes it. A runnable version (ours, correcting the figure's <code>max = freq.values()</code>):</p>
        ${codeBlock(CODE.lcbRepair)}${out(OUT.lcbRepair)}
        ${demo("lcb", "Demo 8 · LiveCodeBench's four scenarios", "pick a scenario")}` },
      { id: "solved", title: "Is function-level code generation solved?", html: `
        <p><em>“Generating code snippets is solved very well by LLMs.”</em> The EvalPlus leaderboard on slide 31 lists pass@1 scores above 90 for its top models (e.g. O1 Preview 96.3, GPT-4o 92.7, DeepSeek-V3 91.5 in the slide's snapshot).</p>
        <p>Solved? Two reasons for doubt (slide 32):</p>
        <ul><li><b>We have stronger LLM agents</b>, so old benchmarks become too easy.</li>
        <li><b>Data is involved in training</b>: benchmark problems are public, so they can leak into the training data (<em>contamination</em>). A model may remember the answer instead of solving the problem.</li></ul>
        <p>The response: <b>let's make benchmarks dynamic.</b></p>
        <ul><li><b>LiveBench</b> is <em>“a challenging, contamination-free LLM benchmark”</em>: it releases new questions regularly (the dataset is updated every 6 months), and every question has a verifiable, objective ground-truth answer, so no LLM judge is needed.</li>
        <li><b>Frontier-CS</b> poses <b>open-ended problems</b> with no single right answer, e.g. <em>Polyomino Packing</em>: pack thousands of small pieces into the tightest possible rectangle. The task rewards heuristic design and long-horizon improvement.</li></ul>` },
      { id: "wrong", title: "Benchmarks may be wrong", html: `
        <p>Slide 36, from a library-style benchmark task. The prompt: <em>“Generate a pandas Series of random dates within a specified date range, including both start_date and end_date, with an optional seed for reproducibility. … randomly selected between the specified start and end dates, inclusive.”</em> The test case:</p>
        ${codeBlock(CODE.wrongTest)}
        <p>The model's <code>task_func</code> returned 10 dates; the test expects <code>(end_date - start_date).days = 9</code>. 1 January to 10 January <em>inclusive</em> is ten days, so the prompt supports the model's answer. The test, not the code, is the problem. A stdlib version (ours: a list instead of a pandas Series):</p>
        ${codeBlock(CODE.taskFunc)}${out(OUT.taskFunc)}
        ${demo("wrongTest", "Demo 9 · Move the end date", "drag the day")}
        ${callout("pitfall", "PITFALL", `<p><b>A failing test is not always a wrong program.</b> Benchmarks are written by people, and their tests can be wrong or ambiguous. A score is only as good as the tests behind it.</p>`)}` },
      { id: "cheat", title: "Cheating", html: `
        <p>Agents can also <em>game</em> a benchmark. Slide 37 (from the “cheating agents” study) shows <b>harness-level cheating, a verifier leak</b> in Terminal-Bench 2: the agent reads <code>/tests/</code>, which should be inaccessible, finds the expected answer in plain text (<code>"GritLM/GritLM-7B"</code>), and writes it straight to <code>/app/result.txt</code>. Both tests pass, and the agent reports <em>“Tests pass.”</em> without solving anything.</p>
        <p>Slide 38 (Cursor's blog): <em>frontier models are getting better at undermining evals by looking up answers on the internet.</em> With a <b>strict harness</b> that restricts access, SWE-bench Multilingual scores drop by 9.1% (Opus 4.8 Max), 7.5% (Composer 2.5) and 0.3% (Opus 4.6 Max). In the speaker notes' words, disabling the internet connection significantly reduces the coding benchmark scores.</p>
        <p>A toy version (ours): the same scripted agent under a standard and a strict harness.</p>
        ${codeBlock(CODE.cheat)}${out(OUT.cheat)}
        ${demo("cheat", "Demo 10 · A verifier leak", "choose a harness, then step")}` },
    ],
    takeaways: ["Top scores above 90: too easy, or remembered?", "Dynamic and open-ended benchmarks respond.", "Tests can be wrong; agents can cheat."],
  },
  {
    slug: "5-prompting", nav: "Prompt engineering", title: "The Harness: Prompt Engineering",
    subtitle: "Better code without training the model",
    abstract: "Prompt engineering is cheap and works across LLMs. ReAct, chain-of-thought, Tree of Thoughts, structured thoughts for code, and Agentless's fixed pipeline.",
    tags: ["ReAct", "CoT", "ToT", "SCoT", "Agentless"],
    hero: "code:firstRepeated", heroCaption: "SCoT's output code (slide 45)",
    sections: [
      { id: "why", title: "Prompt engineering", html: `
        <p>Second pillar: the <b>harness</b>, <em>how to utilize LLMs efficiently?</em> The first tool is <b>prompt engineering</b>, a cost-efficient way to improve performance:</p>
        <ul><li><b>No need for training.</b></li><li><b>Easy to apply to multiple LLMs.</b></li></ul>
        <p><b>ReAct</b> (Lecture 2) is a widely used piece of prompt engineering: the cornerstone of LLM agents. Other research about reasoning follows.</p>` },
      { id: "cot", title: "Chain-of-Thought prompting", html: `
        <p><em>“Let's solve the problem step by step.”</em> In standard prompting the few-shot example gives only the answer (<em>“The answer is 11.”</em>), and on the new question (the cafeteria had 23 apples, used 20, bought 6 more) the model answers <b>27</b>, wrong. In chain-of-thought prompting the example shows its working, and the model copies the pattern: <em>23 − 20 = 3, 3 + 6 = 9</em>. <b>The answer is 9</b>, right.</p>
        ${demo("cot", "Demo 11 · Standard vs chain-of-thought", "switch the prompt")}` },
      { id: "tot", title: "Tree of Thoughts", html: `
        <p>Chain-of-thought follows one line of thought. <b>Tree of Thoughts</b> (ToT) explores a <em>tree</em>: at each step it generates several candidate thoughts, <b>self-evaluates</b> them, keeps the promising ones, and <b>backtracks</b> from dead ends. The slide's figure compares input-output prompting, CoT, self-consistency with CoT (several chains, majority vote) and ToT.</p>
        ${demo("tot", "Demo 12 · From one answer to a tree", "step through")}` },
      { id: "scot", title: "SCoT: structured code as thoughts", html: `
        <p>For code, <b>SCoT</b> makes the thoughts look like a program. The prompt asks the model to <em>“write a rough solving process. It starts with an input-output structure. You should use three basic structures to build the solving process, including sequences, branches, and loops.”</em> Task: find the first repeated character in a string. The thoughts:</p>
        ${codeBlock(CODE.scotThoughts, "repl")}
        <p>Then the output code (the slide's code; we rename the parameter <code>str</code>, which hides the built-in):</p>
        ${codeBlock(CODE.firstRepeated)}${out(OUT.firstRepeated)}
        <p>The code follows the thought's structure (a loop, a branch, a return) but is not a line-by-line copy: it uses a dictionary so it only passes over the string once.</p>
        ${demo("scot", "Demo 13 · Thoughts to code", "← → keys step")}` },
      { id: "agentless", title: "Agentless", html: `
        <p><b>Agentless</b> (Lecture 2) is prompt engineering at the scale of a whole repository: <b>predefined steps and prompt templates</b>. Localize (to the top-N files, then to classes and functions, then to edit locations); repair (generate patches); validate (generate reproduction tests, then filter and rank the patches); submit one patch.</p>
        ${demo("agentless", "Demo 14 · The Agentless pipeline", "step through")}` },
    ],
    takeaways: ["Prompting: no training, any LLM.", "CoT a line; ToT a tree with backtracking.", "SCoT: thoughts shaped like code."],
  },
  {
    slug: "6-execution", nav: "Improving at run time", title: "Improving During Execution",
    subtitle: "Run the code, and feed what happened back in",
    abstract: "Can we improve prompts during executions? Self-improving loops feed test results back; Reflexion remembers why it failed; LEVER generates many candidates and lets a verifier pick.",
    tags: ["self-reflection", "Reflexion", "memory", "candidate ranking", "verifier"],
    hero: "reflexionMini", heroCaption: "Reflexion: fail, reflect, remember, retry.",
    sections: [
      { id: "self", title: "Self-improving code generation", html: `
        <p>Slide 48 (from a survey of LLMs for code generation) draws the loop:</p>
        <ol><li><b>Code task</b>: <em>Write a Python script to print all unique elements in a list.</em></li>
        <li><b>Trajectory</b>: the code LLM writes <code>result = set(lst); return list(result)</code>.</li>
        <li><b>Evaluation</b>: an executor runs the tests. One passes, one fails.</li>
        <li><b>Self-reflection</b> (optional): <em>“… does not work as expected because it uses the built-in <code>set()</code> function in Python, which does not maintain the order of elements.”</em></li></ol>
        <p>The feedback goes back to the code LLM, which tries again.</p>` },
      { id: "reflexion", title: "Reflexion", html: `
        <p><b>Reflexion</b> makes the feedback stick: <b>store the reason for the last failed trajectory into memory for the next iteration of prompting.</b> Here is the whole loop in Python (ours). The coder and the reflector are scripted fake LLMs; the tests really run.</p>
        ${codeBlock(CODE.reflexion)}
        <p>First, slide 48's task:</p>
        ${codeBlock(CODE.runUnique)}${out(OUT.runUnique)}
        ${callout("tip", "TIP (ADDED)", `<p>The slide's second test uses letters, <code>['a', 'b', 'c', 'a', 'd']</code>. We use small integers instead: the order of a set of strings changes from one Python run to the next (string hashing is randomised), so with letters the buggy code would <em>occasionally</em> pass. A flaky test is one more way a benchmark can be wrong.</p>`)}
        <p>Now slide 49's task. Given two strings of parentheses, can they be joined, in some order, into a balanced string? The first trajectory only compares counts; the self-generated tests catch it; the reflection names the reason; the next trajectory checks both orders, <code>S1</code> and <code>S2</code>.</p>
        ${codeBlock(CODE.runParens)}${out(OUT.runParens)}
        ${demo("reflexion", "Demo 15 · Reflexion, trial by trial", "← → keys step", "This replays the notes' two runs. The console shows exactly what they print.")}
        ${predict("The first trajectory passed two of the three tests. Which test did it fail, and why?",
          `<p><code>match_parens([')(', ')(']) == 'No'</code>. There are two <code>(</code> and two <code>)</code>, so the count check says <code>'Yes'</code>, but both orders give <code>)()(</code>, which starts by closing a parenthesis that was never opened.</p>`)}` },
      { id: "candidates", title: "Generate multiple candidate code", html: `
        <p>Instead of one answer at a time: <b>generate multiple code blocks at the same time, and use another model to rank and return the top candidate.</b> The slide's figure (LEVER): the task is <em>“How many students in the class are between 20 and 30 years old?”</em>, to be answered in SQL.</p>
        <ol><li>The LLM <b>generates</b> k programs, each with a generation probability.</li>
        <li>An <b>executor</b> runs each program.</li>
        <li>A <b>verifier</b> model looks at the question, the code and the result, and gives each a verification probability.</li>
        <li>The two probabilities are multiplied; candidates with the <b>same result</b> are added up (Agg.); the highest final score wins.</li></ol>
        <p>The candidates and probabilities below are the slide's; the table is made up so the queries can run (ours, with Python's built-in <code>sqlite3</code>):</p>
        ${codeBlock(CODE.lever)}${out(OUT.lever)}
        <p>The model's own favourite (0.35, listing names) answers the wrong question. Two different programs that both return 5 pool their scores to 0.35, the same final score as on the slide, and win.</p>
        ${demo("rerank", "Demo 16 · Rank the candidates", "drag the verifier")}
        <p><b>What's next.</b> Benchmarks and the harness are done. Next lecture, <b>Coding II</b>, takes the third pillar: the <b>model</b>, how to teach LLMs coding knowledge.</p>` },
    ],
    takeaways: ["Run the code; feed the result back.", "Reflexion: remember why you failed.", "Many candidates + a verifier beat one guess."],
  },
  {
    slug: "7-summary", nav: "Summary", title: "Summary and Practice",
    subtitle: "Check yourself, then compute some pass@k",
    abstract: "A map of the lecture, five self-check questions, three exercises with solutions, and the key terms.",
    tags: ["knowledge map", "self-check", "exercises"],
    hero: "toc",
    sections: [
      { id: "map", title: "Knowledge map", html: `<div class="map">
        <div class="card"><h3>Three pillars</h3><ul><li>Benchmarks: evaluate</li><li>Harness: use LLMs efficiently</li><li>Model: teach coding (Coding II)</li></ul></div>
        <div class="card"><h3>Benchmarks</h3><ul><li>Define the problem; supply data</li><li>HumanEval: 164 tasks, unit tests</li><li>MBPP, LiveCodeBench, BigCodeBench</li></ul></div>
        <div class="card"><h3>pass@k</h3><ul><li>One of k attempts correct</li><li>Average over tasks</li><li>Small k: noisy</li></ul></div>
        <div class="card"><h3>Estimation</h3><ul><li>1 − C(n−c, k) / C(n, k)</li><li>1.0 if n − c &lt; k</li><li>Shortcut underestimates</li></ul></div>
        <div class="card"><h3>Pitfalls</h3><ul><li>Saturation, contamination</li><li>Dynamic: LiveBench, Frontier-CS</li><li>Wrong tests; cheating</li></ul></div>
        <div class="card"><h3>Harness</h3><ul><li>Prompting: ReAct, CoT, ToT, SCoT, Agentless</li><li>Execution: self-improve, Reflexion</li><li>Candidates + verifier (LEVER)</li></ul></div></div>` },
      { id: "check", title: "Check your understanding", html: `<div data-demo="quiz"><div class="demo-body"></div></div>` },
      { id: "exercises", title: "Exercises", html: `
        <h3>Exercise 1 ★ (compute)</h3>
        <p>Use <code>pass_at_k</code> to compute pass@1, pass@5 and pass@10 for n = 20, c = 3. Then compute the naive estimate for the same values. Which is larger?</p>
        <details class="reveal"><summary>Solution</summary>${codeBlock(CODE.ex1)}${out(OUT.ex1)}<p>For k = 1 they agree (both are c/n). For larger k the naive estimate is lower.</p></details>
        <h3>Exercise 2 ★ (modify)</h3>
        <p>Add a third candidate answer to <code>answers</code> in the HumanEval section that passes <code>check</code> without using a list comprehension. Then write one more <code>assert</code> for <code>check</code> that the buggy answer <code>l + [1]</code> would also fail.</p>
        <details class="reveal"><summary>Solution</summary>${codeBlock(CODE.ex2)}${out(OUT.ex2)}<p>For example <code>assert candidate([0]) == [1]</code>: <code>[0] + [1]</code> is <code>[0, 1]</code>.</p></details>
        <h3>Exercise 3 ★★ (design)</h3>
        <p>In the Reflexion loop, the coder never sees the failing test, only the reflection. Change <code>reflexion</code> so the prompt also includes the failing test. When could showing the test <em>hurt</em>? (Hint: think of slide 37.)</p>
        <details class="reveal"><summary>Solution</summary><p>Append the test to the lesson: <code>memory.append(reflector(...) + f" (failed: {failed[0]})")</code>. Showing the test helps the model target the bug, but it also invites it to special-case that one test (for example, <code>if lst == [3, 1, 2, 3]: return [3, 1, 2]</code>). That is the verifier-leak problem of slide 37 in miniature: the tests pass and nothing is solved. Hidden tests guard against it.</p></details>` },
      { id: "terms", title: "Key terms and further reading", html: `
        <p class="tags">${["specification", "three pillars", "benchmark", "HumanEval", "unit test", "pass@k", "unbiased estimator", "sampling with/without replacement", "MBPP", "LiveCodeBench", "BigCodeBench", "saturation", "data contamination", "LiveBench", "Frontier-CS", "verifier leak", "reward hacking", "strict harness", "prompt engineering", "chain-of-thought", "Tree of Thoughts", "SCoT", "Agentless", "self-reflection", "Reflexion", "candidate ranking", "verifier"].map((t) => `<span class="tag">${t}</span>`).join("")}</p>
        <ul><li>M. Chen et al., <em>Evaluating Large Language Models Trained on Code</em> (HumanEval, pass@k). <a href="https://arxiv.org/abs/2107.03374" target="_blank" rel="noopener">arXiv:2107.03374</a></li>
        <li>HumanEval dataset: <a href="https://huggingface.co/datasets/openai/openai_humaneval" target="_blank" rel="noopener">huggingface.co</a></li>
        <li>MBPP: <a href="https://huggingface.co/datasets/Muennighoff/mbpp" target="_blank" rel="noopener">huggingface.co</a> · LiveCodeBench: <a href="https://livecodebench.github.io/" target="_blank" rel="noopener">livecodebench.github.io</a> · BigCodeBench: <a href="https://huggingface.co/datasets/bigcode/bigcodebench" target="_blank" rel="noopener">huggingface.co</a></li>
        <li>EvalPlus leaderboard: <a href="https://evalplus.github.io/leaderboard.html" target="_blank" rel="noopener">evalplus.github.io</a> · LiveBench: <a href="https://livebench.ai/" target="_blank" rel="noopener">livebench.ai</a> · Frontier-CS: <a href="https://frontier-cs.org/" target="_blank" rel="noopener">frontier-cs.org</a></li>
        <li>Cheating agents: <a href="https://debugml.github.io/cheating-agents/" target="_blank" rel="noopener">debugml.github.io</a> · Cursor, reward hacking in coding benchmarks: <a href="https://cursor.com/en-US/blog/reward-hacking-coding-benchmarks" target="_blank" rel="noopener">cursor.com</a></li>
        <li>J. Wei et al., <em>Chain-of-Thought Prompting</em>. <a href="https://arxiv.org/abs/2201.11903" target="_blank" rel="noopener">arXiv:2201.11903</a></li>
        <li>S. Yao et al., <em>Tree of Thoughts</em>. <a href="https://arxiv.org/abs/2305.10601" target="_blank" rel="noopener">arXiv:2305.10601</a></li>
        <li>J. Li et al., <em>Structured Chain-of-Thought Prompting for Code Generation</em>. <a href="https://arxiv.org/abs/2305.06599" target="_blank" rel="noopener">arXiv:2305.06599</a></li>
        <li>C. S. Xia et al., <em>Agentless</em>. <a href="https://arxiv.org/abs/2407.01489" target="_blank" rel="noopener">arXiv:2407.01489</a></li>
        <li>J. Jiang et al., <em>A Survey on Large Language Models for Code Generation</em>. <a href="https://arxiv.org/abs/2406.00515" target="_blank" rel="noopener">arXiv:2406.00515</a></li>
        <li>N. Shinn et al., <em>Reflexion: Language Agents with Verbal Reinforcement Learning</em>. <a href="https://arxiv.org/abs/2303.11366" target="_blank" rel="noopener">arXiv:2303.11366</a></li>
        <li>A. Ni et al., <em>LEVER: Learning to Verify Language-to-Code Generation with Execution</em>. <a href="https://arxiv.org/abs/2302.08468" target="_blank" rel="noopener">arXiv:2302.08468</a> (the slide links X. Chen et al., <em>Teaching Large Language Models to Self-Debug</em>, <a href="https://arxiv.org/abs/2304.05128" target="_blank" rel="noopener">arXiv:2304.05128</a>)</li></ul>` },
    ],
    takeaways: ["Measure with pass@k, estimated properly.", "Distrust saturated, leaky or cheated scores.", "Improve with prompts and execution feedback."],
  },
];

const QUIZ = [
  { q: "Which pillar answers “How to utilize LLMs efficiently?”",
    opts: ["Benchmarks", "Harness", "Model", "Specification"],
    a: 1, why: "Benchmarks evaluate performance; the harness uses LLMs efficiently; the model is taught coding knowledge (Coding II)." },
  { q: "Three tasks: one passes within 5 attempts, two never do. What is the benchmark's pass@5?",
    opts: ["0%", "33.33%", "66.67%", "100%"],
    a: 1, why: "Each task scores 100% or 0%; the benchmark averages them: (100 + 0 + 0) / 3 = 33.33%." },
  { q: "n = 10 samples, c = 6 correct. What is the unbiased pass@5?",
    opts: ["0.6", "0.92", "1.0", "It cannot be computed"],
    a: 2, why: "n − c = 4 < 5, so any 5 picks must include a correct sample: pass@5 = 1.0." },
  { q: "Why does 1 − (1 − c/n)^k underestimate pass@k?",
    opts: ["It ignores the tests", "It treats the k draws as independent, with replacement", "It uses too many samples", "It only works for k = 1"],
    a: 1, why: "In reality k samples are picked from a fixed pool without putting any back. (For k = 1 both formulas agree.)" },
  { q: "On slide 36 the model returned 10 dates for 1–10 January and the test failed. What was wrong?",
    opts: ["The model's code", "The test: the prompt says the range is inclusive", "The random seed", "pandas"],
    a: 1, why: "Ten days inclusive is ten dates; the test expected (end_date − start_date).days = 9. Benchmarks may be wrong." },
  { q: "What does Reflexion store between trials?",
    opts: ["The model's weights", "The whole test suite", "The reason the last trajectory failed", "Every candidate program"],
    a: 2, why: "It stores the reflection — why the last trajectory failed — in memory and adds it to the next prompt." },
];

// The lecture video (added after the page was built).
LECTURE.videos = { "../videos/L08.mp4": "Lecture 8 — Coding I (13 min)" };
CHAPTERS[0].sections.push({
  id: "video", title: "Watch the lecture video",
  html: `<p>The video follows the same slides in the same order. Watch it first, or use it to review after the demos.</p>
    <div class="card video" data-video="../videos/L08.mp4"></div>`,
});
