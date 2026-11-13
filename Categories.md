Categorization is handled automatically at build time in src/lib/posts.ts. Every post gets one category, determined in two steps inside
  parsePostFile and inferCategory:
  ──────
  ### 1. Explicit Category (Highest Priority)

  If you specify a category manually in the post, that exact value is used:

  • YAML Frontmatter:
    ---
    title: "My Post"
    category: "Kubernetes & Containers"
    ---

  • Legacy Header Line (top of Markdown body):
    Category: Kubernetes & Containers


  │ You can even type a brand-new category name here—getAllCategories will automatically create a page for it with a default description
  │ ("Articles and guides in <Category>.").
  ──────
  ### 2. Automatic Inference from tags (Fallback)

  If category is omitted, inferCategory compares the post's tags (case-insensitively) against the keyword lists in CATEGORY_DEFINITIONS and
  scores each category:

  • 1st tag match: +3 points
  • 2nd tag match: +2 points
  • 3rd+ tag match: +1.5 points each

  The category with the highest score wins (so putting your primary topic as the first tag gives it the most weight).

  • Default fallback: If 0 tags match any keyword (or no tags are set, which defaults to ['DevOps']), the post is placed in Platform &
  Systems Engineering.
  ──────
  ### 3. Built-in Categories (CATEGORY_DEFINITIONS)

  Defined in CATEGORY_DEFINITIONS:

   Category Name                  │ URL Slug                                │ Example Matching Tags (keywords)
  ────────────────────────────────┼─────────────────────────────────────────┼──────────────────────────────────────────────────────────────
   Kubernetes & Containers        │ /category/kubernetes-containers/        │ kubernetes, eks, k8s, docker, container, helm, pod,
                                  │                                         │ autoscaling
   Cloud & Storage                │ /category/cloud-storage/                │ aws, efs, s3, ec2, lambda, iam, cloud, storage, cloudwatch
   Observability & Tracing        │ /category/observability-tracing/        │ opentelemetry, prometheus, promql, tracing, monitoring,
                                  │                                         │ observability, logging
   SRE & Incident Response        │ /category/sre-incident-response/        │ sre, incident response, sli, slo, alerting, chaos
                                  │                                         │ engineering, on-call, troubleshooting
   Security & Networking          │ /category/security-networking/          │ security, oauth, authentication, tls, dns, networking, owasp
   Platform & Systems Engineering │ /category/platform-systems-engineering/ │ linux, performance, python, async, api, queue, http (+
                                  │                                         │ default fallback)
  ──────
  ### 4. Where Categories Show Up on the Site

  • Category Pages: slugifyTerm turns the category name into a URL slug. getAllCategories counts posts per category, hides empty categories
  (count === 0), and sorts them from most posts to least.
      • /categories/ (src/pages/categories/index.astro) — Grid of all active categories with descriptions and post counts.
      • /category/<slug>/ ([slug].astro file:///D:/blog/src/pages/category/%5Bslug%5D.astro) — All posts in that category.
  • Footer: src/components/Footer.astro:5 automatically lists the top 6 categories by post count.
  • Related Posts: getRelatedPosts gives +3 points per shared tag and +1.5 points if two posts share the same category.

  ### How to Customize Categories

  To add a new built-in category, rename an existing one, or add new auto-matching tag keywords, edit CATEGORY_DEFINITIONS in
  src/lib/posts.ts.