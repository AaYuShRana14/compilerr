const createClient=require('redis').createClient;
const express=require('express');
const cors=require('cors');
const client=createClient();
const app=express();
app.use(express.json());
app.use(cors());
app.post('/compile',async(req,res)=>{
    const{code,lang}=req.body;
    try{
        await client.lPush('submissions',JSON.stringify({code,lang}));
    }
    catch(err){
        console.log('Error while submitting code');
        res.status(500).send('Error while submitting code');
    }
    res.json('Code submitted successfully');
});
app.listen(8000,()=>{
    startServer();
    console.log('Server started on http://localhost:8000');
});
async function startServer(){
    try{
        await client.connect();
        console.log('Connected to Redis');
    }
    catch(err){
        console.log('Error while connecting to Redis');
    }
}