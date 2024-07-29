import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
function App() {
  const defaultCode = `public class Main {
    public static void main(String[] args) {
    }
}`;
const [code, setCode] = useState(defaultCode);
const [submissionid, setSubmissionId] = useState(null);
const[output,setOutput]=useState(null);
const submitHandler = async(e) => {
  e.preventDefault();
  const res=await axios.post('http://localhost:8000/compile', { code , lang: 'java' });
  const { submissionId } = res.data;
  setSubmissionId(submissionId);
  console.log(submissionId);
  async function pollResult() {
    const responseStatus=await axios.get(`http://localhost:8000/result/${submissionId}`);
    if(responseStatus.status===202){
      setTimeout(pollResult, 1000);
    }
    else{
      const {result,executionTime}=responseStatus.data;
      if(result){
        setOutput(result);
      }
      else{
        setOutput("Error");
      }
    }
  }
  pollResult();
}
  return (
    <div>
      <h1>Java</h1>
      <textarea type="text"  value={code} onChange={(e)=>{setCode(e.target.value)}}  />
      <button onClick={submitHandler}>Run</button>
      <div>
        <h1>Output</h1>
        <p>{output}</p>
      </div>
    </div>
  );
}

export default App;
