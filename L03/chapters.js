// L03 content, adapted from csc4801/notes/L03-advanced-agents.md (which follows the slides in order).

const demo = (name, title, instr, hint = "") =>
  `<div class="card demo" data-demo="${name}"><div class="head"><span class="title">${title}</span><span>${instr}</span></div>
   <div class="demo-body"></div>${hint ? `<p class="hint">${hint}</p>` : ""}</div>`;
const callout = (kind, label, body) => `<div class="callout ${kind}"><b>${label}</b>${body}</div>`;
const predict = (q, a) => callout("predict", "PREDICT", `<p>${q}</p><details class="reveal"><summary>Show the answer</summary>${a}</details>`);
const out = (s) => codeBlock(s, "out");
const link = (href, text) => `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;

const VIDEO = "../videos/L03.mp4";

const LECTURE = {
  number: 3,
  title: "Advanced Agents",
  tagline: "Let's make agents stronger",
  lead: "Last lecture's loop works, but every call resends everything, nothing is remembered between sessions, and one agent's context pollutes its own work. Three fixes — context management, retrieval-augmented generation and subagents — each one step at a time.",
  heroDemo: "managerMini",
  heroLabel: "A context manager at work · cut, then compress",
  heroCaption: "Cut what can be redone; compress only when cutting is not enough.",
  whyTitle: "Why this lecture matters",
  whySub: "Three fixes behind every serious coding agent",
  why: [
    ["Context management", "The LLM is stateless, so every call resends everything. <b>Cut</b> and <b>compress</b> the context while keeping the <b>prompt cache</b> hitting."],
    ["Long-term memory", "<code>CLAUDE.md</code>, <code>MEMORY.md</code>, or <b>RAG</b> over a vector database: what carries knowledge from one session to the next."],
    ["Subagents", "Fresh, isolated contexts that stop <b>context pollution</b>, and bring specialization and parallel work."],
  ],
  ctaTitle: "Ready to make the loop stronger?",
  minutes: "About 60 minutes",
  videos: { [VIDEO]: "Lecture 3 — Advanced Agents (13 min)" },
};

const CHAPTERS = [
  {
    slug: "1-context", nav: "The problem", title: "Why the Context Keeps Growing",
    subtitle: "A stateless LLM, a hungry loop, and why bigger windows don't save us",
    abstract: "Every LLM call resends the whole history. Windows have grown to millions of tokens, but too long a context may fail: historical messages need to be concise.",
    tags: ["stateless", "token-consuming", "long context", "lost in conversation"],
    hero: "growMini", heroCaption: "Characters sent by each call of slide 7's task.",
    sections: [
      { id: "recap", title: "Where we are", html: `
        <p>Last lecture gave the LLM a body: with a harness it can see (read files), act (edit them) and run code. The workflow had ten steps, 0 Start to 9 End, with a main loop from step 3 to step 8.</p>
        <p>Now: <b>let's make agents stronger!</b> The loop works, but it has several problems. This lecture fixes three of them:</p>
        <table><tr><th>Part</th><th>Problem</th><th>Fix</th></tr>
        <tr><td>1</td><td>Every call resends everything; the context keeps growing</td><td>Context management</td></tr>
        <tr><td>2</td><td>Nothing is remembered between sessions</td><td>Retrieval-augmented generation</td></tr>
        <tr><td>3</td><td>One agent's context pollutes its own work</td><td>Subagents</td></tr></table>` },
      { id: "video", title: "Watch the lecture video", html: `
        <p>The video follows the same slides in the same order. Watch it first, or use it to review after the demos.</p>
        <div class="card video" data-video="${VIDEO}"></div>` },
      { id: "stateless", title: "A stateless LLM", html: `
        <p>An LLM is <b>stateless</b>: it keeps nothing between two calls. So <b>all</b> historical messages are included in <b>each</b> LLM API call: the system prompt, the request, every reply and every tool result.</p>
        <p>That makes the loop <b>token-consuming</b>. The slides' example: <em>read 10 files + run 3 runs of test + edit 5 times &gt; 100k tokens</em>. Let's replay that task. We measure characters; the file sizes are made up for the example.</p>
        ${codeBlock(CODE.runTask)}${out(OUT.runTask)}
        ${demo("grow", "Demo 1 · Every call resends everything", "← → keys step")}
        <p>The last call alone carries everything before it, and the total grows much faster than the task. (<em>Added:</em> a common rule of thumb for English text is about four characters per token, so 607,122 characters is roughly 150,000 tokens, in line with the slide's “&gt; 100k tokens”.)</p>` },
      { id: "long", title: "Bigger windows?", html: `
        ${predict("Context windows keep growing. Why not just send everything?",
          `<p>Because too long a context may fail: models get worse as the context grows, and lose track over many turns. And every token is paid for on every call.</p>`)}
        <p>Windows have indeed grown fast. The slides show a chart of context window sizes from 2018 to 2025, from a few thousand tokens (GPT-1, GPT-2) to the first 10M-token window (Llama 4 Scout), and these statistics from BenchLM, as of September 15, 2026:</p>
        <ul><li>the largest tracked context window is 10M tokens;</li><li>24% of the 386 tracked models offer 1M tokens or more;</li>
        <li>the median context window is 256K tokens;</li><li>a 1M-token window fits <em>War &amp; Peace</em> (roughly 750,000 tokens) with room to spare.</li></ul>
        <p>Back in June 2024, Google's Gemini 1.5 could (almost) fit the entire <em>Harry Potter</em> and <em>Lord of the Rings</em> series in its 2-million-token window. But <b>too long context may fail</b>:</p>
        <ul><li><b>RULER</b> (${link("https://arxiv.org/abs/2404.06654", "arXiv:2404.06654")}): almost all models show large performance drops as the context length increases.</li>
        <li><b>LLMs Get Lost in Multi-Turn Conversation</b> (${link("https://arxiv.org/abs/2505.06120", "arXiv:2505.06120")}): when a task is given piece by piece over many turns instead of fully in one, the models tested had lower aptitude (−15%) and very high unreliability (+112%). They answer too early, make wrong assumptions, and then rely on them.</li></ul>
        ${callout("pattern", "HISTORICAL MESSAGES NEED TO BE CONCISE", `<p>And a lot is in the window before you type anything: the system prompt, <code>CLAUDE.md</code>, memory, skills, MCP and tool descriptions. Claude Code's documentation has a page that shows what fills the window (${link("https://code.claude.com/docs/en/context-window", "code.claude.com")}).</p>`)}` },
    ],
    takeaways: ["Stateless: every call resends all messages.", "The loop is token-consuming.", "Too long a context may fail."],
  },
  {
    slug: "2-cache", nav: "Prompt cache", title: "The Prompt Cache",
    subtitle: "Context length vs cache: the design question",
    abstract: "A call that starts like the previous one reuses the server's work. Cache hits are fifty times cheaper on the slide's price list — so how do we cut the context without breaking the cache?",
    tags: ["prefix matching", "cache hit / miss", "system prompt first"],
    hero: "cacheMini", heroCaption: "Each call reuses the prefix it shares with the previous call.",
    sections: [
      { id: "principle", title: "Design principle", html: `
        <p>Shorter context is good. But there is a second force on the seesaw: the <b>prompt cache</b>. The design question of this part is:</p>
        ${callout("pattern", "THE DESIGN QUESTION", `<p>How to reduce context length with minimal cache miss?</p>`)}` },
      { id: "prefix", title: "Prefix matching", html: `
        <p>Call 2 starts with exactly the same messages as call 1, and call 3 starts with the same messages as call 2. The server can <b>reuse</b> the work it did for that shared start. This is <b>prefix matching</b> (<em>Prompt Cache: Modular Attention Reuse for Low-Latency Inference</em>, ${link("https://arxiv.org/abs/2311.04934", "arXiv:2311.04934")}).</p>
        ${codeBlock(CODE.cache)}${out(OUT.cache)}
        <p>Real caches match tokens, not whole messages; ours matches messages to keep it short.</p>` },
      { id: "price", title: "Why care: price and latency", html: `
        <p>The slides show one provider's price list (DeepSeek V4 Flash), in US dollars per 1M input tokens: <b>$0.0028</b> on a cache hit, <b>$0.14</b> on a cache miss. Cached input is also faster (lower latency).</p>
        ${codeBlock(CODE.price)}${out(OUT.price)}
        ${demo("cost", "Demo 2 · What a cache hit is worth", "drag the slider")}
        <p>The 95,000/5,000 split is our example, not a measurement.</p>` },
      { id: "system", title: "System prompt before user prompt", html: `
        <p>System prompts are typically fixed. Putting the system prompt <b>first</b> keeps the start of every call the same, which increases the chance of a cache hit:</p>
        ${codeBlock(CODE.systemFirst)}${out(OUT.systemFirst)}
        ${demo("cache", "Demo 3 · Prefix matching, call by call", "pick an order, then step")}
        <p>Placed last, the system prompt is sent as new input on every call.</p>
        ${callout("pitfall", "PITFALL", `<p><b>Anything that changes the start of the context throws the cache away.</b> Removing or rewriting an <em>old</em> message changes the prefix of every later call. That is why the strategies in the next chapters are designed around the cache: cut rarely and in big pieces, not a little on every call.</p>`)}` },
    ],
    takeaways: ["The cache reuses a matching prefix.", "Hits: ~50× cheaper, and faster.", "Fixed system prompt first."],
  },
  {
    slug: "3-cut", nav: "Cut", title: "Five Strategies: Cut",
    subtitle: "Tool result budget, tool count budget, conversation round budget",
    abstract: "The first three of five strategies remove what can be redone or is no longer needed: oversized results, old read results, and old rounds.",
    tags: ["temp file + preview", "can redo / can NOT redo", "rounds"],
    hero: "code:budgetCount", heroCaption: "Strategy 2 in Python",
    sections: [
      { id: "five", title: "Five strategies", html: `
        <p>The slides present <b>five strategies</b> in two groups. The first three <b>cut</b>; the last two <b>compress</b>.</p>
        <table><tr><th>#</th><th>Strategy</th><th>Group</th><th>What it does</th></tr>
        <tr><td>1</td><td>Tool result budget</td><td>Cut</td><td>One result too long? Save it to a temp file, keep a preview.</td></tr>
        <tr><td>2</td><td>Tool count budget</td><td>Cut</td><td>Too many results? Clear old read results.</td></tr>
        <tr><td>3</td><td>Conversation round budget</td><td>Cut</td><td>Too many rounds? Remove old rounds.</td></tr>
        <tr><td>4</td><td>Auto compact</td><td>Compress</td><td>Still too full? Let an LLM summarize.</td></tr>
        <tr><td>5</td><td>Context collapse</td><td>Compress</td><td>Still almost full? Save everything to disk and restart.</td></tr></table>` },
      { id: "result", title: "1 Tool result budget", html: `
        <ul><li>Set a <b>length threshold</b> for a tool result.</li><li>Write a result over the threshold into a <b>temp file</b> (<code>/tmp/XXX</code>).</li>
        <li>Keep a <b>preview</b> in the context: <em>“Saved to /tmp/xxx, 80k in total”</em>.</li><li><b>Read again</b> if needed.</li></ul>
        ${codeBlock(CODE.budgetResult)}${out(OUT.budgetResult)}
        <p>Nothing is lost. If the model needs the details, it reads the file again:</p>
        ${codeBlock(CODE.readAgain)}${out(OUT.readAgain)}
        ${demo("result", "Demo 4 · A tool result over budget", "pick a result, then step")}
        <p>The limit of 10,000 characters is ours; the slides do not give a number.</p>` },
      { id: "count", title: "2 Tool count budget", html: `
        <ul><li>Set a <b>count threshold</b> for tool results.</li><li>Remove <b>old</b> tool call results.</li></ul>
        <table><tr><th>Tools</th><th>Rule</th><th>Why</th></tr>
        <tr><td>Read, Bash, Grep, Glob</td><td>Keep the 5 most recent results</td><td>Can redo</td></tr>
        <tr><td>Edit, Write</td><td>Keep all results</td><td>Can NOT redo</td></tr></table>
        <p>An old read result is replaced by a short note: <code>[Old tool result content cleared]</code>.</p>
        ${codeBlock(CODE.budgetCount)}${out(OUT.budgetCount)}
        <p>Seven read-type results, so the two oldest are cleared. The Edit result stays, however old it is.</p>
        ${demo("count", "Demo 5 · Old read results are cleared", "step, or change the budget")}
        ${callout("pitfall", "PITFALL", `<p><b>“Can redo” is about the result, not the command.</b> Reading a file again gives the file again. But on the slides Bash sits with the read tools, and a Bash command can also change things (L02 lists Bash as needing permission). Re-running a command that deletes or edits files is not a harmless redo. <em>(Added.)</em></p>`)}` },
      { id: "rounds", title: "3 Conversation round budget", html: `
        <ul><li>A <b>round</b> = an assistant message + all its tool calls and results.</li><li>You may explore <b>wrong directions</b> in old rounds.</li><li><b>Remove old rounds</b>.</li></ul>
        <p>On the slides, the window holds rounds 1–70; rounds 1–20, 21–35 and 36–50 are removed, and rounds 51–70, the current conversation, stay.</p>
        ${codeBlock(CODE.rounds)}${out(OUT.rounds)}
        ${demo("rounds", "Demo 6 · Seventy rounds, a budget of twenty", "step, play, or change the budget")}
        <p>Keeping the user's original request is our choice; the slides only say to remove old rounds.</p>` },
    ],
    takeaways: ["Huge results → temp file + preview.", "Clear old reads; keep every write.", "Remove old rounds."],
  },
  {
    slug: "4-compress", nav: "Compress", title: "Five Strategies: Compress",
    subtitle: "Auto compact and context collapse",
    abstract: "When cutting is not enough, an LLM summarizes the messages. And if the window is still almost full, save everything to disk and start again.",
    tags: ["83% trigger", "summary checklist", "restart"],
    hero: "managerMini", heroCaption: "Cut first; compress when the context still fills 83%.",
    sections: [
      { id: "compact", title: "4 Auto compact", html: `
        <ul><li><b>Trigger condition:</b> after cutting, the context still occupies <b>83%</b> of the context window.</li>
        <li><b>Action:</b> call an LLM to <b>summarize</b> the messages, following a checklist: 1. recent modified files; 2. agent status; 3. plan; 4. used tools.</li></ul>
        ${codeBlock(CODE.autoCompact)}${out(OUT.autoCompact)}
        <p>Compression happens in <b>both</b> places: in the <b>agent</b> (the client) and at the <b>LLM</b> (the provider's server).</p>` },
      { id: "collapse", title: "5 Context collapse", html: `
        <ul><li>After all strategies, the window is <b>still almost full</b>?</li><li><b>Save everything</b> into disk.</li><li><b>Restart</b> the session.</li></ul>
        ${codeBlock(CODE.collapse)}${out(OUT.collapse)}
        <p>What the restarted session keeps (here: the request and a pointer to the saved file) is our choice for the example.</p>` },
      { id: "manager", title: "Context management, summed up", html: `
        <p>Cut and compress are <b>solid and practical engineering methods in industry</b>. Nothing here is exotic: thresholds, temp files, summaries and restarts.</p>
        ${demo("manager", "Demo 7 · A context manager, strategy by strategy", "pick a session, then step")}
        ${predict("<b>How would you design a context manager?</b> What would you cut first, and what would you never throw away?",
          `<p>One reasonable order follows the slides: cut what can be redone (huge or old read results, old rounds), keep what cannot be redone (edits, writes), compress only when cutting is not enough, and restart as the last resort. Cut in big steps, so the cached prefix survives between cuts.</p>`)}` },
    ],
    takeaways: ["Auto compact at 83%: summarize.", "Checklist: files, status, plan, tools.", "Last resort: save to disk, restart."],
  },
  {
    slug: "5-memory", nav: "Memory & RAG", title: "Long-term Memory and RAG",
    subtitle: "From MEMORY.md to vector databases",
    abstract: "Context management is short-term memory. For the long term, an agent can write files — or retrieve from a vector database. Neither is the absolute answer yet.",
    tags: ["MEMORY.md / CLAUDE.md", "embeddings", "cosine similarity", "Mem0", "structure"],
    hero: "code:vector", heroCaption: "The slides' vector database, in Python",
    sections: [
      { id: "short-long", title: "Short-term vs long-term memory", html: `
        <p><b>Context management is short-term memory</b>: like RAM, it lives inside one session. What about <b>long-term memory</b>: how does an agent carry knowledge across sessions, into the project?</p>
        <p>We already have tools to read and write files, and files are long-term memory:</p>
        <table><tr><th>Memory</th><th>Example</th><th>Written by</th><th>Kind</th></tr>
        <tr><td><code>MEMORY.md</code></td><td>user description, feedback/preference, project status, reference doc</td><td>the agent (write, then read)</td><td>dynamic memory</td></tr>
        <tr><td><code>CLAUDE.md</code></td><td>project rules</td><td>the user</td><td>static memory</td></tr></table>
        ${codeBlock(CODE.memory)}${out(OUT.memory)}
        <p>But let's talk about some advanced technology.</p>` },
      { id: "rag", title: "Retrieval-augmented generation", html: `
        <p><b>RAG</b> is built on a <b>vector database</b>: each piece of information is turned into a <b>vector</b> (an <b>embedding</b>) and stored in the database. A query is turned into a vector too, and the database returns the stored pieces whose vectors are most <b>similar</b>.</p>
        <p>The slides' example stores three coding rules with simplified 4-number embeddings, then asks: <em>“Add a function to check status.”</em> (query vector [0.15, 0.82, 0.38, 0.61]). A common similarity measure is <b>cosine similarity</b> (<em>added</em>: the slides do not name the measure).</p>
        <table><tr><th>ID</th><th>Text chunk</th><th>Embedding vector (simplified)</th></tr>
        <tr><td>1</td><td>For boolean checking functions, use the prefix "has_" followed by the object and property.</td><td>[0.12, 0.87, 0.34, 0.66]</td></tr>
        <tr><td>2</td><td>Each file has most 30 functions.</td><td>[0.72, 0.21, 0.91, 0.15]</td></tr>
        <tr><td>3</td><td>Folder depth at most 5 layers.</td><td>[0.31, 0.45, 0.88, 0.20]</td></tr></table>
        ${codeBlock(CODE.vector)}${out(OUT.vector)}
        <p>Chunk 1 wins, as on the slide (which shows 0.96). Then the agent does five steps: (1) the user's request arrives; (2) the agent queries the vector DB; (3) the DB returns the top chunk; (4) the agent adds it to the prompt; (5) the prompt goes to the LLM.</p>
        ${codeBlock(CODE.ragPrompt)}${out(OUT.ragPrompt)}
        ${demo("rag", "Demo 8 · Retrieve, then generate", "step, or move the query vector")}
        <p>Now the model knows to name the new function with the <code>has_</code> prefix. Real systems do more: <b>Mem0</b> (${link("https://arxiv.org/abs/2504.19413", "arXiv:2504.19413")}) extracts memories from the conversation and, in an update phase, <b>resolves conflicting and repeated memories</b> (add, update, delete or no-op).</p>` },
      { id: "challenges", title: "Challenges of RAG", html: `
        <ol><li><b>Similarity ≠ relevance.</b> Ask <em>“Does this code has bugs?”</em> and the similar vectors may not help.</li>
        <li><b>Maintain difficulty.</b> Multiple vendors (Pinecone, Qdrant, Milvus), embedding configuration, chunk size, index update, conflict merge…</li>
        <li><b>Unreadable.</b> A person can open <code>MEMORY.md</code> and read it; nobody can read a table of numbers.</li></ol>
        ${demo("relevance", "Demo 9 · Similar is not the same as relevant", "judge each chunk")}
        <p><b>Beyond memory.</b> Memory is not the only thing an agent must bring into a project: <b>security policies</b> need to reach it too. So which is better, a <code>MEMORY.md</code> file or a vector database? <b>No absolute answer yet.</b></p>` },
      { id: "design", title: "What is a good memory design?", html: `
        <p>Research suggests that <b>structural information may be helpful</b>:</p>
        <ul><li><b>Memory transfer</b> (${link("https://memorytransfer.github.io/", "memorytransfer.github.io")}) stores past experience at three levels: a <b>trajectory</b> (the task and every step with its observation), a <b>workflow</b> (the goal and a reusable action sequence), and a <b>summary</b> (a task summary and general, task-agnostic insights).</li>
        <li><b>User as code</b> (${link("https://01.me/research/user-as-code/", "01.me")}) starts from a raw multi-session conversation. <em>Phase 1, Memorize:</em> an LLM extracts every fact as a flat string and only appends. <em>Phase 2, Structure:</em> an LLM rewrites the facts as typed Python objects.</li></ul>
        ${codeBlock(CODE.userAsCode)}${out(OUT.userAsCode)}
        ${demo("userCode", "Demo 10 · From a conversation to typed objects", "step through the phases")}
        <p>Three loose strings became one object you can query. (Our classes are cut down from the slide's, which also have <code>passions</code> and <code>skills</code>.) With short-term memory (context management) and long-term memory, the agent gets stronger.</p>` },
    ],
    takeaways: ["CLAUDE.md static; MEMORY.md dynamic.", "RAG: embed, search, add to prompt.", "Similarity ≠ relevance; no absolute answer yet."],
  },
  {
    slug: "6-subagents", nav: "Subagents", title: "Subagents",
    subtitle: "Context pollution, and three advantages",
    abstract: "An agent that writes the code and then the tests tests what it wrote, not what was asked. Subagents start fresh: isolated, specialized, and parallel.",
    tags: ["context pollution", "isolation", "specialization", "parallelization", "markdown files"],
    hero: "pollutionMini", heroCaption: "Two subagents, two clean contexts.",
    sections: [
      { id: "pollution", title: "The problem: context pollution", html: `
        <p>The request: <em>“Add a function to calculate the discount price for premium users. Generate code + tests.”</em> One agent writes both:</p>
        ${codeBlock(CODE.polluted)}
        <p>It <b>passed testing with incomplete test cases</b>. The code ignores <code>is_premium</code>, and the test only checks a premium user. The test was written with the code already in the agent's context, so it tested what was written, not what was asked. This is <b>context pollution</b>.</p>` },
      { id: "subagents", title: "Subagents", html: `
        <p>The main agent gives the job to two <b>subagents</b>: one gets <em>“Generate the code to calculate discount price.”</em>, the other <em>“Generate the test for discount calculation.”</em> The test writer never sees the code, so it also checks a regular user:</p>
        ${codeBlock(CODE.discount)}${out(OUT.discount)}
        ${demo("pollution", "Demo 11 · One agent vs two subagents", "pick a setup, then step")}
        <p>The complete test catches the bug that the polluted test let through. In a harness, a subagent is just <b>a tool that runs another agent</b>, with a fresh message list. Here is L02's loop, cut down, with scripted LLMs:</p>
        ${codeBlock(CODE.harness)}${out(OUT.harness)}
        ${demo("subRun", "Demo 12 · Three agents, three contexts", "← → keys step", "This replays the harness above. The console shows exactly what it prints.")}
        <p>The tester's context holds only its own task and answer: it never saw the coder's work. The main agent sees only each subagent's final answer, not its whole run.</p>` },
      { id: "advantages", title: "Three advantages of subagents", html: `
        <ol><li><b>Context isolation</b>: an isolated context window, tools, and so on.</li>
        <li><b>Specialization</b>: e.g. a UX designer expert, a security expert.</li>
        <li><b>Parallelization</b>: several subagents can work at the same time.</li></ol>` },
      { id: "predefined", title: "Predefined subagents", html: `
        <p>In Claude Code you predefine a subagent in a <b>markdown file</b> (${link("https://code.claude.com/docs/en/sub-agents", "code.claude.com")}). The slides' example:</p>
        ${codeBlock(CODE.reviewerMd, "out")}
        <p>The header (between the <code>---</code> lines) gives the name, a description, the tools it may use and the model; the body is its system prompt. A harness can read it with a few lines:</p>
        ${codeBlock(CODE.loadSubagent)}${out(OUT.loadSubagent)}
        ${demo("subFile", "Demo 13 · Write your own subagent file", "edit the file")}
        <p>Note the tools: the reviewer only gets read tools.</p>` },
      { id: "picture", title: "The whole picture", html: `
        <p>The prompts go through <b>context management</b> into the agent; the agent retrieves long-term memory with <b>RAG</b> and hands work to <b>subagents</b>. On L02's loop (the mapping to step numbers is ours):</p>
        <table><tr><th>Technique</th><th>Where it plugs in</th></tr>
        <tr><td>Prompt cache, system prompt first</td><td>3 Prepare context, 4 Call LLM</td></tr>
        <tr><td>Tool result budget, tool count budget</td><td>7 Receive tool results</td></tr>
        <tr><td>Round budget, auto compact, context collapse</td><td>3 Prepare context / 8 Check loop</td></tr>
        <tr><td>RAG, <code>MEMORY.md</code></td><td>3 Prepare context (retrieve), 6 Call tool (write)</td></tr>
        <tr><td>Subagents</td><td>6 Call tool</td></tr></table>
        <p><b>Next problem, next lecture.</b> The context is well managed, but the <b>predefined tools are restricted</b>. Next class: <b>MCP &amp; Skills</b>.</p>` },
    ],
    takeaways: ["Context pollution: tests shaped by the code.", "Subagent = a tool that runs a fresh agent.", "Isolation, specialization, parallelization."],
  },
  {
    slug: "7-summary", nav: "Summary", title: "Summary and Practice",
    subtitle: "Check yourself, then try it on a real agent",
    abstract: "A map of the lecture, six self-check questions, and four exercises with solutions.",
    tags: ["knowledge map", "self-check", "exercises"],
    hero: "toc",
    sections: [
      { id: "map", title: "Knowledge map", html: `<div class="map">
        <div class="card"><h3>The problem</h3><ul><li>Stateless LLM: every call resends all</li><li>The loop is token-consuming</li><li>Too long context may fail</li></ul></div>
        <div class="card"><h3>Prompt cache</h3><ul><li>Prefix matching reuses work</li><li>Hit ≈ 50× cheaper, faster</li><li>Fixed system prompt first</li></ul></div>
        <div class="card"><h3>Cut</h3><ul><li>1 Result budget: temp file + preview</li><li>2 Count budget: clear old reads</li><li>3 Round budget: remove old rounds</li></ul></div>
        <div class="card"><h3>Compress</h3><ul><li>4 Auto compact at 83%</li><li>Checklist: files, status, plan, tools</li><li>5 Collapse: save, restart</li></ul></div>
        <div class="card"><h3>Long-term memory</h3><ul><li><code>CLAUDE.md</code> static, <code>MEMORY.md</code> dynamic</li><li>RAG: embed, search, prompt</li><li>Similarity ≠ relevance; structure helps</li></ul></div>
        <div class="card"><h3>Subagents</h3><ul><li>Stop context pollution</li><li>Isolation, specialization, parallel</li><li>Defined in markdown files</li></ul></div></div>` },
      { id: "check", title: "Check your understanding", html: `<div data-demo="quiz"><div class="demo-body"></div></div>` },
      { id: "exercises", title: "Exercises", html: `
        <h3>Exercise 1 ★ (trace)</h3>
        <p>In a long session with a coding agent, look at what fills the context window (in Claude Code, the <code>/context</code> command). Which of the five strategies would fire first?</p>
        <h3>Exercise 2 ★ (modify)</h3>
        <p>Change <code>budget_count</code> so that it keeps only the <b>3</b> most recent read results. Run it on <code>results</code>. How many results are cleared now?</p>
        <details class="reveal"><summary>Solution</summary><p>Only the argument changes:</p>${codeBlock(CODE.ex2)}${out(OUT.ex2)}<p>Seven read-type results, keep 3, so 4 are cleared. The Edit result is never cleared. (Set Demo 5's budget to 3 to watch it.)</p></details>
        <h3>Exercise 3 ★★ (calculate)</h3>
        <p>A task makes 20 calls. Each call sends a 10,000-token fixed system prompt plus the history. Use the slide's prices to compare the system prompt's cost when it is first (cached from call 2 on) and when it is last (never cached).</p>
        <details class="reveal"><summary>Solution</summary>${codeBlock(CODE.ex3)}${out(OUT.ex3)}<p>Only the first call pays the miss price; the other 19 pay the hit price.</p></details>
        <h3>Exercise 4 ★★ (design)</h3>
        <p>For each, would you use <code>CLAUDE.md</code>, <code>MEMORY.md</code>, RAG over a vector database, or a subagent? (a) “Always run <code>pytest</code> before you commit.” (b) The user prefers short answers. (c) Find the three most related notes in 10,000 old design notes. (d) A security review of a pull request.</p>
        <details class="reveal"><summary>Solution</summary><p>(a) <code>CLAUDE.md</code>: a fixed project rule written by the user. (b) <code>MEMORY.md</code>: a preference the agent learns and writes down. (c) RAG: too many notes to load, so retrieve by similarity (and check relevance). (d) A subagent: a security expert with its own isolated context and read-only tools.</p></details>` },
      { id: "terms", title: "Key terms and further reading", html: `
        <p class="tags">${["stateless", "context window", "prompt cache", "prefix matching", "cache hit", "cache miss", "tool result budget", "tool count budget", "conversation round", "auto compact", "context collapse", "short-term memory", "long-term memory", "static memory", "dynamic memory", "RAG", "vector database", "embedding", "cosine similarity", "Mem0", "context pollution", "subagent", "context isolation"].map((t) => `<span class="tag">${t}</span>`).join("")}</p>
        <ul><li>C.-P. Hsieh et al., <em>RULER: What's the Real Context Size of Your Long-Context Language Models?</em> ${link("https://arxiv.org/abs/2404.06654", "arXiv:2404.06654")}</li>
        <li>P. Laban et al., <em>LLMs Get Lost in Multi-Turn Conversation</em>. ${link("https://arxiv.org/abs/2505.06120", "arXiv:2505.06120")}</li>
        <li>I. Gim et al., <em>Prompt Cache: Modular Attention Reuse for Low-Latency Inference</em>. ${link("https://arxiv.org/abs/2311.04934", "arXiv:2311.04934")}</li>
        <li>P. Chhikara et al., <em>Mem0: Building Production-Ready AI Agents with Scalable Long-Term Memory</em>. ${link("https://arxiv.org/abs/2504.19413", "arXiv:2504.19413")}</li>
        <li>D. Breunig, <em>How Long Contexts Fail</em>. ${link("https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html", "dbreunig.com")}</li>
        <li>Claude Code docs: ${link("https://code.claude.com/docs/en/context-window", "context window")} and ${link("https://code.claude.com/docs/en/sub-agents", "subagents")}</li></ul>` },
    ],
    takeaways: ["Cut and compress, cache-aware.", "Memory: files or vectors, no absolute answer.", "Subagents keep contexts clean."],
  },
];

