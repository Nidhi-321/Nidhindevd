const origin = window.location.origin.replace(/\/$/, '');
const path = window.location.pathname;
const cleanPath = path === '/' || path.endsWith('/index.html') ? '/' : path;
const canonical = `${origin}${cleanPath}`;
const profileImage = `${origin}/images/photos/profile.jpg`;
const title = document.title;
const description = document.querySelector('meta[name="description"]')?.content || '';
const isNoIndex = document.querySelector('meta[name="robots"]')?.content.includes('noindex');

function setMeta(name, content) {
  if (!content) return;
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) { el = document.createElement('meta'); el.name = name; document.head.appendChild(el); }
  el.content = content;
}
function setProperty(property, content) {
  if (!content) return;
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute('property', property); document.head.appendChild(el); }
  el.content = content;
}

if (!isNoIndex) {
  const marker = document.querySelector('link[rel="canonical-placeholder"]');
  if (marker) marker.remove();
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
  link.href = canonical;

  const preferredImage = document.querySelector('.profile-image') ? profileImage : `${origin}/images/bg_7.png`;
  setProperty('og:url', canonical);
  setProperty('og:image', preferredImage);
  setProperty('og:image:alt', document.querySelector('.profile-image') ? 'Portrait of Nidhin Dev D' : title);
  setMeta('twitter:image', preferredImage);
  setMeta('twitter:image:alt', document.querySelector('.profile-image') ? 'Portrait of Nidhin Dev D' : title);

  // Person + website signals. Google can use these to better understand who the site represents.
  const person = {
    '@type': 'Person',
    '@id': `${origin}/#nidhin-dev-d`,
    name: 'Nidhin Dev D',
    url: origin + '/',
    image: profileImage,
    jobTitle: 'Developer, Designer & Cybersecurity Professional',
    description: 'Developer, designer and cybersecurity professional building digital products, visual experiences and security-focused solutions.',
    sameAs: [
      'https://www.linkedin.com/in/nidhin-dev-d-250817271/'
    ]
  };
  const graph = [
    { '@type': 'WebSite', '@id': `${origin}/#website`, url: origin + '/', name: 'Nidhin Dev D', publisher: { '@id': person['@id'] } },
    { '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: title, description, isPartOf: { '@id': `${origin}/#website` }, ...(document.querySelector('.profile-image') ? { primaryImageOfPage: profileImage, mainEntity: { '@id': person['@id'] } } : {}) },
    person
  ];
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
  document.head.appendChild(script);
}
