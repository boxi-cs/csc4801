// L04 content, adapted from csc4801/notes/L04-mcp-skills.md (which follows the slides in order).

const demo = (name, title, instr, hint = "") =>
  `<div class="card demo" data-demo="${name}"><div class="head"><span class="title">${title}</span><span>${instr}</span></div>
   <div class="demo-body"></div>${hint ? `<p class="hint">${hint}</p>` : ""}</div>`;
const callout = (kind, label, body) => `<div class="callout ${kind}"><b>${label}</b>${body}</div>`;
const predict = (q, a) => callout("predict", "PREDICT", `<p>${q}</p><details class="reveal"><summary>Show the answer</summary>${a}</details>`);
const json = (s) => codeBlock(s, "repl");
const out = (s) => codeBlock(s, "out");
const text = (s) => codeBlock(s, "out");

const VIDEO = "../videos/L04.mp4";

const LECTURE = {
  number: 4,
  title: "MCP & Skills",
  tagline: "Plug in new tools; load workflows only when needed",
  lead: "Built-in tools are a fixed set. MCP gives agents one standard plug for new tools; a sandbox keeps those tools safe; and skills save reusable workflows that enter the context only when a task calls for them — every message one click at a time.",
  heroDemo: "sessionMini",
  heroLabel: "An MCP session · initialize, list tools, call tool, result",
  heroCaption: "A toy client and server, one JSON-RPC message at a time.",
  whyTitle: "Why this lecture matters",
  whySub: "Three ideas you will meet in every coding agent this term",
  why: [
    ["One plug for every tool", "<b>MCP</b>: write a tool once as a server, and any agent that speaks the protocol can use it."],
    ["Run tools in a box", "A <b>sandbox</b> isolates a tool, tracks what it ran, and rolls back to a snapshot."],
    ["Workflows on demand", "A <b>skill</b> is a reusable workflow. Only its short description stays in the context until it is needed."],
  ],
  ctaTitle: "Ready to watch a client and a server talk?",
  minutes: "About 50–70 minutes",
  videos: { [VIDEO]: "Lecture 4 — MCP and Skills (14 min)" },
};

