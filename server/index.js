const createClient=require('redis').createClient;
const express=require('express');
const cors=require('cors');
const ShortUniqueId=require('short-unique-id');
const uid = new ShortUniqueId();
const client=createClient();
const app=express();
app.use(express.json());
app.use(cors());
app.post('/compile',async(req,res)=>{
    const{code,lang,input}=req.body;
    try{
        const id=uid.rnd();
        await client.lPush('submissions',JSON.stringify({id,code,lang,input}));
        res.json({submissionId:id});
    }
    catch(err){
        console.log('Error while submitting code');
        res.status(500).send('Error while submitting code');
    }
});
app.get('/result/:id',async(req,res)=>{
    const{id}=req.params;
    try{
        const result=await client.get(id);
        if (result) {
            res.json(JSON.parse(result));
        } else {
            res.sendStatus(202); 
        }
    }
    catch(err){
        console.log('Error while fetching result');
        res.status(500).send('Error while fetching result');
    }
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