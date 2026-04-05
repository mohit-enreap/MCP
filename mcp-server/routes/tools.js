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