const QUIZ = [
  { q: "Why does every LLM call in the agent loop send all the historical messages?",
    opts: ["To use the prompt cache", "The LLM is stateless: it keeps nothing between calls", "The API requires at least 100k tokens", "To make streaming faster"],
    a: 1, why: "An LLM is stateless, so the harness must resend the whole history on each call. That is why the loop is token-consuming." },
  { q: "Call 1 sends [S, U1]. Call 2 sends [S, U1, A2]. What can the prompt cache reuse on call 2?",
    opts: ["Nothing", "Only A2", "The prefix [S, U1]", "Everything, including A2"],
    a: 2, why: "Prefix matching: the leading messages identical to the previous call are reused; A2 is new." },
  { q: "Under the tool count budget on the slides, which result is <b>never</b> cleared?",
    opts: ["An old Read result", "An old Grep result", "An old Edit result", "An old Bash result"],
    a: 2, why: "Edit and Write results are all kept: you can NOT redo them. Read, Bash, Grep and Glob keep only the 5 most recent." },
  { q: "When does auto compact run?",
    opts: ["On every call", "When a single tool result is too long", "When, after cutting, the context still fills 83% of the window", "When the user types /compact only"],
    a: 2, why: "Slide 29: the trigger is that after cutting, the context still occupies 83% of the window. Then an LLM summarizes the messages." },
  { q: "Which is <b>not</b> one of the slides' three challenges of RAG?",
    opts: ["Similarity ≠ relevance", "Maintenance difficulty", "Unreadable vectors", "It cannot store text"],
    a: 3, why: "The three are: similarity is not relevance, it is hard to maintain, and it is unreadable." },
  { q: "One agent writes <code>discount_price</code> and then a test that only checks premium users. What is this problem called, and what fixes it?",
    opts: ["Context collapse; restart the session", "Context pollution; a separate test subagent", "A cache miss; put the system prompt first", "Lost in conversation; a bigger window"],
    a: 1, why: "The code in the agent's context shaped its test. A subagent with an isolated context tests the task, not the code." },
];
