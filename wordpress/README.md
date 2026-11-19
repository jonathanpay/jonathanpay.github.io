# Email maturity assessment on the Academy website

This folder holds the Academy edition of the email maturity assessment, built as a small WordPress plugin. Once it's installed, any page on holisticemailacademy.com can show the assessment with one shortcode:

```
[hea_maturity_assessment]
```

| Path | What it is |
|---|---|
| `hea-maturity-assessment/` | The plugin. `build-plugin.sh` zips it for upload. |
| `apps-script/Code.gs` | The response collector and result emailer, for the Academy Google account. |
| `build-plugin.sh` | Makes `dist/hea-maturity-assessment.zip`. |
| `page-seo.md` | SEO settings for the page: title, Yoast fields, internal links. |
| `page-content.md` | Text to paste below the assessment so search engines have something to read. |

This whole folder is excluded from the GitHub Pages build (`_config.yml`), so nothing here is published on jonathanpay.github.io.

## Setting it up: the walkthrough

It takes about 30 minutes, in this order. The page needs the collector URL from step 1 before it can save anything.

### 1. Responses sheet and collector, in the Academy Google account (about 15 minutes)

Sign in to Google as the **Holistic Email Academy** account (the holisticemail.academy Workspace, the same one the London Forum collector uses), not your personal Gmail.

1. Create a new Google Sheet called **Email maturity assessment responses**. You don't need to add any tabs or headers. On the first save the script creates a `Responses` tab and writes the header row itself.
2. In the sheet, go to **Extensions → Apps Script**. Delete the placeholder code, paste in the whole of `apps-script/Code.gs` and press **Save**.
3. Check the settings at the top of the script:
   - `ASSESSMENT_URL` is the page you'll create in step 3. It's preset to `https://holisticemailacademy.com/email-maturity-assessment/`. If you use a different page address, change it here, because the result email links to it.
   - `REPLY_TO` is optional. Leave it empty and replies to result emails go to the Academy account. Put an address in (for example a shared inbox) to send them there instead.
4. In the function menu at the top, choose **authoriseEmail** and press **Run**. Approve the permissions Google asks for (the spreadsheet and sending email). This sends nothing. It just unlocks email sending.
5. Go to **Deploy → New deployment**. Click the gear icon, choose **Web app** and set:
   - Description: `Academy v1`
   - Execute as: **Me**
   - Who has access: **Anyone**

   Press **Deploy** and copy the **Web app URL**. It ends in `/exec`.
6. Paste that URL into a browser tab. You should see `{"ok":true,"service":"Email maturity assessment collector"}`.

> If "Anyone" isn't offered in step 5, a Google Workspace admin setting is blocking sharing outside the domain. The London Forum collector already runs from this account with "Anyone" access, so this should be fine.

### 2. Install the plugin on WordPress (about 5 minutes)

1. Get `hea-maturity-assessment.zip`, either the copy I sent you or a fresh one from `./build-plugin.sh` (it lands in `wordpress/dist/`).
2. In WP Admin, go to **Plugins → Add New Plugin → Upload Plugin**. Choose the zip, press **Install Now**, then **Activate**.
3. Go to **Settings → Maturity assessment** and:
   - paste the `/exec` URL from step 1 into **Collector URL**;
   - leave **Privacy policy URL** empty to use the site's privacy policy page, or enter another address;
   - press **Save Changes**.

   If the collector URL isn't a Google Apps Script `/exec` address, it won't save and you'll see a message. With no collector URL the assessment still works, but it saves nothing and hides "Get your result by email".

### 3. Create the page (about 5 minutes)

1. Go to **Pages → Add New Page**. Title it **Email maturity assessment**.
2. In the page settings sidebar, set the **slug** to `email-maturity-assessment`. It must match `ASSESSMENT_URL` in the script.
3. Add a **Shortcode** block (type `/shortcode`) and enter `[hea_maturity_assessment]`.
   - Put it **straight on the page, not inside a Group or Columns block**. It sets its own width (up to 1,180px, centred) and its own side margins.
   - You can add your own intro text above it if you like. The assessment opens with its own headline ("Understand where your email programme stands"), so you may want to hide the page title or keep your intro short.
4. Add a short **excerpt / meta description** for search results and link previews, for example: *A free 15–20 minute assessment that shows where your email programme stands across five areas, and what to focus on next.*
5. **Publish.** Search engines can index the page, as you asked. The old pilot's "don't index" tag isn't carried over.

### 4. Test it live (about 5 minutes)

In a private browser window:

1. Open the page and complete the assessment. Answer "I don't know" at least once.
2. At the result, check "Your result has been saved." appears under the buttons.
3. Ask for **Get your result by email** with your own address. Check:
   - a row appears in the sheet, with **Prototype version** = `academy-01`;
   - the email comes from the Academy account and its "take the assessment again" link opens the new page.
