import React, { useState, useRef, useEffect } from "react";
import { supabase } from "./supabase.js";
import axios from "axios";

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
  <div
    style={{
      border: "1px solid #E5E7EB",
      borderRadius: "8px",
      padding: "10px",
      background: "#F9FAFB"
    }}
  >
    {Object.entries(obj).map(([key, value]) => {
      const primitiveValue = formatValue(value);
      if (primitiveValue === null) return null;
      return (
        <div key={key} style={{ marginBottom: "6px", lineHeight: 1.4 }}>
          <strong>{toLabel(key)}:</strong> {primitiveValue}
        </div>
      );
    })}
  </div>
);

const renderStructuredResult = (result) => {
  if (Array.isArray(result)) {
    if (result.length === 0) return <div>No records found.</div>;

    if (result.every((entry) => typeof entry !== "object" || entry === null)) {
      return (
        <ul style={{ margin: 0, paddingLeft: "18px" }}>
          {result.map((entry, index) => (
            <li key={index}>{formatValue(entry)}</li>
          ))}
        </ul>
      );
    }

    return (
      <div>
        {result.map((entry, index) => (
          <div key={index} style={{ marginBottom: "8px" }}>
            {renderObjectFields(entry)}
          </div>
        ))}
      </div>
    );
  }

  if (result && typeof result === "object") {
    return renderObjectFields(result);
  }

  return <div>{formatValue(result)}</div>;
};

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

      const res = await axios.post(
        "http://localhost:5000/api/chatbot/ask",
        { question },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );

      const hasStructuredResult = Object.prototype.hasOwnProperty.call(res.data || {}, "result");
      const botMsg = hasStructuredResult
        ? { sender: "bot", result: res.data.result }
        : { sender: "bot", text: res.data?.message || "No response" };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorPayload = err.response?.data;
      const errorText =
        errorPayload?.message ||
        errorPayload?.error ||
        err.message ||
        "Unable to process your request.";

      setMessages((prev) => [...prev, { sender: "bot", text: `Error: ${errorText}` }]);
    }

    setQuestion("");
  };

  return (
    <>
      <div
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          background: "#4F46E5",
          color: "white",
          borderRadius: "50%",
          width: "60px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0px 4px 12px rgba(0,0,0,0.2)",
          zIndex: 999
        }}
      >
        🤖
      </div>

      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "90px",
            right: "20px",
            width: "380px",
            maxWidth: "calc(100vw - 24px)",
            height: "460px",
            background: "white",
            borderRadius: "12px",
            boxShadow: "0px 4px 20px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            zIndex: 999
          }}
        >
          <div
            style={{
              padding: "12px",
              background: "#4F46E5",
              color: "white",
              borderTopLeftRadius: "12px",
              borderTopRightRadius: "12px"
            }}
          >
            Faculty Assistant
          </div>

          <div style={{ flex: 1, padding: "10px", overflowY: "auto" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: "8px" }}>
                {msg.sender === "user" ? (
                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "8px",
                        borderRadius: "8px",
                        background: "#E0E7FF"
                      }}
                    >
                      {msg.text}
                    </span>
                  </div>
                ) : (
                  <div style={{ textAlign: "left" }}>
                    {Object.prototype.hasOwnProperty.call(msg, "result") ? (
                      <div
                        style={{
                          display: "inline-block",
                          padding: "8px",
                          borderRadius: "8px",
                          background: "#F3F4F6",
                          maxWidth: "100%",
                          overflowX: "auto"
                        }}
                      >
                        {renderStructuredResult(msg.result)}
                      </div>
                    ) : (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "8px",
                          borderRadius: "8px",
                          background: "#F3F4F6"
                        }}
                      >
                        {msg.text}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ display: "flex", padding: "10px", gap: "8px" }}>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask something..."
              style={{ flex: 1, padding: "8px" }}
              onKeyDown={(e) => e.key === "Enter" && askBot()}
            />
            <button onClick={askBot}>Send</button>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChatbot;
