# Email tools on the Academy website

The 13 free email tools, moved from jonathanpay.github.io/email-tools/ to holisticemailacademy.com as one WordPress plugin, **HEA Email Tools**. It works like the maturity assessment plugin: upload a zip, then put a shortcode on each page.

| Path | What it is |
|---|---|
| `email-tools-pages/` | The source pages: one HTML page per tool. Edit here. (They lived in `email-tools/` until the redirects went in.) |
| `../email-tools/assets/` | The tools' scripts and styles. Edit here. `../email-tools/*.html` are now redirects to the Academy. |
| `build-email-tools.mjs` | Generates the plugin's `assets/`, `templates/` and `tools.json`, and the block markup in `email-tools-page-content/`, from the source, the copy and the SEO file. |
| `build-email-tools-plugin.sh` | Runs the tests, regenerates, and makes `dist/hea-email-tools.zip`. |
| `hea-email-tools/` | The plugin (version 1.2.1 is live). Only `hea-email-tools.php` and `uninstall.php` are hand-written. |
| `email-tools-page-copy.md` | Each page's written content: the About text and FAQ that sit around the tool as ordinary WordPress blocks. |
| `email-tools-seo.json` | Each page's slug, intro paragraph and Yoast fields (keyphrase, related keyphrases, SEO title, meta description, social title). |
| `email-tools-page-content/` | Generated: one file of block markup per page, ready to paste into the WordPress code editor. |
| `email-tools-qa.md` | The QA log: what was checked, what was fixed, what's still your call. |

## Setting it up: the walkthrough

About 45 minutes, most of it creating the 14 pages.

### 1. Build and install the plugin (5 minutes)

1. From the repo root run `sh wordpress/build-email-tools-plugin.sh`. It runs every test, then writes `wordpress/dist/hea-email-tools.zip`.
2. In WordPress go to **Plugins → Add New Plugin → Upload Plugin**, choose the zip, **Install Now**, then **Activate**. It needs WordPress 6.5 or later.

### 2. Create the index page (5 minutes)

1. **Pages → Add New Page**. Title: **Free email tools** (Settings → Email tools lists it under its old GitHub title, Free Email Optimisation Tools; either is fine). In the page settings, set the slug (URL) to `email-tools`.
2. Open the **Code editor** (⋮ top right) and paste the contents of `wordpress/email-tools-page-content/index.html`: the intro paragraph in a Group. The index has no shortcode.
3. Underneath, add the site's usual **Post Grid** block, set to pages that are children of *Free email tools*. The grid's excerpt is each tool page's intro paragraph.
4. Publish.

If you'd rather the tools lived somewhere else, change **Settings → Email tools → Tools index address** first. Every link between the tools follows that setting.

### 3. Create the 13 tool pages (30 minutes)

For each row: **Pages → Add New Page**, enter the title, set **Parent page** to *Free email tools* and the slug as shown. Open the **Code editor** and paste the page's file from `wordpress/email-tools-page-content/` (named by the tool's internal name, e.g. `sscc.html`). That gives an intro paragraph in a Group, the Shortcode block with the tool, then the About text, any "How it works" text and the FAQ as ordinary headings and paragraphs, all editable and indexed as page content. Publish. **Settings → Email tools** lists the same table and ticks each page off once it's published at the right address.

| Page title (the H1) | Slug | Shortcode |
|---|---|---|
| A/B Test Hypothesis Builder | `ab-test-hypothesis` | `[hea_email_tool name="hypothesis"]` |
| A/B Test Duration Calculator | `ab-duration` | `[hea_email_tool name="ab-duration"]` |
| Statistical Significance Calculator | `significance-calculator` | `[hea_email_tool name="sscc"]` |
| We-We Calculator | `we-we-calculator` | `[hea_email_tool name="wewe"]` |
| Email Readability Score | `readability-checker` | `[hea_email_tool name="ers"]` |
| Feature-to-Benefit Converter | `feature-to-benefit` | `[hea_email_tool name="f2b"]` |
| Email Tone Analyser | `tone` | `[hea_email_tool name="tone"]` |
| Buyer Persona Matcher | `persona` | `[hea_email_tool name="persona"]` |
| Emotional Appeal Analyser | `emotional-appeal` | `[hea_email_tool name="emotional-appeal"]` |
| Personalisation & Dynamic Content Checker | `personalisation` | `[hea_email_tool name="personalisation"]` |
| Email Accessibility Checker | `accessibility` | `[hea_email_tool name="accessibility"]` |
| CURVE Subject Line Builder | `subject-line-tester` | `[hea_email_tool name="curve"]` |
| DMARC, SPF & DKIM Checker | `dmarc-checker` | `[hea_email_tool name="dmarc-checker"]` |

