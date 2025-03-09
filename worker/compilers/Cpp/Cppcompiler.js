const docker=require("dockerode")();
const Cppcompiler=async({code,input})=>{
    return new Promise(async(resolve,reject)=>{
        const cmdd=`echo '${code}' > Solution.cpp && g++ Solution.cpp -o Solution && echo "${input}" | ./Solution`;
        const container=await docker.createContainer({
            Image:"gcc",
            Tty:true,
            AttachStdout:true,
            AttachStderr:true,
            Cmd:["/bin/bash","-c",cmdd]
        });
        await container.start();
        const starttime=Date.now();
        const stream=await container.attach({stream:true,stdout:true,stderr:true});
        const output=[];
        let timeoutReached=false;
        const timeout=setTimeout(async()=>{
            timeoutReached=true;
            await container.stop();
            await container.remove();
            resolve({result:"Time Limit Exceeded",executionTime:5000});
        },5000);
        stream.on("data",(chunk)=>{
            if(timeoutReached)
                return;
            output.push(chunk);
        });
        stream.on("end",async()=>{
            clearTimeout(timeout);
            if(!timeoutReached){
                const endtime=Date.now();
                const result=Buffer.concat(output).toString("utf-8");
                await container.remove();
                resolve({result,executionTime:endtime-starttime});
            }
        });
        stream.on("error",async(err)=>{
            clearTimeout(timeout);
            await container.remove();
            reject(err);
        });
    });
}
module.exports=Cppcompiler;
