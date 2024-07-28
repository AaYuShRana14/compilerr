import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
function App() {
  const defaultCode = `public class Main {
    public static void main(String[] args) {
    }
}`;
const [code, setCode] = useState(defaultCode);
const submitHandler = (e) => {
  e.preventDefault();
  axios.post('http://localhost:8000/compile', { code , lang: 'java' });
}
  return (
    <div>
      <h1>Java</h1>
      <textarea type="text"  value={code} onChange={(e)=>{setCode(e.target.value)}}  />
      <button onClick={submitHandler}>Run</button>
    </div>
  );
}

export default App;
