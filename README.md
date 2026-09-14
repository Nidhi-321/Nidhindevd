# Nidhin Dev D — Dynamic Portfolio Redesign

## Pages
- `index.html` — animated homepage + 3-card skills carousel
- `about.html` — animated profile, mindset timeline, skill carousel
- `gallery.html` — artwork archive with left-side visual / right-side detail viewer
- `projects.html` — project cards with multi-image navigation
- `writeups.html` — Medium RSS previews + in-page reading panel
- `contact.html` — socials + FormSubmit email form

## Run
Use a local server for the Medium feed and module scripts:
```bash
python3 -m http.server 8000
```
Then open `http://localhost:8000`.

## Personal assets
Place your own image files in `images/photos/`, especially:
- `profile.jpg` — used on Home/About
- `gallery-1.jpg`, etc. — optional future gallery assets

The design falls back to existing artwork when `profile.jpg` is not present.

## Medium
Open `js/config.js` and change `MEDIUM_USERNAME` to the exact Medium handle. The writeup page fetches the public Medium RSS feed through rss2json and renders article previews in-page.

## Contact form
The form uses FormSubmit at `https://formsubmit.co/nidhindev362@gmail.com`. On first use, FormSubmit may send a one-time activation/confirmation email for the receiving address. Once activated, subsequent submissions are delivered to that inbox and redirect to `thank-you.html`.

## Notes
- No build step or framework required.
- Three.js is loaded from jsDelivr for the ambient 3D background.
- `work.html` redirects to `gallery.html` for backwards compatibility.
## Home hero custom video

The Home page supports a custom background video that loops automatically.

1. Put your `.mp4` file in `videos/` (example: `videos/hero.mp4`).
2. Open `js/config.js`.
3. Set `HOME_VIDEO_FILE` to the exact filename.
4. Keep `HOME_VIDEO_ENABLED: true`.

The video is autoplayed muted, loops continuously, and uses the existing WebGL animation as a fallback when the video file is missing or cannot be loaded.

Example:

```js
HOME_VIDEO_ENABLED: true,
HOME_VIDEO_FILE: 'my-portfolio-video.mp4',
HOME_VIDEO_POSTER: 'images/bg_7.png',
```

For best performance, use a compressed H.264 MP4, preferably 1920×1080 or 1280×720.


## Home page 3D sphere
The Home page 3D/WebGL sphere background has been removed. The custom looping hero video remains available through `js/config.js`.


## Google Search + mobile optimization
The site includes responsive mobile refinements and SEO discovery files (`robots.txt`, `sitemap.xml`, `site.webmanifest`, and `js/seo.js`). Before deploying, place your real portrait at `images/photos/profile.jpg` and replace `YOUR-VERCEL-DOMAIN.vercel.app` in `robots.txt` and `sitemap.xml` with the exact production hostname. See `SEO-SETUP.md`.
