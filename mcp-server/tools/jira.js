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
