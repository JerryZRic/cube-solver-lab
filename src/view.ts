import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { type Cubie, type Face, type Move, parseMove } from './cube';

export const COLORS: Record<Face, string> = { U: '#f2f1e9', R: '#ec655e', F: '#4dc49b', D: '#f1cc55', L: '#f49d50', B: '#528cdb' };
export class CubeView {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  root = new THREE.Group();
  groups = new Map<string, THREE.Group>();
  stickers: THREE.Mesh[] = [];
  private bodyGeometry = new RoundedBoxGeometry(.96, .96, .96, 3, .065);
  private stickerGeometry = new RoundedBoxGeometry(.785, .785, .025, 3, .055);
  private bodyMaterial = new THREE.MeshStandardMaterial({color: '#172022', roughness: .38, metalness: .08});
  private materials = Object.fromEntries(Object.entries(COLORS).map(([key,color])=>[key,new THREE.MeshStandardMaterial({color, roughness:.28,metalness:.02})])) as unknown as Record<Face,THREE.Material>;
  private transition: {start:number,duration:number,pivot:THREE.Group,axis:'x'|'y'|'z',target:number,resolve:(value:boolean)=>void} | null = null;
  private raycaster = new THREE.Raycaster();
  onFaceClick?: (face:Face, inverse:boolean)=>void;
  turnMode = false;
  constructor(private container:HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({antialias:true,alpha:true});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    this.renderer.setClearColor(0x000000,0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.45;
    container.append(this.renderer.domElement);
    this.camera.position.set(6.8,5.5,8.3);
    this.controls = new OrbitControls(this.camera,this.renderer.domElement);
    this.controls.enableDamping = true; this.controls.dampingFactor=.07;
    this.controls.enablePan=false; this.controls.minDistance=7; this.controls.maxDistance=17;
    this.controls.target.set(0,0,0);
    this.scene.add(this.root);
    this.scene.add(new THREE.HemisphereLight('#f0fff5','#36454a',2.6));
    const light = new THREE.DirectionalLight('#fff9e8',4); light.position.set(3,7,5); this.scene.add(light);
    const rim = new THREE.DirectionalLight('#8bb6f3',2.5); rim.position.set(-5,2,-3); this.scene.add(rim);
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.25,2.26,100),new THREE.MeshBasicMaterial({color:'#30423b',transparent:true,opacity:.65,side:THREE.DoubleSide}));
    ring.rotation.x=-Math.PI/2; ring.position.y=-1.95; this.scene.add(ring);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.9,64),new THREE.MeshBasicMaterial({color:'#000000',transparent:true,opacity:.12,side:THREE.DoubleSide}));
    shadow.rotation.x=-Math.PI/2;shadow.position.y=-1.96;this.scene.add(shadow);
    new ResizeObserver(()=>this.resize()).observe(container);
    this.resize();
    let start={x:0,y:0};
    this.renderer.domElement.addEventListener('pointerdown',(e)=>{start={x:e.clientX,y:e.clientY};});
    this.renderer.domElement.addEventListener('pointerup',(e)=>{
      if(!this.turnMode || Math.hypot(start.x-e.clientX,start.y-e.clientY)>7 || this.transition) return;
      const rect=this.renderer.domElement.getBoundingClientRect();
      this.raycaster.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),this.camera);
      const hit=this.raycaster.intersectObjects(this.stickers)[0];
      if(hit) this.onFaceClick?.(hit.object.userData.worldFace,e.shiftKey);
    });
    this.renderer.setAnimationLoop((now)=>{
      if(this.transition){ const t=this.transition; const p=Math.min((now-t.start)/t.duration,1); const ease=p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2; t.pivot.rotation[t.axis]=t.target*ease;
        if(p>=1){this.transition=null;t.resolve(true);}
      }
      this.controls.update();this.renderer.render(this.scene,this.camera);
    });
  }
  resize(){const {width,height}=this.container.getBoundingClientRect(); if(!width||!height)return;this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.renderer.setSize(width,height);}
  home(){this.camera.position.set(6.8,5.5,8.3);this.controls.target.set(0,0,0);this.controls.update();}
  sync(cube:Cubie[]){
    this.root.clear();this.groups.clear();this.stickers=[];
    for(const cubie of cube){
      const group=new THREE.Group();group.position.set(...cubie.position);group.add(new THREE.Mesh(this.bodyGeometry,this.bodyMaterial));
      for(const sticker of cubie.stickers){
        const mesh=new THREE.Mesh(this.stickerGeometry,this.materials[sticker.face]);
        const normal=new THREE.Vector3(...sticker.normal);mesh.position.copy(normal).multiplyScalar(.487);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);
        const [x,y,z]=sticker.normal;mesh.userData.worldFace=x===1?'R':x===-1?'L':y===1?'U':y===-1?'D':z===1?'F':'B';
        group.add(mesh);this.stickers.push(mesh);
      }
      this.root.add(group);this.groups.set(cubie.id,group);
    }
  }
  animate(cube:Cubie[],move:Move,duration:number):Promise<boolean>{
    const {axis,layer,quarters}=parseMove(move);const index={x:0,y:1,z:2}[axis];const pivot=new THREE.Group();this.root.add(pivot);
    for(const c of cube)if(c.position[index]===layer)pivot.add(this.groups.get(c.id)!);
    return new Promise(resolve=>{this.transition={start:performance.now(),duration,pivot,axis,target:quarters*Math.PI/2,resolve};});
  }
  abort(){if(this.transition){this.transition.resolve(false);this.transition=null;}}
}
