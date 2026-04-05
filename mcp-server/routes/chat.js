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