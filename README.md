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