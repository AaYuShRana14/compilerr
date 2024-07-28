const docker = require("dockerode")();
const JavaCompiler = async (code) => {
  const cmdd = `echo '${code}' > Main.java && javac Main.java && java Main`;
  const container = await docker.createContainer({
    Image: "openjdk",
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
    console.log("Time Limit Exceeded");
    await container.stop();
    await container.remove();
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
      console.log(result, `Execution Time: ${endtime - starttime}ms`);
      await container.remove();
    }
  });
};

module.exports = JavaCompiler;
