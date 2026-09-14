# Google Search + Google Images setup

This static site now includes: responsive mobile CSS, absolute canonical URLs generated from the deployed origin, Open Graph/Twitter image metadata, Person/Website/WebPage structured data, robots.txt, sitemap.xml, descriptive image alt text, and an image sitemap entry for `images/photos/profile.jpg`.

## Before deploying
1. Put your actual portrait at `images/photos/profile.jpg` (JPEG, PNG, WebP or AVIF; a sharp square or portrait image is best).
2. Replace `YOUR-VERCEL-DOMAIN.vercel.app` in **robots.txt** and **sitemap.xml** with the exact production hostname you use in Vercel.
3. Deploy the folder to the production Vercel domain.

## Google
In Google Search Console, add/verify the production property, submit `/sitemap.xml`, then use URL Inspection to request indexing for `/` and `/about.html`.

The site cannot guarantee an immediate ranking for `Nidhin Dev D` or placement in Google Images. Google decides indexing, ranking and image selection automatically after it crawls the public site.
