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