import React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";

const CodeEditor = ({ boiler, onChange, language }) => {
  const getExtensions = () => {
    switch (language) {
      case "javascript":
        return [javascript({ jsx: true })];
      case "java":
        return [java()];
      case "python":
        return [python()];
      case "cpp":
        return [cpp()];
      default:
        return [];
    }
  };

  return (
    <CodeMirror
      value={boiler}
      height="100%"
      extensions={getExtensions()}
      theme="dark"
      onChange={(value) => onChange(value)}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
        foldGutter: true,
        indentOnInput: true,
        autocompletion: true,
        bracketMatching: true,
      }}
      style={{
        fontFamily: "JetBrains Mono, monospace",
        fontSize: "0.95rem",
        lineHeight: "1.5",
      }}
    />
  );
};

export default CodeEditor;
