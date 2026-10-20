// L01 content, adapted from csc4801/notes/L01-llms.md (which follows the slides in order).

const demo = (name, title, instr, hint = "") =>
  `<div class="card demo" data-demo="${name}"><div class="head"><span class="title">${title}</span><span>${instr}</span></div>
   <div class="demo-body"></div>${hint ? `<p class="hint">${hint}</p>` : ""}</div>`;
const callout = (kind, label, body) => `<div class="callout ${kind}"><b>${label}</b>${body}</div>`;
const predict = (q, a) => callout("predict", "PREDICT", `<p>${q}</p><details class="reveal"><summary>Show the answer</summary>${a}</details>`);
const added = (body) => callout("note", "ADDED (NOT ON THE SLIDES)", body);
const out = (name) => codeBlock(OUT[name], "out");

const VIDEO = "../videos/L01.mp4";

const LECTURE = {
  number: 1,
  title: "The Principles of Large Language Models",
  tagline: "One token at a time",
  lead: "What an LLM actually does — predict the next token, again and again — why its answers are uncertain, where its billions of weights come from (pre-training, SFT, RLHF), and which models you can use. Every idea runs in your browser, one step at a time.",
  heroDemo: "nextTokenMini",
  heroLabel: "Next-token prediction · What is Nobel Prize of Computing?",
  heroCaption: "Each new token goes back into the input, until the model predicts [END].",
  whyTitle: "Why this lecture matters",
  whySub: "Three ideas behind every AI tool you will use this term",
  why: [
    ["Next-token prediction", "An LLM writes everything, code included, <b>one token at a time</b>. Agents, prompts and AI coding all build on this."],
    ["Probabilities, not facts", "Each step is a <b>probability distribution</b>. Sampling makes answers uncertain; a better model has better probabilities."],
    ["Learned in three stages", "<b>Pre-train</b> on the internet, <b>SFT</b> on a few good examples, <b>RLHF</b> on human preferences."],
  ],
  ctaTitle: "Ready to watch a model predict its first token?",
  minutes: "About 45–60 minutes",
  videos: { [VIDEO]: "Lecture 1 — The Principles of Large Language Models (16 min)" },
};

