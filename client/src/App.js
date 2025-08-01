import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import CodeEditor from "./Components/CodeEditor";
import "./App.css";

function App() {
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

  const [language, setLanguage] = useState("java");
  const [code, setCode] = useState(defaultCodes.java);
  const [output, setOutput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const outputRef = useRef(null);

  const submitHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setOutput(null);

    try {
      const res = await axios.post("http://localhost:8000/compile", {
        code,
        lang: language,
        input, 
      });
      const { submissionId } = res.data;

      async function pollResult() {
        try {
          const responseStatus = await axios.get(
            `http://localhost:8000/result/${submissionId}`
          );
          if (responseStatus.status === 202) {
            setTimeout(pollResult, 1000);
          } else {
            const { result, executionTime } = responseStatus.data;
            setOutput(result || "No output");
            setIsLoading(false);
          }
        } catch (error) {
          setOutput("Error fetching result");
          setIsLoading(false);
        }
      }
      pollResult();
    } catch (error) {
      setOutput("Compilation error");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const handleLanguageChange = (selectedLang) => {
    setLanguage(selectedLang);
    setCode(defaultCodes[selectedLang]);
    setOutput(null);
  };

  return (
    <div className="code-compiler-desktop">
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
            <span className="panel-title">{language.toUpperCase()} Code Editor</span>
          </div>
          <CodeEditor
            boiler={code}
            onChange={(newCode) => setCode(newCode)}
            language={language}
          />
          <div className="code-footer">
            <textarea
              className="input-area"
              placeholder="Enter input here (optional)"
              value={input}
              resize="none"
              onChange={(e) => setInput(e.target.value)}
            />
            <button className="run-btn" onClick={submitHandler} disabled={isLoading}>
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

export default App;
