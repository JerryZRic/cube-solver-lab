import './style.css';
import { applyMove, MIN_ORDER, MAX_ORDER, cubeToFacelets, isSolved, parseAlgorithm, inverseMove, scramble, type Face, type Move } from './cube';
import { CubeView, COLORS } from './view';
import { CubeSession } from './session';

const icons:Record<string,string>={shuffle:'<path d="M4 6h3c4 0 6 12 10 12h3M17 15l3 3-3 3M4 18h3c1.2 0 2.3-1 3.3-2.5M14 8.5C15 7 16 6 17 6h3M17 3l3 3-3 3"/>',reset:'<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',play:'<path d="m9 5 10 7-10 7z"/>',pause:'<path d="M8 5v14M16 5v14"/>',next:'<path d="m5 5 10 7-10 7zM19 5v14"/>',prev:'<path d="m19 5-10 7 10 7zM5 5v14"/>',spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',home:'<path d="m3 12 9-9 9 9M6 10v11h12V10M10 21v-7h4v7"/>',arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>'};
const icon=(name:string)=>`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||''}</svg>`;
const faceNames:Record<Face,string>={U:'上',R:'右',F:'前',D:'下',L:'左',B:'后'};
const faces:Face[]=['U','R','F','D','L','B'];
document.querySelector<HTMLDivElement>('#app')!.innerHTML=`
<header class="topbar"><a class="brand" href="./" aria-label="Cube Lab 首页"><img src="./favicon.svg" alt=""/><span>CUBE<span class="brand-light">LAB</span></span><span class="brand-cn">魔方实验室</span></a><div class="header-right"><span class="lab-tag"><span></span> 研究原型 v0.3</span><span class="stack-label">N × N · THREE.JS</span></div></header>
<main><section class="intro"><div><p class="eyebrow">EXPLORE · SCRAMBLE · SOLVE</p><h1>让每一步，<span>都看得见。</span></h1><p class="intro-text">一个魔方，千万种可能。从打乱到复原，探索三维空间里的秩序。</p></div><div class="intro-note"><span class="dot"></span> <b id="order-display">3 × 3 × 3</b><span>浏览器本地计算 · 无需上传</span></div></section>
<section class="configuration-panel" aria-label="魔方阶数设置"><div class="config-title"><span class="eyebrow">DIMENSIONS</span><h2>选择你的维度</h2></div><div class="order-presets" aria-label="预设阶数">${[2,3,4,5].map(n=>`<button data-order="${n}" aria-pressed="${n===3}"><b>${n}</b><span>阶</span></button>`).join('')}</div><form id="custom-order-form" class="custom-order" novalidate><label for="custom-order">自定义</label><input id="custom-order" type="number" min="2" max="10" step="1" value="3" inputmode="numeric" aria-describedby="order-hint order-error"/><span>阶</span><button class="quiet-button" type="submit">应用</button></form><p id="order-hint" class="order-hint">支持 2–10 阶；切换会清空状态与回放<br/>高阶更耗性能，手机建议先试 2–5 阶</p><p id="order-error" class="order-error" role="alert" hidden></p></section><div class="workspace"><section class="stage-panel" aria-label="三维魔方交互区"><div class="stage-top"><div class="status-pill" id="cube-status"><span></span> 已复原</div><div class="view-actions"><button id="turn-mode" class="quiet-button" aria-pressed="false" title="启用后点按色块可顺时针旋转对应面">点按转面</button><button id="view-home" class="icon-button" title="重置观察视角" aria-label="重置观察视角">${icon('home')}</button></div></div><div class="stage-watermark" id="stage-watermark" aria-hidden="true">3³</div><div id="viewport" aria-label="可用鼠标拖动观察的多阶魔方"></div><div class="stage-bottom"><span class="orbit-hint"><span class="mouse-icon"></span><span id="interaction-hint">拖动旋转视角<span class="hint-sep">·</span>滚轮缩放</span></span><span class="axis-hint"><b style="color:var(--green)">F</b> 前 <b style="color:var(--red)">R</b> 右 <b style="color:#efeee6">U</b> 上</span></div><div class="webgl-error" id="webgl-error" hidden><strong>此浏览器无法启动 WebGL</strong><p>请开启硬件加速，或使用新版 Chrome / Safari / Edge。二维状态与求解仍可使用。</p></div></section>
<aside class="control-panel"><section class="control-section"><div class="section-heading"><span class="section-index">01</span><h2>开始探索</h2><span class="tiny-label">EXPERIMENT</span></div><div class="primary-actions"><button id="scramble" class="button secondary">${icon('shuffle')} 随机打乱</button><button id="reset" class="button ghost">${icon('reset')} 复原</button></div><div class="turn-heading"><span>手动转动</span><div class="direction-toggle" aria-label="转动方向"><button id="clockwise" aria-pressed="true">顺时针</button><button id="counter" aria-pressed="false">逆时针 ′</button></div></div><div class="layer-control"><label for="layer">转动层</label><select id="layer" aria-label="转动层"><option value="1">外层 · 第 1 层</option></select><span id="layer-hint">从所选面向内计数</span></div><div class="face-buttons">${faces.map(f=>`<button class="face-button" data-face="${f}" aria-label="旋转${faceNames[f]}面 ${f}"><i style="background:${COLORS[f]}"></i><b>${f}</b><span>${faceNames[f]}</span></button>`).join('')}</div><p class="micro-hint">键盘 U R F D L B 转面，按住 Shift 反向</p><button id="solve" class="button solve-button">${icon('spark')} <span>计算复原步骤</span> ${icon('arrow')}</button><p class="solver-note" id="solver-note">两阶段算法 · 直接求解当前状态，非倒放打乱记录</p></section>
<section class="control-section solution-section"><div class="section-heading"><span class="section-index">02</span><h2 id="playback-title">求解回放</h2><span class="move-count" id="move-count">— 步</span></div><div id="solution-empty" class="solution-empty"><div class="empty-cube">${icon('spark')}</div><p>从混乱中，找到秩序</p><span id="empty-caption">先打乱魔方，再计算一条复原路径</span></div><div id="solution-content" hidden><div class="playback-progress"><span id="progress-label">0 / 0</span><span id="next-label">准备开始</span></div><div class="progress-track"><div id="progress-fill"></div></div><div class="notation" id="notation" aria-label="求解步骤"></div></div><div class="playback-controls"><button id="step-back" class="icon-button" title="上一步" aria-label="上一步">${icon('prev')}</button><button id="play" class="button play-button">${icon('play')} 播放</button><button id="step-next" class="icon-button" title="下一步" aria-label="下一步">${icon('next')}</button><label class="speed-label" for="speed">速度<select id="speed" aria-label="播放速度"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option><option value="2">2×</option><option value="3">3×</option></select></label></div><p class="live-message" id="message" role="status" aria-live="polite">准备好了，试着转动一面吧。</p></section></aside>
<section class="bottom-panel"><div class="net-heading"><p class="eyebrow">LIVE STATE</p><h2>展开来看</h2><p>与 3D 状态实时同步</p></div><div id="cube-net" class="cube-net" aria-label="魔方六面展开图">${faces.map(f=>`<div class="net-face net-${f}" data-net="${f}" aria-label="${faceNames[f]}面"><span>${f}</span><div>${Array(9).fill('<i></i>').join('')}</div></div>`).join('')}</div><div class="last-alg"><span class="tiny-label">最近一次打乱</span><p id="scramble-text">尚未打乱。试试右侧的随机打乱。</p><span class="notation-help">2R = 从右侧数第 2 层（非宽转）<br/>R = 右面顺时针 90° <b>·</b> R′ = 逆时针 <b>·</b> R2 = 180°<br/>方向均以正对该面观察为准</span></div></section></div>
<footer><span>一个关于空间、逻辑与秩序的小实验。 <a href="./source/cube-lab-source.tar.gz" download>源码</a> · <a href="./LICENSE.txt">GPLv3 许可</a></span><span>Three.js + TypeScript <i>／</i> 2–10 Research Prototype</span></footer></main>`;
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const session=new CubeSession(3);
let view:CubeView|null=null;
try{view=new CubeView($('viewport'));view.sync(session.cube);}catch(error){console.error(error);$('webgl-error').hidden=false;}
let busy=false, solving=false, playing=false, inverse=false, depth=1;
let solution:Move[]=[],cursor=0,speed=1;
let worker:Worker|null=null, solveToken:{epoch:number,id:number}|null=null;
let solverTimer:ReturnType<typeof setTimeout>|undefined;
const message=(value:string)=>{$('message').textContent=value;};
const trueSolver=()=>session.order>=2&&session.order<=5;
function clearSolution(){solution=[];cursor=0;playing=false;}
function selectedMove(face:Face, reverse=inverse):Move{return `${depth===1?'':depth}${face}${reverse?"'":''}`;}
function renderFaces(){
  document.querySelectorAll<HTMLButtonElement>('[data-face]').forEach(el=>{const face=el.dataset.face as Face;el.querySelector('b')!.textContent=selectedMove(face).replace("'",'′');el.setAttribute('aria-label',`旋转${faceNames[face]}面第 ${depth} 层 ${selectedMove(face)}`);});
}
function renderOrder(){
  const n=session.order;
  $('order-display').textContent=`${n} × ${n} × ${n}`;$('stage-watermark').textContent=`${n}³`;
  document.querySelectorAll<HTMLButtonElement>('[data-order]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.order)===n)));
  $('custom-order-form').classList.toggle('active',n>5);$('custom-order').setAttribute('max',String(MAX_ORDER));$('custom-order').setAttribute('min',String(MIN_ORDER));$('custom-order').setAttribute('value',String(n));($('custom-order') as HTMLInputElement).value=String(n);
  const maxDepth=n>=4?Math.ceil(n/2):1;
  $('layer').innerHTML=Array.from({length:maxDepth},(_,i)=>`<option value="${i+1}">${i===0?'外层':'内层'} · 第 ${i+1} 层</option>`).join('');
  $('layer-hint').textContent=n<4?'2 / 3 阶暂支持外层':'从所选面向内计数';
  $('cube-net').style.setProperty('--order',String(n));
  $('cube-net').innerHTML=faces.map(f=>`<div class="net-face net-${f}" data-net="${f}" aria-label="${faceNames[f]}面"><span>${f}</span><div>${Array(n*n).fill('<i></i>').join('')}</div></div>`).join('');
  $('playback-title').textContent=trueSolver()?'求解回放':'历史逆序回放';
  $('empty-caption').textContent=trueSolver()?'先打乱魔方，再计算一条复原路径':'记录所有操作，再按历史逆序返回复原状态';
  $('solver-note').textContent=trueSolver()?`${n===2?'二阶角块映射':n===3?'三阶两阶段':'WASM 降阶算法'} · 独立计算当前状态，非倒放记录；非最短解${n>=4?'，可能数百至上千步':''}`:`${n} 阶未接入独立求解器 · 仅撤销本页完整历史（含手动操作）`;
  renderFaces();
}
function redraw(){
  const solved=isSolved(session.cube);$('cube-status').innerHTML=`<span></span> ${solving?'正在求解':busy?'转动中':solved?'已复原':'探索中'} <small>${session.order} 阶</small>`;$('cube-status').classList.toggle('is-solved',solved);
  $('scramble').toggleAttribute('disabled',busy||solving);$('solve').toggleAttribute('disabled',busy||solving||solved);
  $('layer').toggleAttribute('disabled',busy||solving||session.order<4);
  document.querySelectorAll<HTMLButtonElement>('[data-face]').forEach(b=>b.disabled=busy||solving);
  $('solve').querySelector('span')!.textContent=solving?'正在计算…':trueSolver()?'计算复原步骤':'按历史逆序复原';
  $('step-back').toggleAttribute('disabled',busy||solving||playing||cursor===0);
  $('step-next').toggleAttribute('disabled',busy||solving||playing||cursor>=solution.length);
  $('play').toggleAttribute('disabled',solving||solution.length===0||(!playing&&busy)||cursor>=solution.length);
  $('play').innerHTML=playing?`${icon('pause')} 暂停`:`${icon('play')} ${cursor===solution.length&&solution.length?'已完成':'播放'}`;
  $('solution-empty').hidden=solution.length>0;$('solution-content').hidden=solution.length===0;
  $('move-count').textContent=solution.length?`${solution.length} 步`:'— 步';
  $('progress-label').textContent=`${cursor} / ${solution.length}`;
  $('next-label').textContent=cursor===solution.length?'复原完成':`下一步 ${(solution[cursor]||'—').replace("'",'′')}`;
  $('progress-fill').style.width=`${solution.length?cursor/solution.length*100:0}%`;
  $('notation').innerHTML=solution.map((m,i)=>`<span class="${i<cursor?'done':i===cursor?'current':''}" ${i===cursor?'aria-current="step"':''}><small>${i+1}</small>${m.replace("'",'′')}</span>`).join('');
  const facelets=cubeToFacelets(session.cube),faceSize=session.order**2;
  faces.forEach((face,fi)=>document.querySelectorAll<HTMLElement>(`[data-net="${face}"] i`).forEach((el,i)=>{el.style.background=COLORS[facelets[fi*faceSize+i] as Face];}));
}
async function turn(move:Move,duration=330/speed,epoch=session.epoch){
  if(epoch!==session.epoch)return false;
  const finished=view?await view.animate(session.cube,move,duration):await new Promise<boolean>(resolve=>setTimeout(()=>resolve(true),duration));
  if(!finished||!session.commit(move,epoch))return false;
  view?.sync(session.cube);redraw();return true;
}
async function manual(move:Move){
  if(busy||solving)return;clearSolution();busy=true;redraw();const epoch=session.epoch;
  if(await turn(move)){busy=false;message(`已转动 ${move.replace("'",'′')} · ${isSolved(session.cube)?'魔方已复原。':trueSolver()?'可继续探索，或计算复原路径。':'已加入历史，可随时逆序复原。'}`);redraw();}
  else if(epoch===session.epoch){busy=false;redraw();}
}
function makeWorker(){
  const instance=new Worker(new URL('./solver.worker.ts',import.meta.url),{type:'module'});worker=instance;
  instance.onmessage=(event:MessageEvent<{id:number,algorithm?:string,error?:string}>)=>{
    const data=event.data;if(worker!==instance||!solveToken||data.id!==solveToken.id||!session.acceptsRequest(solveToken)||!solving||!trueSolver())return;
    clearTimeout(solverTimer);solving=false;
    if(data.error){message(`求解失败：${data.error}。请重试或复原。`);redraw();return;}
    try{const moves=parseAlgorithm(data.algorithm||'',session.order);const check=structuredClone(session.cube);moves.forEach(m=>applyMove(check,m));if(!isSolved(check))throw new Error('结果校验未通过');solution=moves;cursor=0;message(`找到 ${moves.length} 步独立求解路径。点击播放，或逐步观察。`);}
    catch{message('求解结果校验未通过，请重试。');clearSolution();}redraw();
  };
  instance.onerror=()=>{if(worker!==instance||!solving)return;clearTimeout(solverTimer);solving=false;instance.terminate();worker=null;message('求解器加载失败，可重新点击计算。');redraw();};
}
if(!view){$('turn-mode').setAttribute('disabled','');$('view-home').setAttribute('disabled','');$('interaction-hint').textContent='3D 不可用 · 可通过下方展开图与右侧按钮操作';}
function resetState(order=session.order){
  const changed=order!==session.order;
  session.reset(order);clearTimeout(solverTimer);solveToken=null;
  if(solving){worker?.terminate();worker=null;}view?.abort();clearSolution();busy=false;solving=false;depth=1;
  view?.sync(session.cube);$('scramble-text').textContent='尚未打乱。试试右侧的随机打乱。';$('order-error').hidden=true;
  renderOrder();message(changed?`已切换为 ${order} 阶，旧状态、动画与回放已清空。${trueSolver()?'支持独立求解（非最短解）。':'此阶数仅支持操作历史逆序复原。'}`:'已复原。所有转动和待返回的求解结果已取消。');redraw();
}
document.querySelectorAll<HTMLButtonElement>('[data-order]').forEach(b=>b.onclick=()=>{if(Number(b.dataset.order)!==session.order)resetState(Number(b.dataset.order));});
$('custom-order-form').onsubmit=e=>{
  e.preventDefault();const raw=($('custom-order') as HTMLInputElement).value.trim(),n=Number(raw);
  if(!raw||!Number.isInteger(n)||n<MIN_ORDER||n>MAX_ORDER){$('order-error').textContent=`请输入 ${MIN_ORDER}–${MAX_ORDER} 之间的整数；当前魔方未改变。`;$('order-error').hidden=false;return;}
  if(n!==session.order)resetState(n);else{$('order-error').hidden=true;message(`当前已经是 ${n} 阶。`);}
};
$('layer').onchange=e=>{depth=Number((e.target as HTMLSelectElement).value);renderFaces();};
$('scramble').onclick=async()=>{
  if(busy||solving)return;clearSolution();busy=true;const epoch=session.epoch;
  const count=session.order===2?12:session.order===3?20:Math.min(50,session.order*6);
  const moves=scramble(count,Math.random,session.order);$('scramble-text').textContent=moves.join(' ').replaceAll("'",'′');message(`正在执行 ${count} 步随机打乱${session.order>=4?'（含内层）':''}…`);redraw();
  for(const move of moves)if(!await turn(move,80,epoch))return;
  if(epoch!==session.epoch)return;busy=false;message(trueSolver()?'打乱完成。自由转动，或试试独立求解。':'打乱完成。可继续转动；历史逆序复原不是独立求解器。');redraw();
};
$('reset').onclick=()=>resetState();
$('solve').onclick=()=>{
  if(busy||solving||isSolved(session.cube))return;clearSolution();
  if(!trueSolver()){
    const moves=session.inverseHistory(),check=structuredClone(session.cube);moves.forEach(m=>applyMove(check,m));
    if(!moves.length||!isSolved(check)){message('当前历史不足以复原，请使用“复原”重置。');redraw();return;}
    solution=moves;message(`生成 ${moves.length} 步历史逆序路径（含手动转动）；这不是独立求解。`);redraw();return;
  }
  solving=true;const token=session.beginRequest();solveToken=token;message(`正在从当前 ${session.order} 阶状态计算…首次需初始化求解表。${session.order>=4?'可用“复原”或切换阶数取消；最多等待 45 秒。':''}`);redraw();
  try{if(!worker)makeWorker();worker!.postMessage({id:token.id,order:session.order,facelets:cubeToFacelets(session.cube)});}
  catch{solving=false;worker=null;message('浏览器无法启动求解线程，请重试。');redraw();return;}
  solverTimer=setTimeout(()=>{if(!session.acceptsRequest(token)||!solving)return;worker?.terminate();worker=null;solving=false;message('此次计算超时，请重新计算。');redraw();},45000);
};
$('play').onclick=async()=>{
  if(playing){playing=false;message('已暂停，将完成当前转动。');redraw();return;}
  if(busy||solving||cursor>=solution.length)return;playing=true;busy=true;const epoch=session.epoch;message(trueSolver()?'正在按求解路径复原…':'正在逆序撤销历史操作（非独立求解）…');redraw();
  while(playing&&cursor<solution.length&&epoch===session.epoch){if(!await turn(solution[cursor],330/speed,epoch))return;cursor++;redraw();}
  if(epoch!==session.epoch)return;playing=false;busy=false;message(cursor===solution.length?'复原完成。秩序，回来了。':'回放已暂停，可逐步查看或继续播放。');redraw();
};
async function step(direction:number){
  if(busy||solving||playing||direction<0&&cursor===0||direction>0&&cursor>=solution.length)return;busy=true;const epoch=session.epoch;redraw();const move=direction>0?solution[cursor]:inverseMove(solution[cursor-1]);
  if(await turn(move)){cursor+=direction;busy=false;message(cursor===solution.length?'复原完成。秩序，回来了。':`当前进度：${cursor} / ${solution.length} 步。`);redraw();}
  else if(epoch===session.epoch){busy=false;redraw();}
}
$('step-back').onclick=()=>void step(-1);$('step-next').onclick=()=>void step(1);
$('speed').onchange=e=>{speed=Number((e.target as HTMLSelectElement).value);};
function setInverse(value:boolean){inverse=value;$('clockwise').setAttribute('aria-pressed',String(!value));$('counter').setAttribute('aria-pressed',String(value));renderFaces();}
$('clockwise').onclick=()=>setInverse(false);$('counter').onclick=()=>setInverse(true);
document.querySelectorAll<HTMLButtonElement>('[data-face]').forEach(el=>el.onclick=()=>void manual(selectedMove(el.dataset.face as Face)));
$('view-home').onclick=()=>view?.home();
$('turn-mode').onclick=()=>{if(!view)return;view.turnMode=!view.turnMode;$('turn-mode').setAttribute('aria-pressed',String(view.turnMode));$('interaction-hint').textContent=view.turnMode?'点按色块转所选层 · Shift 反向 · 拖动观察':'拖动旋转视角 · 滚轮缩放';};
if(view)view.onFaceClick=(face,shift)=>void manual(selectedMove(face,shift!==inverse));
window.addEventListener('keydown',e=>{if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||(e.target as HTMLElement).matches('input,select,textarea,[contenteditable=true]'))return;const face=e.key.toUpperCase() as Face;if(faces.includes(face)){e.preventDefault();void manual(selectedMove(face,e.shiftKey));}});
renderOrder();redraw();
