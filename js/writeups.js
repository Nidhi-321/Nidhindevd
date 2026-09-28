import { SITE_CONFIG } from './config.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const grid = $('#writeupGrid');
const overlay = $('#writeupOverlay');
const titleEl = $('#writeupDetailTitle');
const authorEl = $('#writeupDetailAuthor');
const dateEl = $('#writeupDetailDate');
const readTimeEl = $('#writeupDetailReadTime');
const heroEl = $('#writeupDetailHero');
const contentEl = $('#writeupDetailContent');
const mediumLink = $('#writeupDetailLink');
const mediumAppLink = $('#writeupDetailAppLink');
const mediumEndLink = $('#writeupDetailEndLink');
const sourceText = $('#mediumSourceText');
const reader = $('.medium-reading', overlay);
let articles = [];

const escapeHTML = s => String(s ?? '').replace(/[&<>"']/g, m => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[m]));

function normalizeUsername(value = '') {
  return String(value).trim().replace(/^@+/, '');
}

function cleanText(s = '') {
  const d = document.createElement('div');
  d.innerHTML = s;
  return d.textContent.replace(/\s+/g, ' ').trim();
}

function mediumUrlFor(article) {
  return article?.link || SITE_CONFIG.FALLBACK_MEDIUM_URL || 'https://medium.com/';
}

function saveFeed(username, items) {
  try {
    localStorage.setItem(`medium-feed:${username}`, JSON.stringify({ savedAt: Date.now(), items }));
  } catch {}
}

function readCachedFeed(username) {
  try {
    const raw = localStorage.getItem(`medium-feed:${username}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.items) ? parsed.items : null;
  } catch {
    return null;
  }
}

function normalizeItems(items = []) {
  return items
    .filter(item => item?.title && item?.link)
    .map(item => ({
      title: String(item.title),
      link: String(item.link),
      pubDate: item.pubDate || item.isoDate || item.published || '',
      author: item.author || item.creator || item.dcCreator || 'Nidhin Dev D',
      description: item.description || '',
      content: item.content || item['content:encoded'] || item.description || '',
      thumbnail: item.thumbnail || item.enclosure?.link || extractFirstImage(item.content || item.description || '') || ''
    }));
}

function extractFirstImage(html = '') {
  const d = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  return d.querySelector('img')?.getAttribute('src') || '';
}

async function fetchJson(url, timeoutMs = 14000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(url, timeoutMs = 14000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'application/rss+xml, application/xml, text/xml, text/plain' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function parseRssXml(xmlText) {
  const xml = new DOMParser().parseFromString(xmlText, 'text/xml');
  if (xml.querySelector('parsererror')) throw new Error('Invalid RSS XML');

  return [...xml.querySelectorAll('item')].map(item => {
    const text = tag => item.querySelector(tag)?.textContent?.trim() || '';
    const link = text('link');
    const description = text('description');
    const content = text('content\\:encoded') || description;
    const thumbnail =
      item.querySelector('media\\:content')?.getAttribute('url') ||
      item.querySelector('media\\:thumbnail')?.getAttribute('url') ||
      extractFirstImage(content) || '';

    return {
      title: text('title'),
      link,
      pubDate: text('pubDate'),
      author: text('dc\\:creator') || text('author') || 'Nidhin Dev D',
      description,
      content,
      thumbnail
    };
  });
}

async function fetchMediumFeed(username) {
  const rss = `https://medium.com/feed/@${encodeURIComponent(username)}`;
  const encoded = encodeURIComponent(rss);
  const sources = [
    `${SITE_CONFIG.MEDIUM_API}${encoded}`,
    `https://api.rss2json.com/v1/api.json?rss_url=${encoded}`,
    `https://api.allorigins.win/raw?url=${encoded}`
  ].filter((value, index, all) => all.indexOf(value) === index);

  for (const source of sources) {
    try {
      if (source.includes('allorigins')) {
        const xml = await fetchText(source);
        const items = normalizeItems(parseRssXml(xml));
        if (items.length) return items;
      } else {
        const data = await fetchJson(source);
        const items = normalizeItems(data?.items);
        if (items.length) return items;
      }
    } catch {}
  }

  throw new Error('All Medium feed sources failed');
}

function sanitizeArticleHTML(html = '') {
  const source = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html').body.firstElementChild;
  if (!source) return '';

  const allowed = new Set([
    'P','BR','STRONG','B','EM','I','U','S','H2','H3','H4','BLOCKQUOTE','UL','OL','LI','PRE','CODE','A','IMG','FIGURE','FIGCAPTION','HR','DIV','SPAN'
  ]);
  const walker = document.createTreeWalker(source, NodeFilter.SHOW_ELEMENT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach(node => {
    if (!allowed.has(node.tagName)) {
      node.replaceWith(...node.childNodes);
      return;
    }

    [...node.attributes].forEach(attr => {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim();
      if (name.startsWith('on') || name === 'style' || name === 'srcset' || name === 'id') node.removeAttribute(attr.name);
      if (node.tagName === 'A' && !['href','target','rel'].includes(name)) node.removeAttribute(attr.name);
      if (node.tagName === 'IMG' && !['src','alt','loading'].includes(name)) node.removeAttribute(attr.name);
      if ((name === 'href' || name === 'src') && !/^https?:\/\//i.test(value)) node.removeAttribute(attr.name);
    });

    if (node.tagName === 'A') {
      node.target = '_blank';
      node.rel = 'noopener noreferrer';
    }
    if (node.tagName === 'IMG') {
      node.loading = 'lazy';
    }
  });

  return source.innerHTML;
}

function estimateReadTime(article) {
  const words = cleanText(article?.content || article?.description || '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function formatDate(value) {
  if (!value) return 'Published on Medium';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHTML(value);
  return date.toLocaleDateString(undefined, { year:'numeric', month:'long', day:'numeric' });
}

function render() {
  if (!articles.length) {
    grid.innerHTML = `<div class="empty-card">
      <div class="kicker">No feed yet</div>
      <h3>Connect your Medium username</h3>
      <p class="muted">Open js/config.js and set MEDIUM_USERNAME to your real Medium handle.</p>
    </div>`;
    return;
  }

  grid.innerHTML = articles.map((a, i) => {
    const excerpt = cleanText(a.description || a.content || '');
    const date = a.pubDate ? new Date(a.pubDate).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' }) : 'Medium';
    const mins = estimateReadTime(a);

    return `<article class="writeup-card reveal" tabindex="0" data-index="${i}">
      <div class="writeup-image">
        ${a.thumbnail ? `<img src="${escapeHTML(a.thumbnail)}" alt="" loading="lazy">` : ''}
        <span>${String(i + 1).padStart(2,'0')}</span>
      </div>
      <div class="writeup-copy">
        <div class="writeup-meta"><span>${escapeHTML(date)}</span><span>${mins} min read</span></div>
        <h3>${escapeHTML(a.title)}</h3>
        <p>${escapeHTML(excerpt.slice(0,190))}${excerpt.length > 190 ? '…' : ''}</p>
        <span class="read-arrow">Read in Medium style ↗</span>
      </div>
    </article>`;
  }).join('');

  $$('.writeup-card').forEach(card => {
    const openArticle = () => open(Number(card.dataset.index));
    card.addEventListener('click', openArticle);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openArticle();
      }
    });
  });

  $$('.writeup-card').forEach(card => requestAnimationFrame(() => card.classList.add('visible')));
}

function open(index) {
  const article = articles[index];
  if (!article || !overlay) return;

  const url = mediumUrlFor(article);
  const content = sanitizeArticleHTML(article.content || article.description || '<p>Open the full article on Medium to continue reading.</p>');

  titleEl.textContent = article.title;
  authorEl.textContent = article.author || 'Nidhin Dev D';
  dateEl.textContent = formatDate(article.pubDate);
  readTimeEl.textContent = `${estimateReadTime(article)} min read`;
  mediumLink.href = url;
  mediumAppLink.href = url;
  if (mediumEndLink) mediumEndLink.href = url;
  heroEl.src = article.thumbnail || '';
  heroEl.alt = article.title;
  heroEl.hidden = !article.thumbnail;
  contentEl.innerHTML = content;

  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  if (reader) reader.scrollTop = 0;
}

function close() {
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

async function load() {
  const username = normalizeUsername(SITE_CONFIG.MEDIUM_USERNAME);

  if (!username) {
    articles = [];
    render();
    sourceText.innerHTML = 'Set <code>MEDIUM_USERNAME</code> in <code>js/config.js</code>.';
    return;
  }

  sourceText.textContent = `medium.com/@${username}`;
  grid.innerHTML = '<div class="loading-card"><span class="spinner"></span><p>Loading Medium previews…</p></div>';

  try {
    articles = await fetchMediumFeed(username);
    saveFeed(username, articles);
    render();
  } catch {
    const cached = readCachedFeed(username);
    if (cached?.length) {
      articles = normalizeItems(cached);
      sourceText.textContent = `medium.com/@${username} · cached`;
      render();
      return;
    }

    articles = [];
    grid.innerHTML = `<div class="empty-card">
      <div class="kicker">Feed unavailable</div>
      <h3>Medium is temporarily unavailable</h3>
      <p class="muted">The portfolio will use cached writeups automatically when available. You can also open your Medium profile directly.</p>
      <a class="btn primary small" href="https://medium.com/@${encodeURIComponent(username)}" target="_blank" rel="noopener">Open Medium profile ↗</a>
    </div>`;
  }
}

$('#mediumRefresh')?.addEventListener('click', load);
overlay?.addEventListener('click', e => { if (e.target === overlay) close(); });
$$('[data-close]', overlay).forEach(button => button.addEventListener('click', close));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay?.classList.contains('open')) close(); });
load();
