// L02 content, adapted from csc4801/notes/L02-agents.md (which follows the slides in order).

const demo = (name, title, instr, hint = "") =>
  `<div class="card demo" data-demo="${name}"><div class="head"><span class="title">${title}</span><span>${instr}</span></div>
   <div class="demo-body"></div>${hint ? `<p class="hint">${hint}</p>` : ""}</div>`;
const callout = (kind, label, body) => `<div class="callout ${kind}"><b>${label}</b>${body}</div>`;
const predict = (q, a) => callout("predict", "PREDICT", `<p>${q}</p><details class="reveal"><summary>Show the answer</summary>${a}</details>`);
const json = (s) => codeBlock(s, "repl");

const VIDEO = "../videos/L02.mp4";

const LECTURE = {
  number: 2,
  title: "Principles of Agents",
  tagline: "An agent is an LLM plus a harness",
  lead: "Why a bare LLM is a poor problem solver, and how a coding agent like Claude Code turns one into an engineer: the ten-step workflow, ReAct, tools, and the loop that ties them together — every step one click at a time.",
  heroDemo: "reactMini",
  heroLabel: "The agent loop · Add error handling in the file @main.py",
  heroCaption: "Reason, act, observe, repeat — until the model needs no more tools.",
  whyTitle: "Why this lecture matters",
  whySub: "Three ideas behind every coding agent you will use this term",
  why: [
    ["A body for the model", "The <b>harness</b> runs tools for the LLM and feeds the results back, so it can explore, edit and test."],
    ["A loop, not one answer", "An error? Retry. The loop lets an agent check its own work and <b>reduce uncertainty</b>."],
    ["A pattern for deciding", "<b>ReAct</b>: the model reasons about what to do, asks for a tool, and reads what happened."],
  ],
  ctaTitle: "Ready to follow one request through the loop?",
  minutes: "About 45–60 minutes",
  videos: { [VIDEO]: "Lecture 2 — Principles of Agents (10 min)" },
};

