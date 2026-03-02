import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { supabase } from "./supabase.js";

const toLabel = (key) =>
  String(key || "")
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "N/A";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return null;
  return String(value);
};

const renderObjectFields = (obj) => (
  <div className="chatbot-structured-block">
    {Object.entries(obj).map(([key, value]) => {
      const primitiveValue = formatValue(value);
      if (primitiveValue === null) return null;
      return (
        <div key={key} className="mb-1.5 leading-[1.4] text-sm text-[var(--text-primary)] last:mb-0">
          <strong>{toLabel(key)}:</strong> {primitiveValue}
        </div>
      );
    })}
  </div>
);

const renderStructuredResult = (result) => {
  if (Array.isArray(result)) {
    if (result.length === 0) return <div className="text-sm text-[var(--text-secondary)]">No records found.</div>;

    if (result.every((entry) => typeof entry !== "object" || entry === null)) {
      return (
        <ul className="m-0 list-disc pl-[18px] text-sm text-[var(--text-primary)]">
          {result.map((entry, index) => (
            <li key={index}>{formatValue(entry)}</li>
          ))}
        </ul>
      );
    }

    return (
      <div className="space-y-2">
        {result.map((entry, index) => (
          <div key={index}>{renderObjectFields(entry)}</div>
        ))}
      </div>
    );
  }

  if (result && typeof result === "object") return renderObjectFields(result);
  return <div className="text-sm text-[var(--text-primary)]">{formatValue(result)}</div>;
};

const botIcon = (
  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
    <rect x="5" y="8" width="14" height="11" rx="2" />
    <circle cx="9.5" cy="13.5" r="1" fill="currentColor" />
    <circle cx="14.5" cy="13.5" r="1" fill="currentColor" />
    <path d="M12 4v2M8 20h8" strokeLinecap="round" />
  </svg>
);

const FloatingChatbot = () => {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const askBot = async () => {
    if (!question.trim()) return;

    const userMsg = { sender: "user", text: question };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setMessages((prev) => [...prev, { sender: "bot", text: "Please log in again to continue." }]);
        return;
      }

      const response = await axios.post(
        "http://localhost:5000/api/chatbot/ask",
        { question },
        {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      );

      const hasStructuredResult = Object.prototype.hasOwnProperty.call(response.data || {}, "result");
      const botMsg = hasStructuredResult
        ? { sender: "bot", result: response.data.result }
        : { sender: "bot", text: response.data?.message || "No response" };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      const errorPayload = error.response?.data;
      const errorText = errorPayload?.message || errorPayload?.error || error.message || "Unable to process your request.";
      setMessages((prev) => [...prev, { sender: "bot", text: `Error: ${errorText}` }]);
    }

    setQuestion("");
  };

  return (
    <>
      <button
        onClick={() => setOpen((value) => !value)}
        className="chatbot-fab"
        aria-label="Toggle chatbot"
      >
        {botIcon}
      </button>

      {open ? (
        <div className="chatbot-panel">
          <div className="chatbot-header">Faculty Assistant</div>

          <div className="chatbot-scroll">
            {messages.map((msg, index) => (
              <div key={index} className="mb-2">
                {msg.sender === "user" ? (
                  <div className="text-right">
                    <span className="chatbot-bubble-user">{msg.text}</span>
                  </div>
                ) : (
                  <div className="text-left">
                    {Object.prototype.hasOwnProperty.call(msg, "result") ? (
                      <div className="chatbot-bubble-bot max-w-full overflow-x-auto">{renderStructuredResult(msg.result)}</div>
                    ) : (
                      <span className="chatbot-bubble-bot">{msg.text}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-footer">
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask something..."
              className="chatbot-input"
              onKeyDown={(event) => event.key === "Enter" && askBot()}
            />
            <button onClick={askBot} className="chatbot-send">
              Send
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default FloatingChatbot;
