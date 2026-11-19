# Email tools on the Academy website

The 13 free email tools, moved from jonathanpay.github.io/email-tools/ to holisticemailacademy.com as one WordPress plugin, **HEA Email Tools**. It works like the maturity assessment plugin: upload a zip, then put a shortcode on each page.

| Path | What it is |
|---|---|
| `email-tools-pages/` | The source pages: one HTML page per tool. Edit here. (They lived in `email-tools/` until the redirects went in.) |
| `../email-tools/assets/` | The tools' scripts and styles. Edit here. `../email-tools/*.html` are now redirects to the Academy. |
| `build-email-tools.mjs` | Generates the plugin's `assets/`, `templates/` and `tools.json` from the source. |
| `build-email-tools-plugin.sh` | Runs the tests, regenerates, and makes `dist/hea-email-tools.zip`. |
| `hea-email-tools/` | The plugin. Only `hea-email-tools.php` and `uninstall.php` are hand-written. |
| `email-tools-qa.md` | The QA log: what was checked, what was fixed, what's still your call. |

## Setting it up: the walkthrough

About 45 minutes, most of it creating the 14 pages.

### 1. Build and install the plugin (5 minutes)

1. From the repo root run `sh wordpress/build-email-tools-plugin.sh`. It runs every test, then writes `wordpress/dist/hea-email-tools.zip`.
2. In WordPress go to **Plugins → Add New Plugin → Upload Plugin**, choose the zip, **Install Now**, then **Activate**. It needs WordPress 6.5 or later.

### 2. Create the index page (5 minutes)

1. **Pages → Add New Page**. Title: **Free email tools**. In the page settings, set the slug (URL) to `email-tools`.
2. Add a **Shortcode** block (type `/shortcode`) and enter `[hea_email_tools]`.
3. Publish.

If you'd rather the tools lived somewhere else, change **Settings → Email tools → Tools index address** first. Every link between the tools follows that setting.

### 3. Create the 13 tool pages (30 minutes)

For each row: **Pages → Add New Page**, enter the title, set **Parent page** to *Free email tools* and the slug as shown, add a Shortcode block with the shortcode, publish. **Settings → Email tools** lists the same table and ticks each page off once it's published at the right address.

| Page title (the H1) | Slug | Shortcode |
|---|---|---|
| A/B Test Hypothesis Builder | `hypothesis` | `[hea_email_tool name="hypothesis"]` |
| A/B Test Duration Calculator | `ab-duration` | `[hea_email_tool name="ab-duration"]` |
| Statistical Significance Calculator | `sscc` | `[hea_email_tool name="sscc"]` |
| We-We Calculator | `wewe` | `[hea_email_tool name="wewe"]` |
| Email Readability Score | `ers` | `[hea_email_tool name="ers"]` |
| Feature-to-Benefit Converter | `f2b` | `[hea_email_tool name="f2b"]` |
| Email Tone Analyser | `tone` | `[hea_email_tool name="tone"]` |
| Buyer Persona Matcher | `persona` | `[hea_email_tool name="persona"]` |
| Emotional Appeal Analyser | `emotional-appeal` | `[hea_email_tool name="emotional-appeal"]` |
| Personalisation & Dynamic Content Checker | `personalisation` | `[hea_email_tool name="personalisation"]` |
| Email Accessibility Checker | `accessibility` | `[hea_email_tool name="accessibility"]` |
| CURVE Subject Line Builder | `curve` | `[hea_email_tool name="curve"]` |
| DMARC, SPF & DKIM Checker | `dmarc-checker` | `[hea_email_tool name="dmarc-checker"]` |

The slugs are short on purpose: they match the tools' internal names, so links between tools work without any extra setup. If you want longer, keyword-rich slugs, say so and they can be mapped in the plugin.

### 4. SEO fields (Yoast, 10 minutes)

The page title is the only H1: each tool's own headline was removed, and the index hero is an H2. For each page, set the Yoast **meta description** from the table below (copied from the GitHub pages, rebranded). Delete the `%%sep%% %%sitename%%` variables from the SEO title only if you want the title exactly as written.