const CHAPTERS = [
  {
    slug: "1-why", nav: "Why agents", title: "Why We Need Agents",
    subtitle: "One chance, no validation, not enough context",
    abstract: "Paste a bug and the code into an LLM and it answers once, unchecked, with only the code that fits. An agent gives it a body.",
    tags: ["LLM + harness", "four buzzwords", "two goals"],
    hero: "workflowMini", heroCaption: "The workflow of a coding agent, 0 Start to 9 End.",
    sections: [
      { id: "problem", title: "What goes wrong with an LLM alone", html: `
        <p>Last lecture: an LLM does one thing. It predicts the next <b>token</b>, again and again.</p>
        <p>So paste a bug report and the code files into an LLM and ask it to fix the bug. It answers once. On the slides the answer ends <code>return a / cde;</code> — a slip that nothing checked. Two problems:</p>
        <ul><li><b>Bad performance.</b> The model has <em>only one chance</em> to output, and there is <em>no validation</em> of what it wrote.</li>
        <li><b>Insufficient context window.</b> A real code base can have more than three million lines of code. It is impossible to put all of it into one prompt.</li></ul>
        <p>A human engineer works differently: they <em>explore the code repo</em>, <em>retrieve relevant content</em>, and <em>observe the execution results</em>. To work like that, the LLM needs something around it that runs tools for it and feeds the results back. That something is the <b>harness</b>.</p>
        ${callout("pattern", "AGENT = LLM + HARNESS", `<p>An <b>LLM agent</b> is an LLM plus a harness. The LLM decides what to do next; the harness does it (reads files, runs commands) and shows the model what happened.</p>`)}` },
      { id: "goals", title: "Buzzwords and goals", html: `
        <p>You may have heard four buzzwords: <b>prompt engineering</b>, <b>context engineering</b>, <b>harness engineering</b> and <b>loop engineering</b>. By the end of this lecture you will see where each one fits (Chapter 5).</p>
        <p>Agents have two goals:</p>
        <ol><li>Equip LLMs with <b>bodies</b> to solve real-world problems.</li>
        <li><b>Alleviate the uncertainty.</b> An error? Retry… retry… retry, until it works.</li></ol>` },
      { id: "video", title: "Watch the lecture video", html: `
        <p>The video follows the same slides in the same order. Watch it first, or use it to review after the demos.</p>
        <div class="card video" data-video="${VIDEO}"></div>` },
    ],
    takeaways: ["An LLM alone: one chance, no validation.", "Agent = LLM + harness.", "Goals: a body, and retries."],
  },
  {
    slug: "2-input", nav: "Workflow & input", title: "The Workflow and the Input",
    subtitle: "From what you type to the first message",
    abstract: "Claude Code's workflow has three parts: input processing, a main loop, and output. Part 1 turns your prompt into messages and sets up one state.",
    tags: ["0–9 steps", "messages", "system prompt", "layers"],
    hero: "code:mainPy", heroCaption: "The running example: main.py",
    sections: [
      { id: "workflow", title: "How an agent works", html: `
        <p>The slides use Claude Code, a widely used coding agent, to explain the workflow. It has three parts: <b>input processing</b> (steps 0–2), the <b>main loop</b> (steps 3–8), and <b>output</b> (step 9). After step 5 the agent asks one question: <b>does the model want to use a tool?</b> Yes: steps 6–8, then back to step 3. No: step 9.</p>
        ${demo("workflow", "Demo 1 · Follow one request through the workflow", "step, or click any box", "The path shown is our running example: three tool turns (Read, Edit, Run), then a final answer.")}
        <p><b>Running example (0 Start).</b> We have a code file, <code>main.py</code>, which looks up the weather for a city:</p>
        ${codeBlock(CODE.mainPy)}
        <p>Our task: <em>Add error handling in the file @main.py</em>.</p>` },
      { id: "receive", title: "1 Receive prompt", html: `
        <p>Three types of input are accepted:</p>
        <table><tr><th>Input</th><th>Meaning</th></tr>
        <tr><td>Text</td><td>Normal text, the user prompt.</td></tr>
        <tr><td><code>@</code> file reference</td><td>The entire file's content is loaded and put into the message.</td></tr>
        <tr><td><code>/</code> command</td><td>Executes a special command, such as a predefined prompt.</td></tr></table>
        <p>Inside the agent, the conversation is organised as <b>messages</b>. The <code>content</code> field stores the prompt for the LLM. Agents also provide a <b>system prompt</b>, such as <em>“You are a helpful coding assistant.”</em> It arrives at the LLM before the user prompt:</p>
        ${json(`{
    "system": "You are a helpful coding assistant.",
    "type": "user",
    "message": {
        "role": "user",
        "content": "Add error handling in the file @main.py"
    }
}`)}
        ${demo("input", "Demo 2 · From input to message", "type a prompt", "<code>main.py</code> and <code>/review</code> are the only file and command this demo knows.")}` },
      { id: "system", title: "System prompts and prompt layers", html: `
        <p>System prompts are <b>high-priority instructions</b> given to an LLM, and are typically predefined. Why we need them:</p>
        <table><tr><th>Purpose</th><th>Example</th></tr>
        <tr><td>Define role</td><td>“You are a coding assistant.”</td></tr>
        <tr><td>Set style</td><td>“Explain in simple language.”</td></tr>
        <tr><td>Add rules</td><td>“Do not reveal private data.”</td></tr>
        <tr><td>Control format</td><td>“Return JSON only.”</td></tr>
        <tr><td>Improve safety</td><td>“Refuse harmful requests.”</td></tr></table>
        <p>Real system prompts are long. The slides show one of Anthropic's published system prompts for its chat interface: 2,929 words, much of it safety strategies.</p>
        ${callout("pattern", "MULTI-LAYER PROMPTS", `<ol><li><b>Model system prompt</b>: written by the model provider; not visible to you.</li>
          <li><b>Project system prompt</b>: e.g. a <code>CLAUDE.md</code> file in each project folder.</li>
          <li><b>Memory / skills</b>: extended capabilities.</li><li><b>User prompt</b>: your input.</li></ol>`)}
        ${demo("layers", "Demo 3 · What the model receives", "turn layers on and off")}` },
      { id: "init", title: "2 Initialize", html: `
        <p>The agent initialises its <b>runtime state</b>, such as the message list and the available tools. In Claude Code all of it lives in <b>one state variable</b>, and during the loop every change is written to that single variable. Reason: maintaining one unified state avoids a whole class of bugs.</p>` },
    ],
    takeaways: ["Input → loop → output: steps 0–9.", "Everything becomes a message; system first.", "Prompts come in four layers."],
  },
  {
    slug: "3-call", nav: "Calling the model", title: "Calling the Model",
    subtitle: "Steps 3–5: prepare, call, stream",
    abstract: "Every call sends the system prompt, the whole message history and every tool's description — and the answer streams back token by token.",
    tags: ["REST API", "message history", "streaming"],
    hero: "streamMini", heroCaption: "Streaming: watch the work as it happens.",
    sections: [
      { id: "prepare", title: "3 Prepare context and 4 Call LLM", html: `
        <p>For the first iteration of the loop, the context is just the system prompt and our message.</p>
        <p>The model runs on a server. The agent calls it through a REST API, e.g. <code>POST https://api.anthropic.com/v1/messages</code>, with the model name, the system prompt, <b>all message history</b>, and <b>40+ tools' JSON schemas</b>. Every call sends the whole history again.</p>
        ${demo("request", "Demo 4 · The request body, call by call", "drag the call number", "The messages are those of our running example; the tool results are shortened.")}
        ${predict("On the fourth call of our example, how many messages are sent?",
          `<p>Seven: the user's request, then for each of the three tool turns the model's reply and the tool result. Drag Demo 4 to 4 to check.</p>`)}` },
      { id: "stream", title: "5 Stream processing", html: `
        <p>A task may take several minutes. Waiting for the whole answer and only then checking it is slow, so the model <b>outputs tokens one by one</b> as they are generated, instead of all at once.</p>
        ${demo("stream", "Demo 5 · Streamed vs all at once", "press Generate", "The text is the slides' main.py; the token split is a rough illustration.")}` },
    ],
    takeaways: ["The context: system + all messages + tools.", "Called over a web API, every turn.", "Stream tokens instead of waiting."],
  },
  {
    slug: "4-react", nav: "ReAct", title: "ReAct: Reason, Act, Observe",
    subtitle: "How the model decides what to do next",
    abstract: "The cornerstone of LLM agents. The model writes its thoughts, asks for a tool in a fixed format, and reads the result — then the loop goes round again.",
    tags: ["reasoning", "chain-of-thought", "tool calls", "walkthrough"],
    hero: "reactMini", heroCaption: "Our request, solved in four turns.",
    sections: [
      { id: "reason", title: "Reasoning", html: `
        <p>How could an agent decide how to complete the task? The answer is <b>ReAct</b> (reasoning + acting), the cornerstone of LLM agents.</p>
        <p>The model first writes down its thoughts: <em>“To solve the user request, first, I need to inspect the content. Second, I need to … Last, …”</em> There are two ways to get a model to reason:</p>
        <ul><li><b>A specific prompt.</b> <em>Chain-of-thought</em> (CoT): show worked examples (few-shot CoT), or simply add <em>“Let's think step by step”</em> (zero-shot CoT).</li>
        <li><b>Model post-training.</b> Train a foundation model so that reasoning becomes a habit, e.g. DeepSeek R1.</li></ul>` },
      { id: "act", title: "Acting", html: `
        <p>The harness tells the model which tools exist and asks it to reply in a fixed format when it wants one:</p>
        ${codeBlock(`Here are available tools to use: Read, Edit, ... If you need to use any tool,
return the instructions as follows:
{ "tool": [tool name], "args": [parameters for the tool] }`, "out")}
        <p>The model replies, for example, <em>“I need to inspect main.py first.”</em> and <code>{"tool": "Read", "args": "main.py"}</code>. The model only <em>writes</em> the request. The harness reads the reply, runs the tool, and hands back the result.</p>` },
      { id: "walk", title: "The walkthrough", html: `
        ${demo("react", "Demo 6 · The loop, one step at a time", "← → keys step", "This replays the toy harness from Chapter 5. The console shows exactly what it prints.")}
        <table><tr><th>Turn</th><th>Thought (reason)</th><th>Action (tool)</th><th>Observation</th></tr>
        <tr><td>1</td><td>I need to inspect main.py first.</td><td><code>Read("main.py")</code></td><td>the file content</td></tr>
        <tr><td>2</td><td>I should catch the errors of missing arguments.</td><td><code>Edit("main.py", proposed changes)</code></td><td>Update successfully</td></tr>
        <tr><td>3</td><td>I need to verify the code.</td><td><code>Run("python main.py")</code></td><td>It prints <code>Usage: python main.py &lt;config-file&gt;</code></td></tr>
        <tr><td>4</td><td>What's next? No action is required.</td><td>—</td><td>Return final result to the user</td></tr></table>
        <p>Reason, act, observe, repeat. Every turn is just another call to the same next-token predictor, with a longer context.</p>` },
    ],
    takeaways: ["ReAct: reason, then act.", "The model writes the request; the harness runs it.", "Each turn is one more LLM call."],
  },
  {
    slug: "5-tools", nav: "Tools & stopping", title: "Tools, Results and Stopping",
    subtitle: "Steps 6–9, and the whole loop in Python",
    abstract: "Which tools need permission, which run in parallel, what stops the loop — and a toy harness you can run without an API key.",
    tags: ["permission", "parallel vs sequential", "stop conditions", "toy harness"],
    hero: "code:agentLoop", heroCaption: "The whole loop, from the toy harness",
    sections: [
      { id: "tools", title: "6 Call tools", html: `
        <table><tr><th>Tool</th><th>Description</th><th>Permission required</th></tr>
        ${Object.entries(TOOL_INFO).map(([t, [d, p]]) => `<tr><td>${t}</td><td>${d}</td><td>${p ? "Yes" : "No"}</td></tr>`).join("")}</table>
        <p>Tools that change something need your permission; tools that only read do not.</p>
        ${callout("pitfall", "PITFALL", `<p><b>Tools are the interface to the environment, so every tool call must be safe and valid.</b> Before trusting <code>main.py</code>: does it include malicious code or hidden prompts? Is all of its information provided? Is it a valid file at all?</p>`)}` },
      { id: "results", title: "7 Receive tool results", html: `
        <ul><li><b>Read tools</b> (Grep, Read, Glob) are executed <b>in parallel</b>.</li>
        <li><b>Write tools</b> (Bash, Write, Edit) are executed <b>in sequence</b>, so they don't step on each other.</li></ul>
        ${demo("tools", "Demo 7 · How the harness runs a batch of tools", "pick tools")}
        <p>Each result is appended to the message list as a <b>tool result</b>, and the list is sent again on the next call:</p>
        ${json(`{
    "message": {
        "role": "user",
        "content": [
            {
                "tool_use_id": "call_bZnZbCZ1smrb7oIXEFUqQy8u",
                "type": "tool_result",
                "content": "import request..."
            }
        ]
    }
}`)}` },
      { id: "check", title: "8 Check loop and 9 End", html: `
        <p>The agent passes all messages to the LLM again, and the model decides whether more tool calls are required. These also stop the loop: reaching the maximum number of loops (no endless loop); the messages exceeding the token limit; the user asking to stop; the LLM API returning an error.</p>
        ${demo("stop", "Demo 8 · What stops a loop that never ends?", "change the limits")}
        <p><b>9 End.</b> Update the state (e.g. token usage), send a summary to the user, and store all the messages (Claude Code keeps them under <code>~/.claude/projects/</code>) as a backup.</p>` },
      { id: "toy", title: "A toy harness", html: `
        <p>Here is the whole loop in a few lines of Python. The “LLM” is fake: <code>scripted_llm</code> replies with a fixed list of answers, the ones from the walkthrough, so the program runs offline. The <code>Run</code> tool is a stand-in too: it returns the output shown on the slides.</p>
        ${codeBlock(`SYSTEM = "You are a helpful coding assistant."

files = {
    "main.py": 'import requests\\n\\ncity = input("Enter city: ")\\n',
}


def read(path):
    """Read tool: return the file's content."""
    return files[path]


def edit(path, new_text):
    """Edit tool: replace the file's content."""
    files[path] = new_text
    return "Update successfully"


def run(command):
    """Run tool. A stand-in: it returns the output shown on the slides."""
    return "Usage: python main.py <config-file>"


TOOLS = {"Read": read, "Edit": edit, "Run": run}


def scripted_llm(replies):
    """A fake LLM that gives the replies in order, whatever it is sent."""
    replies = iter(replies)

    def call(system, messages, tools):
        return next(replies)

    return call


` + CODE.agentLoop + `


script = [
    {"thought": "I need to inspect main.py first.", "tool": "Read", "args": ["main.py"]},
    {"thought": "I should catch the errors of missing arguments.",
     "tool": "Edit", "args": ["main.py", "<proposed changes>"]},
    {"thought": "I need to verify the code.", "tool": "Run", "args": ["python main.py"]},
    {"thought": "No action is required.", "answer": "Added error handling to main.py."},
]
print(agent("Add error handling in the file @main.py", scripted_llm(script)))`)}
        ${codeBlock(`[1] I need to inspect main.py first.
    Read('main.py') -> 'import requests'
[2] I should catch the errors of missing arguments.
    Edit('main.py') -> 'Update successfully'
[3] I need to verify the code.
    Run('python main.py') -> 'Usage: python main.py <config-file>'
[4] No action is required.
    messages: 8
Added error handling to main.py.`, "out")}
        ${predict("The run above ends with 8 messages. Where does each one come from?",
          `<p>One user message, then for each of the three tool turns an assistant message and a tool result (6 more), then the final assistant message: 1 + 6 + 1 = 8.</p>`)}
        <p>A model that never stops asking for tools is stopped by step 8:</p>
        ${codeBlock(`files["main.py"] = "import requests\\n"
always_read = scripted_llm([{"thought": "Let me look again.", "tool": "Read", "args": ["main.py"]}] * 5)
print(agent("Add error handling in the file @main.py", always_read, max_turns=3))`)}
        ${codeBlock(`[1] Let me look again.
    Read('main.py') -> 'import requests'
[2] Let me look again.
    Read('main.py') -> 'import requests'
[3] Let me look again.
    Read('main.py') -> 'import requests'
Stopped: reached the maximum number of turns.`, "out")}
        ${callout("pattern", "THE FOUR BUZZWORDS, PLACED", `<p><b>Prompt engineering</b> is about the input (step 1). <b>Context engineering</b> is about what goes into each call (step 3). <b>Harness engineering</b> is the tools and checks around the model (steps 6–7). <b>Loop engineering</b> is the loop itself (step 8). Which is the best term? They are parts of the same machine.</p>`)}` },
    ],
    takeaways: ["Writes need permission; reads don't.", "Reads in parallel, writes in sequence.", "Four ways to stop besides “done”."],
  },
  {
    slug: "6-agentless", nav: "Agentless", title: "Do We Always Need Agents?",
    subtitle: "Sometimes a fixed pipeline, or plain code, is better",
    abstract: "Agentless fixes bugs with three fixed LLM calls. And some tasks need no LLM at all.",
    tags: ["Agentless", "fixed pipeline", "plain code"],
    hero: "agentlessMini", heroCaption: "An open loop vs a fixed pipeline.",
    sections: [
      { id: "agentless", title: "Agentless", html: `
        <p>Not always. <b>Agentless</b> fixes bugs with a <em>fixed pipeline</em> of LLM calls instead of an open loop: one call explores the repo structure, the next reads the relevant file, the last one fixes the bug.</p>
        ${demo("agentless", "Demo 9 · Agent loop vs Agentless", "step through both")}` },
      { id: "when", title: "When not to use an LLM", html: `
        <ul><li>Sometimes <b>reasoning wastes resources</b> on simple tasks.</li>
        <li>Sometimes <b>LLMs are not necessary</b>: code can do it, with lower latency and lower token consumption.</li></ul>
        <p>Case studies from the slides: a <b>weather query</b> (an API call does it — that is exactly what <code>main.py</code> does) and <b>Linux commands</b> you already know.</p>` },
    ],
    takeaways: ["Agentless: a fixed pipeline of LLM calls.", "Reasoning can waste resources.", "Plain code: faster, no tokens."],
  },
  {
    slug: "7-summary", nav: "Summary", title: "Summary and Practice",
    subtitle: "Check yourself, then try it on a real agent",
    abstract: "A map of the lecture, five self-check questions, and three exercises with solutions.",
    tags: ["knowledge map", "self-check", "exercises"],
    hero: "toc",
    sections: [
      { id: "map", title: "Knowledge map", html: `<div class="map">
        <div class="card"><h3>Why agents</h3><ul><li>LLM alone: one chance, no validation</li><li>Context window too small for a repo</li><li><b>Agent = LLM + harness</b></li></ul></div>
        <div class="card"><h3>Input (0–2)</h3><ul><li>Text, <code>@</code> file, <code>/</code> command</li><li>Messages; system prompt first</li><li>Four prompt layers; one state</li></ul></div>
        <div class="card"><h3>Calling (3–5)</h3><ul><li>System + all messages + 40+ tools</li><li>REST API, every turn</li><li>Streamed token by token</li></ul></div>
        <div class="card"><h3>ReAct</h3><ul><li>Reason (CoT or post-training)</li><li>Act: a tool call in a fixed format</li><li>Observe: the harness returns the result</li></ul></div>
        <div class="card"><h3>Tools (6–7)</h3><ul><li>Writes need permission</li><li>Reads parallel, writes sequential</li><li>Results appended as tool_result</li></ul></div>
        <div class="card"><h3>Stopping (8–9)</h3><ul><li>No tool → end</li><li>Turn limit, token limit, user, API error</li><li>Not every task needs an agent</li></ul></div></div>` },
      { id: "check", title: "Check your understanding", html: `<div data-demo="quiz"><div class="demo-body"></div></div>` },
      { id: "exercises", title: "Exercises", html: `
        <h3>Exercise 1 ★ (trace)</h3>
        <p>Give a coding agent a small task and read its transcript. Label every step with its number in the workflow (1–9).</p>
        <h3>Exercise 2 ★ (modify)</h3>
        <p>Change the toy harness so the loop also stops when <code>messages</code> has more than 6 entries, and returns <code>"Stopped: context too long."</code>. Run it on <code>script</code>. After which turn does it stop?</p>
        <details class="reveal"><summary>Solution</summary>${codeBlock(`def agent_limited(prompt, llm, max_turns=10, max_messages=6):
    messages = [{"role": "user", "content": prompt}]
    for turn in range(1, max_turns + 1):
        if len(messages) > max_messages:
            return "Stopped: context too long."
        reply = llm(SYSTEM, messages, list(TOOLS))
        messages.append({"role": "assistant", "content": reply})
        print(f"[{turn}] {reply['thought']}")
        if "tool" not in reply:
            return reply["answer"]
        result = TOOLS[reply["tool"]](*reply["args"])
        messages.append({"role": "user", "content": [{"type": "tool_result", "content": result}]})
    return "Stopped: maximum number of turns."


print(agent_limited("Add error handling in the file @main.py", scripted_llm(script)))`)}${codeBlock(`[1] I need to inspect main.py first.
[2] I should catch the errors of missing arguments.
[3] I need to verify the code.
Stopped: context too long.`, "out")}<p>After turn 3 the list holds 7 messages, so the fourth call is never made.</p></details>
        <h3>Exercise 3 ★★ (design)</h3>
        <p>For each task, say whether you would use an agent, a fixed pipeline, or plain code: (a) show today's weather in Shenzhen; (b) fix a failing test in a 200,000-line repo; (c) rename a variable in one file.</p>
        <details class="reveal"><summary>Solution</summary><p>(a) Plain code: one API call. (b) An agent: it must explore, run the tests and retry. (c) Plain code or your editor; at most a single LLM call.</p></details>` },
      { id: "terms", title: "Key terms and further reading", html: `
        <p class="tags">${["token", "LLM agent", "harness", "message", "system prompt", "user prompt", "multi-layer prompts", "runtime state", "REST API", "streaming", "ReAct", "chain-of-thought", "post-training", "tool call", "tool result", "permission", "Agentless"].map((t) => `<span class="tag">${t}</span>`).join("")}</p>
        <ul><li>S. Yao et al., <em>ReAct: Synergizing Reasoning and Acting in Language Models</em>. <a href="https://react-lm.github.io/" target="_blank" rel="noopener">react-lm.github.io</a></li>
        <li>J. Wei et al., <em>Chain-of-Thought Prompting Elicits Reasoning in Large Language Models</em>. <a href="https://arxiv.org/abs/2201.11903" target="_blank" rel="noopener">arXiv:2201.11903</a></li>
        <li>T. Kojima et al., <em>Large Language Models are Zero-Shot Reasoners</em>. <a href="https://arxiv.org/abs/2205.11916" target="_blank" rel="noopener">arXiv:2205.11916</a></li>
        <li>C. S. Xia et al., <em>Agentless: Demystifying LLM-based Software Engineering Agents</em>. <a href="https://arxiv.org/abs/2407.01489" target="_blank" rel="noopener">arXiv:2407.01489</a></li>
        <li>Claude Code tools reference: <a href="https://code.claude.com/docs/en/tools-reference" target="_blank" rel="noopener">code.claude.com</a></li></ul>` },
    ],
    takeaways: ["Agent = LLM + harness + loop.", "ReAct: reason, act, observe.", "Use the loop only when the task needs it."],
  },
];

