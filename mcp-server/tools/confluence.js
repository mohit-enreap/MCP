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
