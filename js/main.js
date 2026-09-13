
const nav=document.querySelector('.nav');
window.addEventListener('scroll',()=>nav?.classList.toggle('scrolled',scrollY>30));
const menu=document.querySelector('.menu'),links=document.querySelector('.nav-links');
menu?.addEventListener('click',()=>links.classList.toggle('open'));
document.querySelectorAll('.nav-links a').forEach(a=>a.addEventListener('click',()=>links?.classList.remove('open')));

const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(e=>observer.observe(e));

const cursor=document.querySelector('.cursor');
window.addEventListener('mousemove',e=>{if(cursor){cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px'}});
document.querySelectorAll('a,button,.project').forEach(el=>{
 el.addEventListener('mouseenter',()=>{if(cursor){cursor.style.width='34px';cursor.style.height='34px';cursor.style.background='rgba(184,255,61,.14)'}});
 el.addEventListener('mouseleave',()=>{if(cursor){cursor.style.width='18px';cursor.style.height='18px';cursor.style.background='transparent'}});
});

document.querySelectorAll('.project').forEach(card=>{
 card.addEventListener('mousemove',e=>{
   const r=card.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
   card.style.transform=`perspective(900px) rotateX(${(y/r.height-.5)*-5}deg) rotateY(${(x/r.width-.5)*6}deg) translateY(-4px)`;
 });
 card.addEventListener('mouseleave',()=>card.style.transform='');
});

const filterButtons=document.querySelectorAll('[data-filter]');
const cards=document.querySelectorAll('[data-category]');
filterButtons.forEach(btn=>btn.addEventListener('click',()=>{
 filterButtons.forEach(b=>b.classList.remove('active'));btn.classList.add('active');
 const f=btn.dataset.filter;
 cards.forEach(c=>c.style.display=(f==='all'||c.dataset.category.includes(f))?'block':'none');
}));

const modal=document.querySelector('.modal');
document.querySelectorAll('.project').forEach(card=>card.addEventListener('click',()=>{
 if(!modal)return;
 modal.querySelector('.modal-img').src=card.dataset.image;
 modal.querySelector('.modal-title').textContent=card.dataset.title;
 modal.querySelector('.modal-text').textContent=card.dataset.description;
 modal.classList.add('open');document.body.style.overflow='hidden';
}));
function closeModal(){modal?.classList.remove('open');document.body.style.overflow=''}
document.querySelector('.modal-close')?.addEventListener('click',closeModal);
modal?.addEventListener('click',e=>{if(e.target===modal)closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});

document.querySelectorAll('.counter').forEach(el=>{
 const target=+el.dataset.target;let done=false;
 const io=new IntersectionObserver(es=>{if(es[0].isIntersecting&&!done){done=true;let n=0;const step=Math.max(1,Math.ceil(target/35));const t=setInterval(()=>{n=Math.min(target,n+step);el.textContent=n+(el.dataset.suffix||'');if(n>=target)clearInterval(t)},25)}});io.observe(el);
});
const year=document.querySelector('[data-year]');if(year)year.textContent=new Date().getFullYear();

const video=document.querySelector('#heroVideo');
if(video){
 video.addEventListener('canplay',()=>{document.querySelector('.video-wrap').style.display='block'});
 video.addEventListener('error',()=>{document.querySelector('.video-wrap').style.display='none'});
 video.load();
}

// REAL-TIME THREE.JS BACKGROUND
async function init3D(){
 const canvas=document.querySelector('#webgl');
 if(!canvas) return;
 const THREE=await import('https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js');

 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,.1,100);
 camera.position.set(0,0,8);

 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
 renderer.setSize(innerWidth,innerHeight);
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.15;

 const group=new THREE.Group();scene.add(group);
 const wireMat=new THREE.MeshPhysicalMaterial({
   color:0xb8ff3d,metalness:.7,roughness:.19,transmission:.08,transparent:true,opacity:.72,
   emissive:0x193d00,emissiveIntensity:.25,wireframe:true
 });
 const solidMat=new THREE.MeshPhysicalMaterial({
   color:0x142018,metalness:.95,roughness:.2,clearcoat:1,clearcoatRoughness:.1,
   emissive:0x061000,emissiveIntensity:.35
 });
 const core=new THREE.IcosahedronGeometry(1.72,5);
 const coreMesh=new THREE.Mesh(core,solidMat);group.add(coreMesh);
 const wire=new THREE.Mesh(new THREE.IcosahedronGeometry(1.82,4),wireMat);group.add(wire);

 for(let i=0;i<8;i++){
   const ring=new THREE.Mesh(new THREE.TorusGeometry(2.15+i*.17,.008+(i%2)*.004,8,160),new THREE.MeshBasicMaterial({color:0xb8ff3d,transparent:true,opacity:.20}));
   ring.rotation.set(Math.random()*2,Math.random()*2,Math.random()*2);ring.userData.speed=(.15+Math.random()*.4)*(i%2?1:-1);group.add(ring);
 }
 const nodes=new THREE.Group();
 const nodeMat=new THREE.MeshBasicMaterial({color:0xb8ff3d});
 const nodeGeo=new THREE.SphereGeometry(.018,8,8);
 for(let i=0;i<150;i++){
   const p=new THREE.Mesh(nodeGeo,nodeMat);
   const r=3.2+Math.random()*4.8, a=Math.random()*Math.PI*2,b=Math.acos(2*Math.random()-1);
   p.position.set(r*Math.sin(b)*Math.cos(a),r*Math.sin(b)*Math.sin(a),r*Math.cos(b));
   p.userData.phase=Math.random()*Math.PI*2;nodes.add(p);
 }
 scene.add(nodes);

 const grid=new THREE.GridHelper(22,44,0x273220,0x131815);
 grid.position.y=-3.1;grid.rotation.x=.15;grid.material.transparent=true;grid.material.opacity=.18;scene.add(grid);

 const ambient=new THREE.HemisphereLight(0xffffff,0x102000,1.2);scene.add(ambient);
 const key=new THREE.PointLight(0xb8ff3d,55,18);key.position.set(4,2,4);scene.add(key);
 const fill=new THREE.PointLight(0x5577ff,16,16);fill.position.set(-5,-1,2);scene.add(fill);

 let mx=0,my=0,sx=0,sy=0,scroll=0;
 addEventListener('mousemove',e=>{mx=(e.clientX/innerWidth-.5);my=(e.clientY/innerHeight-.5)});
 addEventListener('scroll',()=>scroll=scrollY);
 addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.75))});

 const clock=new THREE.Clock();
 function animate(){
   const t=clock.getElapsedTime();
   requestAnimationFrame(animate);
   sx+=(mx-sx)*.035;sy+=(my-sy)*.035;
   const scrollFactor=Math.min(scroll/(innerHeight||800),4);
   group.rotation.y=t*.22+sx*.45;
   group.rotation.x=Math.sin(t*.35)*.18+sy*.22+scrollFactor*.12;
   coreMesh.rotation.x=-t*.18;coreMesh.rotation.y=t*.26;
   wire.rotation.x=t*.12;wire.rotation.z=-t*.17;
   group.position.x=2.2+sx*.65-scrollFactor*.30;
   group.position.y=.1-sy*.35-scrollFactor*.12;
   camera.position.z=8+scrollFactor*.55;
   nodes.rotation.y=t*.025;nodes.rotation.x=t*.012;
   nodes.children.forEach((n,i)=>n.scale.setScalar(.65+.35*Math.sin(t*1.4+n.userData.phase)));
   grid.position.z=(t*.18)%2;
   renderer.render(scene,camera);
 }
 animate();
}
init3D().catch(()=>{});
