// L04 demos. Code panels and printed outputs are copied from csc4801/notes/L04-mcp-skills.md
// (checked by csc4801/tools/check.py). The session, sandbox and skill-loader players replay the
// notes' toy programs line for line; the RPC builder and lazy-loading demo are JS twins of them.

const CODE = {
  fastmcp: `from fastmcp import FastMCP

mcp = FastMCP("Demo 🚀")

@mcp.tool
def add(a: int, b: int) -> int:
    """Add two numbers"""
    return a + b

if __name__ == "__main__":
    mcp.run()`,
  fastmcpClient: `# Call the add tool
result = await client.call_tool(
    "add",
    {
        "a": 3,
        "b": 5
    }
)`,
  rpcAdd: `{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
        "name": "add",
        "arguments": {
            "a": 3,
            "b": 5
        }
    }
}`,
  rpcWeather: `{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
        "name": "get_weather",
        "arguments": {
            "city": "Zurich"
        }
    }
}`,
  toyServer: `import inspect
import json

TYPES = {int: "integer", float: "number", str: "string"}


def describe(fn):
    """What tools/list says about one tool: name, description, input schema."""
    params = inspect.signature(fn).parameters
    return {
        "name": fn.__name__,
        "description": fn.__doc__,
        "inputSchema": {
            "type": "object",
            "properties": {p: {"type": TYPES[params[p].annotation]} for p in params},
            "required": list(params),
        },
    }


class Server:
    """A toy MCP server that answers JSON-RPC 2.0 messages. A stand-in for FastMCP."""

    def __init__(self, name):
        self.name = name
        self.tools = {}

    def tool(self, fn):
        """Decorator: register fn as a tool. Its docstring becomes the description."""
        self.tools[fn.__name__] = fn
        return fn

    def handle(self, text):
        msg = json.loads(text)
        if "id" not in msg:                       # a notification: no reply
            return None
        method, params = msg["method"], msg.get("params", {})
        if method == "initialize":
            result = {"protocolVersion": params["protocolVersion"],
                      "capabilities": {"tools": {}},
                      "serverInfo": {"name": self.name}}
        elif method == "tools/list":
            result = {"tools": [describe(fn) for fn in self.tools.values()]}
        elif method == "tools/call":
            value = self.tools[params["name"]](**params["arguments"])
            result = {"content": [{"type": "text", "text": str(value)}]}
        else:
            error = {"code": -32601, "message": f"Method not found: {method}"}
            return json.dumps({"jsonrpc": "2.0", "id": msg["id"], "error": error})
        return json.dumps({"jsonrpc": "2.0", "id": msg["id"], "result": result})


mcp = Server("Demo")


@mcp.tool
def add(a: int, b: int) -> int:
    """Add two numbers"""
    return a + b`,
  toyClient: `class Client:
    """A toy MCP client. The 'transport' is a plain function call to the server."""

    def __init__(self, server):
        self.server = server
        self.next_id = 1

    def send(self, method, params=None):
        msg = {"jsonrpc": "2.0"}
        if not method.startswith("notifications/"):
            msg["id"] = self.next_id
            self.next_id += 1
        msg["method"] = method
        if params is not None:
            msg["params"] = params
        text = json.dumps(msg)
        print("client ->", text)
        reply = self.server.handle(text)
        if reply is None:
            return None
        print("server ->", reply)
        reply = json.loads(reply)
        return reply.get("result", reply.get("error"))


def connect(server):
    """Open a session: initialize, then tell the server we are ready."""
    client = Client(server)
    client.send("initialize", {"protocolVersion": "2025-06-18", "capabilities": {},
                               "clientInfo": {"name": "toy-client"}})
    client.send("notifications/initialized")
    return client`,
  session: `client = connect(mcp)
client.send("tools/list")
result = client.send("tools/call", {"name": "add", "arguments": {"a": 3, "b": 5}})
print(result["content"][0]["text"])`,
  deleteCall: `client.send("tools/delete")`,
  gitServer: `git = Server("git")
LOG = ["3f2a9c1 Add error handling to main.py", "b71e04d Read the city with input()"]


@git.tool
def list_commit(n: int) -> str:
    """List the latest n commits"""
    return "\\n".join(LOG[:n])


def register(client):
    """Ask the server for its tools and wrap each one as an ordinary tool."""
    def wrap(name):
        def call(**arguments):
            result = client.send("tools/call", {"name": name, "arguments": arguments})
            return result["content"][0]["text"]
        return call
    return {t["name"]: wrap(t["name"]) for t in client.send("tools/list")["tools"]}


def read(path):
    """A built-in tool (a stand-in)."""
    return "import requests"


TOOLS = {"Read": read}                 # built-in tools
TOOLS.update(register(connect(git)))   # plus every tool the MCP server offers
print(list(TOOLS))`,
  agentRun: `def scripted_llm(replies):
    """A fake LLM that gives the replies in order, whatever it is sent."""
    replies = iter(replies)

    def call(messages, tools):
        return next(replies)

    return call


def agent(prompt, llm, tools):
    messages = [{"role": "user", "content": prompt}]
    while True:
        reply = llm(messages, list(tools))
        messages.append({"role": "assistant", "content": reply})
        print("LLM:", reply["thought"])
        if "tool" not in reply:
            return reply["answer"]
        result = tools[reply["tool"]](**reply["args"])
        messages.append({"role": "user", "content": [{"type": "tool_result", "content": result}]})


script = [
    {"thought": "Need read git history", "tool": "list_commit", "args": {"n": 1}},
    {"thought": "Analyse results", "answer": "The latest commit adds error handling to main.py."},
]
print(agent("Analyse latest commit", scripted_llm(script), TOOLS))`,
  primitives: `@mcp.tool
def multiply(a: float, b: float) -> float:
    """Multiplies two numbers together."""
    return a * b

@mcp.resource("data://config")
def get_config() -> dict:
    return {"theme": "dark", "version": "1.0"}

@mcp.prompt
def analyze_data(data_points: list[float]) -> str:
    formatted_data = ", ".join(str(point) for point in data_points)
    return f"Please analyze these data points: {formatted_data}"`,
  fullServer: `class FullServer(Server):
    """The toy server plus resources and prompts."""

    def __init__(self, name):
        super().__init__(name)
        self.resources = {}
        self.prompts = {}

    def resource(self, uri):
        def register(fn):
            self.resources[uri] = fn
            return fn
        return register

    def prompt(self, fn):
        self.prompts[fn.__name__] = fn
        return fn

    def handle(self, text):
        msg = json.loads(text)
        method, params = msg.get("method"), msg.get("params", {})
        if method == "resources/read":
            data = self.resources[params["uri"]]()
            result = {"contents": [{"uri": params["uri"], "text": json.dumps(data)}]}
        elif method == "prompts/get":
            prompt = self.prompts[params["name"]](**params["arguments"])
            result = {"messages": [{"role": "user", "content": {"type": "text", "text": prompt}}]}
        else:
            return super().handle(text)
        return json.dumps({"jsonrpc": "2.0", "id": msg["id"], "result": result})


demo = FullServer("Demo")


@demo.tool
def multiply(a: float, b: float) -> float:
    """Multiplies two numbers together."""
    return a * b


@demo.resource("data://config")
def get_config() -> dict:
    return {"theme": "dark", "version": "1.0"}


@demo.prompt
def analyze_data(data_points: list[float]) -> str:
    formatted_data = ", ".join(str(point) for point in data_points)
    return f"Please analyze these data points: {formatted_data}"


c = Client(demo)
c.send("tools/call", {"name": "multiply", "arguments": {"a": 2.5, "b": 4}})
c.send("resources/read", {"uri": "data://config"})
c.send("prompts/get", {"name": "analyze_data", "arguments": {"data_points": [1.5, 2.0, 3.5]}})`,
  sandbox: `class Sandbox:
    """A toy sandbox for tools that work on a dict of files."""

    def __init__(self, files):
        self.files = dict(files)     # 1 isolation: the tool gets a copy
        self.log = []                # 2 trackable execution
        self.snapshots = []          # 3 recoverable to snapshot

    def snapshot(self):
        self.snapshots.append(dict(self.files))
        return len(self.snapshots) - 1

    def restore(self, k):
        self.files = dict(self.snapshots[k])
        self.log.append(f"restore snapshot {k}")

    def run(self, tool, *args):
        self.log.append(f"{tool.__name__}{args}")
        return tool(self.files, *args)


def clean_cache(files, suffix):
    """Remove cache files (from a 'random MCP server')."""
    for name in list(files):
        if name.endswith(suffix):
            del files[name]
    return f"removed files ending in {suffix!r}"


project = {"main.py": "import requests\\n", "cache.pyc": "...", "README.md": "# Weather\\n"}
box = Sandbox(project)
k = box.snapshot()
print(box.run(clean_cache, ".py"))       # meant ".pyc"
print("sandbox:      ", sorted(box.files))
print("real project: ", sorted(project))
box.restore(k)
print("after restore:", sorted(box.files))
print("log:", box.log)`,
  debugPrompt: `Debug this issue <issue description>:

1. Reproduce the failure locally
2. Collect stack traces
3. Identify the smallest failing component
4. Write a regression test
5. Implement the fix
6. Run the test check script

Rules:
- Never modify tests to hide failures
- Every bug fix requires a regression test`,
  skillTree: `my-skill/
├── SKILL.md          name + description, then the workflow
├── references/
├── scripts/
└── assets/`,
  skillMd: `---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes
---

# Systematic Debugging

## Phase 1
…
## Phase 2
…`,
  skillLoader: `import re

SKILLS = [
    """---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes
---
# Systematic Debugging

1. Reproduce the failure locally
2. Collect stack traces
3. Identify the smallest failing component
4. Write a regression test
5. Implement the fix
6. Run the test check script

Rules:
- Never modify tests to hide failures
- Every bug fix requires a regression test
""",
    """---
name: commit-message
description: Use when writing a commit message
---
# Commit Messages

1. Summarise the change in one short line
2. Leave a blank line, then explain why the change was made
""",
]


def parse(skill):
    """Split SKILL.md into its metadata (between the --- lines) and its instructions."""
    _, head, body = skill.split("---\\n", 2)
    meta = dict(line.split(": ", 1) for line in head.strip().splitlines())
    return meta, body


STOP = {"use", "when", "any", "before"}


def matches(prompt, description):
    """A crude stand-in for the model: description keywords found in the prompt."""
    words = re.findall(r"[a-z]+", prompt.lower())
    keys = [k for k in re.findall(r"[a-z]+", description.lower()) if len(k) > 2 and k not in STOP]
    return [k for k in keys if any(k in w for w in words)]


def size(text):
    return len(text.split())           # words, a rough stand-in for tokens


def context(prompt):
    """Build the context for one prompt and report what went into it."""
    skills = [parse(s) for s in SKILLS]
    catalog = "\\n".join(f"{m['name']}: {m['description']}" for m, _ in skills)
    total = size(catalog) + size(prompt)
    print(repr(prompt))
    print(f"  metadata of {len(skills)} skills: {size(catalog)} words")
    for meta, body in skills:
        hit = matches(prompt, meta["description"])
        if hit:
            print(f"  matched {meta['name']} on {hit}: load instructions, {size(body)} words")
            total += size(body)
    print(f"  context: {total} words")
    return total


for p in ["Debug this issue", "Write a commit message", "Explain what this project does"]:
    context(p)`,
  memoryCmp: `bodies = sum(size(parse(s)[1]) for s in SKILLS)
for p in ["Debug this issue", "Write a commit message", "Explain what this project does"]:
    print(f"{p!r:34} memory: {bodies + size(p):3} words")`,
  testCall: `context("My test fails on CI")`,
  commitTree: `commit-message/
└── SKILL.md`,
  commitSkill: `---
name: commit-message
description: Use when writing a commit message
---
# Commit Messages

1. Summarise the change in one short line
2. Leave a blank line, then explain why the change was made`,
  ex1: `@mcp.tool
def multiply(a: float, b: float) -> float:
    """Multiplies two numbers together."""
    return a * b


names = [t["name"] for t in client.send("tools/list")["tools"]]
print(names)
print(client.send("tools/call", {"name": "multiply", "arguments": {"a": 3, "b": 5}}))`,
  ex2: `class SafeServer(Server):
    def handle(self, text):
        msg = json.loads(text)
        params = msg.get("params", {})
        if msg.get("method") == "tools/call" and params["name"] not in self.tools:
            error = {"code": -32602, "message": f"Unknown tool: {params['name']}"}
            return json.dumps({"jsonrpc": "2.0", "id": msg["id"], "error": error})
        return super().handle(text)


safe = SafeServer("Demo")
safe.tool(add)
print(Client(safe).send("tools/call", {"name": "subtract", "arguments": {"a": 3, "b": 5}}))`,
  ex3a: `---
name: log-fields
description: Use when adding or changing log statements, to type each log field consistently
---`,
  ex3b: `---
name: slow-sql
description: Use when a database query is slow or a page times out on a SQL query
---`,
};

