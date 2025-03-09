import React, { useEffect } from "react";
import Monaco from "@monaco-editor/react";

const CodeEditor = ({ boiler, language, onChange }) => {
  return (
    <Monaco
      height="100%"
      language={language} 
      value={boiler} 
      theme="vs-dark"
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        lineNumbers: "on",
        scrollBeyondLastLine: false,
      }}
      onChange={(value) => {
        onChange(value); 
      }}
    />
  );
};

export default CodeEditor;
