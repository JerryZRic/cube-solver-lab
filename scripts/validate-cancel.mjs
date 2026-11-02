// Real worker termination during WASM initialization/solve, followed by a fresh job.
import {Worker} from 'node:worker_threads';
import assert from 'node:assert/strict';
const run = new URL('./validate-wasm.mjs',import.meta.url);
const aborted = new Worker(run,{workerData:{n:5,name:'cancelled',moves:['3R','2F','2U']}});
let replied=false;aborted.on('message',()=>{replied=true;});
await new Promise(resolve=>setTimeout(resolve,100));
const start=performance.now();await aborted.terminate();
assert(!replied,'cancelled worker must not publish a solution');
const terminateMs=Math.round(performance.now()-start);
const result=await new Promise((resolve,reject)=>{const w=new Worker(run,{workerData:{n:4,name:'after-cancel',moves:['2R','F']}});const t=setTimeout(()=>{w.terminate();reject(new Error('fresh worker timeout'));},45000);w.once('message',r=>{clearTimeout(t);w.terminate();resolve(r);});w.once('error',reject);});
assert(result.ok);console.log(JSON.stringify({terminationPassed:true,terminateMs,freshWorker:result}));
