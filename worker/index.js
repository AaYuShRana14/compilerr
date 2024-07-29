const JavaCompiler = require("./compilers/Java/JavaCompiler");
const createClient = require("redis").createClient;
const client = createClient();
async function startWorker() {
    try {
        await client.connect();
        console.log("Connected to Redis");

        while (true) {
            const submission = await client.brPop("submissions", 0);
            const data = submission.element;
            const { lang, code ,id} = JSON.parse(data);
            if (lang === "java") {
                let res=await JavaCompiler(code);
                const {result,executionTime}=res;
                console.log(result,id);
                await client.set(id,JSON.stringify({result,executionTime}));
            }
        }
    } catch (err) {
        console.log(err);
    }
}
startWorker();