| Page | SEO title | Meta description |
|---|---|---|
| Free email tools | Free Email Marketing Tools (No Sign-Up) | Thirteen free email marketing tools from the Holistic Email Academy: plan and read A/B tests, check readability, tone and personalisation, and test your DMARC, SPF and DKIM. |
| Hypothesis Builder | Free A/B Test Hypothesis Builder | Turn a vague test idea into a hypothesis you can actually prove wrong. A guided set of questions, then hand it on to the Duration Calculator. No sign-up needed. |
| Duration Calculator | Free A/B Test Duration Calculator | Know how long to run your A/B test before you start. Calculate required sample size and test duration with a two-proportion z-test. No sign-up needed. |
| Significance Calculator | Free Email A/B Test Significance Calculator | Check whether your email A/B test result is statistically significant before you act on it. Enter sample sizes and conversion rates — no sign-up needed. |
| We-We Calculator | We-We Calculator: Is Your Email About You or Your Reader? | Check if your email copy talks about you or to your reader. Count brand-focused vs. customer-focused pronouns instantly — no sign-up needed. |
| Readability Score | Free Email Readability Checker | Score your email copy's readability with Flesch Reading Ease, Gunning Fog, and SMOG — with UK reading ages and practical suggestions. No sign-up needed. |
| Feature-to-Benefit | Feature-to-Benefit Converter for Email Copy | Turn product features into customer benefits. Pick your industry, enter a feature, and get a benefit statement from 384 templates across 8 industries. No sign-up needed. |
| Tone Analyser | Free Email Tone Analyser | Detect the tone of your email copy across five dimensions — Friendly, Persuasive, Professional, Urgent, and Empathetic — with phrase suggestions for shifting tone. No sign-up needed. |
| Persona Matcher | Buyer Persona Matcher for Email Copy | Find out who your email copy is really speaking to. Detects Competitive, Spontaneous, Humanistic, and Methodical buyer modalities, with phrase suggestions — no sign-up needed. |
| Emotional Appeal | Emotional Appeal Analyser for Email Copy | Detect the emotional triggers in your email copy — Fear, Hope, Curiosity, Pride, Trust, and Belonging — with guidance on when each appeal works best. No sign-up needed. |
| Personalisation | Email Personalisation & Fallback Checker | Check your email's personalisation tokens and dynamic content blocks for missing fallbacks and unbalanced conditionals, across 16 email platforms. No sign-up needed. |
| Accessibility | Free Email Accessibility Checker | Check your email HTML against common accessibility pitfalls — missing alt text, vague link text, small fonts, poor colour contrast, and broken heading order. No sign-up needed. |
| CURVE | CURVE Subject Line Builder | Score your subject line against the Academy's CURVE framework — Curiosity, Urgency, Relevance, Value, Emotion — and see exactly which element is missing. No sign-up needed. |
| DMARC Checker | Free DMARC, SPF & DKIM Checker | Check your domain's SPF, DKIM and DMARC records in plain English: what's set up, what's missing and what to fix. No sign-up needed. |

The DMARC page also outputs its FAQ as structured data (FAQPage), as it did on GitHub.

### 5. Privacy policy (5 minutes)

Every tool runs in the visitor's browser and sends nothing to the Academy. The one exception: the **DMARC checker** looks up the domain the visitor types using Google's public DNS service (dns.google). Add a line to the privacy policy, for example:

> Our DMARC, SPF & DKIM Checker looks up the domain you enter using Google Public DNS (dns.google). Only the domain name is sent, and Google's privacy policy applies to that lookup. The other email tools run entirely in your browser and don't send what you paste anywhere.

### 6. Test it live (15 minutes)

The generated pages were tested in a browser inside a stand-in theme, but the plugin's PHP hasn't yet run in a real WordPress, so do this on a staging copy first if you have one. Check **Settings → Email tools** shows ✓ for all 14 pages, then on each page check:

- [ ] The tool appears, styled, with the Academy header and footer around it.
- [ ] Run it with real copy: one of your own sends works well. Results appear, and there are no errors in the browser console.
- [ ] The course cards under the tool link to `/courses/…?ref=email-tools-…` on the same site.
- [ ] "← All email tools" goes back to the index; every index card opens its tool.
- [ ] Hypothesis Builder → "Next: Duration Calculator" carries the hypothesis, baseline and lift across.
- [ ] DMARC checker: try `google.com` (SPF and DMARC found) and a domain you know has no DMARC.
- [ ] On a phone: nothing overflows sideways, and the buttons are easy to tap.

### 7. Point the old addresses at the new pages (once you're happy)

This is done (you're reading the version from the redirects branch): each GitHub tool page now sends visitors, with any `?…` query, to its Academy page. It keeps `email-tools/assets/`: the London Forum assessment, its dashboard, the slides and the pilot load fonts and course data from there.

Also update links you control elsewhere: the jonathanpay.github.io homepage card and `/tools/` list (the redirect branch does this), LinkedIn posts, the newsletter footer, and anything in the Academy that already links to jonathanpay.github.io/email-tools/.

## Afterwards

- **Changing a tool.** Edit the page in `wordpress/email-tools-pages/` or the script in `email-tools/assets/`, run `sh wordpress/build-email-tools-plugin.sh`, then upload the new zip (WordPress offers to replace the installed version). The test `tests/email-tools-plugin.test.mjs` fails if the plugin is out of date with the source, so you can't commit a stale build.
- **A course launches or changes.** Edit `COURSES` in `email-tools/assets/course-ctas.js`, rebuild, upload. The maturity assessment has its own copy of the course list (`hea-maturity-assessment/assets/js/courses.js`), so update both.
- **How it's protected from the theme.** Every style is scoped to `#hea-et`, with a small reset for theme styles that would leak in (buttons, headings, links). Scripts are ES modules with content-hashed URLs, so a new upload is picked up straight away.