const QUIZ = [
  { q: "Which is <b>not</b> a reason the slides give for why an LLM alone is a poor bug fixer?",
    opts: ["It has only one chance to output", "Nothing validates its answer", "A large code base does not fit in its context window", "It cannot write Python"],
    a: 3, why: "The slides list bad performance (one chance, no validation) and an insufficient context window. Writing Python is not the problem; checking it is." },
  { q: "Which of these tools needs your permission in Claude Code?",
    opts: ["Read", "Grep", "Edit", "Glob"],
    a: 2, why: "Edit, Write and Bash change things, so they need permission. Read, Grep and Glob only look." },
  { q: "In ReAct, who actually runs the tool?",
    opts: ["The model, inside its forward pass", "The harness, after reading the model's reply", "The user, by copying the command", "The API server"],
    a: 1, why: "The model only writes the request in the agreed format. The harness reads it, runs the tool, and appends the result." },
  { q: "Besides “the model needs no more tools”, which of these also stops the loop?",
    opts: ["The model writes a long thought", "The messages exceed the token limit", "A read tool runs in parallel", "The system prompt is long"],
    a: 1, why: "The slides list four: the maximum number of loops, the token limit, the user asking to stop, and an API error." },
  { q: "Why are read tools run in parallel but write tools in sequence?",
    opts: ["Reads are slower", "Writes change files, so two at once could overwrite each other", "Writes need the internet", "The API allows only one write"],
    a: 1, why: "Reads change nothing, so their order doesn't matter. Writes change files, so the harness runs them one at a time." },
];
