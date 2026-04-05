# Atlassian MCP Server Complete Guide

## Overview

This document explains how to connect your application to Atlassian (Jira/Confluence) using an MCP-style architecture.

This approach simplifies API handling and works with **any tech stack** such as:

- React
- Node.js
- Python
- Java / Spring
- Forge
- Any frontend or backend

---

## What is Atlassian MCP?

Atlassian MCP (Model Context Protocol) is a bridge between your application and Atlassian tools.

Instead of app calling Jira API directly, MCP acts as a middle layer:

**WITHOUT MCP:**
App → Jira API directly (complex, insecure)

**WITH MCP:**
App → MCP Server → Jira API (simple, secure)

MCP provides ready-to-use tools such as:

- Search Jira issues
- Create Jira tickets
- Update Jira issue status
- Delete Jira tickets
- Get single Jira issue details
- Search Confluence pages
- Read Confluence page content
- Create Confluence pages
- Update Confluence pages
- Delete Confluence pages

---

## Architecture

```
User → Your App → MCP Server → Atlassian → Response
```

**MCP Architecture — Universal Guide**
Works with React · Python · Node.js · Java · Mobile · Any HTTP Client

```
Any Frontend              MCP Server (server.js) — Port 3333              Atlassian
                          Your Custom MCP Implementation

React                     MIDDLEWARE — runs on every request:
Python                    cors()   express.json()   dotenv.config()
Node.js
Java/Spring               TOOLS LAYER — tools/jira.js + tools/confluence.js:
Mobile App                search_jira_issues    create_jira_issue
Any HTTP Client           update_jira_issue     delete_jira_issue
                          get_jira_issue        search_confluence
                          get_confluence_page   create_confluence_page

                          ROUTES — URL path decides which handler runs:
                          POST /tools    POST /chat    GET /health
                          (Direct MCP)  (Groq AI chat)  (Server status)

                          Authentication:
                          Every API call includes email + API token
                          Atlassian verifies before returning data

                          OPTIONAL FEATURE:
                          Groq AI Brain (tools/llm.js)
                          Converts plain English → Tool calls automatically
```

> KEY RULE: MCP is an architecture pattern — not a package to install.
> Any tech stack can implement it. Build your own server.js equivalent and you have your own MCP server.

---

## Prerequisites

Before starting, make sure you have:

- Node.js installed
- Visual Studio Code
- Atlassian account
- Atlassian API Token
- Any application (frontend or backend)

---

## Installation and Setup Steps

### 1. Installing Node.js to your machine

a. Open the Node.js download page in your browser:
   **Link:** https://nodejs.org/en/download

b. Download and install Node.js using an administrator username and password.

c. After installation, verify that Node.js is installed correctly by running the following command in **Command Prompt (cmd)**:

```
node --version
```

**Expected Output:**
```
v24.13.1
```

---

### 2. Install Visual Studio Code

a. Download Visual Studio Code from:
   **Link:** https://code.visualstudio.com/download

---

### 3. Install project setup according to you

- Creating a React App
- Download Python
- Getting started with Forge

*To install the above stack, visit the respective links.*

*Install whichever frontend stack YOU want to use.*

---

### Create Project Structure

```
MCP/
├── mcp-server     (backend - MCP)
└── mcp-frontend   (React / Node / Python / etc.)
```

---

### 4. Create an Atlassian Account

**Link:** https://home.atlassian.com/

*After completing the above installation, follow the steps below.*

---

## Step 1: Create Atlassian API Token

1. Open: https://id.atlassian.com/manage/api-tokens
2. Click **Create API Token**
3. Enter name + expiry
4. Copy token

You will use:

```
ATLASSIAN_EMAIL=your-email
ATLASSIAN_API_TOKEN=your-token
ATLASSIAN_BASE_URL=https://your-domain.atlassian.net
```

---

## Step 2: Set up MCP Server (Backend)

### Create backend

```
mkdir mcp-server
cd mcp-server
npm init -y
```

### Install dependencies

```
npm install express axios dotenv cors openai
```

### Create `.env` (inside mcp-server)

```
ATLASSIAN_BASE_URL=https://your-domain.atlassian.net
ATLASSIAN_EMAIL=your-email
ATLASSIAN_API_TOKEN=your-token
PORT=3333
GROK_API_KEY=your-groq-api-key
```

> Make sure your `.env` file is inside the `mcp-server` folder.

---

### Project File Structure

```
mcp-server/
├── server.js
├── package.json
├── .env
├── .gitignore
├── routes/
│   ├── tools.js
│   └── chat.js
└── tools/
    ├── jira.js
    ├── confluence.js
    └── llm.js
```

---

### Create `server.js`

```javascript
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

// Load environment variables FIRST
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const toolsRouter = require("./routes/tools");
const chatRouter = require("./routes/chat");    // ← ADD THIS

app.use("/tools", toolsRouter);
app.use("/chat", chatRouter);                   // ← ADD THIS

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "✅ MCP Server is running",
    port: process.env.PORT,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(process.env.PORT, () => {
  console.log(`🚀 MCP Server running on port ${process.env.PORT}`);
  console.log(`📋 Tools endpoint: http://localhost:${process.env.PORT}/tools`);
  console.log(`💬 Chat endpoint:  http://localhost:${process.env.PORT}/chat`);
  console.log(`💚 Health check:   http://localhost:${process.env.PORT}/health`);
});
```

**Why is `server.js` needed?**

- Keeps Atlassian API credentials secure (email + API token)
- Acts as a middle layer between frontend and Jira/Confluence
- Converts tool requests into real Atlassian API calls
- Avoids browser issues like CORS errors
- Allows adding logic, validation, and LLM integration

---

### Create `routes/tools.js`

This file handles direct tool execution (without LLM) via `POST /tools`.

```javascript
const express = require("express");
const router = express.Router();