const OUT = {
  session: `client -> {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2025-06-18", "capabilities": {}, "clientInfo": {"name": "toy-client"}}}
server -> {"jsonrpc": "2.0", "id": 1, "result": {"protocolVersion": "2025-06-18", "capabilities": {"tools": {}}, "serverInfo": {"name": "Demo"}}}
client -> {"jsonrpc": "2.0", "method": "notifications/initialized"}
client -> {"jsonrpc": "2.0", "id": 2, "method": "tools/list"}
server -> {"jsonrpc": "2.0", "id": 2, "result": {"tools": [{"name": "add", "description": "Add two numbers", "inputSchema": {"type": "object", "properties": {"a": {"type": "integer"}, "b": {"type": "integer"}}, "required": ["a", "b"]}}]}}
client -> {"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "add", "arguments": {"a": 3, "b": 5}}}
server -> {"jsonrpc": "2.0", "id": 3, "result": {"content": [{"type": "text", "text": "8"}]}}
8`,
  deleteCall: `client -> {"jsonrpc": "2.0", "id": 4, "method": "tools/delete"}
server -> {"jsonrpc": "2.0", "id": 4, "error": {"code": -32601, "message": "Method not found: tools/delete"}}`,
  register: `client -> {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2025-06-18", "capabilities": {}, "clientInfo": {"name": "toy-client"}}}
server -> {"jsonrpc": "2.0", "id": 1, "result": {"protocolVersion": "2025-06-18", "capabilities": {"tools": {}}, "serverInfo": {"name": "git"}}}
client -> {"jsonrpc": "2.0", "method": "notifications/initialized"}
client -> {"jsonrpc": "2.0", "id": 2, "method": "tools/list"}
server -> {"jsonrpc": "2.0", "id": 2, "result": {"tools": [{"name": "list_commit", "description": "List the latest n commits", "inputSchema": {"type": "object", "properties": {"n": {"type": "integer"}}, "required": ["n"]}}]}}
['Read', 'list_commit']`,
  agentRun: `LLM: Need read git history
client -> {"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "list_commit", "arguments": {"n": 1}}}
server -> {"jsonrpc": "2.0", "id": 3, "result": {"content": [{"type": "text", "text": "3f2a9c1 Add error handling to main.py"}]}}
LLM: Analyse results
The latest commit adds error handling to main.py.`,
  primitives: `client -> {"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "multiply", "arguments": {"a": 2.5, "b": 4}}}
server -> {"jsonrpc": "2.0", "id": 1, "result": {"content": [{"type": "text", "text": "10.0"}]}}
client -> {"jsonrpc": "2.0", "id": 2, "method": "resources/read", "params": {"uri": "data://config"}}
server -> {"jsonrpc": "2.0", "id": 2, "result": {"contents": [{"uri": "data://config", "text": "{\\"theme\\": \\"dark\\", \\"version\\": \\"1.0\\"}"}]}}
client -> {"jsonrpc": "2.0", "id": 3, "method": "prompts/get", "params": {"name": "analyze_data", "arguments": {"data_points": [1.5, 2.0, 3.5]}}}
server -> {"jsonrpc": "2.0", "id": 3, "result": {"messages": [{"role": "user", "content": {"type": "text", "text": "Please analyze these data points: 1.5, 2.0, 3.5"}}]}}`,
  sandbox: `removed files ending in '.py'
sandbox:       ['README.md', 'cache.pyc']
real project:  ['README.md', 'cache.pyc', 'main.py']
after restore: ['README.md', 'cache.pyc', 'main.py']
log: ["clean_cache('.py',)", 'restore snapshot 0']`,
  skillLoader: `'Debug this issue'
  metadata of 2 skills: 21 words
  matched systematic-debugging on ['bug']: load instructions, 49 words
  context: 73 words
'Write a commit message'
  metadata of 2 skills: 21 words
  matched commit-message on ['commit', 'message']: load instructions, 23 words
  context: 48 words
'Explain what this project does'
  metadata of 2 skills: 21 words
  context: 26 words`,
  memoryCmp: `'Debug this issue'                 memory:  75 words
'Write a commit message'           memory:  76 words
'Explain what this project does'   memory:  77 words`,
  testCall: `'My test fails on CI'
  metadata of 2 skills: 21 words
  matched systematic-debugging on ['test']: load instructions, 49 words
  context: 75 words`,
  ex1: `client -> {"jsonrpc": "2.0", "id": 5, "method": "tools/list"}
server -> {"jsonrpc": "2.0", "id": 5, "result": {"tools": [{"name": "add", "description": "Add two numbers", "inputSchema": {"type": "object", "properties": {"a": {"type": "integer"}, "b": {"type": "integer"}}, "required": ["a", "b"]}}, {"name": "multiply", "description": "Multiplies two numbers together.", "inputSchema": {"type": "object", "properties": {"a": {"type": "number"}, "b": {"type": "number"}}, "required": ["a", "b"]}}]}}
['add', 'multiply']
client -> {"jsonrpc": "2.0", "id": 6, "method": "tools/call", "params": {"name": "multiply", "arguments": {"a": 3, "b": 5}}}
server -> {"jsonrpc": "2.0", "id": 6, "result": {"content": [{"type": "text", "text": "15"}]}}
{'content': [{'type': 'text', 'text': '15'}]}`,
  ex2: `client -> {"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "subtract", "arguments": {"a": 3, "b": 5}}}
server -> {"jsonrpc": "2.0", "id": 1, "error": {"code": -32602, "message": "Unknown tool: subtract"}}
{'code': -32602, 'message': 'Unknown tool: subtract'}`,
};

