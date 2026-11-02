import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { createCube, applyMove, cubeToFacelets, parseMove, scramble, isSolved } from '../src/cube.ts';
import { toReductionColors as toCandidateColors, fromReductionMoves as fromCandidateMoves } from '../src/reduction-adapter.ts';
function fromCandidateColors(colors,n){const order='URFDLB',upstream='UDFBLR';return [...order].flatMap(f=>Array.from(colors.slice(upstream.indexOf(f)*n*n,(upstream.indexOf(f)+1)*n*n),x=>upstream[x])).join('');}
const pkg = new URL('../src/vendor/cube_wasm.js',import.meta.url);
if(!isMainThread){
 const {default:init,CubeLab}=await import(pkg.href);await init({module_or_path:await readFile(new URL('../src/vendor/cube_wasm_bg.wasm',import.meta.url))});
 const {n,moves,name}=workerData;const state=createCube(n);moves.forEach(m=>applyMove(state,m));const start=performance.now();const lab=new CubeLab(n);
 try{assert(lab.load_face_colors(toCandidateColors(cubeToFacelets(state),n)));const result=JSON.parse(lab.solve(1,50));assert(result.found,JSON.stringify(result));const output=fromCandidateMoves(result.moves,n);output.forEach(m=>applyMove(state,m));assert(isSolved(state),'independent canonical replay');parentPort.postMessage({name,n,ok:true,elapsedMs:Math.round(performance.now()-start),steps:output.length,winner:result.winner});}catch(e){parentPort.postMessage({name,n,ok:false,elapsedMs:Math.round(performance.now()-start),error:String(e)});}finally{lab.free();}
}else{
 const {default:init,CubeLab}=await import(pkg.href);await init({module_or_path:await readFile(new URL('../src/vendor/cube_wasm_bg.wasm',import.meta.url))});
 let abi=0;
 for(const n of [4,5])for(const face of 'URFDLB')for(let depth=1;depth<=n;depth++)for(const suffix of ['',"'",'2']){
   const state=createCube(n);['R','U','2F',"L'"].forEach(m=>applyMove(state,m));const lab=new CubeLab(n);assert(lab.load_face_colors(toCandidateColors(cubeToFacelets(state),n)));const m=(depth===1?'':depth)+face+suffix,p=parseMove(m,n);for(let j=0;j<Math.abs(p.quarters);j++)lab.apply_design_move('xyz'.indexOf(p.axis),(p.layer+n-1)/2,Math.sign(p.quarters));applyMove(state,m);assert.equal(fromCandidateColors(lab.face_colors(n),n),cubeToFacelets(state),`${n}:${m}`);lab.free();abi++;
 }
 console.log(JSON.stringify({abiChecks:abi,ok:true}));
 const cases=[];
 for(const n of [4,5]){
  cases.push({n,name:`${n}-single-inner`,moves:['2R']},{n,name:`${n}-all-axis-inner`,moves:['2R',"2U'",'2F2','R','D']},{n,name:`${n}-whole-rotation`,moves:Array.from({length:n},(_,i)=>(i===0?'':i+1)+'R')});
  if(n===5)cases.push({n,name:'5-fixed-centers',moves:['3R','3U',"3F'"]});
  for(let seed=1;seed<=8;seed++){let v=seed*314159;const rng=()=>{v=(Math.imul(v,1664525)+1013904223)>>>0;return v/4294967296;};cases.push({n,name:`${n}-random-${seed}`,moves:scramble(n*6,rng,n)});}
 }
 const results=[];
 for(const c of cases){const r=await new Promise(resolve=>{const w=new Worker(new URL(import.meta.url),{workerData:c});let done=false;const finish=x=>{if(done)return;done=true;clearTimeout(timer);w.terminate();resolve(x);};const timer=setTimeout(()=>finish({...c,moves:undefined,ok:false,error:'45s hard timeout'}),45000);w.once('message',finish);w.once('error',e=>finish({name:c.name,n:c.n,ok:false,error:String(e)}));});results.push(r);console.log(JSON.stringify(r));await writeFile(new URL('../wasm-validation-results.json',import.meta.url),JSON.stringify({abiChecks:abi,results},null,2));}
 if(results.some(r=>!r.ok))process.exitCode=1;
}