The shortcode still takes the tool's internal name; the slug comes from `email-tools-seo.json`, and the plugin links between tools at those slugs.

**Renamed in 1.2.0.** Six pages started on slugs made from internal shorthand and were renamed to addresses people search for:

| Old address | New address |
|---|---|
| `/email-tools/hypothesis/` | `/email-tools/ab-test-hypothesis/` |
| `/email-tools/sscc/` | `/email-tools/significance-calculator/` |
| `/email-tools/wewe/` | `/email-tools/we-we-calculator/` |
| `/email-tools/ers/` | `/email-tools/readability-checker/` |
| `/email-tools/f2b/` | `/email-tools/feature-to-benefit/` |
| `/email-tools/curve/` | `/email-tools/subject-line-tester/` |

Each old address has a 301 redirect to the new one in **Yoast SEO → Redirects** (Yoast Premium adds it when the slug changes), so old links and Google's index carry over. If a slug changes again, check the redirect appears there and add it by hand if not.

### 4. SEO fields (Yoast, 10 minutes)

The page title is the only H1: each tool's own headline was removed. Every page's Yoast fields come from `wordpress/email-tools-seo.json`, which is the source of truth: if you change one in WordPress, change it there too. For each page set the **focus keyphrase**, the **related keyphrases** (Premium, one per box), the **SEO title** and **meta description** below, and the **social title** in Yoast's Social tab. Delete the `%%sep%% %%sitename%%` variables from the SEO title so it's exactly as written; Google shows the site name separately.

| Page | SEO title | Meta description |
|---|---|---|
| Free email tools | Free Email Marketing Tools: Copy, Testing, and DMARC | Thirteen free email marketing tools: check your copy before you send, read your A/B tests after, and test your domain's DMARC. No sign-up needed. |
| Hypothesis Builder | A/B Test Hypothesis Builder for Email (Free) | Build an A/B test hypothesis you can prove wrong. Answer five questions, then plan the test's length with the Duration Calculator. Free, no sign-up. |
| Duration Calculator | A/B Test Duration Calculator: Sample Size and Days (Free) | A free A/B test duration calculator for email: the sample size each variant needs, and how many days that takes at your volume. Plan it before you start. |
| Significance Calculator | A/B Test Significance Calculator for Email (Free) | A free A/B test significance calculator for email. Enter the sample size and each variant's rate to see if the result is significant or could be chance. |
| We-We Calculator | We-We Calculator: Check for Customer-Focused Copy (Free) | Paste your email and see how much of it talks about your brand and how much about your reader. A free pronoun count for customer-focused copy. No sign-up. |
| Readability Score | Email Readability Checker: Flesch, Fog, and SMOG (Free) | A free email readability checker: Flesch Reading Ease, Gunning Fog, and SMOG scores for your copy, with UK reading ages and suggestions. No sign-up. |
| Feature-to-Benefit | Features vs Benefits: Free Feature-to-Benefit Converter | Features vs benefits, sorted: enter a product feature, pick your industry, and get a benefit statement your reader cares about. Free, no sign-up. |
| Tone Analyser | Email Tone Checker: Free Tone Analyser for Email Copy | Paste your copy into this free email tone checker to see which tones it gives off, from friendly to urgent, with phrases to strengthen each. No sign-up. |
| Persona Matcher | Buyer Persona Matcher for the Four Buyer Types (Free) | Paste your email to see which of four buyer types it reaches (Competitive, Spontaneous, Humanistic, and Methodical) and which it misses. Free, no sign-up. |
| Emotional Appeal | Emotional Appeal Analyser for Email Copy (Free) | See which emotional appeals your email copy uses, from fear and hope to trust and belonging, and learn when each one works best. Free, no sign-up. |
| Personalisation | Email Personalisation Checker: Fallbacks and Merge Tags | A free email personalisation checker: find every token in your email and whether it has a fallback value, in the syntax of 16 email platforms. No sign-up. |
| Accessibility | Email Accessibility Checker: Alt Text and Contrast (Free) | A free email accessibility checker: missing alt text, vague link text, small fonts, poor colour contrast, and broken heading order. No sign-up. |
| CURVE | Email Subject Line Tester: Score It With CURVE (Free) | A free subject line tester built on CURVE: Curiosity, Urgency, Relevance, Value, and Emotion. See which it covers and how to add the first one missing. |
| DMARC Checker | Free DMARC Checker: Test SPF, DKIM, and DMARC Records | A free DMARC checker for your domain's DMARC, SPF, and DKIM setup, in plain English: what's in place, what's missing, and what to fix. No sign-up. |