// ---------- shared helpers ----------

// A step player: Reset / Back / Step / Play, ← → keys. render(i) draws step i.
function stepper(el, n, render, { mini = false, ms = 1200, prefix = "sp" } = {}) {
  let i = 0, timer = null;
  const bar = mini ? "" : `<div class="controls"><button class="cbtn ${prefix}-reset">⟲ Reset</button><button class="cbtn ${prefix}-back">◀ Back</button>
    <button class="cbtn ${prefix}-step on">Step ▶</button><button class="cbtn ${prefix}-play">Play</button>
    <span class="spacer"></span><span class="counter ${prefix}-count"></span></div>`;
  el.insertAdjacentHTML("beforeend", bar);
  const $ = (q) => el.querySelector(q);
  function draw() {
    render(i);
    if (mini) return;
    $(`.${prefix}-count`).textContent = `step ${i + 1} / ${n}`;
    $(`.${prefix}-back`).disabled = $(`.${prefix}-reset`).disabled = i === 0;
    $(`.${prefix}-step`).disabled = i === n - 1;
  }
  function stop() { clearInterval(timer); timer = null; if (!mini) $(`.${prefix}-play`).textContent = "Play"; }
  function play() {
    if (timer) return stop();
    if (i === n - 1) i = 0;
    if (!mini) $(`.${prefix}-play`).textContent = "Pause";
    timer = setInterval(() => {
      if (!el.isConnected) return stop();
      if (i < n - 1) i++; else if (mini) i = 0; else return stop();
      draw();
    }, ms);
  }
  if (!mini) {
    $(`.${prefix}-reset`).onclick = () => { stop(); i = 0; draw(); };
    $(`.${prefix}-back`).onclick = () => { stop(); if (i) i--; draw(); };
    $(`.${prefix}-step`).onclick = () => { stop(); if (i < n - 1) i++; draw(); };
    $(`.${prefix}-play`).onclick = play;
    el.tabIndex = 0;
    el.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); $(`.${prefix}-step`).click(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); $(`.${prefix}-back`).click(); }
    });
  }
  draw();
  if (mini) play();
  return { go: (k) => { stop(); i = k; draw(); } };
}

// Python-style JSON (json.dumps): ", " and ": " separators; floats keep their ".0".
class PyFloat { constructor(v) { this.v = v; } }
function pyNum(v) {
  if (v instanceof PyFloat) { const s = String(v.v); return /[.eE]|Infinity|NaN/.test(s) ? s : s + ".0"; }
  return String(v);
}
function dumps(v, indent = 0, depth = 0) {
  const nl = indent ? "\n" + " ".repeat(indent * (depth + 1)) : "";
  const end = indent ? "\n" + " ".repeat(indent * depth) : "";
  const sep = indent ? "," : ", ";
  if (v instanceof PyFloat || typeof v === "number") return pyNum(v);
  if (typeof v === "string") return JSON.stringify(v);
  if (Array.isArray(v)) return v.length ? "[" + nl + v.map((x) => dumps(x, indent, depth + 1)).join(sep + nl) + end + "]" : "[]";
  if (v && typeof v === "object") {
    const ks = Object.keys(v);
    return ks.length ? "{" + nl + ks.map((k) => JSON.stringify(k) + ": " + dumps(v[k], indent, depth + 1)).join(sep + nl) + end + "}" : "{}";
  }
  return String(v);
}
const pretty = (line) => JSON.stringify(JSON.parse(line), null, 2);
const lines = (s) => s.split("\n");

// ---------- the MCP workflow (slide 8), with where each part lives (slides 9–10) ----------

const LANES = [["User", "var(--green-soft)"], ["LLM", "var(--teal-soft)"], ["MCP Client", "var(--teal-soft)"], ["MCP Server", "var(--mark)"], ["Data", "var(--green-soft)"]];
const AGENT_RUN = lines(OUT.agentRun);
const FLOW = [
  [0, 1, "Analyse latest commit", "The user asks the agent to analyse the latest commit."],
  [1, 1, "Need read git history", "The LLM reasons: to answer, it needs the git history."],
  [1, 2, "Call tool: list_commit()", "The LLM asks for a tool, exactly as it would ask for Read. The tool happens to be an MCP tool."],
  [2, 3, "JSON-RPC Request", "The MCP client turns the call into a JSON-RPC request and sends it to the server.", AGENT_RUN[1]],
  [3, 4, "Fetch Git Logs", "The server does the real work: it fetches the git logs."],
  [4, 3, "Return Logs", "The logs come back to the server."],
  [3, 2, "JSON-RPC Response", "The server answers with a JSON-RPC response carrying the same id.", AGENT_RUN[2]],
  [2, 1, "Tool Output", "The client hands the tool output to the LLM as an ordinary tool result."],
  [1, 0, "Analyse results", "The LLM analyses the results for the user."],
];