const CHAPTERS = [
  {
    slug: "1-tokens", nav: "Next token", title: "Tokens and Next-Token Prediction",
    subtitle: "What an LLM actually does",
    abstract: "LLMs provide the core capabilities of ChatGPT, Claude, DeepSeek and Cursor. Underneath, an LLM does one thing: it predicts the next token, appends it, and goes again.",
    tags: ["token", "tokenizer", "next-token prediction", "[END]"],
    hero: "nextTokenMini", heroCaption: "The slides' two examples, one token at a time.",
    sections: [
      { id: "why", title: "Why LLMs", html: `
        <p>You have used chat assistants such as ChatGPT, Claude and DeepSeek; coding tools such as Cursor are built on the same kind of model. In all of them, <b>LLMs provide the core capabilities.</b> An LLM is easy to use: you type a question, and an answer comes back. Yet it is powerful, with wide applications, <em>especially in software engineering</em>.</p>
        <p>The goal of this lecture: <b>understand the core principles of LLMs.</b> Every later lecture (agents, prompts, coding with AI) builds on them.</p>
        ${predict("In your view, what defines a good model?", `<p>Keep your answer in mind. Chapter 2 gives the slides' answer: a better model has a <b>more accurate probability</b> for the next-token prediction.</p>`)}` },
      { id: "video", title: "Watch the lecture video", html: `
        <p>The video follows the same slides in the same order. Watch it first, or use it to review after the demos.</p>
        <div class="card video" data-video="${VIDEO}"></div>` },
      { id: "tokens", title: "Tokens", html: `
        <p>A language model does one thing: it reads some text and predicts the <b>next token</b>. A <b>token</b> (词元) is a small piece of text: often a whole word, sometimes part of a word or a single symbol.</p>
        <p>How is text cut into tokens? A program called a <b>tokenizer</b> does it, with a fixed vocabulary of pieces. Slide 54 shows a real example for a line of code: <code>def _get_eigensystem(self):</code> becomes <code>[def] [ get] [_e] [ig] [ens] [ystem] [(self] [):]</code>. Pieces often start with a space, and a long name is split into several pieces.</p>
        <p>Here is a toy tokenizer. Its vocabulary has only 18 pieces; at each position it takes the longest piece that matches, and falls back to a single character.</p>
        ${codeBlock(CODE.tokenize)}${out("tokenize")}
        <p><code>Models</code> is not in the vocabulary, so it becomes <code>' Model'</code> and <code>'s'</code>; <code>_eigensystem</code> is split into the same four pieces as on slide 54.</p>
        ${demo("tokenize", "Demo 1 · Cut text into tokens", "type anything", "The toy tokenizer from the notes, with its 18-piece vocabulary. ␣ marks a space. Dashed chips are single characters that are not in the vocabulary.")}
        ${added(`<p><b>Token IDs.</b> Inside the model, each token is a number: its position in the vocabulary. The model never sees letters, only these IDs.</p>${codeBlock(CODE.tokenIds)}${out("tokenIds")}`)}` },
      { id: "next", title: "Next-token prediction", html: `
        <p>The slides give the prompt <em>“LLMs are”</em> to an LLM. It predicts <b>Large</b>. Then <em>“LLMs are Large”</em> goes in, and it predicts <b>Language</b>; then <b>Models</b>. Each output token is appended to the prompt, and the longer prompt goes in again. That is <b>next-token prediction</b>.</p>
        <p>Answering a question works the same way. Ask <em>“What is Nobel Prize of Computing?”</em>:</p>
        <table><tr><th>Input</th><th>Next token</th></tr>
        <tr><td>What is Nobel Prize of Computing?</td><td>Turing</td></tr>
        <tr><td>What is Nobel Prize of Computing? Turing</td><td>Award</td></tr>
        <tr><td>What is Nobel Prize of Computing? Turing Award</td><td>[END]</td></tr></table>
        <p>The answer is the tokens produced before the special <b>[END]</b> token: <em>Turing Award</em>. It is never stored anywhere as a whole; it is produced one token at a time.</p>
        ${demo("nextToken", "Demo 2 · One token at a time", "pick a prompt, then step", "The toy model from Chapter 2, always taking the most likely token (greedy). The console shows exactly what the notes' program prints.")}
        ${predict("Can you answer? <em>“Roses are red, violets are ___”</em> and <em>“I opened the fridge and found a ___”</em>.",
          `<p>Almost everyone says <em>blue</em> for the first. The second has many good answers. That difference is what Chapter 2 is about: the next token is a <b>probability</b>, not a fact.</p>`)}` },
    ],
    takeaways: ["A token is a small piece of text.", "Predict, append, repeat.", "Stop at [END]."],
  },
  {
    slug: "2-prob", nav: "Probabilities", title: "Probabilities and Uncertainty",
    subtitle: "Why the same question can get different answers",
    abstract: "An LLM gives every possible next token a probability, and samples one. That makes its output uncertain — and gives one answer to “what defines a good model?”.",
    tags: ["distribution", "sampling", "seed", "temperature"],
    hero: "tempMini", heroCaption: "Temperature sharpens or flattens the distribution (added).",
    sections: [
      { id: "dist", title: "The next-token distribution", html: `
        <p>There is a huge space of possible next tokens. How does an LLM choose one? It gives <b>every</b> token a score, a probability. After <em>“What is Nobel Prize of Computing? Turing”</em> the slide shows:</p>
        <table><tr><th>Token</th><th>Score</th></tr><tr><td>Award</td><td>0.5</td></tr><tr><td>Home</td><td>0.2</td></tr>
        <tr><td>at</td><td>0.0000…</td></tr><tr><td>how</td><td>0.0000…</td></tr><tr><td>……</td><td></td></tr></table>
        <p>This table is the <b>next-token probability distribution</b>. Each step of an answer has its own distribution (slide 11): one for <em>Turing</em>, one for <em>Award</em>, one for <em>[END]</em>.</p>
        <p>Here is a toy language model: a table that gives, for the last word of the input, the probability of each next word. To keep the table small, its tokens are whole words, and it looks only at the last word; a real LLM looks at the whole input. <em>Award 0.5</em> and <em>Home 0.2</em> are the slide's numbers; the other numbers are illustrative.</p>
        ${codeBlock(CODE.nextTable)}${out("nextTable")}` },
      { id: "sample", title: "Probabilistic output", html: `
        ${predict("What is the problem with a probabilistic answer?", `<p>The output is <b>uncertain</b>: ask the same question twice and you may get two different answers.</p>`)}
        <p>The model does not always take the top token: it <b>samples</b> one from the distribution. So probabilistic next-token prediction makes the output <b>uncertain</b>. Ask <em>“What is Nobel Prize of Computing?”</em> twice, and the first token may be <em>Turing</em> (Turing Award) or <em>It</em> (It is Turing Award).</p>
        ${callout("pattern", "WHAT MAKES A GOOD MODEL", `<p>A better model has a <b>more accurate probability</b> for the next-token prediction.</p>`)}
        <p>Here is a sampler. It draws a random number <code>r</code> between 0 and 1 and walks along the distribution until the running total passes <code>r</code>. To make the run repeatable (and the same in the demo below), it uses its own tiny random number generator with a fixed <b>seed</b>.</p>
        ${codeBlock(CODE.sampler)}${out("sampler")}
        <p>Same question, six answers, four of them different. Run it again with the same seed and you get the same six; change the seed and you get others.</p>
        ${demo("sample", "Demo 3 · Sample the answer, token by token", "set seed and temperature, then step", "Seed 42 at temperature 1.0, <b>Ask 6 times</b>: the same six answers as the notes. The generator is the notes' Park–Miller one, so any seed matches Python.")}
        ${added(`<p><b>Temperature.</b> Chat models let you set a <b>temperature</b> <i>t</i>. The sampler above raises each probability to the power 1/<i>t</i> and renormalises. A low temperature sharpens the distribution toward the top token; a high one flattens it.</p>${codeBlock(CODE.temperature)}${out("temperature")}<p>At <i>t</i> = 1 the distribution is unchanged. As <i>t</i> approaches 0, sampling becomes <code>greedy</code>.</p>`)}` },
      { id: "challenge", title: "Next-token prediction is challenging", html: `
        <p>The slides' code example: given</p>
        ${codeBlock(CODE.resultEq)}
        <p>what comes next: <code>max(numbers)</code>, <code>min(numbers)</code>, <code>sum(numbers)</code> or <code>len(numbers)</code>? (The slide groups several tokens together for simplicity.) To predict well, the model must:</p>
        <ol><li>understand the code's intention;</li><li>pick the correct function name;</li><li>pick the correct variable name;</li><li>close the brackets.</li></ol>
        <p>A good next-token predictor has to understand the code, not just the words.</p>` },
    ],
    takeaways: ["Every token gets a probability.", "Sampling → uncertain output.", "Better model = more accurate probabilities."],
  },
  {
    slug: "3-weights", nav: "Weights & stages", title: "A Function with Billions of Weights",
    subtitle: "What is inside, and where it comes from",
    abstract: "An LLM is a function f(x) with a huge number of weights, built on Transformers. The weights are learned from three kinds of data, in three stages.",
    tags: ["f(x)", "weights", "Transformer", "Pre-train → SFT → RLHF"],
    hero: "stagesMini", heroCaption: "The same request, answered by each version of the model.",
    sections: [
      { id: "function", title: "A function with weights", html: `
        <p>Think of an LLM as a function <i>f</i>. Its input <i>x</i> is a user task or incomplete code; its output <i>f</i>(<i>x</i>) is the next-token distribution. A school function such as <i>f</i>(<i>x</i>) = <i>ax</i> + <i>b</i> has two weights, <i>a</i> and <i>b</i>. An LLM is the same idea with <b>a huge number of weights</b>. On Hugging Face, the open model <code>openai/gpt-oss-120b</code> has about 120 billion parameters (slide 16).</p>
        <p>The architecture of <i>f</i> is the <b>Transformer</b>: layers of <em>self-attention</em> and <em>feed-forward</em> parts. This is not an LLM course, so we do not go into detail. Two good visual guides: <a href="https://jalammar.github.io/illustrated-transformer/" target="_blank" rel="noopener">The Illustrated Transformer</a> and <a href="https://bbycroft.net/llm" target="_blank" rel="noopener">bbycroft.net/llm</a>.</p>` },
      { id: "data", title: "Where do the weights come from?", html: `
        <p>From data, of three kinds (slide 19):</p>
        <table><tr><th>Data</th><th>Example</th></tr>
        <tr><td>Public data from the internet</td><td>GitHub (420M+ projects/repositories); Stack Overflow, the biggest Q&amp;A site for programmers</td></tr>
        <tr><td>Annotation data</td><td><code>numbers = [1, 2, 3, 4, 5]</code> → <code>result = sum(numbers)</code></td></tr>
        <tr><td>User response data</td><td>thumbs down for <code>max(numbers)</code>, thumbs up for <code>sum(numbers)</code></td></tr></table>
        <p>Each kind of data feeds one training stage:</p>
        <table><tr><th>Stage</th><th>Full name</th><th>Data</th></tr>
        <tr><td>Pre-train</td><td>Pre-training</td><td>public data from the internet</td></tr>
        <tr><td>SFT</td><td>Supervised Fine-Tuning</td><td>annotation data</td></tr>
        <tr><td>RLHF</td><td>Reinforcement Learning with Human Feedback</td><td>user response data</td></tr></table>
        <p>SFT and RLHF together are called <b>alignment</b>.</p>
        ${callout("pattern", "THE LEARNING PROCESS", `<p><b>Each stage's output is the input of the next stage.</b> Initial model with default weights → Pre-train → <em>Version 1</em> → SFT → <em>Version 2</em> → RLHF → <em>Final version</em>.</p>`)}
        ${demo("stages", "Demo 4 · Train the model, stage by stage", "step through the stages", "The answers are the slides' examples (slides 40 and 43); the initial model's noise is illustrative.")}` },
    ],
    takeaways: ["LLM = f(x) with billions of weights.", "Internet → Pre-train; examples → SFT; preferences → RLHF.", "Each stage starts from the last."],
  },
  {
    slug: "4-pretrain", nav: "Pre-training", title: "Pre-training",
    subtitle: "Huge data, self-supervised, and the scaling law",
    abstract: "Pre-training turns the internet into an answer key. How much data that takes, how much compute (C ≈ 6ND), and why quality matters as much as quantity.",
    tags: ["self-supervised", "15T tokens", "C ≈ 6ND", "compression", "data quality"],
    hero: "code:train", heroCaption: "“Training” by counting, from the notes",
    sections: [
      { id: "selfsup", title: "Self-supervised learning", html: `
        <p>Pre-training requires a <b>huge amount of data</b>. Slide 22 cites a study (Zhang et al., 2021, <em>When do you need billions of words of pretraining data?</em>): its chart shows a model's performance on several tests rising as the pretraining set grows from 1M to 30B words, and one of them (SuperGLUE) still rising at the largest size.</p>
        <p>The trick is <b>self-supervised learning</b>: the text is its own answer key. Take <code>print("hello world!");</code> from the internet and cut it into input/output pairs:</p>
        ${codeBlock(CODE.pairs)}${out("pairs")}
        <p>The model predicts the output, compares it with the real next token, and updates its weights. <b>Few human effort is involved</b>, so this scales to the whole internet.</p>
        <p>Here is the idea in miniature. Our toy “training” just counts which token follows which, and turns the counts into probabilities. The four lines of code are illustrative.</p>
        ${codeBlock(CODE.train)}${out("train")}
        <p>No one labelled anything: the probabilities come from the text alone.</p>
        ${demo("selfSup", "Demo 5 · From raw text to a next-token table", "step the pairs, then edit the corpus")}` },
      { id: "size", title: "How much data?", html: `
        <p>LLaMA 3 was pre-trained on a corpus of about <b>15T</b> (15 trillion) multilingual tokens; DeepSeek-V4 on <b>more than 32T</b> (slide 24). How big is 15T? Print it at 1000 tokens per page, with 100 sheets of paper 1 cm thick, and read one page every 10 seconds:</p>
        ${codeBlock(CODE.printout)}${out("printout")}
        ${predict("What happens if data is exhausted?", `<p>There is only one internet, and more and more new text on it is written by AI. It starts to sound the same: the slides show the familiar pattern <em>“Not …, instead …”</em>. <b>We lose our uniqueness.</b></p>`)}` },
      { id: "scaling", title: "Scaling law", html: `
        <p>With a limited pretraining budget, how should we spend it? More training data? More model parameters? Both? A different architecture? This is the question of the <b>scaling law</b>. For Transformer language models there is an approximation:</p>
        <p style="text-align:center;font:600 20px var(--mono)">C ≈ 6ND</p>
        <p>where <i>N</i> is the number of model parameters, <i>D</i> the number of training tokens, and <i>C</i> the compute in floating point operations (FLOPs). For Llama 3:</p>
        ${codeBlock(CODE.compute)}${out("compute")}
        <p>That is 6.3 × 10<sup>24</sup> FLOPs. The scaling-law study then asks three questions:</p>
        <ul><li><b>Data scaling:</b> change <i>D</i>; what happens to the loss?</li><li><b>Model scaling:</b> change <i>N</i>; what happens to the loss?</li>
        <li><b>Compute scaling:</b> should we increase compute by increasing <i>D</i> or by increasing <i>N</i>?</li></ul>
        <p>Its plots (slide 34, from Kaplan et al.) show the test loss falling along a smooth straight line on log-log axes as compute, dataset size and parameters grow. The fitted lines on the slide are power laws, for example <i>L</i> = (<i>N</i> / 8.8·10<sup>13</sup>)<sup>−0.076</sup> for <i>N</i> parameters (not counting embeddings) and <i>L</i> = (<i>D</i> / 5.4·10<sup>13</sup>)<sup>−0.095</sup> for <i>D</i> tokens:</p>
        ${codeBlock(CODE.lossN)}${out("lossN")}
        <p>Each 100× more parameters multiplies the loss by the same factor (100<sup>−0.076</sup> ≈ 0.70): steady, predictable gains, but each one costs 100 times more.</p>
        ${demo("scale", "Demo 6 · Data, compute and loss", "move the sliders", "The first two consoles print exactly what the notes' programs print for the same inputs.")}` },
      { id: "quality", title: "Compression and quality", html: `
        <p>LLMs do not remember everything from training: they <b>compress</b> all the knowledge they have seen. From <code>def add(a, b): return a + b</code> and <code>def multiply(a, b): return a * b</code>, a model can learn the pattern</p>
        ${codeBlock(CODE.patternFn)}
        <p>and then complete <code>def divide(a, b):</code> with <code>return a / b</code>, even if it never saw that function.</p>
        <p>Is more data always better? No. Slide 36 shows a forum page that is nothing but <em>“Mmmmm…”</em>: lots of tokens, nothing to learn. <b>Quality is also important.</b> One way to clean data is <em>Rephrasing the Web</em>: a model rephrases noisy web text into high-quality, Wikipedia-style English. On the slide's chart the model trained this way reaches the same accuracy about 3× faster.</p>
        ${callout("pattern", "AFTER PRE-TRAINING", `<ul><li>A pre-trained model has a <em>chance</em> of producing the correct answer.</li><li>That chance may not be good enough.</li>
          <li>The pre-trained model is like a rough gem: it still needs meticulous polishing.</li><li>Next step: <b>SFT and RL increase the chance of the correct answer.</b></li></ul>`)}` },
    ],
    takeaways: ["The text is its own answer key.", "15T tokens; C ≈ 6ND.", "Quality matters, and data can run out."],
  },
  {
    slug: "5-align", nav: "SFT & RLHF", title: "SFT and RLHF",
    subtitle: "How should I answer — and which answer do humans prefer?",
    abstract: "SFT teaches the model to act as an assistant from a few high-quality examples. RLHF uses human preferences, with no new training data, borrowing from reinforcement learning.",
    tags: ["SFT", "RLHF", "preferences", "reward", "AlphaGo"],
    hero: "code:feedback", heroCaption: "Preferences move the weights (a toy, from the notes)",
    sections: [
      { id: "sft", title: "SFT: how should I answer a user?", html: `
        <p><b>SFT</b> (Supervised Fine-Tuning) teaches the model: <em>“How should I answer a user?”</em> The slides' example:</p>
        <table><tr><th>Input</th><th>Before SFT</th><th>After SFT</th></tr>
        <tr><td><code>def divide(a, b):</code></td><td><code>return a / b</code></td><td></td></tr>
        <tr><td>User: Write a Python function that divides two numbers.</td><td>Assistant: I cannot write it.</td><td>Assistant: <code>def divide(a, b): return a / b</code></td></tr></table>
        <p>The pre-trained model completes code well, but it has not learned to act as an assistant. SFT shows it pairs of a user request and a good answer.</p>
        <p>SFT uses <b>few but high-quality</b> data to further adjust the weights. The Llama 2 paper (slide 41): <em>“Quality Is All You Need.”</em> The team set aside millions of third-party examples, used fewer but higher-quality examples from their own annotation, and stopped after a total of <b>27,540</b> annotations.</p>` },
      { id: "rlhf", title: "RLHF: which answer do humans prefer?", html: `
        <p><b>RLHF</b> (Reinforcement Learning with Human Feedback) teaches the model: <em>“Which answer do humans prefer?”</em> For the same request the model may give two answers:</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">${codeBlock(CODE.divide1)}${codeBlock(CODE.divide2)}</div>
        <p>People prefer the second (thumbs up), not the first (thumbs down). <b>No new training data!</b> The preferences alone are used as feedback to adjust the weights.</p>
        <p><b>Which one do you prefer?</b> The slides' question, from a student who starts studying the day before the exam. There is no single right answer. The speaker note on this slide (in the <code>.pptx</code>) turns it into a group activity: if a model got feedback only from your group for a long time, what would it get better at, and what might it give up? The point: people's preferences depend on how they judge, and <em>popular</em> does not automatically mean <em>true or reliable</em>.</p>
        ${demo("prefer", "Demo 7 · Vote, and watch the weights move", "click the answer you prefer")}
        <p>Here is the toy behind the demo. The model's weights are just the probabilities of answers A, B and C; each vote raises the preferred answer by half and renormalises. This is only an illustration.</p>
        ${codeBlock(CODE.feedback)}${out("feedback")}
        <p>No new answers were written; only the probabilities moved.</p>
        ${added(`<p>Real RLHF trains a separate <em>reward model</em> on many such comparisons, then updates the LLM with a reinforcement-learning algorithm.</p>`)}` },
      { id: "rl", title: "Reinforcement learning", html: `
        <p>RLHF borrows from <b>reinforcement learning</b> (RL). An <b>actor</b> sees an <b>observation</b>, takes an <b>action</b> (action = <i>f</i>(observation)), and the <b>environment</b> returns a <b>reward</b>. The goal: <em>find a policy (an actor) that maximises the total (expected) reward.</em></p>
        <p>In Go, AlphaGo observes the board and chooses the next move. The reward is 0 for most moves; at the end it is +1 for a win and −1 for a loss. An LLM is the same picture: the prompt is the board, and the next token is the move.</p>
        ${demo("rl", "Demo 8 · Go and the LLM, side by side", "step, then switch", "The LLM's reward row is our gloss: slide 48 maps only observation, actor and action.")}
        ${callout("pitfall", "THE REWARD IS IMPORTANT", `<p>The slides link OpenAI's <em>Faulty Reward Functions</em>: in a boat-racing game, an agent rewarded for points learned to circle and hit the same targets again and again instead of finishing the race. An RL learner optimises exactly what you reward, not what you meant.</p>`)}
        <p>The full learning process again: default weights → <b>Pre-train</b> (version 1) → <b>SFT</b> (version 2) → <b>RLHF</b> (final version).</p>` },
    ],
    takeaways: ["SFT: few, high-quality examples.", "RLHF: preferences, no new data.", "Reward what you mean."],
  },
  {
    slug: "6-models", nav: "Models", title: "Beyond Text, and Which LLMs to Use",
    subtitle: "Visual tokens; black-box, open-source, open-weight",
    abstract: "Tokens need not be text: code can be read as an image with far fewer tokens. And LLMs come in three kinds, by how much of them is public.",
    tags: ["multimodal", "visual tokens", "black-box", "open-weight", "open-source"],
    hero: "visualMini", heroCaption: "One function: 110 text tokens, or 27 visual tokens.",
    sections: [
      { id: "beyond", title: "Beyond text", html: `
        ${predict("Must tokens be text?", `<p>No. Code, images and audio can all be turned into tokens.</p>`)}
        <p>A multimodal LLM (slide 53) cuts an image into <b>patches</b>, encodes them as visual tokens, aligns them with the text tokens of the prompt, and processes both together.</p>
        <p>This even works for code (slide 54, arXiv:2602.01785). A function read as text is <b>110 text tokens</b>. Rendered as an image it is 110 visual tokens; with the resolution adjusted, <b>27 visual tokens</b>: 75.5% fewer, yet the model can still tell the code apart.</p>
        ${demo("visual", "Demo 9 · Text tokens vs visual tokens", "one square per token")}` },
      { id: "kinds", title: "Which LLMs can we use?", html: `
        <table><tr><th>Kind</th><th>What is public</th><th>What we know</th><th>Examples on the slides</th></tr>
        <tr><td><b>Black-box</b></td><td>nothing inside; you call a service</td><td>not how <i>f</i> works or how it is produced</td><td>Gemini, ChatGPT, Claude</td></tr>
        <tr><td><b>Open-source</b></td><td>data, data filtering, tokenizer, training code, hyperparameters, checkpoints, logs, evaluation</td><td>how <i>f</i> is produced</td><td>Olmo, BLOOM</td></tr>
        <tr><td><b>Open-weight</b></td><td>only the parameters</td><td>the internals of <i>f</i>; we can download it and deploy it locally</td><td>Gemma, Mistral, LLaMA, MiMo</td></tr></table>
        <p>Black-box models are typically commercial, huge and powerful. Open-weight models are a trade-off between black box and open source.</p>
        ${demo("models", "Demo 10 · What can you see?", "pick a kind")}
        <p><b>Hugging Face</b> (<a href="https://huggingface.co/models" target="_blank" rel="noopener">huggingface.co/models</a>) hosts both open-weight models (parameters public) and open-source ones (training process public). For this course, <b>we will provide MiMo and GLM APIs for all students.</b> With <b>Ollama</b> (<a href="https://ollama.com/" target="_blank" rel="noopener">ollama.com</a>) you can run an open model on your own machine.</p>
        <p>For more on how LLMs work, the slides recommend Prof. Hung-yi Lee's (李宏毅, National Taiwan University) course; the link is in the further reading.</p>` },
    ],
    takeaways: ["Tokens can be images and audio.", "Black-box: use it, can't see it.", "Open-weight: download and run locally."],
  },
  {
    slug: "7-summary", nav: "Summary", title: "Summary and Practice",
    subtitle: "Check yourself, then try it on the toy model",
    abstract: "A map of the lecture, five self-check questions, and four exercises with solutions.",
    tags: ["knowledge map", "self-check", "exercises"],
    hero: "toc",
    sections: [
      { id: "map", title: "Knowledge map", html: `<div class="map">
        <div class="card"><h3>Next token</h3><ul><li>Tokens: pieces of text</li><li>Predict, append, repeat</li><li>Stop at [END]</li></ul></div>
        <div class="card"><h3>Probabilities</h3><ul><li>A distribution at every step</li><li>Sampling → uncertain output</li><li>Better model, better probabilities</li></ul></div>
        <div class="card"><h3>Weights</h3><ul><li><i>f</i>(<i>x</i>) with billions of weights</li><li>Transformer architecture</li><li>Pre-train → SFT → RLHF</li></ul></div>
        <div class="card"><h3>Pre-training</h3><ul><li>Self-supervised, internet scale</li><li>15T tokens; C ≈ 6ND</li><li>Compression; quality matters</li></ul></div>
        <div class="card"><h3>Alignment</h3><ul><li>SFT: few, high-quality examples</li><li>RLHF: preferences, no new data</li><li>The reward is important</li></ul></div>
        <div class="card"><h3>Models</h3><ul><li>Tokens need not be text</li><li>Black-box · open-source · open-weight</li><li>Run open models locally</li></ul></div></div>` },
      { id: "check", title: "Check your understanding", html: `<div data-demo="quiz"><div class="demo-body"></div></div>` },
      { id: "exercises", title: "Exercises", html: `
        <p>The exercises use the functions from the notes (<code>train</code>, <code>corpus</code>, <code>sampler</code>, <code>generate</code>, <code>question</code>).</p>
        <h3>Exercise 1 ★ (compute)</h3>
        <p>Use C ≈ 6ND for a model with 7 billion parameters trained on 2 trillion tokens. How many times less compute is that than Llama 3's 6.3 × 10<sup>24</sup> FLOPs?</p>
        <details class="reveal"><summary>Solution</summary>${codeBlock(CODE.ex1)}${out("ex1")}</details>
        <h3>Exercise 2 ★ (modify)</h3>
        <p>Add two lines <code>"result = len ( numbers )"</code> to <code>corpus</code> and train again. What are the probabilities after <code>=</code> now? (Try it in Demo 5 too.)</p>
        <details class="reveal"><summary>Solution</summary>${codeBlock(CODE.ex2)}${out("ex2")}<p>Six lines have <code>=</code>: three continue with <code>sum</code>, one with <code>max</code>, two with <code>len</code>.</p></details>
        <h3>Exercise 3 ★★ (experiment)</h3>
        <p>Ask the toy model the question 1000 times with <code>sampler(seed=7)</code> and count the answers. Which answer is the most common? Work out its probability from <code>NEXT</code> and compare.</p>
        <details class="reveal"><summary>Solution</summary>${codeBlock(CODE.ex3)}${out("ex3")}<p><em>Turing Award</em> has probability 0.6 × 0.5 = 0.30, close to 293 out of 1000. Over both paths, <em>Award</em> ends the answer half the time (0.5): 293 + 211 = 504.</p></details>
        <h3>Exercise 4 ★★ (design)</h3>
        <p>Which training stage does each one most resemble: (a) clicking thumbs down on a chatbot answer; (b) writing 1,000 user requests with model answers by hand; (c) crawling GitHub for code? And which kind of LLM would you pick if you must know exactly what data it was trained on?</p>
        <details class="reveal"><summary>Solution</summary><p>(a) RLHF: a preference. (b) SFT: high-quality annotation data. (c) Pre-training: public internet data. To know the training data you need an <b>open-source</b> model; an open-weight model shares only its parameters.</p></details>` },
      { id: "terms", title: "Key terms and further reading", html: `
        <p class="tags">${["token", "tokenizer", "token ID", "next-token prediction", "[END] token", "probability distribution", "sampling", "seed", "temperature", "weights (parameters)", "Transformer", "pre-training", "self-supervised learning", "SFT", "RLHF", "alignment", "reinforcement learning", "reward", "policy", "scaling law", "FLOPs", "compression", "data quality", "multimodal", "black-box LLM", "open-source LLM", "open-weight LLM", "Hugging Face", "local deployment"].map((t) => `<span class="tag">${t}</span>`).join("")}</p>
        <ul><li>J. Alammar, <em>The Illustrated Transformer</em>. <a href="https://jalammar.github.io/illustrated-transformer/" target="_blank" rel="noopener">jalammar.github.io</a></li>
        <li>B. Bycroft, <em>LLM Visualization</em>. <a href="https://bbycroft.net/llm" target="_blank" rel="noopener">bbycroft.net/llm</a></li>
        <li>J. Kaplan et al., <em>Scaling Laws for Neural Language Models</em>. <a href="https://arxiv.org/abs/2001.08361" target="_blank" rel="noopener">arXiv:2001.08361</a></li>
        <li>A. Grattafiori et al., <em>The Llama 3 Herd of Models</em>. <a href="https://arxiv.org/abs/2407.21783" target="_blank" rel="noopener">arXiv:2407.21783</a></li>
        <li>H. Touvron et al., <em>Llama 2: Open Foundation and Fine-Tuned Chat Models</em>. <a href="https://arxiv.org/abs/2307.09288" target="_blank" rel="noopener">arXiv:2307.09288</a></li>
        <li>P. Maini et al., <em>Rephrasing the Web</em>. <a href="https://arxiv.org/abs/2401.16380" target="_blank" rel="noopener">arXiv:2401.16380</a></li>
        <li>Y. Zhang et al., <em>When Do You Need Billions of Words of Pretraining Data?</em> ACL 2021.</li>
        <li><em>Reasoning with Sampling: Your Base Model is Smarter Than You Think</em>. <a href="https://arxiv.org/abs/2510.14901" target="_blank" rel="noopener">arXiv:2510.14901</a></li>
        <li>OpenAI, <em>Faulty Reward Functions in the Wild</em>. <a href="https://openai.com/index/faulty-reward-functions/" target="_blank" rel="noopener">openai.com</a></li>
        <li>L. Ouyang et al., <em>Training Language Models to Follow Instructions with Human Feedback</em> (added). <a href="https://arxiv.org/abs/2203.02155" target="_blank" rel="noopener">arXiv:2203.02155</a></li>
        <li>Hung-yi Lee, generative AI and machine learning course. <a href="https://www.youtube.com/playlist?list=PLJV_el3uVTsMMGi5kbnKP5DrDHZpTX0jT" target="_blank" rel="noopener">YouTube playlist</a></li></ul>` },
    ],
    takeaways: ["Predict the next token, again and again.", "Probabilities make answers uncertain.", "Pre-train, SFT, RLHF."],
  },
];

const QUIZ = [
  { q: "In next-token prediction, what happens to each token the model outputs?",
    opts: ["It is stored, and the full answer is returned at the end of training", "It is appended to the input, and the longer input goes back into the model", "It is checked against a database of answers", "It replaces the last token of the prompt"],
    a: 1, why: "Predict, append, repeat: <em>LLMs are</em> → Large → Language → Models → [END]." },
  { q: "After “…Computing? Turing” the slide gives Award 0.5 and Home 0.2. Why might the model still answer <em>Turing Home</em>?",
    opts: ["The model has a bug", "It samples from the distribution, so Home is picked about 20% of the time", "Home has the highest score", "The tokenizer split Award into Home"],
    a: 1, why: "The output is probabilistic. A better model has a more accurate distribution, but sampling still picks less likely tokens sometimes." },
  { q: "Which data does each stage use?",
    opts: ["Pre-train: preferences · SFT: internet · RLHF: annotations", "Pre-train: internet · SFT: annotations · RLHF: user preferences", "Pre-train: annotations · SFT: preferences · RLHF: internet", "All three use only internet data"],
    a: 1, why: "Public internet data → pre-training; annotation data → SFT; user response data (preferences) → RLHF." },
  { q: "Using C ≈ 6ND, about how much compute did Llama 3 (70B parameters, 15T tokens) take?",
    opts: ["6.3 × 10<sup>12</sup> FLOPs", "1.05 × 10<sup>24</sup> FLOPs", "6.3 × 10<sup>24</sup> FLOPs", "4,756 FLOPs"],
    a: 2, why: "6 × 70×10<sup>9</sup> × 15×10<sup>12</sup> = 6.3 × 10<sup>24</sup>. (4,756 is the years to read the 15T tokens printed out.)" },
  { q: "You may not send your company's code to an outside service. Which kind of LLM can you still use?",
    opts: ["Only black-box models", "An open-weight (or open-source) model, deployed locally", "None: every LLM runs in the cloud", "Any model, if you ask it not to remember"],
    a: 1, why: "Open-weight models publish their parameters, so you can download and run them on your own machine, e.g. with Ollama." },
];