const CHAPTERS = [
  {
    slug: "1-problem", nav: "The problem", title: "Predefined Tools Are Not Enough",
    subtitle: "The context is well managed; the tools are not",
    abstract: "Prompts, context management, RAG and subagents handle what the model sees. But what it can do is still a fixed list of built-in tools.",
    tags: ["recap", "built-in tools", "adding a tool"],
    hero: "archMini", heroCaption: "Built-in tools, then tools from MCP servers.",
    sections: [
      { id: "recap", title: "Where we are", html: `
        <p>So far the course has built up a coding agent piece by piece: <b>prompts</b> go in, <b>context management</b> decides what the model sees, <b>RAG</b> brings in relevant documents, and <b>subagents</b> take on smaller jobs. The context is well managed.</p>
        <p>But look at the other side: what can the agent <em>do</em>? Its tools are a fixed, predefined set. Here are Claude Code's built-in tools again (Lecture 02):</p>
        <table><tr><th>Tool</th><th>Description</th><th>Permission required</th></tr>
        ${Object.entries(TOOL_INFO).map(([t, [d, p]]) => `<tr><td>${t}</td><td>${d}</td><td>${p ? "Yes" : "No"}</td></tr>`).join("")}</table>
        <p>They are enough for files. Real work also touches the git history, an issue tracker, a database, a web browser, a team chat (our examples, not the slides'). Each built-in tool lives inside the agent's own code.</p>
        ${predict("How can we efficiently add a new tool to an agent?",
          `<p>With a standard interface between agents and tools, so a tool written once works in every agent. That is MCP, the next chapter.</p>`)}` },
      { id: "video", title: "Watch the lecture video", html: `
        <p>The video follows the same slides in the same order. Watch it first, or use it to review after the demos.</p>
        <div class="card video" data-video="${VIDEO}"></div>` },
    ],
    takeaways: ["Context is managed; tools are fixed.", "Built-in tools live in the agent's code.", "Question: how to add a tool efficiently?"],
  },
  {
    slug: "2-mcp", nav: "MCP", title: "The Model Context Protocol",
    subtitle: "A unified interface to add tools for agents",
    abstract: "Hosts, clients and servers; one request followed through five parties; and where each part lives.",
    tags: ["host", "client", "server", "workflow", "architecture"],
    hero: "flowMini", heroCaption: "Analyse latest commit, through MCP (slide 8).",
    sections: [
      { id: "interface", title: "A unified interface", html: `
        <p>The answer is the <b>Model Context Protocol</b> (MCP): <b>a unified interface to add tools for agents</b>. The slide's picture is a laptop with plugs:</p>
        <ul><li><b>MCP hosts</b> are the agent applications, such as Claude.</li>
        <li>Inside a host, <b>MCP clients</b> (e.g. <code>client.py</code>) speak the protocol.</li>
        <li>Each <b>MCP server</b> connects one service: remote services such as Slack, Gmail or a calendar, or local data sources on your own machine.</li></ul>
        <p>Write a tool once, as an MCP server, and every agent that speaks MCP can plug it in.</p>` },
      { id: "workflow", title: "The MCP workflow", html: `
        <p>The slides follow one request through five parties: <b>User</b>, <b>LLM</b>, <b>MCP Client</b>, <b>MCP Server</b> and <b>Data</b>. Step through it; the dashed boxes show where each part lives.</p>
        ${demo("flow", "Demo 1 · One request through MCP", "← → keys step", "The two JSON-RPC messages are the ones our toy client prints in Chapter 3; the commit log is made up.")}
        <table><tr><th>#</th><th>From → to</th><th>What happens</th></tr>
        ${FLOW.map(([a, b, label], k) => `<tr><td>${k + 1}</td><td>${LANES[a][0]}${a === b ? "" : " → " + LANES[b][0]}</td><td>${esc(label)}</td></tr>`).join("")}</table>` },
      { id: "arch", title: "Architecture", html: `
        <p>Where does each part live?</p>
        <ul><li><b>Within agents:</b> the LLM and the MCP client.</li><li><b>External servers:</b> the MCP server and the data.</li></ul>
        <p>The client <b>registers</b> each server tool <b>as a tool</b>: it becomes one more row in the agent's tool table, next to Bash, Edit and Read. To the model, an MCP tool looks like any other tool.</p>
        ${demo("arch", "Demo 2 · Register as a tool", "connect a server", "The two servers and their tools are the toy ones from Chapter 3.")}
        ${callout("pattern", "MCP = ONE PLUG FOR EVERY TOOL", `<p>The model still asks for tools the way it did in Lecture 02. What changes is <em>where</em> the tool runs: the MCP client forwards the call to an external server over a standard protocol, so new tools can be added without changing the agent.</p>`)}` },
    ],
    takeaways: ["MCP: one interface for adding tools.", "LLM + client inside; server + data outside.", "Server tools register as ordinary tools."],
  },
  {
    slug: "3-build", nav: "Build a server", title: "Building an MCP Server",
    subtitle: "FastMCP, JSON-RPC, and a toy you can run",
    abstract: "A tool is a decorated Python function. Client and server exchange small JSON-RPC messages: initialize, list tools, call a tool, read the result.",
    tags: ["FastMCP", "JSON-RPC", "tools/call", "tools, resources, prompts"],
    hero: "code:fastmcp", heroCaption: "Slide 11: a FastMCP server",
    sections: [
      { id: "fastmcp", title: "Example: FastMCP", html: `
        <p>The slides use <b>FastMCP</b> (<a href="https://gofastmcp.com/" target="_blank" rel="noopener">gofastmcp.com</a>), a Python library for MCP servers. The server side:</p>
        ${codeBlock(CODE.fastmcp)}
        <p>The decorator <code>@mcp.tool</code> turns an ordinary function into a tool, and its docstring becomes the description the model reads. The client side calls the tool by name:</p>
        ${codeBlock(CODE.fastmcpClient)}
        <p class="hint">These two need the <code>fastmcp</code> package and a running server, so they are not run in the notes.</p>` },
      { id: "jsonrpc", title: "The JSON-RPC protocol", html: `
        <p>What travels between client and server is a small <b>JSON-RPC</b> message. For the <code>add</code> call (slide 13, written as valid JSON):</p>
        ${json(CODE.rpcAdd)}
        <ul><li><code>"jsonrpc": "2.0"</code>: the protocol version.</li><li><code>"id"</code>: matches the response to its request.</li>
        <li><code>"method": "tools/call"</code>: what the client wants.</li><li><code>"params"</code>: the tool's <code>name</code> and its <code>arguments</code>.</li></ul>
        <p>The same message shape works for any tool. Slide 14 calls a weather tool with <code>"name": "get_weather"</code> and <code>"arguments": {"city": "Zurich"}</code>.</p>
        ${demo("rpc", "Demo 3 · Build a JSON-RPC message", "pick a method, edit the arguments")}` },
      { id: "toy", title: "A toy MCP server and client", html: `
        <p>To see every message, here is MCP in miniature (ours). <code>Server</code> is a stand-in for FastMCP: a <code>tool</code> decorator and a <code>handle</code> method that answers one JSON-RPC message. <code>Client</code> sends a message and prints both directions. The “transport” is a plain function call, so it all runs in one process.</p>
        ${codeBlock(CODE.toyServer)}
        <p>The client numbers its requests. A message whose method starts with <code>notifications/</code> gets no <code>id</code> and no reply.</p>
        ${codeBlock(CODE.toyClient)}
        <p>Now the whole session, one message at a time: <b>initialize</b>, <b>list tools</b>, <b>call a tool</b>, read the <b>result</b>.</p>
        ${codeBlock(CODE.session)}
        ${demo("session", "Demo 4 · The session, one message at a time", "← → keys step", "This replays the toy program above. The console shows exactly what it prints; the last two steps are the error example below.")}
        ${out(OUT.session)}
        <p>The <code>tools/call</code> request is the slide's message. The <code>inputSchema</code> in the <code>tools/list</code> reply was built from the type hints <code>a: int, b: int</code>: this is how the model learns what arguments a tool takes.</p>
        ${predict("What does the server send back if the client asks for a method it does not know, such as <code>tools/delete</code>?",
          `${codeBlock(CODE.deleteCall)}${out(OUT.deleteCall)}<p>An <code>error</code> instead of a <code>result</code>, with JSON-RPC's standard code <code>-32601</code> (method not found).</p>`)}` },
      { id: "e2e", title: "The workflow, end to end", html: `
        <p>Now the slide 8 request, <em>Analyse latest commit</em>, through our toy pieces. A <code>git</code> server offers <code>list_commit</code> (the commit log is made up), and the client <b>registers</b> each server tool as an ordinary tool next to a built-in one:</p>
        ${codeBlock(CODE.gitServer)}${out(OUT.register)}
        <p>The agent loop is Lecture 02's, with a fake LLM that replies with the slide's two thoughts:</p>
        ${codeBlock(CODE.agentRun)}${out(OUT.agentRun)}
        <p>The model asked for <code>list_commit</code> exactly as it would ask for <code>Read</code>. Only the harness knows that this tool lives in another program.</p>` },
      { id: "primitives", title: "Tools, resources and prompts", html: `
        <p>Slide 14 shows that an MCP server can offer three kinds of things (from the FastMCP and MCP documentation):</p>
        <table><tr><th>Primitive</th><th>What it is</th><th>Slide's example</th></tr>
        <tr><td><b>Tools</b></td><td>Functions that clients invoke to perform actions or access external systems.</td><td><code>multiply(a, b)</code></td></tr>
        <tr><td><b>Resources</b></td><td>Data that clients can read: passive data sources rather than invocable functions.</td><td><code>data://config</code></td></tr>
        <tr><td><b>Prompts</b></td><td>Reusable message templates that guide LLM interactions.</td><td><code>analyze_data(data_points)</code></td></tr></table>
        <p>The slide's code, in FastMCP:</p>
        ${codeBlock(CODE.primitives)}
        <p>Our toy server can learn the other two primitives in a few lines. The method names <code>resources/read</code> and <code>prompts/get</code> are the MCP specification's:</p>
        ${codeBlock(CODE.fullServer)}${out(OUT.primitives)}
        <p class="hint">We skipped <code>initialize</code> here to keep the output short; the toy server does not enforce it. In the real protocol, prompt arguments are passed as strings.</p>
        <p>A tool <b>does</b> something, a resource <b>is</b> something to read, and a prompt <b>says</b> something to the model. Try all three in Demo 3 above.</p>` },
    ],
    takeaways: ["A tool = a decorated function + docstring.", "JSON-RPC: id, method, params → result or error.", "Servers offer tools, resources, prompts."],
  },
  {
    slug: "4-sandbox", nav: "Ecosystem & sandbox", title: "The Ecosystem and the Sandbox",
    subtitle: "Many servers to plug in — are they safe to execute?",
    abstract: "Browser tools, a market of servers, and more bot traffic than human. Then: run tools isolated, tracked and recoverable, at the layer that fits the risk.",
    tags: ["Browser MCP", "MCP Market", "isolation", "snapshot", "layers"],
    hero: "code:sandbox", heroCaption: "A toy sandbox (ours)",
    sections: [
      { id: "ecosystem", title: "The MCP ecosystem", html: `
        <p>Because the interface is shared, a whole ecosystem has grown around it.</p>
        <ul><li><b>Example: Web Browser</b> (<a href="https://browsermcp.io/" target="_blank" rel="noopener">browsermcp.io</a>). Browser MCP gives an agent browser tools: Navigate, Go Back, Go Forward, Wait, Press Key, Snapshot (an accessibility snapshot of the page), Click, Drag &amp; Drop, Hover, Type Text, Get Console Logs and Screenshot.</li>
        <li><b>Agent vs human</b> (<a href="https://radar.cloudflare.com/traffic#bot-vs-human" target="_blank" rel="noopener">Cloudflare Radar</a>). The slide shows Cloudflare Radar's split of HTTP requests for HTML content, worldwide, over seven days (14–20 September 2026): <b>61.4% bot</b>, <b>38.6% human</b>. Automated clients already make most requests.</li>
        <li><b>MCP Market</b> (<a href="https://mcpmarket.com/" target="_blank" rel="noopener">mcpmarket.com</a>): a directory of MCP servers and clients that you can connect to your agent.</li></ul>` },
      { id: "safe", title: "Are these tools safe to execute?", html: `
        <p>A server downloaded from the internet runs code on your machine, and the model decides when to call it. Lecture 02 already warned that every tool call must be safe and valid. The answer is a <b>sandbox</b>.</p>
        ${callout("pattern", "TOOL SANDBOX", `<ol><li><b>Environment isolation</b>: each sandbox is its own isolated environment.</li><li><b>Trackable execution</b>: you can see what ran.</li><li><b>Recoverable to snapshot</b>: you can roll back.</li></ol>`)}
        <p>Here are the three properties in a toy (ours). The “file system” is a dict, and the tool comes from a “random MCP server”: it promises to clean caches, but its pattern is wrong.</p>
        ${codeBlock(CODE.sandbox)}${out(OUT.sandbox)}
        ${demo("sandbox", "Demo 5 · A risky tool, with and without a sandbox", "← → keys step", "With the box ticked this replays the program above; untick it to see the same call on the real project.")}
        <p>The tool deleted <code>main.py</code>, but only inside the sandbox; the log shows what ran; the snapshot brings the file back.</p>` },
      { id: "layers", title: "Multi-layer sandbox", html: `
        <p>Sandboxes come in layers, from small to large (slide 21):</p>
        <ol><li><b>Bash commands</b> run in the sandbox, via <code>/sandbox</code> (in Claude Code).</li>
        <li><b>The MCP server</b> runs in a sandbox: wrap its launch command with a sandbox runtime.
        ${json(`{
  "mcpServers": {
    "risky-server": {
      "command": "npx",
      "args": ["@anthropic-ai/sandbox-runtime", "npx", "-y", "risky-mcp-server"]
    }
  }
}`)}</li>
        <li><b>The entire coding agent</b> runs in a sandbox: <code>npx @anthropic-ai/sandbox-runtime claude</code>.</li>
        <li><b>The OS</b> runs in a sandbox (e.g. a virtual machine).</li></ol>
        ${predict("Which layer would you use for each case? (a) Everyday coding on your own laptop. (b) Coding on a shared server. (c) Trying out a random MCP server from the internet.",
          `<table><tr><th>Case</th><th>Sandbox (slide 22)</th></tr>${CASES.map((c) => `<tr><td>${c[0]}</td><td>${c[2]}</td></tr>`).join("")}</table>`)}
        ${demo("layers", "Demo 6 · Pick a sandbox layer", "pick a case, or click a layer")}` },
    ],
    takeaways: ["MCP has an ecosystem: browsers, markets.", "Sandbox: isolated, tracked, recoverable.", "Four layers: bash, server, agent, OS."],
  },
  {
    slug: "5-skills", nav: "Skills", title: "Skills: Reusable Workflows",
    subtitle: "How to reuse the workflow of using agents?",
    abstract: "A good prompt you type again and again becomes a skill: a record of experience, saved as a folder with a SKILL.md.",
    tags: ["copy it", "memory?", "SOP", "SKILL.md"],
    hero: "skillFileMini", heroCaption: "A skill folder, loaded in three levels.",
    sections: [
      { id: "reuse", title: "How to reuse a workflow?", html: `
        <p>The next problem: <b>how do we reuse the workflow of using agents?</b></p>
        <p>A classmate asks you: <em>“How do you debug this issue?”</em> You have a good answer, and you have typed it to the agent many times:</p>
        ${text(CODE.debugPrompt)}
        <p><em>“Here is my prompt.”</em> Your classmate can <b>copy it</b> and paste it in front of every issue. That works, but it is copy-and-paste. Instead, save it once as a <b>reusable workflow description</b>: that is a <b>skill</b>.</p>` },
      { id: "memory", title: "Why not memory?", html: `
        <p>Why not put the workflow in memory? A <code>MEMORY.md</code> file holds facts the agent loads every session: <code>[user description]</code>, <code>[feedback/preference]</code>, <code>[project status]</code>, <code>[reference doc]</code>. A debugging workflow is needed only when you debug.</p>
        ${callout("pitfall", "PITFALL", `<p><b>A skill is not a global workflow polluting the context.</b> Anything in memory is sent on every call, whether the task needs it or not. A skill is loaded only when the task calls for it.</p>`)}` },
      { id: "what", title: "What a skill is", html: `
        <p>A skill is <b>a record of experience (a Standard Operating Procedure) for a certain type of task</b>. The slides' examples: how to type log fields; how to query slow SQLs; how to write a commit message.</p>
        <p>Skills can even be distilled from people: the <b>colleague-skill</b> project (<a href="https://github.com/titanwings/colleague-skill" target="_blank" rel="noopener">github.com/titanwings/colleague-skill</a>) turns a colleague's way of working into a skill, and its gallery shares them.</p>` },
      { id: "skillmd", title: "Skill.md", html: `
        <p>On disk, a skill is a folder (slide 32):</p>
        ${text(CODE.skillTree)}
        <p>It is loaded in three levels:</p>
        <table><tr><th>Level</th><th>Slide's label</th><th>What</th><th>Size</th></tr>
        <tr><td>1</td><td>Entry Point</td><td>Define name and description</td><td>~100 tokens</td></tr>
        <tr><td>2</td><td>After Task Completion*</td><td>The workflow in <code>SKILL.md</code></td><td>&lt; 5k</td></tr>
        <tr><td>3</td><td>As Needed</td><td>Use files in <code>references/</code>, <code>scripts/</code>, or <code>assets/</code> as supplemental context</td><td>∞</td></tr></table>
        <p class="hint">* The slide's label for level 2 does not match slides 34–35, which load the full instructions when the prompt matches, not after the task. We follow slides 34–35.</p>
        ${callout("pattern", "A SKILL = PROMPTS + SCRIPTS + OTHER REFERENCE FILES", `<p>The instructions are a prompt; the scripts do work the model should not redo by hand; the references hold details the model reads only when it needs them.</p>`)}` },
    ],
    takeaways: ["A skill is a saved, reusable workflow (SOP).", "Memory is loaded every call; a skill is not.", "Skill = SKILL.md + scripts + references."],
  },
  {
    slug: "6-trigger", nav: "Triggering", title: "How to Trigger a Skill",
    subtitle: "Metadata, matching, and lazy loading",
    abstract: "Only the metadata of every skill sits in the context. When a prompt matches, the full instructions load; scripts run only when needed.",
    tags: ["metadata", "instructions", "lazy load", "toy loader"],
    hero: "lazyMini", heroCaption: "Context size per prompt: skills vs memory.",
    sections: [
      { id: "meta", title: "Metadata and instructions", html: `
        <p>The top of <code>SKILL.md</code>, between the two <code>---</code> lines, is the <b>metadata</b>; below it are the <b>instructions</b> (slide 33):</p>
        ${text(CODE.skillMd)}` },
      { id: "lazy", title: "Lazy loading", html: `
        <p>The user types <em>“Debug this issue”</em>. The agent compares the prompt with every skill's metadata.</p>
        <ul><li><b>If the prompt matches the metadata:</b> load the full instructions and follow them.</li><li>Execute the skill's scripts <b>only when necessary</b>.</li></ul>
        ${demo("skillFile", "Demo 7 · Debug this issue, with a skill", "← → keys step", "The steps are slide 25's workflow; the levels are slide 32's.")}
        ${callout("pattern", "LAZY LOAD FOR SAVING CONTEXT WINDOW", `<p>Only the short metadata of every skill sits in the context. A skill's instructions enter the context when a prompt matches, and its scripts and reference files only when a step needs them.</p>`)}
        <p>The example on the slides is a real shared skill, <code>systematic-debugging</code> from the <em>superpowers</em> collection on SkillHub (<a href="https://www.skillhub.club" target="_blank" rel="noopener">skillhub.club</a>), where you can also share your own.</p>` },
      { id: "toy", title: "A toy skill loader", html: `
        <p>Here is lazy loading in a few lines (ours). There are two skills: the slides' <code>systematic-debugging</code>, with the slide 25 workflow as its instructions, and a <code>commit-message</code> skill we made up. In a real agent the <em>model</em> reads the descriptions and decides; here a crude keyword match stands in for it, and words stand in for tokens.</p>
        ${codeBlock(CODE.skillLoader)}${out(OUT.skillLoader)}
        <p>Compare memory, which puts every workflow into every call:</p>
        ${codeBlock(CODE.memoryCmp)}${out(OUT.memoryCmp)}
        <p>With two skills the saving is small when a skill matches (73 vs 75 words), and large when none does (26 vs 77). The point is how it grows: each new skill adds one line of metadata to every call, not its whole workflow.</p>
        ${demo("lazy", "Demo 8 · What enters the context?", "type a prompt; switch skills / memory")}
        ${predict("Ask <em>“My test fails on CI”</em>. Which skill loads, and on which keyword?",
          `${codeBlock(CODE.testCall)}${out(OUT.testCall)}<p><code>test</code> (from “test failure”) matches. A real model would also match <em>“the build is red”</em>, which shares no keyword at all: that is why agents let the model, not a keyword list, make the call.</p>`)}` },
      { id: "build", title: "Let us build a simple skill", html: `
        <p>A skill is just a folder with a <code>SKILL.md</code>. For example, the slides' <em>“how to write commit message”</em> as a skill (the instructions are our illustration):</p>
        ${text(CODE.commitTree)}${text(CODE.commitSkill)}
        <p>The <code>description</code> is what decides when the skill is used, so write it as <em>when to use</em> the skill, as <code>systematic-debugging</code> does.</p>` },
    ],
    takeaways: ["Metadata always; instructions on a match.", "Scripts and references only when needed.", "Write the description as “use when…”."],
  },
  {
    slug: "7-research", nav: "Good skills?", title: "Are Your Skills Good Enough?",
    subtitle: "Writing a skill is easy; a good one is a research question",
    abstract: "Optimizing skills, choosing which to evaluate, doubting the gains, skills vs subagents, checking intent, who maintains skills, and mining them from code.",
    tags: ["SkillOpt", "evaluation", "variance", "Code2Skill"],
    hero: "skillOptMini", heroCaption: "SkillOpt's training loop (slide 39).",
    sections: [
      { id: "skillopt", title: "SkillOpt: optimize your skills", html: `
        <p><b>SkillOpt</b> (<a href="https://github.com/microsoft/skillopt" target="_blank" rel="noopener">github.com/microsoft/skillopt</a>) treats <code>skill.md</code> as a parameter and improves it in a training loop.</p>
        ${demo("skillOpt", "Demo 9 · SkillOpt's training loop", "← → keys step", "The stages and their one-line descriptions are the slide's figure.")}` },
      { id: "survey", title: "Recent work on skills", html: `
        <p>The slides survey recent work (we repeat only what the slides state; the arXiv numbers are the slides'):</p>
        <table><tr><th>Work</th><th>The slide's point</th></tr>
        <tr><td><b>COBRA-Skills</b> (arXiv 2609.11682)</td><td>Spends evaluations selectively: bandit-guided prioritization picks which skills to evaluate next.</td></tr>
        <tr><td><b>Skill Issue</b> (arXiv 2609.12742)</td><td>On three Kotlin repositories, observed skill-optimization gains remain difficult to distinguish from agent run-to-run variance.</td></tr>
        <tr><td><b>Subagents vs Agent Skills</b> (arXiv 2609.09233)</td><td>A skill runs in the main context; a subagent in its own subcontext. With clear I/O contracts, subagent execution can improve results, at the cost of extra communication tokens.</td></tr>
        <tr><td><b>SkillSpec</b> (arXiv 2609.06052)</td><td>Compares declared intent with encoded behavior and validates suspected skill defects in an isolated sandbox.</td></tr>
        <tr><td><b>Who Maintains Agent Skills?</b> (arXiv 2609.05677)</td><td>Across five repositories, all 254 substantive skill edits were human-authored or human-merged, while 62% carried AI co-author trailers.</td></tr>
        <tr><td><b>Code2Skill</b> (arXiv 2609.05571)</td><td>Builds a retrievable skill bank from source code, using reconstruction and source-aware checks.</td></tr></table>
        ${callout("pitfall", "PITFALL", `<p><b>“Optimized” is not the same as “better”.</b> The Skill Issue result is a reminder: an agent's runs vary, so compare a skill against that run-to-run variance before you trust a gain.</p>`)}` },
      { id: "record", title: "Recording a skill", html: `
        <p>Slide 46 shows one more way to make a skill: an app's <b>Record a skill</b> button. Your screen, clicks, typing and voice are recorded, then turned into a repeatable skill (saved, in the example, as the command <code>/file-expenses</code>).</p>` },
    ],
    takeaways: ["Skills can be optimized like parameters.", "Check gains against run-to-run variance.", "Skills can be mined, checked, recorded."],
  },
  {
    slug: "8-big-picture", nav: "Big picture", title: "The Big Picture",
    subtitle: "All agents do is prompt organization",
    abstract: "The whole agent on one page, the four layers of prompts again, and the other coding agents that share the same architecture.",
    tags: ["the whole agent", "prompt layers", "other coding agents"],
    hero: "agentMapMini", heroCaption: "The whole agent (slide 47).",
    sections: [
      { id: "whole", title: "The whole agent", html: `
        <p>Slide 47 puts the pieces together: <b>prompts</b> pass through <b>context management</b> to the agent; <b>RAG</b>, <b>subagents</b> and <b>skills</b> around it; and, new today, <b>MCP</b> connecting it to tools that run in a <b>sandbox</b>.</p>
        ${demo("agentMap", "Demo 10 · The whole agent", "click a piece")}` },
      { id: "prompts", title: "All agents do is prompt organization", html: `
        <p>Back to Lecture 02's layers of prompts:</p>
        <ol><li><b>Model system prompts</b>: not visible.</li><li><b>Project system prompts</b>: <code>CLAUDE.md</code> in each project folder.</li>
        <li><b>Memory / skills</b>: extended capabilities.</li><li><b>User prompts</b>: your inputs.</li></ol>
        <p>Skills slot into layer 3, and MCP tool descriptions join the tool list sent on every call.</p>` },
      { id: "others", title: "Other agents", html: `
        <ul><li>Coding agents are the major agents.</li><li>They share similar architectures with other agents.</li></ul>
        <table><tr><th>Agent</th><th>The slide's note</th></tr>
        <tr><td>MiMo Code</td><td>Xiaomi's coding agent</td></tr>
        <tr><td>Claude Code</td><td>as a Visual Studio Code extension, or in the terminal</td></tr>
        <tr><td>GitHub Copilot</td><td>First-generation coding agent by GitHub</td></tr>
        <tr><td>Codex</td><td>Coding agent by OpenAI</td></tr>
        <tr><td>Gemini CLI</td><td>Coding agent by Google</td></tr>
        <tr><td>OpenCode</td><td>Popular open-source coding agent</td></tr>
        <tr><td>Cursor</td><td>A fork of VSCode with AI coding support</td></tr></table>
        <p>They look different, but inside each one you find the same loop, the same kinds of tools, and increasingly the same MCP servers and skills.</p>
        <p>The lecture ends with the <b>project announcement</b> (given in class) and the next class: <em>How to write a prompt</em>.</p>` },
    ],
    takeaways: ["Today: MCP, sandbox, skills.", "Agents organize prompts in four layers.", "Coding agents share one architecture."],
  },
  {
    slug: "9-summary", nav: "Summary", title: "Summary and Practice",
    subtitle: "Check yourself, then build a server and a skill",
    abstract: "A map of the lecture, self-check questions, and four exercises with solutions.",
    tags: ["knowledge map", "self-check", "exercises"],
    hero: "toc",
    sections: [
      { id: "map", title: "Knowledge map", html: `<div class="map">
        <div class="card"><h3>The problem</h3><ul><li>Context is managed</li><li>Built-in tools are fixed</li><li>How to add a tool?</li></ul></div>
        <div class="card"><h3>MCP</h3><ul><li>Hosts, clients, servers</li><li>LLM + client inside; server + data outside</li><li>Server tools register as tools</li></ul></div>
        <div class="card"><h3>JSON-RPC</h3><ul><li>initialize → tools/list → tools/call</li><li>id, method, params → result / error</li><li>Tools, resources, prompts</li></ul></div>
        <div class="card"><h3>Sandbox</h3><ul><li>Isolated, tracked, recoverable</li><li>Bash · server · agent · OS</li><li>Pick the layer by risk</li></ul></div>
        <div class="card"><h3>Skills</h3><ul><li>A reusable workflow (SOP)</li><li>Not memory: not in every call</li><li>SKILL.md + scripts + references</li></ul></div>
        <div class="card"><h3>Lazy loading</h3><ul><li>Metadata always (~100 tokens)</li><li>Instructions on a match (&lt;5k)</li><li>Files as needed</li></ul></div></div>` },
      { id: "check", title: "Check your understanding", html: `<div data-demo="quiz"><div class="demo-body"></div></div>` },
      { id: "exercises", title: "Exercises", html: `
        <h3>Exercise 1 ★ (modify)</h3>
        <p>Add the slide's <code>multiply</code> tool to the toy <code>mcp</code> server, then send <code>tools/list</code> and a <code>tools/call</code> for <code>multiply</code> with <code>a = 3</code>, <code>b = 5</code>. What do the two replies contain?</p>
        <details class="reveal"><summary>Solution</summary>${codeBlock(CODE.ex1)}${out(OUT.ex1)}
        <p><code>tools/list</code> now lists both tools, and <code>multiply</code>'s schema says <code>number</code> (from <code>float</code>). The call returns <code>15</code>: Python multiplied the two integers it was sent. The ids carry on from 5 because this client already sent four requests.</p></details>
        <h3>Exercise 2 ★★ (modify)</h3>
        <p>Asking for a tool that does not exist, e.g. <code>tools/call</code> with <code>"name": "subtract"</code>, crashes the toy server with a <code>KeyError</code>. Change <code>Server.handle</code> so it returns a JSON-RPC error instead, with code <code>-32602</code> (invalid params) and message <code>Unknown tool: subtract</code>.</p>
        <details class="reveal"><summary>Solution</summary><p>Check the name before calling, in a subclass so the rest of the notes keep the original:</p>${codeBlock(CODE.ex2)}${out(OUT.ex2)}
        <p>A server that crashes takes the whole session down; an error reply lets the model read it and try something else.</p></details>
        <h3>Exercise 3 ★ (design)</h3>
        <p>Write the <code>SKILL.md</code> metadata for the slides' other two example skills: <em>how to type log fields</em> and <em>how to query slow SQLs</em>. Then write one prompt that should trigger each, and one that should trigger neither.</p>
        <details class="reveal"><summary>Solution</summary><p>One possible answer:</p>${text(CODE.ex3a)}${text(CODE.ex3b)}
        <p><em>“Add logging to the payment handler”</em> → <code>log-fields</code>. <em>“The orders page takes 30 seconds to load”</em> → <code>slow-sql</code> (a good model links this to SQL even though the word is missing; our keyword toy would not). <em>“Rename this variable”</em> → neither. The description should say <b>when</b> to use the skill, in the words a user is likely to type.</p></details>
        <h3>Exercise 4 ★★ (judge)</h3>
        <p>For each case, choose a sandbox layer and say why: (a) a classmate's MCP server that reads your calendar; (b) letting an agent run your project's test suite on your laptop; (c) an agent that will run overnight on the department's shared GPU server.</p>
        <details class="reveal"><summary>Solution</summary><p>(a) A server you have not read is a <em>random MCP server</em>: wrap it with the sandbox runtime, or run it in a VM. (b) Everyday coding on your own machine: the bash sandbox (<code>/sandbox</code>). (c) A shared server: a container/VM or the sandbox runtime around the whole agent, so it cannot touch other users' files.</p></details>` },
      { id: "terms", title: "Key terms and further reading", html: `
        <p class="tags">${["predefined tools", "Model Context Protocol (MCP)", "MCP host", "MCP client", "MCP server", "FastMCP", "JSON-RPC", "tools/call", "tools/list", "initialize", "tool", "resource", "prompt template", "sandbox", "snapshot", "sandbox runtime", "skill", "Standard Operating Procedure", "SKILL.md", "metadata", "memory (MEMORY.md)", "lazy loading", "skill distillation"].map((t) => `<span class="tag">${t}</span>`).join("")}</p>
        <ul><li>Model Context Protocol, server concepts: <a href="https://modelcontextprotocol.io/docs/learn/server-concepts" target="_blank" rel="noopener">modelcontextprotocol.io</a></li>
        <li>Model Context Protocol specification: <a href="https://modelcontextprotocol.io/specification" target="_blank" rel="noopener">modelcontextprotocol.io/specification</a></li>
        <li>FastMCP documentation: <a href="https://gofastmcp.com/servers/server" target="_blank" rel="noopener">gofastmcp.com</a></li>
        <li>JSON-RPC 2.0 specification: <a href="https://www.jsonrpc.org/specification" target="_blank" rel="noopener">jsonrpc.org</a></li>
        <li>Browser MCP: <a href="https://browsermcp.io/" target="_blank" rel="noopener">browsermcp.io</a> · MCP Market: <a href="https://mcpmarket.com/" target="_blank" rel="noopener">mcpmarket.com</a></li>
        <li>The <code>systematic-debugging</code> skill on SkillHub: <a href="https://www.skillhub.club/skills/obra-superpowers-systematic-debugging" target="_blank" rel="noopener">skillhub.club</a></li>
        <li>colleague-skill: <a href="https://github.com/titanwings/colleague-skill" target="_blank" rel="noopener">github.com/titanwings/colleague-skill</a></li>
        <li>SkillOpt: <a href="https://github.com/microsoft/skillopt" target="_blank" rel="noopener">github.com/microsoft/skillopt</a></li>
        <li>The papers on slides 40–45: arXiv 2609.11682, 2609.12742, 2609.09233, 2609.06052, 2609.05677, 2609.05571.</li></ul>` },
    ],
    takeaways: ["MCP: one plug for new tools.", "Sandbox the tools you don't trust.", "Skills: workflows loaded only when needed."],
  },
];

const QUIZ = [
  { q: "What problem does MCP solve?",
    opts: ["Adding a new tool means changing each agent's own code", "The context window is too small", "LLMs cannot reason", "Tool calls are too slow"],
    a: 0, why: "Built-in tools live inside the agent. MCP is a unified interface: a tool written once as an MCP server works in every agent that speaks the protocol." },
  { q: "In the MCP workflow, which two parts live <b>inside</b> the agent?",
    opts: ["MCP server and data", "LLM and MCP client", "User and LLM", "MCP client and MCP server"],
    a: 1, why: "Slides 9–10: the LLM and the MCP client are within agents; the MCP server and the data are external servers." },
  { q: "In a JSON-RPC message, what is the <code>id</code> for?",
    opts: ["It names the tool", "It is the protocol version", "It counts the arguments", "It matches a response to its request"],
    a: 3, why: "The server's reply carries the same id as the request. The tool's name goes in params; the version is \"jsonrpc\": \"2.0\"." },
  { q: "Which message gets <b>no reply</b> from the server?",
    opts: ["initialize", "tools/list", "notifications/initialized", "tools/call"],
    a: 2, why: "It is a notification: it has no id, so the server does not answer. Our toy server returns None for it." },
  { q: "<code>@mcp.resource(\"data://config\")</code> declares a…",
    opts: ["tool: a function the client invokes to act", "resource: data the client can read", "prompt: a reusable message template", "sandbox"],
    a: 1, why: "Resources are passive data sources rather than invocable functions (slide 14)." },
  { q: "Which is <b>not</b> one of the three properties of a tool sandbox on the slides?",
    opts: ["Environment isolation", "Trackable execution", "Recoverable to snapshot", "Faster execution"],
    a: 3, why: "The slides list isolation, trackable execution and recovery to a snapshot. Speed is not the point." },
  { q: "You want to try a random MCP server from the internet. The slides suggest…",
    opts: ["Wrap it with the sandbox runtime, or run it in a VM", "Bash sandbox via /sandbox only", "No sandbox: MCP servers are safe", "Put it in MEMORY.md"],
    a: 0, why: "Slide 22: wrap it with the sandbox runtime, or run it in a VM. /sandbox only covers bash commands." },
  { q: "Why keep a debugging workflow as a skill rather than in <code>MEMORY.md</code>?",
    opts: ["Memory cannot store lists", "Skills run faster", "Memory is loaded on every call; a skill loads only when the prompt matches", "Memory is only for the model provider"],
    a: 2, why: "A skill is not a global workflow polluting the context: only its metadata stays in the context until it is needed." },
  { q: "Which part of a skill is in the context <b>all the time</b>?",
    opts: ["The whole SKILL.md", "Its scripts", "The name and description (metadata)", "Its references/ folder"],
    a: 2, why: "Level 1, about 100 tokens. The instructions load when a prompt matches; scripts and references only as needed." },
];