function flowSVG(step, mini) {
  const X = [64, 192, 320, 448, 576], top = 14, y0 = 66, dy = mini ? 26 : 30, H = y0 + FLOW.length * dy + 34;
  let g = `<svg viewBox="0 0 640 ${H}" role="img" aria-label="MCP workflow">
    <defs><marker id="mfa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="var(--stone)"/></marker>
    <marker id="mfb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="var(--amber)"/></marker></defs>
    <rect x="128" y="${top - 6}" width="256" height="${H - top}" rx="10" fill="none" stroke="var(--teal)" stroke-dasharray="5 4"/>
    <rect x="390" y="${top - 6}" width="244" height="${H - top}" rx="10" fill="none" stroke="var(--amber)" stroke-dasharray="5 4"/>
    <text x="256" y="${H - 13}" text-anchor="middle" font-size="11" fill="var(--teal)">within agents</text>
    <text x="512" y="${H - 13}" text-anchor="middle" font-size="11" fill="var(--amber)">external servers</text>`;
  LANES.forEach(([name, fill], k) => {
    g += `<line x1="${X[k]}" y1="${top + 34}" x2="${X[k]}" y2="${H - 28}" stroke="var(--line)" stroke-dasharray="3 3"/>
      <rect x="${X[k] - 50}" y="${top}" width="100" height="32" rx="6" fill="${fill}" stroke="var(--line)"/>
      <text x="${X[k]}" y="${top + 21}" text-anchor="middle" font-size="12.5" fill="var(--ink)">${name}</text>`;
  });
  FLOW.forEach(([a, b, label], k) => {
    if (k > step) return;
    const y = y0 + k * dy, on = k === step, col = on ? "var(--amber)" : "var(--stone)";
    const dashed = [5, 6, 7, 8].includes(k) ? ` stroke-dasharray="4 3"` : "";
    if (a === b) {
      g += `<rect x="${X[a] - 70}" y="${y - 12}" width="140" height="20" rx="4" fill="var(--mark)" stroke="${col}" stroke-width="${on ? 2 : 1}"/>
        <text x="${X[a]}" y="${y + 2}" text-anchor="middle" font-size="11" fill="var(--ink)">${label}</text>`;
    } else {
      const dir = b > a ? 1 : -1;
      g += `<path d="M ${X[a] + dir * 4} ${y} L ${X[b] - dir * 6} ${y}" stroke="${col}" stroke-width="${on ? 2.2 : 1.3}" fill="none" marker-end="url(#${on ? "mfb" : "mfa"})"${dashed}/>
        <text x="${(X[a] + X[b]) / 2}" y="${y - 5}" text-anchor="middle" font-size="11" fill="var(--ink)" font-weight="${on ? 600 : 400}">${label}</text>`;
    }
  });
  return g + "</svg>";
}

function demoFlow(el, { mini = false } = {}) {
  el.innerHTML = `<div class="svgbox mf-svg"></div>${mini ? "" : `<div class="msg mf-msg"></div><div class="mf-json"></div>`}`;
  stepper(el, FLOW.length, (i) => {
    el.querySelector(".mf-svg").innerHTML = flowSVG(i, mini);
    if (mini) return;
    const [a, b, label, text, line] = FLOW[i];
    el.querySelector(".mf-msg").innerHTML = `<b>${i + 1}. ${LANES[a][0]}${a === b ? "" : " → " + LANES[b][0]}</b> · ${esc(label)} — ${text}`;
    el.querySelector(".mf-json").innerHTML = line
      ? `<div class="counter" style="margin-top:8px">the message, as our toy client prints it (pretty-printed)</div>${codeBlock(pretty(line.replace(/^\w+ -> /, "")), "repl")}`
      : "";
  }, { mini, ms: 1000, prefix: "mf" });
}

// ---------- architecture: MCP tools register as ordinary tools ----------

const TOOL_INFO = {
  Bash: ["Executes shell commands in your environment", true],
  Edit: ["Makes targeted edits to specific files", true],
  Glob: ["Finds files based on pattern matching", false],
  Grep: ["Searches for patterns in file contents", false],
  Read: ["Reads the contents of files", false],
  Write: ["Creates or overwrites files", true],
};
const MCP_SERVERS = {
  git: [["list_commit", "List the latest n commits"]],
  Demo: [["add", "Add two numbers"]],
};

function demoArch(el, { mini = false } = {}) {
  const on = new Set();
  el.innerHTML = `${mini ? "" : `<div class="controls" style="margin-top:0">${Object.keys(MCP_SERVERS).map((s) =>
    `<button class="cbtn" data-s="${s}">connect the ${s} server</button>`).join("")}</div>`}
    <div class="ar-table"></div>${mini ? "" : `<div class="msg ar-msg"></div>`}`;
  function render() {
    let rows = Object.entries(TOOL_INFO).map(([t, [d, p]]) => `<tr><td>${t}</td><td>${d}</td><td>built-in${p ? " 🔒" : ""}</td></tr>`).join("");
    for (const s of on) rows += MCP_SERVERS[s].map(([t, d]) => `<tr style="background:var(--mark)"><td><b>${t}</b></td><td>${d}</td><td>MCP · ${s} server</td></tr>`).join("");
    el.querySelector(".ar-table").innerHTML = `<table style="font-size:13.5px;margin:${mini ? 0 : 10}px 0 0"><tr><th>Tool</th><th>Description</th><th>Where it runs</th></tr>${rows}</table>`;
    if (mini) return;
    el.querySelectorAll("[data-s]").forEach((b) => {
      b.classList.toggle("on", on.has(b.dataset.s));
      b.textContent = `${on.has(b.dataset.s) ? "disconnect" : "connect"} the ${b.dataset.s} server`;
    });
    el.querySelector(".ar-msg").innerHTML = on.size
      ? `Connecting ran <code>initialize</code>, <code>notifications/initialized</code> and <code>tools/list</code>; each tool in the reply became one more row. To the model, every row looks the same: only the harness knows the highlighted ones run in another program.`
      : "Only the predefined tools. Connect a server: no change to the agent's code is needed.";
  }
  if (!mini) {
    el.querySelectorAll("[data-s]").forEach((b) => {
      b.onclick = () => { const s = b.dataset.s; on.has(s) ? on.delete(s) : on.add(s); render(); };
    });
  } else {
    let k = 0;
    setInterval(() => { if (!el.isConnected) return; k = (k + 1) % 3; on.clear(); if (k >= 1) on.add("git"); if (k >= 2) on.add("Demo"); render(); }, 1500);
  }
  render();
}

// ---------- the toy session, one message at a time ----------

const SESSION_TEXT = [
  ["initialize", "The client opens the session: the protocol version it speaks, its capabilities, its name. This request has id 1."],
  ["initialize", "The server answers with the same id 1: it agrees on the version and says it offers tools."],
  ["initialize", "A notification: no id, so no reply. The client says it is ready."],
  ["list tools", "Which tools do you have? (id 2)"],
  ["list tools", "One tool, add, with its description and an input schema built from the type hints a: int, b: int. The client registers it as a tool for the model."],
  ["call tool", "The model asked for add(3, 5). The client sends the slide 13 message: method tools/call, the tool's name and its arguments. (id 3)"],
  ["result", "The result, with the same id 3: content of type text, \"8\". The program prints it."],
  ["error", "An extra request: a method the server does not know. (id 4)"],
  ["error", "An error instead of a result, with JSON-RPC's code -32601: method not found."],
];
const SESSION = (() => {
  const s = [], out = [...lines(OUT.session), ...lines(OUT.deleteCall)];
  out.forEach((line, k) => {
    if (!/^(client|server) ->/.test(line)) { s[s.length - 1].print.push(line); return; }
    s.push({ from: line.startsWith("client") ? "client" : "server", line, upto: k + 1, print: [] });
  });
  s.forEach((x, k) => { x.phase = SESSION_TEXT[k][0]; x.text = SESSION_TEXT[k][1]; });
  return s;
})();
const SESSION_OUT = [...lines(OUT.session), ...lines(OUT.deleteCall)];

