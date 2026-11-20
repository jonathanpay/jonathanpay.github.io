# SEO for the assessment page

The page is https://holisticemailacademy.com/email-maturity-assessment/. It's set up for the search **email marketing maturity assessment** and for close variations like "email maturity model", "email marketing audit" and "email marketing self-assessment".

The searches people make for this are small but specific, and the other results are mostly gated PDFs, vendor reports and "talk to our team" offers. An interactive assessment that's free and needs no sign-up stands out among them. Lean on that.

## 1. Page title (the big heading on the page)

Change it from "Email Maturity Assessment" to:

> **Email Marketing Maturity Assessment**

Leave the slug (`email-maturity-assessment`) as it is. The result email and the collector script both link to that address.

## 2. Yoast SEO fields (Yoast box under the page editor, or the Yoast icon in the top-right sidebar)

| Field | Enter |
|---|---|
| Focus keyphrase | `email marketing maturity assessment` |
| Related keyphrases (Premium) | `email maturity model`, `email marketing audit`, `email marketing self-assessment` |
| SEO title | `Free Email Marketing Maturity Assessment (No Sign-Up)` (53 characters). Delete the `%%sep%% %%sitename%%` variables so this is the whole title. Google shows the site name separately. |
| Meta description | `Free email marketing maturity assessment: see where your programme stands across five areas, from deliverability to lifecycle. 15–20 minutes, no sign-up.` (153 characters) |

**Social tab** (what LinkedIn, Slack and others show when someone shares the link):

| Field | Enter |
|---|---|
| Social title | `How mature is your email marketing?` |
| Social description | `Take the free 20-question assessment from Holistic Email Academy. See where your programme stands across five areas and get a practical next step.` |
| Social image | A 1200 × 630 image for this page. Right now it uses the site's default banner (2400 × 500), which crops badly on LinkedIn. |

## 3. Page text (below the assessment)

Search engines and AI search tools read the text on a page, not the inside of an interactive tool. At the moment the page has almost no text of its own. `page-content.md` adds about 550 words: what the assessment covers, how it works, who it's for and an FAQ.

1. Open `page-content.md` and copy all of it.
2. In the page editor, click just **below** the Shortcode block and paste. WordPress turns the `##` lines into headings and the lists into list blocks.
3. Check the two links inside it (privacy policy, courses) and the "Start the assessment ↑" link at the end, which jumps back to the top of the assessment.

Optional, above the Shortcode block: one short sentence that uses the keyphrase, which helps Yoast's "keyphrase in introduction" check. For example:

> A free email marketing maturity assessment from Holistic Email Academy. 20 questions, about 15 minutes, no sign-up.

## 4. Link to it from the rest of the site

No other page on the site links to the assessment yet, which makes it hard for Google to find and to judge as important. Good places for links:

- **Main menu.** "Start Free" currently goes to The Buyer's Mind course. Consider adding the assessment there or under it.
- **Homepage.** A short section or button: "How mature is your email marketing? Take the free assessment."
- **Courses page.** "Not sure where to start? Take the assessment."
- **Blog posts** on deliverability, testing, lifecycle and so on. Link the phrase "email marketing maturity assessment" to the page.
- **The Mindful Marketer newsletter** and your email signature.

## 5. After publishing the changes

In Google Search Console (Site Kit is installed), use **URL inspection** on the page and click **Request indexing**. The page wasn't in the Yoast page sitemap when I checked on 19 November, the day it was published. That's normally a cache that catches up within a day, so check that `https://holisticemailacademy.com/page-sitemap.xml` lists it the next day.

## What the plugin already handles (version 1.0.2)

- **One H1 per page.** The page title is the only H1. The assessment's own headings are H2s, so they no longer compete with it.
- **Fonts.** Down from 1.3 MB to 114 KB (compressed WOFF2, Latin characters only), which speeds up loading on phones.
- **Search engines can index the page.** It has the right canonical address and is in English (UK). Yoast manages these.