// Import all tools
const {
  searchJiraIssues,
  getJiraIssue,
  createJiraIssue,
  updateJiraIssue,
  deleteJiraIssue,
} = require("../tools/jira");

const {
  searchConfluencePages,
  getConfluencePage,
  createConfluencePage,
  updateConfluencePage,
  deleteConfluencePage,
} = require("../tools/confluence");

// Main tools route
router.post("/", async (req, res) => {
  const { tool, input } = req.body;

  try {
    // ===== JIRA TOOLS =====

    if (tool === "search_jira_issues") {
      const result = await searchJiraIssues(input);
      return res.json(result);
    }

    if (tool === "get_jira_issue") {
      const result = await getJiraIssue(input);
      return res.json(result);
    }

    if (tool === "create_jira_issue") {
      const result = await createJiraIssue(input);
      return res.json(result);
    }

    if (tool === "update_jira_issue") {
      const result = await updateJiraIssue(input);
      return res.json(result);
    }

    if (tool === "delete_jira_issue") {
      const result = await deleteJiraIssue(input);
      return res.json(result);
    }

    // ===== CONFLUENCE TOOLS =====

    if (tool === "search_confluence_pages") {
      const result = await searchConfluencePages(input);
      return res.json(result);
    }

    if (tool === "get_confluence_page") {
      const result = await getConfluencePage(input);
      return res.json(result);
    }

    if (tool === "create_confluence_page") {
      const result = await createConfluencePage(input);
      return res.json(result);
    }

    if (tool === "update_confluence_page") {
      const result = await updateConfluencePage(input);
      return res.json(result);
    }

    if (tool === "delete_confluence_page") {
      const result = await deleteConfluencePage(input);
      return res.json(result);
    }

    // Unknown tool
    return res.status(400).json({
      error: `Unknown tool: "${tool}"`,
      availableTools: [
        "search_jira_issues",
        "get_jira_issue",
        "create_jira_issue",
        "update_jira_issue",
        "delete_jira_issue",
        "search_confluence_pages",
        "get_confluence_page",
        "create_confluence_page",
        "update_confluence_page",
        "delete_confluence_page",
      ],
    });
  } catch (error) {
    return res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

module.exports = router;
```

---

### Create `routes/chat.js`

This file handles LLM-powered chat with automatic tool selection via `POST /chat`.

```javascript
const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const { processWithLLM } = require("../tools/llm");

// Import all Jira tools
const {
  searchJiraIssues,
  getJiraIssue,
  createJiraIssue,
  updateJiraIssue,
  deleteJiraIssue
} = require("../tools/jira");

// Import all Confluence tools
const {
  searchConfluencePages,
  getConfluencePage,
  createConfluencePage,
  updateConfluencePage,
  deleteConfluencePage
} = require("../tools/confluence");

// Initialize Groq client for summary calls
const groq = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

// Tool executor — runs the tool Groq selected
const executeTool = async (toolName, toolInput) => {
  console.log(`🔧 Executing tool: ${toolName}`);
  console.log(`📥 Input:`, toolInput);

  switch (toolName) {
    // Jira tools
    case "search_jira_issues":
      return await searchJiraIssues(toolInput);
    case "get_jira_issue":
      return await getJiraIssue(toolInput);
    case "create_jira_issue":
      return await createJiraIssue(toolInput);
    case "update_jira_issue":
      return await updateJiraIssue(toolInput);
    case "delete_jira_issue":
      return await deleteJiraIssue(toolInput);

    // Confluence tools
    case "search_confluence_pages":
      return await searchConfluencePages(toolInput);
    case "get_confluence_page":
      return await getConfluencePage(toolInput);
    case "create_confluence_page":
      return await createConfluencePage(toolInput);
    case "update_confluence_page":
      return await updateConfluencePage(toolInput);
    case "delete_confluence_page":
      return await deleteConfluencePage(toolInput);

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
};

// Clean tool results — removes unnecessary data
const cleanToolResult = (toolName, toolResult) => {
  // Clean Jira issues list
  if (toolResult.issues) {
    return {
      total: toolResult.issues.length,
      issues: toolResult.issues.map(issue => ({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status?.name,
        priority: issue.fields.priority?.name,
        assignee: issue.fields.assignee?.displayName || "Unassigned",
        created: issue.fields.created
      }))
    };
  }

  // Clean single Jira issue
  if (toolResult.fields) {
    return {
      key: toolResult.key,
      summary: toolResult.fields.summary,
      status: toolResult.fields.status?.name,
      priority: toolResult.fields.priority?.name,
      assignee: toolResult.fields.assignee?.displayName || "Unassigned",
      created: toolResult.fields.created
    };
  }

  // Clean Confluence pages
  if (toolResult.results) {
    return {
      total: toolResult.results.length,
      pages: toolResult.results.map(page => ({
        id: page.id,
        title: page.title,
        space: page.space?.name,
        url: page._links?.webui
      }))
    };
  }

  // For create/update/delete — return as is
  return toolResult;
};

// Main chat endpoint
router.post("/", async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    console.log(`\n💬 User: ${message}`);

    // Step 1 — Send message to Groq WITH tools
    const grokResponse = await processWithLLM(message, history);
    console.log(`🤖 Groq finish reason: ${grokResponse.finish_reason}`);

    // Step 2 — Check if Groq wants to use a tool
    if (grokResponse.finish_reason === "tool_calls") {
      const toolCall = grokResponse.message.tool_calls[0];
      const toolName = toolCall.function.name;
      const toolInput = JSON.parse(toolCall.function.arguments);

      console.log(`🔧 Groq selected tool: ${toolName}`);

      // Step 3 — Execute the tool
      const toolResult = await executeTool(toolName, toolInput);

      // Step 4 — Clean result for Groq summary
      const cleanResult = cleanToolResult(toolName, toolResult);
      console.log(`✅ Tool result cleaned`);

      // Step 5 — Ask Groq to summarize result
      // IMPORTANT: No tools in this call — just summarize!
      const summaryResponse = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are a helpful Atlassian assistant. 
Summarize the tool result in a clear, friendly, human-readable way.
Be concise and well formatted.
Use bullet points or numbered lists when showing multiple items.`
          },
          {
            role: "user",
            content: message
          },
          {
            role: "assistant",
            content: null,
            tool_calls: grokResponse.message.tool_calls
          },
          {
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(cleanResult)
          }
        ]
        // NO tools here — prevents failed_generation error!
      });

      const reply = summaryResponse.choices[0].message.content;
      console.log(`💬 Assistant: ${reply}`);

      return res.json({
        reply: reply,
        toolUsed: toolName,
        toolInput: toolInput,
        toolResult: cleanResult
      });
    }

    // Step 6 — No tool needed, return direct Groq response
    console.log(`💬 Assistant: ${grokResponse.message.content}`);
    return res.json({
      reply: grokResponse.message.content,
      toolUsed: null,
      toolResult: null
    });

  } catch (error) {
    console.error("❌ Chat error:", error.message);
    return res.status(500).json({
      error: error.message || "Something went wrong"
    });
  }
});

module.exports = router;
```

---

### Create `tools/jira.js`

All 5 Jira tools — search, get, create, update, delete.

```javascript
const axios = require("axios");

const BASE_URL = process.env.ATLASSIAN_BASE_URL;
const EMAIL = process.env.ATLASSIAN_EMAIL;
const TOKEN = process.env.ATLASSIAN_API_TOKEN;

// Auth helper
const getAuth = () => ({
  username: EMAIL,
  password: TOKEN,
});

// ✅ TOOL 1 — Search Jira Issues
const searchJiraIssues = async (input) => {
  const response = await axios.get(`${BASE_URL}/rest/api/3/search/jql`, {
    auth: getAuth(),
    params: {
      jql: input?.query || "project IS NOT EMPTY ORDER BY created DESC",
      fields: "summary,status,assignee,created,priority",
    },
  });
  return response.data;
};

// ✅ TOOL 2 — Get Single Jira Issue
const getJiraIssue = async (input) => {
  const response = await axios.get(
    `${BASE_URL}/rest/api/3/issue/${input.issueKey}`,
    {
      auth: getAuth(),
      params: {
        fields: "summary,status,assignee,created,priority,description",
      },
    },
  );
  return response.data;
};

// ✅ TOOL 3 — Create Jira Issue
const createJiraIssue = async (input) => {
  const response = await axios.post(
    `${BASE_URL}/rest/api/3/issue`,
    {
      fields: {
        project: {
          key: input.projectKey,
        },
        summary: input.summary,
        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: input.description || "",
                },
              ],
            },
          ],
        },
        issuetype: {
          name: input.issueType || "Task",
        },
        priority: {
          name: input.priority || "Medium",
        },
      },
    },
    { auth: getAuth() },
  );
  return response.data;
};

// ✅ TOOL 4 — Update Jira Issue Status
const updateJiraIssue = async (input) => {
  // Step 1 — Get available transitions
  const transitionsRes = await axios.get(
    `${BASE_URL}/rest/api/3/issue/${input.issueKey}/transitions`,
    { auth: getAuth() },
  );

  // Step 2 — Find matching transition
  const transition = transitionsRes.data.transitions.find(
    (t) => t.name.toLowerCase() === input.status.toLowerCase(),
  );

  if (!transition) {
    throw new Error(
      `Status "${input.status}" not found. Available: ${transitionsRes.data.transitions
        .map((t) => t.name)
        .join(", ")}`,
    );
  }

  // Step 3 — Apply transition
  await axios.post(
    `${BASE_URL}/rest/api/3/issue/${input.issueKey}/transitions`,
    { transition: { id: transition.id } },
    { auth: getAuth() },
  );

  return {
    success: true,
    message: `Issue ${input.issueKey} updated to "${input.status}"`,
  };
};

// ✅ TOOL 5 — Delete Jira Issue
const deleteJiraIssue = async (input) => {
  await axios.delete(`${BASE_URL}/rest/api/3/issue/${input.issueKey}`, {
    auth: getAuth(),
  });
  return {
    success: true,
    message: `Issue ${input.issueKey} deleted successfully`,
  };
};

// Export all tools
module.exports = {
  searchJiraIssues,
  getJiraIssue,
  createJiraIssue,
  updateJiraIssue,
  deleteJiraIssue,
};
```

---

### Jira Tools Summary

| Tool | Purpose | Input Parameters | API Endpoint |
|------|---------|-----------------|--------------|
| `search_jira_issues` | Search tickets by JQL | `query` (optional) | `GET /rest/api/3/search/jql` |
| `get_jira_issue` | Get single issue details | `issueKey` | `GET /rest/api/3/issue/{key}` |
| `create_jira_issue` | Create new ticket | `projectKey`, `summary`, `description` (opt), `issueType` (opt), `priority` (opt) | `POST /rest/api/3/issue` |
| `update_jira_issue` | Change issue status | `issueKey`, `status` | `POST /rest/api/3/issue/{key}/transitions` |
| `delete_jira_issue` | Delete ticket | `issueKey` | `DELETE /rest/api/3/issue/{key}` |

---

### Create `tools/confluence.js`

All 5 Confluence tools — search, get, create, update, delete.

```javascript
const axios = require("axios");

const BASE_URL = process.env.ATLASSIAN_BASE_URL;
const EMAIL = process.env.ATLASSIAN_EMAIL;
const TOKEN = process.env.ATLASSIAN_API_TOKEN;

// Auth helper
const getAuth = () => ({
  username: EMAIL,
  password: TOKEN,
});

// ✅ TOOL 1 — Search Confluence Pages
const searchConfluencePages = async (input) => {
  const response = await axios.get(`${BASE_URL}/wiki/rest/api/content/search`, {
    auth: getAuth(),
    params: {
      cql: input?.query || "type=page ORDER BY created DESC",
      limit: input?.limit || 10,
      expand: "space,body.view,version",
    },
  });
  return response.data;
};

// ✅ TOOL 2 — Get Single Confluence Page
const getConfluencePage = async (input) => {
  const response = await axios.get(
    `${BASE_URL}/wiki/rest/api/content/${input.pageId}`,
    {
      auth: getAuth(),
      params: {
        expand: "body.view,version,space",
      },
    },
  );
  return response.data;
};

// ✅ TOOL 3 — Create Confluence Page
const createConfluencePage = async (input) => {
  const response = await axios.post(
    `${BASE_URL}/wiki/rest/api/content`,
    {
      type: "page",
      title: input.title,
      space: {
        key: input.spaceKey,
      },
      body: {
        storage: {
          value: input.content || "",
          representation: "storage",
        },
      },
    },
    { auth: getAuth() },
  );
  return response.data;
};

// ✅ TOOL 4 — Update Confluence Page
const updateConfluencePage = async (input) => {
  // Step 1 — Get current page version first
  const currentPage = await axios.get(
    `${BASE_URL}/wiki/rest/api/content/${input.pageId}`,
    {
      auth: getAuth(),
      params: { expand: "version" },
    },
  );

  const currentVersion = currentPage.data.version.number;

  // Step 2 — Update with incremented version
  const response = await axios.put(
    `${BASE_URL}/wiki/rest/api/content/${input.pageId}`,
    {
      type: "page",
      title: input.title,
      version: {
        number: currentVersion + 1,
      },
      body: {
        storage: {
          value: input.content || "",
          representation: "storage",
        },
      },
    },
    { auth: getAuth() },
  );
  return response.data;
};

// ✅ TOOL 5 — Delete Confluence Page
const deleteConfluencePage = async (input) => {
  await axios.delete(`${BASE_URL}/wiki/rest/api/content/${input.pageId}`, {
    auth: getAuth(),
  });
  return {
    success: true,
    message: `Page ${input.pageId} deleted successfully`,
  };
};

// Export all tools
module.exports = {
  searchConfluencePages,
  getConfluencePage,
  createConfluencePage,
  updateConfluencePage,
  deleteConfluencePage,
};
```

---

### Confluence Tools Summary

| Tool | Purpose | Input Parameters | API Endpoint |
|------|---------|-----------------|--------------|
| `search_confluence_pages` | Search pages by CQL | `query` (optional), `limit` (optional) | `GET /wiki/rest/api/content/search` |
| `get_confluence_page` | Get page full content | `pageId` | `GET /wiki/rest/api/content/{id}` |
| `create_confluence_page` | Create new page | `spaceKey`, `title`, `content` (optional) | `POST /wiki/rest/api/content` |
| `update_confluence_page` | Update page content | `pageId`, `title`, `content` | `PUT /wiki/rest/api/content/{id}` |
| `delete_confluence_page` | Delete page | `pageId` | `DELETE /wiki/rest/api/content/{id}` |

---

### Create `tools/llm.js`

LLM integration — defines all 10 tools for Groq AI and processes messages.

```javascript
const OpenAI = require("openai");

// Initialize Groq client
const grok = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

// Define ALL tools Groq can use
const tools = [
  {
    type: "function",
    function: {
      name: "search_jira_issues",
      description: "Search for Jira issues using JQL query. Use this ONLY when user explicitly asks about their Jira tickets, issues, tasks or projects.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "JQL query. Example: project = KAN AND status = 'To Do'"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_jira_issue",
      description: "Get details of a specific Jira issue by its key. Use ONLY when user mentions a specific ticket like KAN-12.",
      parameters: {
        type: "object",
        properties: {
          issueKey: {
            type: "string",
            description: "The Jira issue key. Example: KAN-12"
          }
        },
        required: ["issueKey"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_jira_issue",
      description: "Create a new Jira issue/ticket. Use ONLY when user explicitly says create, add, or raise a new ticket.",
      parameters: {
        type: "object",
        properties: {
          projectKey: {
            type: "string",
            description: "Jira project key. Example: KAN"
          },
          summary: {
            type: "string",
            description: "Short title of the issue"
          },
          description: {
            type: "string",
            description: "Detailed description of the issue"
          },
          issueType: {
            type: "string",
            description: "Type of issue: Task, Bug, Story",
            enum: ["Task", "Bug", "Story"]
          },
          priority: {
            type: "string",
            description: "Priority level",
            enum: ["Highest", "High", "Medium", "Low", "Lowest"]
          }
        },
        required: ["projectKey", "summary"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_jira_issue",
      description: "Update the status of a Jira issue. Use ONLY when user explicitly wants to move or change status of a specific ticket.",
      parameters: {
        type: "object",
        properties: {
          issueKey: {
            type: "string",
            description: "The Jira issue key. Example: KAN-12"
          },
          status: {
            type: "string",
            description: "New status name. Example: In Progress, Done, To Do"
          }
        },
        required: ["issueKey", "status"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_jira_issue",
      description: "Delete a Jira issue permanently. Use ONLY when user explicitly says delete a specific ticket.",
      parameters: {
        type: "object",
        properties: {
          issueKey: {
            type: "string",
            description: "The Jira issue key to delete. Example: KAN-12"
          }
        },
        required: ["issueKey"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_confluence_pages",
      description: "Search Confluence pages. Use ONLY when user explicitly asks to search or find Confluence documentation or pages.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "CQL search query. Example: type=page AND title ~ 'onboarding'"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_confluence_page",
      description: "Get full content of a specific Confluence page by ID. Use ONLY when user provides a specific page ID.",
      parameters: {
        type: "object",
        properties: {
          pageId: {
            type: "string",
            description: "The Confluence page ID"
          }
        },
        required: ["pageId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_confluence_page",
      description: "Create a new Confluence page. Use ONLY when user explicitly asks to create a new page.",
      parameters: {
        type: "object",
        properties: {
          spaceKey: {
            type: "string",
            description: "Confluence space key. Example: KAN"
          },
          title: {
            type: "string",
            description: "Title of the page"
          },
          content: {
            type: "string",
            description: "HTML content of the page"
          }
        },
        required: ["spaceKey", "title"]
      }
    }
  }
];

// Main function
const processWithLLM = async (userMessage, conversationHistory = []) => {

  const systemPrompt = `You are a helpful AI assistant — just like Claude or ChatGPT.

You have TWO modes:

## MODE 1 — General Assistant (DEFAULT)
For ANY general question, concept, explanation, or conversation:
- Answer directly from your knowledge
- Do NOT use any tools
- Examples of general questions:
  * "What is MCP?" → explain Model Context Protocol
  * "What is Jira?" → explain Jira
  * "What is Rovo?" → explain Atlassian Rovo
  * "Hello" → greet back
  * "How does REST API work?" → explain it
  * "What is agile?" → explain agile
  * ANY question asking "what is", "how does", "explain", "tell me about"

## MODE 2 — Atlassian Actions (ONLY when explicitly asked)
Use tools ONLY when user explicitly asks to DO something in Jira or Confluence:
- "Show me my Jira issues" → use search_jira_issues
- "Create a ticket for..." → use create_jira_issue
- "Update KAN-12 to Done" → use update_jira_issue
- "Search Confluence for..." → use search_confluence_pages
- "Get details of KAN-5" → use get_jira_issue

## CRITICAL RULES:
1. NEVER use tools for general knowledge questions
2. NEVER search Jira just because a word appears in the user's message
3. If user asks "what is rovo" → explain it, don't search Jira
4. If user asks "what is MCP" → explain Model Context Protocol, don't use tools
5. Default Jira project key is "KAN"
6. Always be friendly, helpful and conversational`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory,
    { role: "user", content: userMessage }
  ];

  const response = await grok.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: messages,
    tools: tools,
    tool_choice: "auto",
    temperature: 0.7
  });

  return response.choices[0];
};

module.exports = { processWithLLM, tools };
```

---

### Start MCP Server

```
node server.js
```

**Output:**
```
🚀 MCP Server running on port 3333
📋 Tools endpoint: http://localhost:3333/tools
💬 Chat endpoint:  http://localhost:3333/chat
💚 Health check:   http://localhost:3333/health
```

**MCP endpoints:**
```
POST http://localhost:3333/tools   ← Direct tool execution
POST http://localhost:3333/chat    ← LLM-powered chat
GET  http://localhost:3333/health  ← Server status
```

---

## Step 3: Create a Frontend App (React)

```
mkdir mcp-frontend
cd mcp-frontend
npx create-react-app .
```

**Install Tailwind CSS and additional dependencies:**

```
npm install tailwindcss postcss autoprefixer react-markdown @tailwindcss/typography
npx tailwindcss init -p
```

---

## Step 4: Connect MCP to Your Application

MCP exposes HTTP endpoints. Your application sends a request like:

**POST /tools (Direct tool call — no LLM):**

```json
POST http://localhost:3333/tools

{
  "tool": "search_jira_issues",
  "input": {
    "query": "project = KAN"
  }
}
```

**POST /chat (LLM-powered — natural language):**

```json
POST http://localhost:3333/chat

{
  "message": "Show me all my high priority Jira issues",
  "history": []
}
```

---

## Step 5: Connect with Any Stack

### React

Update `mcp-frontend/src/App.js`:

```javascript
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

const getTime = () => new Date().toLocaleTimeString([], { 
  hour: "2-digit", minute: "2-digit" 
});

// ============================================
// Tool Badge
// ============================================
const ToolBadge = ({ toolName }) => {
  if (!toolName) return null;
  const tools = {
    search_jira_issues:      { label: "Searched Jira",           color: "text-blue-500",   bg: "bg-blue-50",   icon: "🔍" },
    create_jira_issue:       { label: "Created Jira Ticket",     color: "text-green-600",  bg: "bg-green-50",  icon: "✅" },
    update_jira_issue:       { label: "Updated Jira Issue",      color: "text-amber-600",  bg: "bg-amber-50",  icon: "🔄" },
    delete_jira_issue:       { label: "Deleted Jira Issue",      color: "text-red-500",    bg: "bg-red-50",    icon: "🗑️" },
    get_jira_issue:          { label: "Fetched Issue",           color: "text-purple-600", bg: "bg-purple-50", icon: "📋" },
    search_confluence_pages: { label: "Searched Confluence",     color: "text-teal-600",   bg: "bg-teal-50",   icon: "🔍" },
    get_confluence_page:     { label: "Read Confluence Page",    color: "text-cyan-600",   bg: "bg-cyan-50",   icon: "📄" },
    create_confluence_page:  { label: "Created Confluence Page", color: "text-emerald-600",bg: "bg-emerald-50",icon: "📝" },
    update_confluence_page:  { label: "Updated Confluence Page", color: "text-orange-600", bg: "bg-orange-50", icon: "✏️" },
    delete_confluence_page:  { label: "Deleted Confluence Page", color: "text-rose-600",   bg: "bg-rose-50",   icon: "🗑️" },
  };
  const t = tools[toolName] || { label: toolName, color: "text-gray-500", bg: "bg-gray-50", icon: "🔧" };
  return (
    <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${t.bg} ${t.color} mb-2`}>
      <span>{t.icon}</span>
      <span>{t.label}</span>
    </div>
  );
};

// ============================================
// User Message
// ============================================
const UserMessage = ({ message }) => (
  <div className="flex justify-end mb-6 px-4">
    <div className="max-w-[85%] lg:max-w-[65%]">
      <div className="bg-gray-900 text-white rounded-3xl rounded-br-lg px-5 py-3.5 text-sm leading-relaxed">
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
      <p className="text-xs text-gray-400 mt-1.5 text-right pr-1">{message.timestamp}</p>
    </div>
  </div>
);

// ============================================
// Assistant Message
// ============================================
const AssistantMessage = ({ message }) => (
  <div className="flex justify-start mb-6 px-4">
    <div className="flex gap-3 max-w-[85%] lg:max-w-[75%]">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold mt-0.5 shadow-sm">
        M
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">
        {message.toolUsed && <ToolBadge toolName={message.toolUsed} />}
        <div className="text-gray-800 text-sm leading-relaxed prose prose-sm max-w-none
          prose-headings:font-semibold prose-headings:text-gray-900
          prose-strong:font-semibold prose-strong:text-gray-900
          prose-ul:my-2 prose-li:my-0.5
          prose-ol:my-2
          prose-p:my-1.5 prose-p:leading-relaxed
          prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:text-gray-700
          prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:p-4">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        <p className="text-xs text-gray-400 mt-2">{message.timestamp}</p>
      </div>
    </div>
  </div>
);

// ============================================
// Loading Animation
// ============================================
const ThinkingIndicator = () => (
  <div className="flex justify-start mb-6 px-4">
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">
        M
      </div>
      <div className="flex items-center gap-1.5 bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
      </div>
    </div>
  </div>
);

// ============================================
// Quick Actions
// ============================================
const quickActions = [
  { label: "Show my Jira issues",        message: "Show me all my Jira issues" },
  { label: "Create a bug ticket",        message: "Create a bug ticket for " },
  { label: "Search Confluence",          message: "Search Confluence pages about " },
  { label: "Update issue status",        message: "Update KAN- status to In Progress" },
  { label: "Get issue details",          message: "Get details of KAN-" },
];

// ============================================
// Welcome Screen
// ============================================
const WelcomeScreen = ({ onQuickAction }) => (
  <div className="flex flex-col items-center justify-center h-full px-4 pb-8">
    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-5">
      M
    </div>
    <h2 className="text-2xl font-semibold text-gray-900 mb-2">MCP Atlassian Assistant</h2>
    <p className="text-gray-500 text-sm text-center mb-8 max-w-sm">
      Powered by Groq AI. Manage your Jira tickets and Confluence pages using natural language.
    </p>
    {/* Suggestion Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
      {[
        { icon: "🔍", title: "Search Issues",    desc: "Show me all my Jira issues",              msg: "Show me all my Jira issues" },
        { icon: "✅", title: "Create Ticket",    desc: "Create a bug for login not working",      msg: "Create a bug ticket for login page not working" },
        { icon: "📄", title: "Search Docs",      desc: "Find Confluence pages about onboarding",  msg: "Search Confluence pages about onboarding" },
        { icon: "🔄", title: "Update Status",    desc: "Move KAN-12 to In Progress",              msg: "Update issue KAN-12 status to In Progress" },
      ].map((card) => (
        <button
          key={card.title}
          onClick={() => onQuickAction(card.msg)}
          className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-2xl hover:border-blue-300 hover:bg-blue-50 transition-all text-left group shadow-sm"
        >
          <span className="text-xl mt-0.5">{card.icon}</span>
          <div>
            <p className="text-sm font-medium text-gray-800 group-hover:text-blue-700">{card.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.desc}</p>
          </div>
        </button>
      ))}
    </div>
  </div>
);

// ============================================
// MAIN APP
// ============================================
export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();

    const userMessage = {
      role: "user",
      content: userText,
      timestamp: getTime(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3333/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: conversationHistory
        })
      });

      const data = await response.json();

      if (data.error) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: `❌ **Error:** ${data.error}`,
          timestamp: getTime(),
          toolUsed: null
        }]);
        setLoading(false);
        return;
      }

      const assistantMessage = {
        role: "assistant",
        content: data.reply,
        timestamp: getTime(),
        toolUsed: data.toolUsed
      };

      setMessages(prev => [...prev, assistantMessage]);
      setConversationHistory(prev => [
        ...prev,
        { role: "user", content: userText },
        { role: "assistant", content: data.reply }
      ]);

    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "❌ **Cannot connect to MCP server.** Make sure it's running on port 3333.",
        timestamp: getTime(),
        toolUsed: null
      }]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (msg) => {
    setInput(msg);
    textareaRef.current?.focus();
  };

  const showWelcome = messages.length === 0 && !loading;

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">

      {/* ===== HEADER ===== */}
      <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold shadow-sm">
            M
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900 leading-tight">MCP Atlassian Assistant</h1>
            <p className="text-xs text-gray-400">Jira • Confluence • Groq AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-700 font-medium">Connected</span>
        </div>
      </header>

      {/* ===== MESSAGES AREA ===== */}
      <main className="flex-1 overflow-y-auto">
        {showWelcome ? (
          <WelcomeScreen onQuickAction={handleQuickAction} />
        ) : (
          <div className="max-w-3xl mx-auto py-6">
            {messages.map((msg, i) =>
              msg.role === "user"
                ? <UserMessage key={i} message={msg} />
                : <AssistantMessage key={i} message={msg} />
            )}
            {loading && <ThinkingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* ===== QUICK ACTIONS ===== */}
      {messages.length > 0 && (
        <div className="border-t border-gray-100 bg-white px-4 py-2 flex gap-2 overflow-x-auto">
          {quickActions.map((a) => (
            <button
              key={a.label}
              onClick={() => handleQuickAction(a.message)}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all bg-white"
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

      {/* ===== INPUT AREA ===== */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-white border border-gray-300 rounded-2xl px-4 py-3 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message MCP Assistant..."
              rows={1}
              className="flex-1 resize-none outline-none text-sm text-gray-800 placeholder-gray-400 leading-relaxed bg-transparent max-h-40"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              {loading ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>

    </div>
  );
}
```

---

### Node.js

```javascript
const fetch = require("node-fetch");

const res = await fetch("http://localhost:3333/tools", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    tool: "search_jira_issues",
    input: { query: "project = KAN" }
  })
});

console.log(await res.json());
```

### Python

```python
import requests

res = requests.post(
    "http://localhost:3333/tools",
    json={
        "tool": "search_jira_issues",
        "input": {"query": "project = KAN"}
    }
)

print(res.json())
```

---

## Step 6: Understanding Queries (JQL & CQL)

### JQL (Jira Query Language)

JQL is used to tell Jira what data to fetch. MCP does not decide data — your query does.

**Example Queries:**

```
project = KAN
project = KAN AND status = "Waiting for Support"
assignee = currentUser()
priority = High
project IS NOT EMPTY ORDER BY created DESC
```

**Important Rule:** JQL must include at least one condition.

| | Example |
|--|---------|
| Invalid | `ORDER BY created DESC` |
| Valid | `project IS NOT EMPTY ORDER BY created DESC` |

**In MCP:**

```json
{
  "tool": "search_jira_issues",
  "input": {
    "query": "project = KAN"
  }
}
```

Query → MCP → Jira → Result

### CQL (Confluence Query Language)

CQL is used to search Confluence pages.

**Example Queries:**

```
type=page ORDER BY created DESC
type=page AND title ~ "onboarding"
space = "KAN" AND type = page
```

**In MCP:**

```json
{
  "tool": "search_confluence_pages",
  "input": {
    "query": "type=page AND title ~ 'onboarding'"
  }
}
```

---

## Step 7: How MCP Works

MCP is a middle layer between your app and Atlassian.

**Flow:**
```
User → App → MCP → Atlassian → Response
```

**Steps:**

1. App sends request (tool + query)
2. MCP receives request
3. MCP converts the request into a Jira/Confluence API call
4. Atlassian returns data
5. MCP sends response back

**Key Point:**
- Your app never calls Jira or Confluence directly
- MCP handles everything

---

## Step 8: MCP with LLM (AI)

LLM makes MCP intelligent.

**Without LLM** — developer manually writes query:

```json
{
  "tool": "search_jira_issues",
  "input": { "query": "project = KAN" }
}
```

**With LLM** — user types plain English, LLM converts automatically:

User types:
> "Show my high priority issues"

LLM converts to:
```
assignee = currentUser() AND priority = High
```

**Flow:**
```
User → LLM → MCP → Jira → Response
```

**Key Benefit:**
- No need to write JQL or CQL
- Works like a chatbot
- Auto tool + query selection

---

### LLM Integration Details

**Model used:** `llama-3.3-70b-versatile` via Groq

**How it works — Two-Call Strategy:**

```
Step 1: User message → Groq (with all 10 tools defined)
           ↓
        Groq decides: tool_calls or stop?
           ↓
Step 2a: finish_reason = "tool_calls"
         → Extract tool name + input
         → Execute tool (Jira or Confluence API)
         → Clean result data
         → Ask Groq to summarize (NO tools in this call)
         → Return: reply + toolUsed + toolInput + toolResult
           ↓
Step 2b: finish_reason = "stop"
         → Return Groq's direct response
```

**Why Two Calls?**
The second call (summary) has no tools — this prevents Groq's `failed_generation` error that occurs when tool results are large.

**Chat endpoint response format:**
```json
{
  "reply": "Human-readable summary from Groq",
  "toolUsed": "search_jira_issues",
  "toolInput": { "query": "project = KAN" },
  "toolResult": {
    "total": 5,
    "issues": [
      {
        "key": "KAN-12",
        "summary": "Search button not working on mobile",
        "status": "To Do",
        "priority": "Medium",
        "assignee": "Mohit Deshpande",
        "created": "2026-03-25T17:02:21.031+0530"
      }
    ]
  }
}
```

---

## Step 9: Dependencies

### Backend (`mcp-server/package.json`)

```json
{
  "name": "mcp-server",
  "version": "1.0.0",
  "type": "commonjs",
  "dependencies": {
    "axios": "^1.14.0",
    "cors": "^2.8.6",
    "dotenv": "^17.3.1",
    "express": "^5.2.1",
    "node-fetch": "^3.3.2",
    "openai": "^6.33.0"
  }
}
```

| Package | Purpose |
|---------|---------|
| `express` | Web framework — handles HTTP routes |
| `cors` | Allows cross-origin requests from frontend |
| `dotenv` | Loads `.env` file (API credentials) |
| `axios` | HTTP client for Atlassian API calls |
| `openai` | OpenAI SDK used to call Groq AI |
| `node-fetch` | Fetch API for Node.js |

### Frontend (`mcp-frontend/package.json`)

```json
{
  "name": "mcp-frontend",
  "version": "0.1.0",
  "dependencies": {
    "@tailwindcss/typography": "^0.5.19",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "react-markdown": "^10.1.0",
    "react-scripts": "5.0.1"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.27",
    "postcss": "^8.5.8",
    "tailwindcss": "^3.4.19"
  }
}
```

| Package | Purpose |
|---------|---------|
| `react` | UI library |
| `react-dom` | DOM rendering |
| `react-markdown` | Renders LLM responses as formatted markdown |
| `tailwindcss` | CSS utility framework |
| `@tailwindcss/typography` | Rich text prose styling for markdown output |

---

## Step 10: Run Everything

### Start Backend

```
cd mcp-server
node server.js
```

### Start Frontend

```
cd mcp-frontend
npm start
```

**Access:**
- Frontend: `http://localhost:3000`
- MCP Server: `http://localhost:3333`
- Health Check: `http://localhost:3333/health`

---

## All Available Tools Reference

### Jira Tools (5 tools)

| Tool | Input | Example |
|------|-------|---------|
| `search_jira_issues` | `{ query: "JQL" }` | `{ query: "project = KAN AND priority = High" }` |
| `get_jira_issue` | `{ issueKey: "KAN-12" }` | `{ issueKey: "KAN-12" }` |
| `create_jira_issue` | `{ projectKey, summary, description?, issueType?, priority? }` | `{ projectKey: "KAN", summary: "Login bug", issueType: "Bug", priority: "High" }` |
| `update_jira_issue` | `{ issueKey, status }` | `{ issueKey: "KAN-12", status: "In Progress" }` |
| `delete_jira_issue` | `{ issueKey }` | `{ issueKey: "KAN-12" }` |

**Issue Types:** `Task`, `Bug`, `Story`

**Priority Levels:** `Highest`, `High`, `Medium`, `Low`, `Lowest`

**Status Options:** `To Do`, `In Progress`, `Done`

### Confluence Tools (5 tools)

| Tool | Input | Example |
|------|-------|---------|
| `search_confluence_pages` | `{ query: "CQL", limit?: 10 }` | `{ query: "type=page AND title ~ 'onboarding'" }` |
| `get_confluence_page` | `{ pageId: "123456" }` | `{ pageId: "123456" }` |
| `create_confluence_page` | `{ spaceKey, title, content? }` | `{ spaceKey: "KAN", title: "My Page", content: "<p>Hello</p>" }` |
| `update_confluence_page` | `{ pageId, title, content }` | `{ pageId: "123456", title: "Updated Title", content: "<p>New content</p>" }` |
| `delete_confluence_page` | `{ pageId }` | `{ pageId: "123456" }` |

---

## When Can We Use Direct MCP (without server.js)?

You can skip `server.js` **only if you are using a prebuilt/hosted MCP server**, such as:

- Atlassian Rovo MCP
- External MCP services
- Tools like Cline (VS Code extension), Claude

---

## Result

The complete MCP Atlassian Assistant is a chat application that lets you manage Jira tickets and Confluence pages using plain English.

**Example conversation:**

> User: "Show me all high priority Jira issues"
> → LLM converts to: `assignee = currentUser() AND priority = High`
> → MCP calls Jira API
> → Returns formatted list of issues

> User: "Create a bug ticket for login page crash"
> → LLM creates: `{ projectKey: "KAN", summary: "Login page crash", issueType: "Bug" }`
> → MCP calls Jira API
> → Returns new ticket key (e.g., KAN-13)

> User: "Search Confluence pages about onboarding"
> → LLM converts to: `type=page AND title ~ 'onboarding'`
> → MCP calls Confluence API
> → Returns matching pages with titles and links

*This document covers the complete MCP implementation including all Jira tools, Confluence tools, LLM integration, React frontend, and direct API access from any tech stack.*
