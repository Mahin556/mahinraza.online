# Mahin Raza — DevOps & Cloud Engineering Blog

Personal DevOps, Cloud Engineering, Kubernetes, Observability, and SRE blog powered by **Astro** and deployed as a static site on **Cloudflare Pages** at [`https://blog.mahinraza.online`](https://blog.mahinraza.online).

---

## Publishing a New Blog Post

Publishing is as simple as adding a Markdown file inside [`posts/`](./posts) and pushing to GitHub. No database, CMS, or manual index updates are required.

### Option A: Single Markdown File (Fastest)

Create `posts/YYYY-MM-DD-your-post-slug.md`:

```markdown
---
title: "How to Tune Kubernetes Pod Autoscaling for Latency-Sensitive Workloads"
description: "Configure HPA custom metrics, startup probes, and scale-down stabilization windows on EKS without latency spikes."
date: 2026-11-12
category: "Kubernetes & Containers"
tags:
  - Kubernetes
  - EKS
  - Autoscaling
  - Prometheus
devto: true # Set true to cross-post to dev.to, false (or omit) to keep blog-only
---

Write your Markdown content here using `##` and `###` headings.
The Table of Contents, reading time, RSS entry, sitemap URL, and search index are generated automatically at build time.
```

### Option B: Folder Post (When Including Local Images or Diagrams)

Create a folder `posts/YYYY-MM-DD-your-post-slug/` containing `README.md` (or `index.md`) alongside any images:

```text
posts/2026-11-12-eks-autoscaling/
├── README.md
└── architecture.png
```

Reference co-located images with standard relative Markdown paths:

```markdown
![EKS Autoscaling Architecture](./architecture.png)
```

> **Legacy format compatibility:** Existing posts that use inline `# Title`, `Author: ...`, and `Tags: ...` lines at the top of `README.md` continue to work out of the box without migration.

### Frontmatter Reference

| Field | Required | Description |
| :--- | :--- | :--- |
| `title` | Yes (or `# Heading`) | Post title shown on the page, cards, RSS, and OpenGraph tags. |
| `description` | Optional | Summary for SEO & post cards (auto-extracted from the first paragraph if omitted). |
| `date` | Optional | Publish date (`YYYY-MM-DD`); inferred from the `YYYY-MM-DD-` slug prefix if omitted. |
| `tags` | Optional | YAML list or comma-separated list of topic tags. |
| `category` | Optional | Explicit category name; automatically inferred from `tags` if omitted. |
| `draft` | Optional | Set `draft: true` to exclude a work-in-progress post from builds. |
| `image` | Optional | Custom OpenGraph social card path or URL (defaults to `social-media.png` if present, otherwise `/og-default.png`). |
| `devto` | Optional | Controls DEV Community (`dev.to`) publishing: `true` = publish live, `draft` = save as draft on DEV, `false` / omitted = **do not** publish to DEV. |
| `devto_series` | Optional | Optional series name when cross-posting to DEV Community. |

---

## Cross-Posting to DEV Community (`dev.to`)

Every post stays **exclusively on `blog.mahinraza.online` by default**. Only posts where you explicitly opt in are synced to DEV:

- **Publish live to DEV:** `devto: true` (or `DevTo: true` in inline-header posts)
- **Save as an unpublished draft on DEV:** `devto: draft`
- **Do NOT publish to DEV:** `devto: false` (or simply omit `devto`)

When cross-posted, the script automatically:
1. Sets `canonical_url` to `https://blog.mahinraza.online/posts/<slug>/` so your blog keeps 100% of search engine SEO credit.
2. Attaches your post's OpenGraph cover image (`main_image`) and rewrites relative Markdown images/links to absolute URLs.
3. Sanitizes tags to DEV's 4-tag alphanumeric rule and updates existing DEV posts in place on future edits without creating duplicates.

### One-Time GitHub Setup (Automatic on `git push`)

1. Open [DEV Community Settings → Extensions](https://dev.to/settings/extensions), scroll to **DEV Community API Keys**, enter a description (e.g. `blog-sync`), and click **Generate API Key**.
2. In your GitHub repository (`Mahin556/mahinraza.online`), go to **Settings → Secrets and variables → Actions → New repository secret**:
   - **Name:** `DEVTO_API_KEY`
   - **Secret:** *(paste your DEV API key)*
3. Push any post with `devto: true` to `main`/`master` — [`.github/workflows/publish-devto.yml`](./.github/workflows/publish-devto.yml) will automatically publish or update it on DEV.

---

## Local Development & Scripts

Requires **Node.js 20+**.

```bash
# Install dependencies
npm install

# Start local dev server at http://localhost:4321
npm run dev

# Validate Markdown posts (titles, dates, relative image links)
npm run validate

# Optional: Generate branded OpenGraph social cards for folder posts
npm run generate-social-image

# Preview which posts are opted-in for DEV Community (dev.to)
npm run publish:devto:dry

# Publish/update opted-in posts on DEV Community (requires DEVTO_API_KEY in .env)
npm run publish:devto

# Build production static site into ./dist
npm run build

# Preview production build locally
npm run preview
```

---

## Deploying to Cloudflare Pages (`blog.mahinraza.online`)

1. Sign in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and open **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Select the `Mahin556/mahinraza.online` GitHub repository.
3. Configure the build settings:
   - **Production branch:** `master` (or `main`)
   - **Framework preset:** `Astro`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Environment variable:** `NODE_VERSION` = `20`
4. Click **Save and Deploy**.
5. Once deployed, open your Pages project → **Custom domains** → **Set up a custom domain** → enter **`blog.mahinraza.online`**. Cloudflare automatically provisions the `CNAME` record and SSL certificate.


  ──────
  ### Next Steps for You

  1. Commit and push your repository changes to GitHub (Mahin556/mahinraza.online).
  2. In Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git, select Mahin556/mahinraza.online with:
      • Build command: npm run build
      • Build output directory: dist
      • Environment variable: NODE_VERSION = 20
  3. Under Custom domains, attach blog.mahinraza.online.