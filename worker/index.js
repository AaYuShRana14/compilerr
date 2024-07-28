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
            const { lang, code } = JSON.parse(data);
            if (lang === "java") {
                JavaCompiler(code);
            }
        }
    } catch (err) {
        console.log(err);
    }
}
startWorker();
