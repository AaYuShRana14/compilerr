import Editor from "@monaco-editor/react";

function CodeEditor({ boiler, onChange, language }) {
  return (
    <Editor
      height="100%"
      defaultLanguage={language}
      value={boiler}
      onChange={(value) => onChange(value)}
      theme="vs-dark"
    />
  );
}
export default CodeEditor;