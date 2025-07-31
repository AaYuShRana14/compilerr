const JavaCompiler = require("./compilers/Java/JavaCompiler");
const Cppcompiler = require("./compilers/Cpp/Cppcompiler");
const PythonCompiler = require("./compilers/Python/PythonCompiler");
const createClient = require("redis").createClient;
const client = createClient();
async function startWorker() {
    try {
        await client.connect();
        console.log("Connected to Redis");
        while (true) {
            const submission = await client.brPop("submissions", 0);
            const data = submission.element;
            const { lang, code ,id,input} = JSON.parse(data);
            if (lang === "java") {
                let res=await JavaCompiler({code,input});
                const {result,executionTime}=res;
            
                await client.set(id,JSON.stringify({result,executionTime}));
            }
            if(lang==="cpp"){
                let res=await Cppcompiler({code,input});
                const {result,executionTime}=res;
                await client.set(id,JSON.stringify({result,executionTime}));
            }
            if (lang === "python") {
                let res = await PythonCompiler({ code, input });
                const { result, executionTime } = res;
                await client.set(id, JSON.stringify({ result, executionTime }));
            }
        }
    } catch (err) {
        console.log(err);
    }
}
startWorker();