function demoSession(el, { mini = false } = {}) {
  el.innerHTML = `<div class="ss-lanes" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr) minmax(0,1fr);gap:8px;align-items:center;text-align:center">
      <div class="frame ss-c" style="font-weight:600">toy client</div>
      <div class="ss-arrow mono" style="font-size:12px;overflow-wrap:anywhere"></div>
      <div class="frame ss-s" style="font-weight:600">toy server</div></div>
    ${mini ? `<div class="ss-mini mono" style="margin-top:10px;font-size:12px;display:grid;gap:4px"></div>` : `
    <div class="tags ss-phases" style="margin-top:10px"></div>
    <div class="msg ss-msg"></div><div class="ss-json"></div>
    <div class="counter" style="margin-top:10px">what the toy program prints</div><div class="console ss-out" style="max-height:220px;overflow:auto"></div>`}`;
  const $ = (q) => el.querySelector(q);
  stepper(el, mini ? 7 : SESSION.length, (i) => {
    const s = SESSION[i], obj = JSON.parse(s.line.replace(/^\w+ -> /, ""));
    const what = obj.method || (obj.error ? `error ${obj.error.code}` : "result");
    const id = "id" in obj ? ` · id ${obj.id}` : " · no id";
    $(".ss-arrow").innerHTML = s.from === "client" ? `${esc(what)}${id}<br>──────▶` : `${esc(what)}${id}<br>◀──────`;
    $(".ss-c").className = "frame ss-c" + (s.from === "client" ? " top" : "");
    $(".ss-s").className = "frame ss-s" + (s.from === "server" ? (obj.error ? " err" : " ret") : "");
    if (mini) {
      $(".ss-mini").innerHTML = SESSION.slice(0, 7).map((x, k) => {
        const o = JSON.parse(x.line.replace(/^\w+ -> /, ""));
        const t = o.method || "result";
        return `<div style="opacity:${k <= i ? 1 : 0.25};text-align:${x.from === "client" ? "left" : "right"}">${x.from === "client" ? "→ " : ""}${esc(t)}${"id" in o ? " #" + o.id : ""}${x.from === "server" ? " ←" : ""}</div>`;
      }).join("");
      return;
    }
    $(".ss-phases").innerHTML = ["initialize", "list tools", "call tool", "result", "error"].map((p) =>
      `<span class="tag" style="${p === s.phase ? "background:var(--mark);font-weight:600" : ""}">${p}</span>`).join("");
    $(".ss-msg").innerHTML = s.text;
    $(".ss-msg").className = "msg ss-msg" + (s.phase === "result" ? " good" : s.phase === "error" && s.from === "server" ? " bad" : "");
    $(".ss-json").innerHTML = codeBlock(JSON.stringify(obj, null, 2), "repl");
    $(".ss-out").textContent = SESSION_OUT.slice(0, s.upto + s.print.length).join("\n");
  }, { mini, ms: mini ? 900 : 1500, prefix: "ss" });
}

// ---------- build a JSON-RPC message (a JS twin of the toy server) ----------

const num = (t) => { const v = Number(t); if (t.trim() === "" || !isFinite(v)) return null; return /[.eE]/.test(t) ? new PyFloat(v) : v; };
const val = (x) => (x instanceof PyFloat ? x.v : x);
const isF = (x) => x instanceof PyFloat;
const RPC = {
  add: { label: "tools/call · add", fields: [["a", "3"], ["b", "5"]],
    req: (f) => ({ method: "tools/call", params: { name: "add", arguments: { a: f.a, b: f.b } } }),
    run: (f) => { const r = val(f.a) + val(f.b); return { content: [{ type: "text", text: pyNum(isF(f.a) || isF(f.b) ? new PyFloat(r) : r) }] }; } },
  multiply: { label: "tools/call · multiply", fields: [["a", "2.5"], ["b", "4"]],
    req: (f) => ({ method: "tools/call", params: { name: "multiply", arguments: { a: f.a, b: f.b } } }),
    run: (f) => { const r = val(f.a) * val(f.b); return { content: [{ type: "text", text: pyNum(isF(f.a) || isF(f.b) ? new PyFloat(r) : r) }] }; } },
  weather: { label: "tools/call · get_weather", fields: [["city", "Zurich"]], text: true,
    req: (f) => ({ method: "tools/call", params: { name: "get_weather", arguments: { city: f.city } } }),
    run: null },
  config: { label: "resources/read · data://config", fields: [],
    req: () => ({ method: "resources/read", params: { uri: "data://config" } }),
    run: () => ({ contents: [{ uri: "data://config", text: '{"theme": "dark", "version": "1.0"}' }] }) },
  prompt: { label: "prompts/get · analyze_data", fields: [["data_points", "1.5, 2.0, 3.5"]], list: true,
    req: (f) => ({ method: "prompts/get", params: { name: "analyze_data", arguments: { data_points: f.data_points } } }),
    run: (f) => ({ messages: [{ role: "user", content: { type: "text", text: "Please analyze these data points: " + f.data_points.map(pyNum).join(", ") } }] }) },
};

function demoRpc(el) {
  let kind = "add";
  el.innerHTML = `<div class="controls" style="margin-top:0">${Object.entries(RPC).map(([k, r]) => `<button class="cbtn" data-k="${k}">${r.label}</button>`).join("")}</div>
    <div class="controls rp-fields"></div><div class="rp-body"></div><p class="hint rp-hint"></p>`;
  const $ = (q) => el.querySelector(q);
  function fields() {
    const r = RPC[kind];
    $(".rp-fields").innerHTML = r.fields.length ? r.fields.map(([n, v]) => `<label>${n} <input type="text" class="rp-f" data-n="${n}" value="${v}" style="width:${r.list ? 150 : 80}px"></label>`).join("")
      : `<span class="hint">no arguments: a resource is read by its URI</span>`;
    el.querySelectorAll("[data-k]").forEach((b) => b.classList.toggle("on", b.dataset.k === kind));
    el.querySelectorAll(".rp-f").forEach((i) => { i.oninput = render; });
    render();
  }
  function render() {
    const r = RPC[kind], f = {};
    let bad = null;
    el.querySelectorAll(".rp-f").forEach((i) => {
      const t = i.value;
      if (r.text) f[i.dataset.n] = t;
      else if (r.list) { const xs = t.split(",").map(num); if (xs.some((x) => x === null)) bad = i.dataset.n; f[i.dataset.n] = xs; }
      else { const x = num(t); if (x === null) bad = i.dataset.n; f[i.dataset.n] = x; }
    });
    if (bad) { $(".rp-body").innerHTML = `<div class="msg bad">${bad} must be a number${r.list ? " list, e.g. 1.5, 2.0, 3.5" : ""}.</div>`; return; }
    const req = Object.assign({ jsonrpc: "2.0", id: 1 }, r.req(f));
    let html = `<div class="counter" style="margin-top:8px">client → server</div>${codeBlock(dumps(req, 4), "repl")}`;
    if (r.run) {
      const res = { jsonrpc: "2.0", id: 1, result: r.run(f) };
      html += `<div class="counter">server → client</div>${codeBlock(dumps(res, 4), "repl")}
        <div class="counter">one line each, as the toy client prints them</div><div class="console">${esc("client -> " + dumps(req) + "\nserver -> " + dumps(res))}</div>`;
    }
    $(".rp-body").innerHTML = html;
    $(".rp-hint").innerHTML = r.run ? "The reply is computed the way the toy server in the notes computes it (Python's number formatting, so 2.5 × 4 prints 10.0)."
      : "Slide 14's message. The notes have no get_weather server, so there is no reply here: any server with that tool would receive exactly this.";
  }
  el.querySelectorAll("[data-k]").forEach((b) => { b.onclick = () => { kind = b.dataset.k; fields(); }; });
  fields();
}

// ---------- the toy sandbox ----------