**Social images.** Each of the 14 pages has its own 1200×630 social image, set in Yoast's Social tab (used for Facebook, LinkedIn and X shares). Give a new tool page one too, at the same size, or shares fall back to the site default.

The DMARC page also outputs its FAQ as structured data (FAQPage), as it did on GitHub.

### 5. Privacy policy (5 minutes)

Every tool runs in the visitor's browser, and the tools don't store what you paste. Two things do leave the browser:

- The **DMARC checker** looks up the domain the visitor types using Google's public DNS service (dns.google).
- The **Hypothesis Builder** carries the hypothesis to the Duration Calculator in the page address when the visitor presses Next, so that text reaches the site's server logs like any page visit.

So the privacy line shouldn't claim the tools send nothing anywhere. For example:

> Our DMARC, SPF & DKIM Checker looks up the domain you enter using Google Public DNS (dns.google). Only the domain name is sent, and Google's privacy policy applies to that lookup. The other email tools run in your browser and don't store what you paste.

### 6. Test it live (15 minutes)

The plugin has been tested in a clean WordPress with the default theme (see the QA log), but not yet with the Academy's own theme and plugins, so do this on a staging copy first if you have one. Check **Settings → Email tools** shows ✓ for all 14 pages, then on each page check:

- [ ] The tool appears, styled, with the Academy header and footer around it.
- [ ] Run it with real copy: one of your own sends works well. Results appear, and there are no errors in the browser console.
- [ ] The course cards under the tool link to `/courses/…?ref=email-tools-…` on the same site.
- [ ] "← All email tools" goes back to the index; every index card opens its tool.
- [ ] Hypothesis Builder → "Next: Duration Calculator" carries the hypothesis, baseline and lift across.
- [ ] DMARC checker: try `google.com` (SPF and DMARC found) and a domain you know has no DMARC.
- [ ] On a phone: nothing overflows sideways, and the buttons are easy to tap.

### 7. Point the old addresses at the new pages (once you're happy)

Done. Each `email-tools/*.html` on jonathanpay.github.io now sends visitors to its Academy page (by the slugs in `email-tools-seo.json`), keeping any `?…` query so Hypothesis Builder hand-offs still land pre-filled. The source pages moved to `wordpress/email-tools-pages/`, which isn't published. The `email-tools/assets/` folder stays: the London Forum assessment, its dashboard, the slides and the pilot load fonts and course data from there.

Also update links you control elsewhere: the jonathanpay.github.io homepage card and `/tools/` list (done), LinkedIn posts, the newsletter footer, and anything in the Academy that already links to jonathanpay.github.io/email-tools/.

## Afterwards

- **Changing a tool.** Edit the page in `wordpress/email-tools-pages/` or the script in `email-tools/assets/`, run `sh wordpress/build-email-tools-plugin.sh`, then upload the new zip (WordPress offers to replace the installed version). The test `tests/email-tools-plugin.test.mjs` fails if the plugin is out of date with the source, so you can't commit a stale build.
- **Changing a page's words or SEO.** Edit `email-tools-page-copy.md` or `email-tools-seo.json`, rebuild, then paste the regenerated file from `email-tools-page-content/` into that page's code editor and update its Yoast fields. The words live in WordPress, not in the plugin, so uploading a new zip doesn't change them.
- **A course launches or changes.** Edit `COURSES` in `email-tools/assets/course-ctas.js`, rebuild, upload. The maturity assessment has its own copy of the course list (`hea-maturity-assessment/assets/js/courses.js`), so update both.
- **How it's protected from the theme.** Every style is scoped to `#hea-et`, with a small reset for theme styles that would leak in (buttons, headings, links). Scripts are ES modules with content-hashed URLs, so a new upload is picked up straight away.
