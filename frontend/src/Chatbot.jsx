import React, { useState, useRef, useEffect } from "react";
import { supabase } from "./supabase.js";
import axios from "axios";

const FloatingChatbot = () => {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const askBot = async () => {
    if (!question.trim()) return;

    // Add user message
    const userMsg = { sender: "user", text: question };
    setMessages(prev => [...prev, userMsg]);

    try {
      // 🔐 Get logged-in session
      const { data: { session } } = await supabase.auth.getSession();

      // POST to backend
      const res = await axios.post(
        "http://localhost:5000/api/chatbot/ask",
        { question },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );

      // Backend returns: { sql, result }
      const botText = res.data.result
        ? JSON.stringify(res.data.result, null, 2) // nicely formatted
        : res.data.message || "No response";

      const botMsg = { sender: "bot", text: botText };
      setMessages(prev => [...prev, botMsg]);

    } catch (err) {
      console.log("CHATBOT ERROR:", err.response?.data || err.message);
      setMessages(prev => [
        ...prev,
        { sender: "bot", text: "Error: " + JSON.stringify(err.response?.data || err.message) }
      ]);
    }

    setQuestion("");
  };

  return (
    <>
      {/* Floating Button */}
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
          fontSize: "24px",
          cursor: "pointer",
          boxShadow: "0px 4px 12px rgba(0,0,0,0.2)",
          zIndex: 999
        }}
      >
        🤖
      </div>

      {/* Chat Window */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "90px",
            right: "20px",
            width: "320px",
            height: "420px",
            background: "white",
            borderRadius: "12px",
            boxShadow: "0px 4px 20px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            zIndex: 999
          }}
        >
          {/* Header */}
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

          {/* Messages */}
          <div style={{ flex: 1, padding: "10px", overflowY: "auto" }}>
  {messages.map((msg, i) => (
    <div key={i} style={{ marginBottom: "8px" }}>
      {msg.sender === "user" ? (
        <div style={{ textAlign: "right" }}>
          <span style={{
            display: "inline-block",
            padding: "8px",
            borderRadius: "8px",
            background: "#E0E7FF"
          }}>
            {msg.text}
          </span>
        </div>
      ) : (
        <div style={{ textAlign: "left" }}>
          {msg.data ? (
            // Render array of journals as cards
            msg.data.map((item, idx) => (
              <div key={idx} style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "8px",
                marginBottom: "6px",
                background: "#F3F4F6"
              }}>
                <strong>Title:</strong> {item.title} <br/>
                <strong>Journal:</strong> {item.journal_name} <br/>
                <strong>Indexing:</strong> {item.indexing_details || "N/A"} <br/>
                <strong>Publication Date:</strong> {item.publication_date}
              </div>
            ))
          ) : (
            <span style={{
              display: "inline-block",
              padding: "8px",
              borderRadius: "8px",
              background: "#F3F4F6"
            }}>
              {msg.text}
            </span>
          )}
        </div>
      )}
    </div>
  ))}
  <div ref={messagesEndRef} />
</div>

          {/* Input */}
          <div style={{ display: "flex", padding: "10px" }}>
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Ask something..."
              style={{ flex: 1, padding: "8px" }}
              onKeyDown={e => e.key === "Enter" && askBot()}
            />
            <button onClick={askBot}>Send</button>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChatbot;