const SB_OUT = lines(OUT.sandbox);
const SB_STEPS = [
  { real: ["README.md", "cache.pyc", "main.py"], box: ["README.md", "cache.pyc", "main.py"], snap: false, out: 0,
    msg: "<code>box = Sandbox(project)</code>: the tool will work on a <b>copy</b> (isolation)." },
  { real: ["README.md", "cache.pyc", "main.py"], box: ["README.md", "cache.pyc", "main.py"], snap: true, out: 0,
    msg: "<code>k = box.snapshot()</code>: save snapshot 0 before anything runs." },
  { real: ["README.md", "cache.pyc", "main.py"], box: ["README.md", "cache.pyc"], snap: true, out: 1, log: 1, gone: true,
    msg: "<code>box.run(clean_cache, \".py\")</code>: the tool meant <code>.pyc</code> but matched <code>.py</code>. <code>main.py</code> is gone — inside the sandbox. The run is logged (trackable).", bad: true },
  { real: ["README.md", "cache.pyc", "main.py"], box: ["README.md", "cache.pyc"], snap: true, out: 3, log: 1, gone: true,
    msg: "Compare: the sandbox lost <code>main.py</code>; the real project did not." },
  { real: ["README.md", "cache.pyc", "main.py"], box: ["README.md", "cache.pyc", "main.py"], snap: true, out: 5, log: 2,
    msg: "<code>box.restore(k)</code>: back to snapshot 0 (recoverable). The log shows both the tool run and the restore.", good: true },
];
const NO_SB = [
  { real: ["README.md", "cache.pyc", "main.py"], msg: "No sandbox: the tool gets the real project." },
  { real: ["README.md", "cache.pyc", "main.py"], msg: "No sandbox, no snapshot to save." },
  { real: ["README.md", "cache.pyc"], msg: "The same tool call deletes the <b>real</b> <code>main.py</code>.", bad: true },
  { real: ["README.md", "cache.pyc"], msg: "Nothing to compare against, and no log of what ran.", bad: true },
  { real: ["README.md", "cache.pyc"], msg: "Nothing to restore: the file is lost. (This path is our illustration; the notes' program uses the sandbox.)", bad: true },
];

function demoSandbox(el) {
  let use = true;
  el.innerHTML = `<div class="controls" style="margin-top:0"><label><input type="checkbox" class="sb-use" checked> run the tool in the sandbox</label></div>
    <div class="sb-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px"></div>
    <div class="msg sb-msg"></div>
    <div class="counter" style="margin-top:10px">what the toy program prints</div><div class="console sb-out"></div>`;
  const $ = (q) => el.querySelector(q);
  const files = (title, fs, all, note) => `<div><div class="counter">${title}</div><div style="display:grid;gap:4px;margin-top:4px">${all.map((f) =>
    `<div class="frame ${fs.includes(f) ? "" : "err"}" style="font-size:12.5px;${fs.includes(f) ? "" : "opacity:.6;text-decoration:line-through"}">${f}</div>`).join("")}</div>${note ? `<div class="hint">${note}</div>` : ""}</div>`;
  const ALL = ["README.md", "cache.pyc", "main.py"];
  let ctl;
  function render(i) {
    if (use) {
      const s = SB_STEPS[i];
      $(".sb-grid").innerHTML = files("real project", s.real, ALL) + files("sandbox (a copy)", s.box, ALL, s.snap ? "snapshot 0 saved" : "");
      $(".sb-msg").innerHTML = s.msg;
      $(".sb-msg").className = "msg sb-msg" + (s.bad ? " bad" : s.good ? " good" : "");
      $(".sb-out").textContent = SB_OUT.slice(0, s.out).join("\n");
    } else {
      const s = NO_SB[i];
      $(".sb-grid").innerHTML = files("real project", s.real, ALL) + `<div><div class="counter">sandbox</div><p class="hint">none</p></div>`;
      $(".sb-msg").innerHTML = s.msg;
      $(".sb-msg").className = "msg sb-msg" + (s.bad ? " bad" : "");
      $(".sb-out").textContent = i >= 2 ? SB_OUT[0] : "";
    }
  }
  ctl = stepper(el, SB_STEPS.length, render, { prefix: "sb" });
  $(".sb-use").onchange = (e) => { use = e.target.checked; ctl.go(0); };
}

// ---------- sandbox layers (slides 21–22) ----------

const LAYERS = [
  ["Bash commands", "Running bash commands in the sandbox via <code>/sandbox</code>."],
  ["MCP server", `Running the MCP server in a sandbox: wrap its launch command.${"<pre class=\"code nonum\" style=\"font-size:11.5px\">" + esc(`"risky-server": {
  "command": "npx",
  "args": ["@anthropic-ai/sandbox-runtime", "npx", "-y", "risky-mcp-server"]
}`) + "</pre>"}`],
  ["Coding agent", "Running the entire coding agent in a sandbox: <code>npx @anthropic-ai/sandbox-runtime claude</code>."],
  ["OS", "Running the OS in a sandbox, e.g. a virtual machine."],
];
const CASES = [
  ["Everyday coding on my own laptop", [0], "Bash sandbox via /sandbox"],
  ["Coding on shared servers", [2, 3], "container/VM or sandbox runtime"],
  ["Trying out a random MCP server from the internet", [1, 3], "wrap it with the sandbox runtime, or run in a VM"],
];

function demoLayers(el) {
  let hl = [], text = "Click a layer, or pick a case.";
  el.innerHTML = `<div class="controls" style="margin-top:0">${CASES.map((c, k) => `<button class="cbtn" data-c="${k}">${c[0]}</button>`).join("")}</div>
    <div class="svgbox ly-svg" style="margin-top:8px"></div><div class="msg ly-msg"></div>`;
  function box(k, x, y, w, h) {
    const on = hl.includes(k);
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${on ? "var(--mark)" : k === 3 ? "var(--card-2)" : "var(--card)"}" stroke="${on ? "var(--amber)" : "var(--line)"}" stroke-width="${on ? 2.5 : 1.3}" data-l="${k}" style="cursor:pointer"/>
      <text x="${x + 12}" y="${y + 20}" font-size="12.5" font-weight="600" fill="var(--ink)" pointer-events="none">${k + 1}. ${LAYERS[k][0]}</text>`;
  }
  function render() {
    el.querySelector(".ly-svg").innerHTML = `<svg viewBox="0 0 640 230" role="img" aria-label="Sandbox layers">
      ${box(3, 10, 10, 620, 210)}${box(2, 40, 44, 560, 164)}${box(0, 70, 80, 230, 110)}${box(1, 340, 80, 230, 110)}
      <text x="185" y="150" text-anchor="middle" font-size="11" fill="var(--stone)" pointer-events="none">ls, python main.py, …</text>
      <text x="455" y="150" text-anchor="middle" font-size="11" fill="var(--stone)" pointer-events="none">risky-mcp-server</text></svg>`;
    el.querySelectorAll("[data-l]").forEach((r) => {
      r.onclick = () => { const k = +r.dataset.l; hl = [k]; text = `<b>${k + 1}. ${LAYERS[k][0]}</b> — ${LAYERS[k][1]}`; mark(-1); render(); };
    });
    el.querySelector(".ly-msg").innerHTML = text;
  }
  function mark(c) { el.querySelectorAll("[data-c]").forEach((b) => b.classList.toggle("on", +b.dataset.c === c)); }
  el.querySelectorAll("[data-c]").forEach((b) => {
    b.onclick = () => { const c = CASES[+b.dataset.c]; hl = c[1]; text = `<b>${c[0]}</b> → ${c[2]} <span class="counter">(slide 22)</span>`; mark(+b.dataset.c); render(); };
  });
  render();
}

// ---------- SKILL.md and triggering (slides 32–35) ----------

const SKILL_BODY = lines(CODE.skillLoader.split('"""---\nname: systematic-debugging')[1].split('""",')[0]).slice(3, -1);
const TRIGGER = [
  { ctx: [1], hl: 1, msg: "The agent starts. From every skill folder, only <b>name + description</b> enter the context (level 1, ~100 tokens)." },
  { ctx: [1], hl: 1, prompt: true, msg: "The user types <b>Debug this issue</b>. The agent compares the prompt with each skill's metadata." },
  { ctx: [1, 2], hl: 2, prompt: true, match: true, msg: "It matches <code>systematic-debugging</code>: <b>load the full instructions</b> from SKILL.md (level 2, under 5k) and follow them." },
  { ctx: [1, 2], hl: 2, prompt: true, match: true, done: 5, msg: "Steps 1–5 need only the instructions. Nothing else is loaded." },
  { ctx: [1, 2, 3], hl: 3, prompt: true, match: true, done: 6, msg: "Step 6, <i>Run the test check script</i>: now the skill's <code>scripts/</code> are used (level 3, as needed). Scripts run only when necessary." },
  { ctx: [1, 2, 3], hl: 0, prompt: true, match: true, done: 6, msg: "Done. <b>Lazy load for saving context window</b>: each level entered the context only when it was needed.", good: true },
];

function demoSkillFile(el, { mini = false } = {}) {
  el.innerHTML = `<div style="display:grid;grid-template-columns:${mini ? "1fr" : "minmax(0,1fr) minmax(0,1.2fr)"};gap:12px">
    <div><div class="counter">my-skill/ (systematic-debugging)</div><div class="sf-tree" style="display:grid;gap:5px;margin-top:6px"></div></div>
    ${mini ? "" : `<div><div class="counter">SKILL.md · instructions</div><div class="sf-body frame" style="font-size:12.5px;margin-top:6px;white-space:pre-wrap"></div></div>`}</div>
    <div class="counter" style="margin-top:10px">CONTEXT WINDOW</div><div class="sf-ctx" style="display:flex;gap:3px;margin-top:4px;min-height:30px"></div>
    ${mini ? "" : `<div class="msg sf-msg"></div><p class="hint">Level sizes are the slide's (~100 tokens, &lt;5k, ∞); the bar widths are only illustrative.</p>`}`;
  const $ = (q) => el.querySelector(q);
  const LV = { 1: ["name + description", "~100 tokens", "var(--teal-soft)"], 2: ["workflow", "<5k", "var(--green-soft)"], 3: ["references/ scripts/ assets/", "as needed", "var(--mark)"] };
  stepper(el, TRIGGER.length, (i) => {
    const s = TRIGGER[i];
    const row = (lv, label) => `<div class="frame ${s.hl === lv ? "top" : ""}" style="font-size:12.5px;background:${s.ctx.includes(lv) ? LV[lv][2] : "var(--card)"}">${label} <span class="counter">· level ${lv} · ${LV[lv][1]}</span></div>`;
    $(".sf-tree").innerHTML = `${row(1, "SKILL.md: name + description")}${row(2, "SKILL.md: workflow")}${row(3, "references/ · scripts/ · assets/")}`;
    $(".sf-ctx").innerHTML = [1, 2, 3].filter((l) => s.ctx.includes(l)).map((l) =>
      `<div style="flex:${l === 1 ? 1 : l === 2 ? 4 : 3};background:${LV[l][2]};border:1px solid var(--line);border-radius:5px;padding:4px 6px;font-size:11.5px;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${LV[l][0]}</div>`).join("")
      + (s.prompt ? `<div style="flex:1;background:var(--card-2);border:1px solid var(--line);border-radius:5px;padding:4px 6px;font-size:11.5px;white-space:nowrap">Debug this issue</div>` : "");
    if (mini) return;
    $(".sf-body").innerHTML = s.match
      ? SKILL_BODY.map((l) => { const n = parseInt(l, 10); const tick = n && s.done && n <= s.done; return `<div style="${tick ? "color:var(--green)" : ""}">${tick ? "✓ " : ""}${esc(l) || " "}</div>`; }).join("")
      : `<span class="hint">not loaded: only the metadata is in the context</span>`;
    $(".sf-msg").innerHTML = s.msg;
    $(".sf-msg").className = "msg sf-msg" + (s.good ? " good" : "");
  }, { mini, ms: mini ? 1400 : 1600, prefix: "sf" });
}

