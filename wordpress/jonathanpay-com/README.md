# jonathanpay.com: WordPress styled like the GitHub site

`additional.css` restyles the WordPress.com site (Twenty Twenty theme, Premium plan) to match this repository's design: navy header bar, gold italic navigation, Open Sans Bold Italic headings at the GitHub sizes, a 696px reading column, left-aligned post headers, gold-edged quotes, square gold buttons and a navy footer.

Colours and sizes are copied from `assets/css/main.css`. If you change them there, change them here too.

## Install (about 5 minutes)

1. In WP Admin go to **Appearance → Customize → Additional CSS**.
2. Delete anything already in the box (it's empty at the time of writing), paste in the whole of `additional.css`.
3. The preview on the right updates as you paste. Click through the homepage, a post, the Blog page and the Privacy Policy before you press **Publish**.

To undo it, empty the box and publish again. Additional CSS keeps revisions, so you can also roll back from there.

## Switch posts off the Cover template (recommended)

Every post currently uses Twenty Twenty's **Cover Template**: a full-screen photo with the title over it. The GitHub site shows a plain header with the title left-aligned and the image underneath, which is what Twenty Twenty's **Default Template** does once this CSS is in.

- **One post:** open it in the editor, then **Post → Template → Default template**, and Update.
- **All posts:** **Posts → All Posts**, tick the select-all box, **Bulk actions → Edit → Apply**. Set **Template** to **Default template** and press **Update**. Change 20 at a time if the list is paged.

Leave the homepage on the Cover Template: it matches the GitHub site's photo hero.

The CSS styles both templates, so nothing breaks if some posts stay on Cover.

## Things CSS can't change

- **Menu items.** The GitHub nav is About, Work, Writing, Holistic Email Marketing, Holistic Email Academy. WordPress currently lists Blog, Holistic Email Academy, Holistic Email Marketing, Jonathan Pay, Privacy Policy. Set this up under **Appearance → Menus** once the missing pages exist.
- **The "Proudly powered by WordPress.com" footer credit.** Removing it needs the Business plan.
- **Accent colour in the editor.** Set **Appearance → Customize → Colors → Primary color** to `#8b7417` (it may already be) so the block editor's colour swatches match.

## How it was checked

The CSS was injected into the live pages in a browser (homepage, a Cover-template post, the Blog page, the Privacy Policy) at 1024px wide; nothing was saved to WordPress. Not checked: phone widths (WordPress.com's bot check blocked the emulated phone), the Default-template post layout (no post uses it yet), comments and the search screen. Check those in the Customizer preview, which has phone and tablet buttons at the bottom.

Note: Twenty Twenty sets `1rem = 10px`, so sizes in this file are in px rather than the rem values in `main.css`.
