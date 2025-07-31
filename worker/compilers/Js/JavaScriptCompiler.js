const docker = require("dockerode")();
const JavaScriptCompiler = async ({ code, input }) => {
    return new Promise(async (resolve, reject) => {
        const cmdd = `echo '${code}' > Solution.js && echo "${input}" | node Solution.js`;
        const container = await docker.createContainer({
            Image: "node:latest",
            Tty: true,
            AttachStdout: true,
            AttachStderr: true,
            Cmd: ["/bin/bash", "-c", cmdd]
        });

        await container.start();
        const starttime = Date.now();
        const stream = await container.attach({ stream: true, stdout: true, stderr: true });
        const output = [];
        let timeoutReached = false;
        const timeout = setTimeout(async () => {
            timeoutReached = true;
            await container.stop();
            await container.remove();
            resolve({ result: "Time Limit Exceeded", executionTime: 5000 });
        }, 5000);

        stream.on("data", (chunk) => {
            if (timeoutReached) return;
            output.push(chunk);
        });

        stream.on("end", async () => {
            clearTimeout(timeout);
            if (!timeoutReached) {
                const endtime = Date.now();
                const result = Buffer.concat(output).toString("utf-8");
                await container.remove();
                resolve({ result, executionTime: endtime - starttime });
            }
        });

        stream.on("error", async (err) => {
            clearTimeout(timeout);
            await container.remove();
            reject(err);
        });
    });
};

module.exports = JavaScriptCompiler;