// ---------- lazy loading vs memory: a JS twin of the notes' toy skill loader ----------

const SKILL_SRC = CODE.skillLoader.split("SKILLS = [")[1].split("\n]\n")[0].split('""",').map((s) => s.slice(s.indexOf('"""') + 3).replace(/"""\s*$/, "")).filter((s) => s.trim());
const pyWords = (t) => t.split(/\s+/).filter(Boolean).length;
function pyParse(skill) {
  const [, head, ...rest] = skill.split("---\n");
  const body = rest.join("---\n");
  const meta = {};
  head.trim().split("\n").forEach((l) => { const k = l.indexOf(": "); meta[l.slice(0, k)] = l.slice(k + 2); });
  return [meta, body];
}
const STOP = new Set(["use", "when", "any", "before"]);
function pyMatches(prompt, description) {
  const words = prompt.toLowerCase().match(/[a-z]+/g) || [];
  const keys = (description.toLowerCase().match(/[a-z]+/g) || []).filter((k) => k.length > 2 && !STOP.has(k));
  return keys.filter((k) => words.some((w) => w.includes(k)));
}
const pyRepr = (s) => (s.includes("'") && !s.includes('"') ? `"${s.replace(/\\/g, "\\\\")}"` : `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`);
const pyList = (xs) => "[" + xs.map(pyRepr).join(", ") + "]";

function contextTwin(prompt) {
  const skills = SKILL_SRC.map(pyParse);
  const catalog = skills.map(([m]) => `${m.name}: ${m.description}`).join("\n");
  const parts = [["metadata of all skills", pyWords(catalog), "var(--teal-soft)"]];
  const out = [pyRepr(prompt), `  metadata of ${skills.length} skills: ${pyWords(catalog)} words`];
  let total = pyWords(catalog) + pyWords(prompt);
  for (const [meta, body] of skills) {
    const hit = pyMatches(prompt, meta.description);
    if (hit.length) {
      out.push(`  matched ${meta.name} on ${pyList(hit)}: load instructions, ${pyWords(body)} words`);
      parts.push([`${meta.name} instructions`, pyWords(body), "var(--green-soft)"]);
      total += pyWords(body);
    }
  }
  out.push(`  context: ${total} words`);
  parts.push(["prompt", pyWords(prompt), "var(--card-2)"]);
  return { out, parts, total };
}
function memoryTwin(prompt) {
  const skills = SKILL_SRC.map(pyParse);
  const bodies = skills.reduce((s, [, b]) => s + pyWords(b), 0);
  return {
    out: [`${pyRepr(prompt).padEnd(34)} memory: ${String(bodies + pyWords(prompt)).padStart(3)} words`],
    parts: [...skills.map(([m, b]) => [`${m.name} (in memory)`, pyWords(b), "var(--red-soft)"]), ["prompt", pyWords(prompt), "var(--card-2)"]],
    total: bodies + pyWords(prompt),
  };
}
const LAZY_PROMPTS = ["Debug this issue", "Write a commit message", "Explain what this project does", "My test fails on CI"];

function demoLazy(el, { mini = false } = {}) {
  el.innerHTML = `${mini ? "" : `<div class="controls" style="margin-top:0">
      <input type="text" class="lz-in" value="Debug this issue" style="flex:1;min-width:200px">
      <label><input type="radio" name="lzmode" class="lz-mode" value="skill" checked> as skills</label>
      <label><input type="radio" name="lzmode" class="lz-mode" value="memory"> in MEMORY.md</label></div>
    <div class="controls">${LAZY_PROMPTS.map((p) => `<button class="cbtn" data-p="${p}">${p}</button>`).join("")}</div>`}
    <div class="lz-bars" style="display:grid;grid-template-columns:minmax(0,1fr);gap:6px;margin-top:10px"></div>
    ${mini ? "" : `<div class="counter" style="margin-top:10px">what the toy program prints</div><div class="console lz-out"></div>
    <p class="hint">A JS twin of the notes' <code>context()</code> and memory comparison: the same keyword match and word count (words stand in for tokens; a real agent lets the model decide). Try your own prompt.</p>`}`;
  const $ = (q) => el.querySelector(q);
  function bars(r, label) {
    const max = Math.max(90, r.total + 4);
    return `<div style="min-width:0"><div class="counter" style="overflow-wrap:anywhere">${label} · ${r.total} words</div><div style="display:flex;gap:2px;margin-top:3px;overflow:hidden">${r.parts.map(([n, w, c]) =>
      `<div title="${n}: ${w} words" style="flex:0 0 ${(100 * w) / max}%;min-width:0;background:${c};border:1px solid var(--line);border-radius:4px;font-size:11px;padding:3px 4px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${n} ${w}</div>`).join("")}</div></div>`;
  }
  function render(prompt) {
    if (mini) { $(".lz-bars").innerHTML = bars(contextTwin(prompt), `skills · ${esc(prompt)}`) + bars(memoryTwin(prompt), "memory"); return; }
    const mode = el.querySelector(".lz-mode:checked").value;
    const r = mode === "skill" ? contextTwin(prompt) : memoryTwin(prompt);
    const other = mode === "skill" ? memoryTwin(prompt) : contextTwin(prompt);
    $(".lz-bars").innerHTML = bars(r, mode === "skill" ? "skills: lazy loading" : "memory: every workflow, every call") + bars(other, mode === "skill" ? "for comparison: memory" : "for comparison: skills");
    $(".lz-out").textContent = r.out.join("\n");
    el.querySelectorAll("[data-p]").forEach((b) => b.classList.toggle("on", b.dataset.p === prompt));
  }
  if (mini) {
    let k = 0;
    render(LAZY_PROMPTS[0]);
    setInterval(() => { if (!el.isConnected) return; k = (k + 1) % 3; render(LAZY_PROMPTS[k]); }, 1800);
    return;
  }
  const go = () => render($(".lz-in").value);
  $(".lz-in").oninput = go;
  el.querySelectorAll(".lz-mode").forEach((r) => { r.onchange = go; });
  el.querySelectorAll("[data-p]").forEach((b) => { b.onclick = () => { $(".lz-in").value = b.dataset.p; go(); }; });
  go();
}

// ---------- SkillOpt's training loop (slide 39) ----------

const OPT = [
  ["PARAMETER", "skill.md", "The skill file is the parameter being trained (the slide marks a fast field and a slow field)."],
  ["FORWARD", "Rollout batch", "Run the agent with the skill on a batch of tasks; collect scored trajectories."],
  ["BACKWARD", "Minibatch reflection", "Reflect on what worked and what didn't."],
  ["BOUNDED UPDATE", "Merge & rank, then clip", "Keep the top edits under the edit budget."],
  ["CANDIDATE", "Proposed skill", "Apply the bounded edits to skill.md."],
  ["VALIDATION GATE", "Held-out check", "Did the held-out score improve? Then the candidate becomes the new skill.md: epoch +1."],
];

function demoSkillOpt(el, { mini = false } = {}) {
  el.innerHTML = `<div class="svgbox so-svg"></div>${mini ? "" : `<div class="msg so-msg"></div>`}`;
  const P = [[320, 40], [520, 110], [520, 210], [320, 270], [120, 210], [120, 110]];
  stepper(el, OPT.length, (i) => {
    let g = `<svg viewBox="0 0 640 310" role="img" aria-label="SkillOpt training loop"><text x="320" y="165" text-anchor="middle" font-size="15" fill="var(--stone)">Training Loop</text>`;
    P.forEach(([x, y], k) => {
      const [x2, y2] = P[(k + 1) % P.length];
      g += `<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="${k === i ? "var(--amber)" : "var(--line)"}" stroke-width="${k === i ? 2.5 : 1.3}" stroke-dasharray="${k === i ? "" : "4 3"}"/>`;
    });
    P.forEach(([x, y], k) => {
      const on = k === i;
      g += `<rect x="${x - 95}" y="${y - 24}" width="190" height="48" rx="8" fill="${on ? "var(--mark)" : "var(--card)"}" stroke="${on ? "var(--amber)" : "var(--line)"}" stroke-width="${on ? 2.5 : 1.3}"/>
        <text x="${x}" y="${y - 6}" text-anchor="middle" font-size="10" fill="var(--stone)">${OPT[k][0]}</text>
        <text x="${x}" y="${y + 12}" text-anchor="middle" font-size="13" font-weight="600" fill="var(--ink)">${OPT[k][1]}</text>`;
    });
    el.querySelector(".so-svg").innerHTML = g + "</svg>";
    if (!mini) el.querySelector(".so-msg").innerHTML = `<b>${OPT[i][0]} · ${OPT[i][1]}</b> — ${OPT[i][2]}`;
  }, { mini, ms: 1100, prefix: "so" });
}

// ---------- the whole agent (slide 47) ----------

const MAP = {
  prompts: ["Prompts", 70, 150, "Your input, plus the system and project prompts. Next class: how to write a prompt.", false],
  context: ["Context Management", 190, 230, "Decides what the model sees on each call (Lecture 03).", false],
  agent: ["Agent (LLM)", 320, 150, "The loop from Lecture 02: reason, act, observe.", false],
  rag: ["RAG", 440, 40, "Retrieval brings relevant documents into the context (Lecture 03).", false],
  subagents: ["Subagents", 320, 270, "Smaller agents with their own context (Lecture 03).", false],
  skills: ["Skills", 170, 40, "Reusable workflows; only their metadata stays in the context. Today.", true],
  mcp: ["MCP", 470, 150, "One protocol to plug external tools into any agent. Today.", true],
  sandbox: ["Sandbox", 580, 230, "Tools run isolated, tracked and recoverable. Today.", true],
};
const MAP_EDGES = [["prompts", "agent"], ["context", "agent"], ["rag", "agent"], ["subagents", "agent"], ["skills", "agent"], ["mcp", "agent"], ["sandbox", "mcp"]];

function demoAgentMap(el, { mini = false } = {}) {
  let sel = mini ? null : "mcp";
  el.innerHTML = `<div class="svgbox am-svg"></div>${mini ? "" : `<div class="msg am-msg"></div>`}`;
  function render() {
    let g = `<svg viewBox="0 0 660 310" role="img" aria-label="The whole agent">`;
    MAP_EDGES.forEach(([a, b]) => { g += `<line x1="${MAP[a][1]}" y1="${MAP[a][2]}" x2="${MAP[b][1]}" y2="${MAP[b][2]}" stroke="var(--stone)" stroke-width="1.3"/>`; });
    Object.entries(MAP).forEach(([k, [name, x, y, , today]]) => {
      const on = k === sel, w = Math.max(90, name.length * 8.4);
      g += `<rect x="${x - w / 2}" y="${y - 18}" width="${w}" height="36" rx="8" fill="${on ? "var(--mark)" : today ? "var(--teal-soft)" : "var(--card)"}" stroke="${on ? "var(--amber)" : today ? "var(--teal)" : "var(--line)"}" stroke-width="${on ? 2.5 : 1.3}" data-m="${k}" style="cursor:pointer"/>
        <text x="${x}" y="${y + 5}" text-anchor="middle" font-size="12.5" font-weight="${today ? 600 : 400}" fill="var(--ink)" pointer-events="none">${name}</text>`;
    });
    el.querySelector(".am-svg").innerHTML = g + `<text x="10" y="302" font-size="11" fill="var(--teal)">tinted = new today</text></svg>`;
    if (mini) return;
    el.querySelector(".am-msg").innerHTML = `<b>${MAP[sel][0]}</b> — ${MAP[sel][3]}`;
    el.querySelectorAll("[data-m]").forEach((r) => { r.onclick = () => { sel = r.dataset.m; render(); }; });
  }
  render();
  if (mini) {
    const ks = ["skills", "mcp", "sandbox"];
    let k = 0;
    setInterval(() => { if (!el.isConnected) return; sel = ks[k++ % 3]; render(); }, 1200);
  }
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
  flow: (el) => demoFlow(el),
  flowMini: (el) => demoFlow(el, { mini: true }),
  arch: (el) => demoArch(el),
  archMini: (el) => demoArch(el, { mini: true }),
  session: (el) => demoSession(el),
  sessionMini: (el) => demoSession(el, { mini: true }),
  rpc: (el) => demoRpc(el),
  sandbox: (el) => demoSandbox(el),
  layers: (el) => demoLayers(el),
  skillFile: (el) => demoSkillFile(el),
  skillFileMini: (el) => demoSkillFile(el, { mini: true }),
  lazy: (el) => demoLazy(el),
  lazyMini: (el) => demoLazy(el, { mini: true }),
  skillOpt: (el) => demoSkillOpt(el),
  skillOptMini: (el) => demoSkillOpt(el, { mini: true }),
  agentMap: (el) => demoAgentMap(el),
  agentMapMini: (el) => demoAgentMap(el, { mini: true }),
  quiz: (el) => demoQuiz(el, QUIZ),
};
