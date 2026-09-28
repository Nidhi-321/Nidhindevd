const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const $ = (selector, root = document) => root.querySelector(selector);

const cards = $$('[data-project]');
const overlay = $('#projectOverlay');
const detailPanel = $('.project-detail-panel', overlay);
const detailVisual = $('.project-visual', overlay);
const detailImage = $('#projectDetailImage');
const thumbs = $('#projectThumbs');
const closeButton = $('[data-close]', overlay);
const detailCategory = $('#projectDetailCategory');
const detailTitle = $('#projectDetailTitle');
const detailDescription = $('#projectDetailDescription');
const detailRole = $('#projectDetailRole');
const currentCounter = $('#projectCurrent');
const totalCounter = $('#projectTotal');

let current = -1;
let isAnimating = false;

function projectFromCard(card, index) {
  let images = [];
  try {
    images = JSON.parse(card.dataset.images || '[]');
  } catch {
    images = [];
  }
  const cover = card.dataset.cover || $('.project-image img', card)?.currentSrc || $('.project-image img', card)?.src || '';
  if (!images.length && cover) images = [cover];
  if (cover && images[0] !== cover) images.unshift(cover);

  return {
    index,
    title: card.dataset.title || 'Project',
    category: card.dataset.category || 'PROJECT',
    description: card.dataset.description || '',
    role: card.dataset.role || 'Development',
    images: [...new Set(images)],
    alt: $('.project-image img', card)?.alt || `${card.dataset.title || 'Project'} image`
  };
}

function projects() {
  return cards.map((card, index) => projectFromCard(card, index));
}

function renderThumbs(project) {
  if (!thumbs) return;
  thumbs.innerHTML = project.images.map((src, i) => `
    <button class="thumb ${i === (project.activeImage || 0) ? 'active' : ''}" data-image-index="${i}" aria-label="View ${project.title} image ${i + 1}" aria-current="${i === (project.activeImage || 0) ? 'true' : 'false'}">
      <img src="${src}" alt="${project.title} image ${i + 1}" loading="lazy">
    </button>
  `).join('');

  $$('.thumb', thumbs).forEach(button => {
    button.addEventListener('click', () => {
      const imageIndex = Number(button.dataset.imageIndex);
      if (!Number.isNaN(imageIndex)) setProjectImage(imageIndex);
    });
  });
}

function updateText(project) {
  detailCategory.textContent = project.category;
  detailTitle.textContent = project.title;
  detailDescription.textContent = project.description;
  detailRole.textContent = project.role;
  currentCounter.textContent = String(project.index + 1).padStart(2, '0');
  totalCounter.textContent = String(cards.length).padStart(2, '0');
  document.title = `${project.title} — Projects | Nidhin Dev D`;
}

function updateImage(project, imageIndex = 0) {
  const safeIndex = Math.max(0, Math.min(imageIndex, project.images.length - 1));
  project.activeImage = safeIndex;
  detailImage.src = project.images[safeIndex];
  detailImage.alt = `${project.title} image ${safeIndex + 1}`;
  renderThumbs(project);
}

function setProject(index, animate = false) {
  if (!cards[index]) return;
  const project = projectFromCard(cards[index], index);
  const previous = current;
  current = index;

  if (detailVisual) detailVisual.classList.toggle('project-switching', animate && previous >= 0);
  if (detailPanel) detailPanel.querySelector('.detail-copy')?.classList.toggle('project-copy-switching', animate && previous >= 0);

  // Swap the complete case-study state in one synchronous update. No fade-out,
  // dimming, or intermediate frame is used, so the text always matches the image.
  updateText(project);
  updateImage(project, 0);
}

function setProjectImage(imageIndex) {
  if (current < 0 || !cards[current]) return;
  const project = projectFromCard(cards[current], current);
  updateImage(project, imageIndex);
}

function animateImageFromCard(card) {
  // Keep the original flight-in effect only when opening a project. Navigation
  // between projects is intentionally instantaneous so the page never dims.
  const source = $('.project-image img', card);
  if (!source || !detailVisual || !detailImage) return Promise.resolve();

  const from = source.getBoundingClientRect();
  const visualRect = detailVisual.getBoundingClientRect();
  if (!from.width || !from.height || !visualRect.width || !visualRect.height) return Promise.resolve();

  const target = document.createElement('img');
  target.src = source.currentSrc || source.src;
  target.alt = source.alt || '';
  target.className = 'project-flight-image';
  target.style.left = `${from.left}px`;
  target.style.top = `${from.top}px`;
  target.style.width = `${from.width}px`;
  target.style.height = `${from.height}px`;
  document.body.appendChild(target);
  detailImage.classList.add('is-hidden');

  requestAnimationFrame(() => {
    const horizontalPadding = Math.min(56, visualRect.width * 0.08);
    const verticalPadding = 56;
    const maxWidth = visualRect.width - horizontalPadding * 2;
    const maxHeight = visualRect.height - verticalPadding * 2;
    const ratio = from.width / from.height;
    let width = maxWidth;
    let height = width / ratio;
    if (height > maxHeight) {
      height = maxHeight;
      width = height * ratio;
    }
    target.style.left = `${visualRect.left + (visualRect.width - width) / 2}px`;
    target.style.top = `${visualRect.top + (visualRect.height - height) / 2}px`;
    target.style.width = `${width}px`;
    target.style.height = `${height}px`;
    target.classList.add('moving');
  });

  return new Promise(resolve => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      target.remove();
      detailImage.classList.remove('is-hidden');
      resolve();
    };
    target.addEventListener('transitionend', finish, { once: true });
    window.setTimeout(finish, 700);
  });
}

async function showProject(index) {
  if (isAnimating || !cards[index] || !overlay) return;
  isAnimating = true;
  setProject(index, false);
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  await animateImageFromCard(cards[index]);
  isAnimating = false;
}

function closeProject() {
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  detailImage.classList.remove('is-hidden');
  detailVisual?.classList.remove('project-switching');
  detailPanel?.querySelector('.detail-copy')?.classList.remove('project-copy-switching');
  current = -1;
}

function changeProject(direction) {
  if (!cards.length || current < 0) return;
  const nextIndex = (current + direction + cards.length) % cards.length;
  setProject(nextIndex, false);
}

cards.forEach((card, index) => {
  card.addEventListener('click', () => showProject(index));
  card.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      showProject(index);
    }
  });
});

$('#projectPrev')?.addEventListener('click', () => changeProject(-1));
$('#projectNext')?.addEventListener('click', () => changeProject(1));
closeButton?.addEventListener('click', closeProject);
overlay?.addEventListener('click', event => {
  if (event.target === overlay) closeProject();
});

document.addEventListener('keydown', event => {
  if (!overlay?.classList.contains('open')) return;
  if (event.key === 'Escape') closeProject();
  if (event.key === 'ArrowLeft') changeProject(-1);
  if (event.key === 'ArrowRight') changeProject(1);
});

const filter = $('[data-project-filter]');
filter && $$('button', filter).forEach(button => {
  button.addEventListener('click', () => {
    $$('button', filter).forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    const selected = button.dataset.filter;
    cards.forEach(card => {
      const category = card.dataset.category || '';
      card.style.display = selected === 'all' || category.includes(selected) ? '' : 'none';
    });
  });
});