4. Try **Print or save as PDF**. Only the assessment should print, without the site menu or footer.
5. Open the page on your phone.

### 5. Update the privacy policy (Section 10)

Section 10 of https://holisticemailacademy.com/privacy-policy/ currently says the assessment page is hosted on GitHub Pages. Once the new page is live, replace that sentence with something like:

> The assessment runs on this website, which is hosted by WordPress.com (Automattic); see Section 4.

Check that Section 4 lists WordPress.com/Automattic as a processor (it may already, as the website host). The Google Sheets and Google Workspace wording is already right, and it becomes accurate once the collector runs from the Academy account rather than the pilot's personal Gmail.

### 6. Retire the old copies (once you're happy)

Nothing below has been changed yet. These are your decisions:

- **GitHub pilot** (`pilots/email-maturity-assessment/`, https://jonathanpay.github.io/pilots/email-maturity-assessment/). This is still live and still saves to the pilot sheet on your personal Gmail. Replace it with a redirect to the new page, or remove it.
- **Pilot QA sheet** (personal Gmail). It holds testers' names and emails. Archive or delete it as the original README planned. Undeploy its Apps Script (Deploy → Manage deployments → Archive) so nothing else can post to it.
- **London Forum workshop copy and dashboard** (`workshops/london-forum/`). These are separate and untouched.

## What changed from the GitHub pilot

- **Pilot wording removed.** No "Pilot" badge, no "Review 04 · Pilot edition", no "test record", no facilitator or debrief wording. The debrief box is now "Feedback on this assessment".
- **Reference code and timer hidden.** The result heading no longer shows `HEA-XXXXXX`, and "Questionnaire time: N minutes" is gone. The reference is still saved in the sheet (column **Reference**, formerly "Pilot code") and quoted in the result email.
- **Download kept, renamed** to "Download my answers", with "Open answers you downloaded earlier" on the start screen. Print is now the main button ("Print or save as PDF").
- **Indexable.** There's no `noindex` tag.
- **Course links stay on the Academy site** (`/courses/...`) and carry `?ref=maturity-assessment-dimension-N` instead of UTM tags. UTM tags on links within the same site overwrite the visitor's original traffic source in Google Analytics. The result email still uses UTM tags (`utm_medium=email`), which is correct for email.
- **Theme-proof.** Every style is scoped to the assessment (`#hea-ma`), so the Academy theme can't restyle it and it can't restyle the theme. The layout adapts to the width it's given, not just the screen width.
- **Self-contained.** Fonts (CMG Sans, as compressed WOFF2 with Latin characters only: 114 KB instead of 1.3 MB), course data and scripts ship inside the plugin. Nothing loads from jonathanpay.github.io.
- **One H1.** The WordPress page title is the page's only H1; the assessment's own headings are H2s.
- **Fixed a stylesheet bug.** A stray `}` in the pilot's `styles.css` silently dropped one rule (the intro's small green heading came out purple).
- **No London Forum material.** The plugin is built from the general pilot, not the workshop copy, so there are no sessions, room dashboard or workshop takeaway.

Unchanged: the 20 questions, the scoring, the advice rules, the course mapping and course statuses (as of the pilot), the autosave behaviour and the result email. Some internal field names still say "pilot" (`schema: hea-assessment-pilot-v1`, `pilotCode`) so the collector and previously downloaded files keep working. People only see them if they open a downloaded file in a text editor.

## Updating it later

- **A course launches or changes.** Edit its `status` (or `title`/`offer`) in `hea-maturity-assessment/assets/js/courses.js` **and** in `COURSES` in `apps-script/Code.gs`. Then:
  1. run the tests (below);
  2. bump `Version:` in `hea-maturity-assessment.php`, then run `./build-plugin.sh`;
  3. in WordPress, use **Plugins → Add New Plugin → Upload Plugin** with the new zip and choose **Replace current with uploaded**;
  4. in Apps Script, paste the new `Code.gs`, then **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. The `/exec` URL stays the same.
- **The page address changes.** Update `ASSESSMENT_URL` in the script and deploy a new version.
- **Moving the sheet again.** Deploy the script in the new sheet, then paste its new `/exec` URL into Settings → Maturity assessment. Nothing refers to the sheet by ID.

## Tests

From the repository root (Node 22+):

```bash
node --test tests/maturity-assessment-*.test.mjs
```

`maturity-assessment-academy.test.mjs` checks that the scoring and advice files are byte-for-byte the pilot's, that course data matches the email tools and Code.gs, that course links carry no UTM tags, that no pilot or workshop wording reaches people, and that every CSS rule is scoped and the braces balance. The `academy-collector` and `academy-advice` files rerun the pilot's collector and advice suites against this copy.
