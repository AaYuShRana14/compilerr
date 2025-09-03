const createClient=require('redis').createClient;
const express=require('express');
const cors=require('cors');
const ShortUniqueId=require('short-unique-id');
const uid = new ShortUniqueId();
const client = createClient({
  socket: {
    host: '127.0.0.1',  
    port: 6379
  }
});
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
app.post('/snippets/new', async (req, res) => {
  const { code, lang } = req.body;
  try {
    const id = uid.rnd();
    const snippetData = { [lang]: code }; 
    await client.set(id, JSON.stringify(snippetData), { EX: 3600 });
    res.json({ snippetId: id });
  } catch (err) {
    console.error('Error while saving snippet');
    res.status(500).send('Error while saving snippet');
  }
});

app.get('/snippets/:id/:lang', async (req, res) => {
  const { id, lang } = req.params;
  try {
    const snippet = await client.get(id);
    if (!snippet) return res.status(404).send('Snippet not found');

    const snippetData = JSON.parse(snippet);
    const code = snippetData[lang] || null;

    res.json({ code, lang });
  } catch (err) {
    console.error('Error while fetching snippet');
    res.status(500).send('Error while fetching snippet');
  }
});
app.post('/snippets/:id/autosave', async (req, res) => {
  const { id } = req.params;
  const { code, lang } = req.body;
  try {
    const snippet = await client.get(id);
    if (!snippet) return res.status(404).send('Snippet not found');

    const snippetData = JSON.parse(snippet);
    snippetData[lang] = code; 

    await client.set(id, JSON.stringify(snippetData), { EX: 3600 });
    res.json({ message: `Snippet autosaved successfully for ${lang}` });
  } catch (err) {
    console.error('Error while autosaving snippet:', err);
    res.status(500).send('Error while autosaving snippet');
  }
});


app.listen(8000, "0.0.0.0", () => {
    startServer();
    console.log("Server started on http://0.0.0.0:8000");
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