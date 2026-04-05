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