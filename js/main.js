import { SITE_CONFIG } from './config.js';

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

// nav / page state
const nav = $('.nav');
window.addEventListener('scroll', () => nav?.classList.toggle('scrolled', scrollY > 20), {passive:true});
const menu = $('.menu'), links = $('.nav-links');
menu?.addEventListener('click', () => { const open = links.classList.toggle('open'); menu.setAttribute('aria-expanded', open); });
$$('.nav-links a').forEach(a => a.addEventListener('click', () => { links?.classList.remove('open'); menu?.setAttribute('aria-expanded','false'); }));
const path = location.pathname.split('/').pop() || 'index.html';
$$('.nav-links a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === path));

// reveal motion
const observer = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }), {threshold:.12});
$$('.reveal').forEach(e => observer.observe(e));

// pointer
const cursor = $('.cursor');
window.addEventListener('mousemove', e => { if(cursor){ cursor.style.left=e.clientX+'px'; cursor.style.top=e.clientY+'px'; } }, {passive:true});
$$('a,button,.gallery-card,.project-card,.skill-card').forEach(el => {
  el.addEventListener('mouseenter',()=>cursor && (cursor.classList.add('hover')));
  el.addEventListener('mouseleave',()=>cursor && (cursor.classList.remove('hover')));
});

// tilt
$$('[data-tilt]').forEach(card=>{
  card.addEventListener('pointermove', e=>{
    const r=card.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
    card.style.transform=`perspective(1000px) rotateX(${(-y*4).toFixed(2)}deg) rotateY(${(x*5).toFixed(2)}deg) translateY(-6px)`;
  });
  card.addEventListener('pointerleave',()=>card.style.transform='');
});

// skill carousel — centre card is always the active card
$$('[data-skill-carousel]').forEach(carousel=>{
  const cards=$$('.skill-card',carousel);
  let index=Math.max(0,cards.findIndex(c=>c.classList.contains('active')));
  const host=carousel.closest('.container') || carousel.parentElement;
  const kicker=$('#skillKicker',host) || $('.skill-kicker',host); const title=$('#skillTitle',host) || $('.skill-title',host);
  const copy=$('#skillCopy',host) || $('.skill-copy',host); const tags=$('#skillTags',host) || $('.skill-tags',host);
  function render(){
    cards.forEach((c,i)=>{c.classList.toggle('active',i===index); c.classList.toggle('left',i===(index-1+cards.length)%cards.length); c.classList.toggle('right',i===(index+1)%cards.length);});
    const c=cards[index], list=(c.dataset.list||'').split('|').filter(Boolean);
    kicker && (kicker.textContent=c.dataset.kicker||''); title && (title.textContent=c.dataset.title||''); copy && (copy.textContent=c.dataset.copy||'');
    if(tags) tags.innerHTML=list.map(x=>`<span>${x}</span>`).join('');
  }
  cards.forEach((c,i)=>c.addEventListener('click',()=>{index=i;render();}));
  let auto=setInterval(()=>{index=(index+1)%cards.length;render()},5000);
  carousel.addEventListener('pointerenter',()=>clearInterval(auto)); carousel.addEventListener('pointerleave',()=>auto=setInterval(()=>{index=(index+1)%cards.length;render()},5000));
  render();
});

// counters
$$('.counter').forEach(el=>{
  const target=Number(el.dataset.target)||0; let done=false;
  const io=new IntersectionObserver(es=>{if(es[0].isIntersecting&&!done){done=true;let n=0;const timer=setInterval(()=>{n=Math.min(target,n+Math.max(1,Math.ceil(target/30)));el.textContent=n+(el.dataset.suffix||'');if(n>=target)clearInterval(timer)},25);io.disconnect();}}, {threshold:.6}); io.observe(el);
});

const year=$('[data-year]'); if(year) year.textContent=new Date().getFullYear();
// Optional custom looping Home hero video. Drop an MP4 into /videos/ and set the filename in config.js.
const heroVideo = $('#heroVideo');
if (heroVideo && SITE_CONFIG.HOME_VIDEO_ENABLED) {
  const videoFile = SITE_CONFIG.HOME_VIDEO_FILE || 'hero.mp4';
  heroVideo.poster = SITE_CONFIG.HOME_VIDEO_POSTER || '';
  heroVideo.src = `videos/${encodeURIComponent(videoFile)}`;
  heroVideo.loop = true;
  heroVideo.muted = true;
  heroVideo.playsInline = true;
  heroVideo.addEventListener('canplay', () => document.querySelector('.hero-home')?.classList.add('video-ready'), {once:true});
  heroVideo.addEventListener('error', () => {
    document.querySelector('.hero-home')?.classList.remove('video-ready');
    heroVideo.removeAttribute('src');
    heroVideo.load();
  }, {once:true});
  const playVideo = () => heroVideo.play().catch(() => {});
  heroVideo.addEventListener('loadeddata', playVideo, {once:true});
  playVideo();
}


