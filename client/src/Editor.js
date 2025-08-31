import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import debounce from "lodash.debounce";
import CodeEditor from "./Components/CodeEditor";
import "./App.css";

function Editor() {
  const defaultCodes = {
    java: `public class Solution {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
    python: `print("Hello, World!")`,
    cpp: `#include <iostream>
int main() { std::cout << "Hello, World!" << std::endl; return 0; }`,
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
  const containerRef = useRef(null);

  // Suppress ResizeObserver errors
  useEffect(() => {
    const handleResizeObserverError = (e) => {
      if (e.message && (
        e.message.includes('ResizeObserver loop limit exceeded') ||
        e.message.includes('ResizeObserver loop completed with undelivered notifications')
      )) {
        e.stopImmediatePropagation();
      }
    };

    window.addEventListener('error', handleResizeObserverError);
    return () => window.removeEventListener('error', handleResizeObserverError);
  }, []);

  // Debounced autosave (per language)
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
        setSaveStatus("Error saving");
      }
    }, 1500),
    [id]
  );

  // On mount: create snippet if none exists
  useEffect(() => {
    if (!id) {
      axios
        .post("http://210.79.129.246:8000/snippets/new", {
          code,
          lang: language,
        })
        .then((res) => {
          const snippetId = res.data.snippetId;
          navigate(`/editor/${snippetId}`);
        })
        .catch((error) => {
          console.error("Error creating snippet:", error);
        });
    }
  }, []);

  // Load snippet for current language whenever id or language changes
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

  // Handle language change with smooth transition
  const handleLanguageChange = useCallback((selectedLang) => {
    // Use requestAnimationFrame to ensure smooth transitions
    requestAnimationFrame(() => {
      setLanguage(selectedLang);
      setOutput(null);
    });
  }, []);

  // Handle code change with debounced autosave
  const handleCodeChange = useCallback((newCode) => {
    requestAnimationFrame(() => {
      setCode(newCode);
      autosave(newCode, language);
    });
  }, [autosave, language]);

  // Submit (compile & run) with better error handling
  const submitHandler = async (e) => {
    e.preventDefault();
    
    // Use requestAnimationFrame for smooth UI updates
    requestAnimationFrame(() => {
      setIsLoading(true);
      setOutput(null);
    });

    try {
      const res = await axios.post("http://210.79.129.246:8000/compile", {
        code,
        lang: language,
        input,
      });
      const { submissionId } = res.data;

      async function pollResult() {
        try {
          const responseStatus = await axios.get(
            `http://210.79.129.246:8000/result/${submissionId}`
          );
          if (responseStatus.status === 202) {
            setTimeout(pollResult, 1000);
          } else {
            const { result } = responseStatus.data;
            // Use requestAnimationFrame for smooth output update
            requestAnimationFrame(() => {
              setOutput(result || "No output");
              setIsLoading(false);
            });
          }
        } catch (error) {
          requestAnimationFrame(() => {
            setOutput("Error fetching result");
            setIsLoading(false);
          });
        }
      }
      pollResult();
    } catch (error) {
      requestAnimationFrame(() => {
        setOutput("Compilation error");
        setIsLoading(false);
      });
    }
  };

  // Smooth scroll to bottom of output
  useEffect(() => {
    if (outputRef.current && output) {
      requestAnimationFrame(() => {
        outputRef.current.scrollTop = outputRef.current.scrollHeight;
      });
    }
  }, [output]);

  return (
    <div className="code-compiler-desktop" ref={containerRef}>
      <div className="compiler-grid">
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

        <div className="code-panel">
          <div className="code-header">
            <span className="panel-title">
              {language.toUpperCase()} Code Editor
              <span className="save-status"> ({saveStatus})</span>
            </span>
          </div>
          <CodeEditor
            boiler={code}
            onChange={handleCodeChange}
            language={language}
          />
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
    </div>
  );
}

export default Editor;