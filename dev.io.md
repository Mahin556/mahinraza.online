I have added opt-in cross-posting to DEV Community (dev.to) so you have per-article control over what gets published there
  and what stays only on blog.mahinraza.online.

  ### What Was Added

  1. **Per-Post Control in BlogPost** — Defaults to false so none of your existing or new posts are sent to DEV unless you
  explicitly opt in.
  2. DEV Publisher Script (src/scripts/publish-devto.ts) — Automatically sets canonical_url back to blog.mahinraza.online
  (preserving your SEO), attaches your social-media.png / OpenGraph cover image, rewrites relative image/link URLs to absolute
  URLs, formats tags to DEV's 4-tag rule, and updates existing DEV articles in place without creating duplicates.
  3. GitHub Actions Auto-Sync (.github/workflows/publish-devto.yml) — Runs automatically whenever you push changes inside
  posts/ to main/master (plus manual trigger support in the GitHub Actions UI).
  4. Docs & Env Template — Updated README.md, package.json, and .env.example.
  ──────
  ### 1. How to Control Publishing Per Article

  In any Markdown post's YAML frontmatter, set devto (devio also works as an alias):

    ---
    title: "How to Tune Kubernetes Pod Autoscaling"
    description: "Configure HPA custom metrics without latency spikes."
    date: 2026-11-13
    tags: [Kubernetes, EKS, Prometheus]
    devto: true          # true = publish live on dev.to
                         # draft = save as unpublished draft on dev.to
                         # false (or omit) = DO NOT publish to dev.to (blog only)
    ---

  (If you write a folder post using the inline header style without --- frontmatter, adding DevTo: true or DevTo: draft at the
  top works too.)
  ──────
  ### 2. One-Time API Key Setup (Automatic on git push)

  1. Go to DEV Settings → Extensions https://dev.to/settings/extensions → scroll to DEV Community API Keys → generate a new API
  key.
  2. Open your GitHub repo → Settings → Secrets and variables → Actions → New repository secret:
      • Name: DEVTO_API_KEY
      • Secret: (paste your key)
  3. Whenever you push a post with devto: true, GitHub Actions will automatically publish (or update) it on DEV while skipping
  every post where devto is false or omitted.

  (For local CLI testing with Node.js, copy .env.example to .env, add DEVTO_API_KEY=..., and run npm run publish:devto:dry to
  preview or npm run publish:devto to sync.)

---

Right now, all existing posts in posts/ default to not publishing to DEV (devto: false), so nothing gets cross-posted unless
  you choose it.

  Because your existing posts use the inline header format inside posts/<post-folder>/README.md, you don't even need to rewrite
  them to YAML frontmatter — just add DevTo: true (or DevTo: draft) right below Description: in whichever existing article you
  want to publish:

    # How to Alert on Queue Backlog Without Paging on Batch Spikes or Idle Consumers

    Author: [Mahin556](https://github.com/Mahin556)

    Tags: Monitoring, Queue, Prometheus, SQS

    Description: Alert on queue age, deadlines and stalled progress while distinguishing normal batch accumulation from idle or
    failed consumers.

    DevTo: true

  Once you commit and push that change:

  • src/lib/posts.ts:428-433 strips the DevTo: true metadata line cleanly so it never shows up as text on your website.
  • .github/workflows/publish-devto.yml triggers automatically and publishes only that opted-in existing article to dev.to
  (with its social-media.png cover image and canonical_url pointing back to blog.mahinraza.online), while leaving all other
  existing posts untouched.