import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Editor from "./Editor";

// You can add more components/routes here as needed
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Editor />} />
        <Route path="/editor/:id" element={<Editor />} />
        {/* Example: <Route path="/" element={<Home />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;