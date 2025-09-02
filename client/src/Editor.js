import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import debounce from "lodash.debounce";
import CodeEditor from "./Components/CodeEditor";

function Editor() {
  const defaultCodes = {
    java: `public class Solution {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
    python: `print("Hello, World!")`,
    cpp: `#include <iostream>
int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}`,
    javascript: `console.log("Hello, World!");`,
  };

  const { id } = useParams();
  const navigate = useNavigate();

  const [language, setLanguage] = useState("java");
  const [code, setCode] = useState(defaultCodes["java"]);
  const [output, setOutput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [saveStatus, setSaveStatus] = useState("Idle");

  const outputRef = useRef(null);

  // 🔹 Debounced autosave
  const autosave = useCallback(
    debounce(async (newCode, newLang) => {
      if (!id) return;
      setSaveStatus("Saving...");
      try {
        await axios.post(`http://210.79.129.246:8000/snippets/${id}/autosave`, {
          code: newCode,
          lang: newLang,
        });
        setSaveStatus("Saved ✅");
      } catch {
        setSaveStatus("Error saving ❌");
      }
    }, 1500),
    [id]
  );

  // 🔹 Create new snippet if none exists
  useEffect(() => {
    if (!id) {
      axios
        .post("http://210.79.129.246:8000/snippets/new", {
          code,
          lang: language,
        })
        .then((res) => {
          navigate(`/editor/${res.data.snippetId}`);
        })
        .catch((err) => {
          console.error("Error creating snippet:", err);
        });
    }
  }, [id, navigate]);

  // 🔹 Load snippet for language
  useEffect(() => {
    if (id) {
      axios
        .get(`http://210.79.129.246:8000/snippets/${id}/${language}`)
        .then((res) => {
          setCode(res.data.code || defaultCodes[language]);
        })
        .catch(() => {
          setCode(defaultCodes[language]);
        });
    }
  }, [id, language]);

  // 🔹 Language change
  const handleLanguageChange = useCallback((selectedLang) => {
    setLanguage(selectedLang);
    setOutput(null);
  }, []);

  // 🔹 Code change (with autosave)
  const handleCodeChange = useCallback(
    (newCode) => {
      setCode(newCode);
      autosave(newCode, language);
    },
    [autosave, language]
  );

  // 🔹 Submit code
  const submitHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setOutput(null);

    try {
      const res = await axios.post("http://210.79.129.246:8000/compile", {
        code,
        lang: language,
        input,
      });

      const { submissionId } = res.data;

      // Poll results
      async function pollResult() {
        try {
          const response = await axios.get(
            `http://210.79.129.246:8000/result/${submissionId}`
          );
          if (response.status === 202) {
            setTimeout(pollResult, 1000);
          } else {
            setOutput(response.data.result || "No output");
            setIsLoading(false);
          }
        } catch {
          setOutput("Error fetching result ❌");
          setIsLoading(false);
        }
      }
      pollResult();
    } catch {
      setOutput("Compilation error ❌");
      setIsLoading(false);
    }
  };

  // 🔹 Scroll output
  useEffect(() => {
    if (outputRef.current && output) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div className="code-compiler-desktop">
      <div className="compiler-grid">
        {/* Language Panel */}
        <div className="language-panel">
          <div className="language-selector">
            {Object.keys(defaultCodes).map((lang) => (
              <button
                key={lang}
                className={`lang-btn ${language === lang ? "active" : ""}`}
                onClick={() => handleLanguageChange(lang)}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Code Panel */}
        <div className="code-panel">
          <div className="code-header">
            <span className="panel-title">
              {language.toUpperCase()} Code Editor
              <span className="save-status"> ({saveStatus})</span>
            </span>
          </div>
          <div className="code-editor-wrapper">
            <CodeEditor
              boiler={code}
              onChange={handleCodeChange}
              language={language}
            />
          </div>
          <div className="code-footer">
            <textarea
              className="input-area"
              placeholder="Enter input here (optional)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button 
              className="run-btn" 
              onClick={submitHandler} 
              disabled={isLoading}
            >
              {isLoading ? "Compiling..." : "Run Code"}
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className="output-panel">
          <div className="output-header">
            <span className="panel-title">Output Console</span>
          </div>
          <pre
            ref={outputRef}
            className={`output-content ${
              output ? (output.includes("Error") ? "error" : "success") : ""
            }`}
          >
            {isLoading ? "Executing code..." : output || "Output will appear here"}
          </pre>
        </div>
      </div>

       <style jsx>{`
        /* Modern Animated Code Editor Styles */

        :root {
          --primary-bg: #0a0a0f;
          --secondary-bg: rgba(30, 30, 50, 0.8);
          --accent-color: #00d4ff;
          --accent-secondary: #ff6b6b;
          --accent-tertiary: #4ecdc4;
          --success-color: #00ff88;
          --error-color: #ff4757;
          --text-primary: #ffffff;
          --text-secondary: #b4b4b4;
          --border-color: rgba(255, 255, 255, 0.1);
          --shadow-glow: 0 0 30px rgba(0, 212, 255, 0.3);
          --glass-bg: rgba(255, 255, 255, 0.05);
          --glass-border: rgba(255, 255, 255, 0.2);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', monospace;
          background: var(--primary-bg);
          color: var(--text-primary);
          overflow-x: hidden;
        }

        .code-compiler-desktop {
          min-height: 100vh;
          padding: 2rem;
          position: relative;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0a15 50%, #0a0f15 100%);
        }

        .code-compiler-desktop::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: 
            radial-gradient(circle at 20% 80%, rgba(0, 212, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 107, 107, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(78, 205, 196, 0.1) 0%, transparent 50%);
          z-index: -1;
        }

        .compiler-grid {
          display: grid;
          grid-template-columns: 250px 1fr 400px;
          grid-template-rows: 1fr;
          gap: 2rem;
          height: calc(100vh - 4rem);
          max-width: 1600px;
          margin: 0 auto;
        }

        /* Language Panel */
        .language-panel {
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          padding: 2rem 1rem;
          box-shadow: var(--shadow-glow);
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .language-selector {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .lang-btn {
          background: transparent;
          border: 2px solid var(--border-color);
          color: var(--text-secondary);
          padding: 1rem 1.5rem;
          border-radius: 15px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          font-family: inherit;
          font-weight: 600;
          font-size: 1rem;
          position: relative;
          overflow: hidden;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .lang-btn:hover {
          transform: translateY(-5px) scale(1.05);
          border-color: var(--accent-color);
          color: var(--accent-color);
          box-shadow: 0 10px 30px rgba(0, 212, 255, 0.3);
        }

        .lang-btn.active {
          background: linear-gradient(45deg, var(--accent-color), var(--accent-tertiary));
          color: var(--primary-bg);
          border-color: var(--accent-color);
          transform: scale(1.1);
          box-shadow: 0 15px 40px rgba(0, 212, 255, 0.4);
        }

        /* CRITICAL: Fixed Code Panel Layout */
        .code-panel {
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          box-shadow: var(--shadow-glow);
        }

        .code-header {
          background: rgba(0, 0, 0, 0.3);
          padding: 1.5rem 2rem;
          border-bottom: 1px solid var(--border-color);
          flex-shrink: 0;
        }

        .panel-title {
          font-size: 1.2rem;
          font-weight: 700;
          background: linear-gradient(45deg, var(--accent-color), var(--accent-tertiary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .save-status {
          font-size: 0.9rem;
          color: var(--success-color);
        }

        /* CRITICAL FIX: Editor wrapper with explicit height constraint */
        .code-editor-wrapper {
          flex: 1;
          min-height: 0;
          max-height: calc(100% - 200px);
          overflow-y: auto;
          overflow-x: hidden;
          background: rgba(0, 0, 0, 0.3);
        }

        .code-footer {
          background: rgba(0, 0, 0, 0.3);
          padding: 1.5rem 2rem;
          border-top: 2px solid var(--border-color);
          display: flex;
          gap: 1.5rem;
          align-items: flex-end;
          flex-shrink: 0;
          min-height: 140px;
          max-height: 140px;
        }

        .input-area {
          flex: 1;
          background: rgba(0, 0, 0, 0.5);
          border: 2px solid var(--border-color);
          border-radius: 12px;
          padding: 1rem;
          color: var(--text-primary);
          font-family: inherit;
          font-size: 0.95rem;
          resize: none;
          height: 80px;
          transition: all 0.3s ease;
        }

        .input-area:focus {
          outline: none;
          border-color: var(--accent-color);
          box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
        }

        .run-btn {
          background: linear-gradient(45deg, var(--accent-color), var(--accent-tertiary));
          border: none;
          color: var(--primary-bg);
          padding: 1rem 2rem;
          border-radius: 15px;
          font-family: inherit;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          text-transform: uppercase;
          letter-spacing: 1px;
          min-width: 140px;
          height: 50px;
        }

        .run-btn:hover {
          transform: translateY(-5px) scale(1.05);
          box-shadow: 0 15px 40px rgba(0, 212, 255, 0.5);
        }

        .run-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        /* Output Panel */
        .output-panel {
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          box-shadow: var(--shadow-glow);
        }

        .output-header {
          background: rgba(0, 0, 0, 0.3);
          padding: 1.5rem 2rem;
          border-bottom: 1px solid var(--border-color);
          flex-shrink: 0;
        }

        .output-content {
          flex: 1;
          background: rgba(0, 0, 0, 0.5);
          padding: 2rem;
          color: var(--text-secondary);
          font-family: inherit;
          font-size: 0.95rem;
          line-height: 1.6;
          overflow-y: auto;
          white-space: pre-wrap;
          word-wrap: break-word;
          min-height: 0;
        }

        .output-content.success {
          color: var(--success-color);
          border-left: 4px solid var(--success-color);
        }

        .output-content.error {
          color: var(--error-color);
          border-left: 4px solid var(--error-color);
        }

        /* Scrollbar Styles */
        .code-editor-wrapper::-webkit-scrollbar,
        .output-content::-webkit-scrollbar {
          width: 8px;
        }

        .code-editor-wrapper::-webkit-scrollbar-track,
        .output-content::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }

        .code-editor-wrapper::-webkit-scrollbar-thumb,
        .output-content::-webkit-scrollbar-thumb {
          background: var(--accent-color);
          border-radius: 4px;
        }

        .code-editor-wrapper::-webkit-scrollbar-thumb:hover,
        .output-content::-webkit-scrollbar-thumb:hover {
          background: var(--accent-tertiary);
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .compiler-grid {
            grid-template-columns: 1fr;
            grid-template-rows: auto 500px 300px;
            height: auto;
            gap: 1.5rem;
          }

          .language-selector {
            flex-direction: row;
            flex-wrap: wrap;
            gap: 0.75rem;
          }

          .lang-btn {
            flex: 1;
            min-width: 80px;
          }

          .code-panel {
            height: 500px;
          }

          .output-panel {
            height: 300px;
          }
        }

        @media (max-width: 768px) {
          .code-compiler-desktop {
            padding: 0.75rem;
          }

          .compiler-grid {
            grid-template-rows: auto 400px 250px;
          }

          .code-footer {
            flex-direction: column;
            gap: 0.75rem;
            min-height: 160px;
            max-height: 160px;
            padding: 1rem;
          }

          .run-btn {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .code-compiler-desktop {
            padding: 0.5rem;
          }

          .compiler-grid {
            grid-template-rows: auto 350px 200px;
            gap: 0.5rem;
          }

          .code-panel {
            height: 350px;
          }

          .output-panel {
            height: 200px;
          }

          .code-header,
          .output-header {
            padding: 0.75rem;
          }

          .panel-title {
            font-size: 1rem;
          }

          .code-footer {
            min-height: 140px;
            max-height: 140px;
          }

          .input-area {
            height: 60px;
            font-size: 0.85rem;
          }

          .run-btn {
            padding: 0.75rem;
            font-size: 0.85rem;
            height: 40px;
          }
        }
      `}</style>
    </div>
  );
}

export default Editor;