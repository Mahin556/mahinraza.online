You now have 3 ways to create social-media.png cards anytime on your own — plus a blank template and a 1-click browser
  tool I just added for you:

  ### Option 1: Double-Click Browser Generator (Easiest — No Setup Needed)

  I created a standalone offline tool at tools/social-card-generator.html.

  1. Double-click D:\blog\tools\social-card-generator.html to open it in Chrome or Edge.
  2. Type or paste your Post Title (you can also adjust font size or add an optional category tag).
  3. Click Download social-media.png and drop the downloaded file into your post folder:
    posts/YYYY-MM-DD-your-post-slug/social-media.png

  ──────
  ### Option 2: Blank Image Template (Canva / Figma / Photoshop)

  Your blank 1280 × 720 background frame is already saved at social-media-image-template.png.

  • Upload social-media-image-template.png into Canva, Figma, or Photopea.
  • Add your title text in the middle white area using:
      • Font: Poppins Bold (also included locally at src/fonts/Poppins-Bold.ttf)
      • Font Size: 52px – 56px
      • Text Color: #0F172A (or #0F766E for teal accent text)

  ──────
  ### Option 3: Automatic Command (When Node.js Is Installed)

  Your project also includes an automated generator script in src/scripts/generate-social-image.ts:

    # Generate social-media.png automatically for all new folder posts
    npm run generate-social-image

    # Or generate for one specific post folder
    npm run generate-social-image -- posts/2026-11-13-your-post-slug

  (Note: Creating social-media.png is completely optional — if a post doesn't have one, your site automatically uses
  public/og-default.png.)