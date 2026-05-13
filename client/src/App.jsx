// src/App.jsx

import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Upload PDF
  const uploadPDF = async () => {
    if (!file) {
      alert("Please select PDF");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/upload",
        formData
      );

      alert(res.data.message);
    } catch (error) {
      console.log(error);
      alert("Upload Failed");
    } finally {
      setLoading(false);
    }
  };

  // Ask Question
  const askQuestion = async () => {
    if (!question.trim()) return;

    const userMessage = {
      sender: "user",
      text: question,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/ask",
        {
          question,
        }
      );

      const botMessage = {
        sender: "bot",
        text: res.data.answer,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setQuestion("");
    }
  };

  return (
    <div className="container">
      <h1>SmartDoc AI</h1>

      <p className="subtitle">
        Intelligent PDF Question Answering System
      </p>

      {/* Upload Section */}

      <div className="upload-box">
        <h2>Upload PDF</h2>

        <input
          type="file"
          accept="application/pdf"
          onChange={(e) =>
            setFile(e.target.files[0])
          }
        />

        <button onClick={uploadPDF}>
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {/* Chat Section */}

      <div className="chat-box">
        <h2>Ask Questions</h2>

        <div className="messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={
                msg.sender === "user"
                  ? "user-message"
                  : "bot-message"
              }
            >
              {msg.text}
            </div>
          ))}
        </div>

        <div className="input-area">
          <input
            type="text"
            placeholder="Ask question from document..."
            value={question}
            onChange={(e) =>
              setQuestion(e.target.value)
            }
          />

          <button onClick={askQuestion}>
            {loading ? "Loading..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;