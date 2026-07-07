#!/usr/bin/env python3
from __future__ import annotations

import html
import os
import re
import shutil
import ssl
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path

REPO = Path("/Users/jonathanpay/Documents/GitHub/jonathanpay.github.io")
EXPORT = Path.home() / "Downloads" / "jonathanpay.WordPress.2026-07-03.xml"
SITE_URL = "https://jonathanpay.com"

NS = {
    "content": "http://purl.org/rss/1.0/modules/content/",
    "dc": "http://purl.org/dc/elements/1.1/",
    "excerpt": "http://wordpress.org/export/1.2/excerpt/",
    "wp": "http://wordpress.org/export/1.2/",
}


def clean_xml_bytes(raw: bytes) -> bytes:
    return bytes(b for b in raw if b in (9, 10, 13) or b >= 32)


def text(node: ET.Element, path: str) -> str:
    return (node.findtext(path, namespaces=NS) or "").strip()


def slugify(value: str) -> str:
    value = html.unescape(value)
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value.lower()).strip("-")
    return value or "untitled"


def yaml_string(value: str) -> str:
    value = html.unescape(value).replace("\\", "\\\\").replace('"', '\\"')
    value = value.replace("\n", "\\n")
    return f'"{value}"'


def yaml_list(name: str, values: list[str]) -> list[str]:
    if not values:
        return []
    lines = [f"{name}:"]
    for value in values:
        lines.append(f"  - {yaml_string(value)}")
    return lines


def front_matter(data: dict[str, object]) -> str:
    lines = ["---"]
    for key, value in data.items():
        if isinstance(value, bool):
            lines.append(f"{key}: {'true' if value else 'false'}")
        elif isinstance(value, list):
            lines.extend(yaml_list(key, [str(v) for v in value]))
        elif value is None:
            continue
        elif isinstance(value, (int, float)):
            lines.append(f"{key}: {value}")
        else:
            lines.append(f"{key}: {yaml_string(str(value))}")
    lines.append("---")
    return "\n".join(lines) + "\n\n"


def parse_date(value: str) -> datetime:
    if not value or value.startswith("0000"):
        return datetime(1970, 1, 1, 0, 0, 0)
    return datetime.strptime(value, "%Y-%m-%d %H:%M:%S")


def category_terms(item: ET.Element, domain: str) -> list[str]:
    values: list[str] = []
    for cat in item.findall("category"):
        if cat.get("domain") == domain and cat.text:
            values.append(html.unescape(cat.text.strip()))
    return sorted(dict.fromkeys(values), key=str.lower)


def post_name(item: ET.Element) -> str:
    return text(item, "wp:post_name") or slugify(text(item, "title"))


def permalink_from_link(item: ET.Element) -> str:
    parsed = urllib.parse.urlparse(text(item, "link"))
    if parsed.path and parsed.path != "/":
        return parsed.path if parsed.path.endswith("/") else parsed.path + "/"
    return f"/{post_name(item)}/"


def upload_tail(url: str) -> str | None:
    parsed = urllib.parse.urlparse(html.unescape(url))
    netloc = parsed.netloc.lower()
    path = urllib.parse.unquote(parsed.path)
    marker = "/wp-content/uploads/"
    if netloc in {"jonathanpay.com", "www.jonathanpay.com"} and marker in path:
        return path.split(marker, 1)[1]
    if netloc in {"i0.wp.com", "i1.wp.com", "i2.wp.com"}:
        prefix = "/jonathanpay.com/wp-content/uploads/"
        if path.startswith(prefix):
            return path[len(prefix):]
    return None


def local_upload_url(url: str) -> str | None:
    tail = upload_tail(url)
    if not tail:
        return None
    return "/assets/uploads/" + tail


def source_upload_url(tail: str) -> str:
    return f"{SITE_URL}/wp-content/uploads/{urllib.parse.quote(tail, safe='/.-_')}"


def rewrite_uploads(content: str, media_tails: set[str]) -> str:
    content = html.unescape(content)

    def repl(match: re.Match[str]) -> str:
        url = match.group(0)
        tail = upload_tail(url)
        if not tail:
            return url
        media_tails.add(tail)
        return "/assets/uploads/" + tail

    pattern = re.compile(r"https?://(?:jonathanpay\.com|www\.jonathanpay\.com|i[0-2]\.wp\.com)/[^\s\"'<>)]*wp-content/uploads/[^\s\"'<>)]*")
    return pattern.sub(repl, content)


def clean_content(content: str, media_tails: set[str]) -> str:
    content = rewrite_uploads(content, media_tails)
    content = re.sub(r"<!--\s*/?wp:[\s\S]*?-->", "", content)
    content = re.sub(r"\n{3,}", "\n\n", content)
    return content.strip() + "\n"


def collect_media(items: list[ET.Element]) -> set[str]:
    tails: set[str] = set()
    for item in items:
        if text(item, "wp:post_type") == "attachment":
            tail = upload_tail(text(item, "wp:attachment_url"))
            if tail:
                tails.add(tail)
        elif text(item, "wp:post_type") in {"post", "page"}:
            clean_content(text(item, "content:encoded"), tails)
    return tails


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def remove_path(path: Path) -> None:
    if path.is_dir():
        shutil.rmtree(path)
    elif path.exists():
        path.unlink()


def copy_import_script() -> None:
    target = REPO / "scripts" / "import_wordpress.py"
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(Path(__file__), target)


def static_files() -> None:
    write(REPO / "Gemfile", """source "https://rubygems.org"

gem "github-pages", "232", group: :jekyll_plugins

group :jekyll_plugins do
  gem "jekyll-feed"
  gem "jekyll-sitemap"
  gem "jekyll-seo-tag"
  gem "jekyll-redirect-from"
end
""")
    write(REPO / "_config.yml", """title: Jonathan Pay
description: Email marketer, writer, consultant, and second-generation practitioner.
url: "https://jonathanpay.com"
baseurl: ""
lang: en-GB
timezone: Europe/London
permalink: /:year/:month/:day/:title/

author:
  name: Jonathan Pay
  email: email@jonathanpay.com

plugins:
  - jekyll-feed
  - jekyll-sitemap
  - jekyll-seo-tag
  - jekyll-redirect-from

defaults:
  - scope:
      path: ""
      type: posts
    values:
      layout: post

exclude:
  - scripts
  - wordpress-import-report.md
  - readme.md
  - vendor
  - Gemfile.lock
""")
    write(REPO / ".gitignore", """.DS_Store
_site/
.jekyll-cache/
.sass-cache/
.bundle/
vendor/
""")
    write(REPO / "_layouts" / "default.html", """<!doctype html>
<html lang="{{ page.lang | default: site.lang | default: 'en-GB' }}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{% if page.title %}{{ page.title }} | {% endif %}{{ site.title }}</title>
    <link rel="icon" href="{{ '/favicon.ico' | relative_url }}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;0,700;0,800;1,400;1,700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ '/assets/css/main.css' | relative_url }}">
    {% seo title=false %}
  </head>
  <body>
    <div class="site-shell">
      <header class="site-header">
        <a class="site-brand" href="{{ '/' | relative_url }}">Jonathan Pay</a>
        <nav class="site-nav" aria-label="Primary navigation">
          <a href="{{ '/blog/' | relative_url }}" {% if page.url == '/blog/' %}aria-current="page"{% endif %}>Blog</a>
          <a href="{{ '/holistic-email-marketing/' | relative_url }}" {% if page.url == '/holistic-email-marketing/' %}aria-current="page"{% endif %}>Holistic Email Marketing</a>
          <a href="{{ '/holistic-email-academy/' | relative_url }}" {% if page.url == '/holistic-email-academy/' %}aria-current="page"{% endif %}>Holistic Email Academy</a>
          <a href="mailto:email@jonathanpay.com">Contact</a>
        </nav>
      </header>

      <main class="site-main">
        {{ content }}
      </main>

      <footer class="site-footer">
        <p>&copy; {{ 'now' | date: '%Y' }} Jonathan Pay. <a href="{{ '/privacy-policy/' | relative_url }}">Privacy policy</a>.</p>
      </footer>
    </div>
  </body>
</html>
""")
    write(REPO / "_layouts" / "page.html", """---
layout: default
---
<article class="page-content">
  {% unless page.hide_title %}
    <h1>{{ page.title }}</h1>
  {% endunless %}
  {{ content }}
</article>
""")
    write(REPO / "_layouts" / "post.html", """---
layout: default
---
<article class="post-content">
  <header class="post-header">
    <p class="post-meta">{{ page.date | date: "%-d %B %Y" }}{% if page.categories and page.categories != empty %} · {{ page.categories | join: ", " }}{% endif %}</p>
    <h1>{{ page.title }}</h1>
  </header>
  {{ content }}
  {% if page.tags and page.tags != empty %}
    <footer class="post-tags">
      {% for tag in page.tags %}
        <span>{{ tag }}</span>
      {% endfor %}
    </footer>
  {% endif %}
</article>
""")
    write(REPO / "assets" / "css" / "main.css", """ :root {
  --ink: #2c3e50;
  --muted: #687783;
  --paper: #fafafa;
  --line: #dfe5e8;
  --accent: #7f8c8d;
  --accent-strong: #2c3e50;
  --max: 780px;
}

* { box-sizing: border-box; }

html { min-height: 100%; background: var(--paper); }

body {
  min-height: 100%;
  margin: 0;
  color: var(--ink);
  background: radial-gradient(circle at top, rgba(44, 62, 80, 0.08), transparent 34rem), var(--paper);
  font-family: "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 18px;
  line-height: 1.65;
}

a { color: var(--accent-strong); text-decoration-thickness: 0.08em; text-underline-offset: 0.18em; }
a:hover, a:focus { color: var(--accent); }

.site-shell {
  width: min(100% - 32px, var(--max));
  min-height: 100vh;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}

.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 0;
  border-bottom: 1px solid var(--line);
}

.site-brand {
  color: var(--ink);
  font-size: 1.1rem;
  font-weight: 800;
  text-decoration: none;
  white-space: nowrap;
}

.site-nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px 18px;
  font-size: 0.88rem;
  font-weight: 700;
}

.site-nav a {
  color: rgba(44, 62, 80, 0.78);
  padding-bottom: 3px;
  text-decoration: none;
  border-bottom: 2px solid transparent;
}

.site-nav a:hover,
.site-nav a:focus,
.site-nav a[aria-current="page"] {
  color: var(--ink);
  border-bottom-color: var(--ink);
}

.site-main {
  flex: 1;
  padding: 56px 0 64px;
}

.page-content,
.post-content,
.blog-index {
  overflow-wrap: break-word;
}

h1, h2, h3, h4 {
  color: var(--ink);
  font-weight: 800;
  line-height: 1.15;
  margin: 2.2rem 0 0.8rem;
}

h1 { margin-top: 0; font-size: clamp(2.1rem, 7vw, 4rem); letter-spacing: 0; }
h2 { font-size: clamp(1.55rem, 4vw, 2.35rem); }
h3 { font-size: 1.35rem; }

p, ul, ol, blockquote, figure { margin: 0 0 1.35rem; }
ul, ol { padding-left: 1.35rem; }
li + li { margin-top: 0.35rem; }

blockquote {
  border-left: 4px solid var(--accent);
  color: #405260;
  padding: 0.2rem 0 0.2rem 1.1rem;
  font-style: italic;
}

blockquote cite {
  display: block;
  margin-top: 0.7rem;
  color: var(--muted);
  font-size: 0.92rem;
  font-style: normal;
}

img, video {
  display: block;
  max-width: 100%;
  height: auto;
}

figure img { margin-inline: auto; }
figcaption, .wp-element-caption {
  color: var(--muted);
  font-size: 0.88rem;
  line-height: 1.45;
  margin-top: 0.55rem;
  text-align: center;
}

.aligncenter,
.has-text-align-center { text-align: center; }

.aligncenter img,
.is-style-circle-mask img,
.is-style-rounded img { margin-inline: auto; }
.is-style-circle-mask img { border-radius: 999px; }
.is-style-rounded img { border-radius: 14px; }

.wp-block-separator {
  border: 0;
  border-top: 1px solid var(--line);
  margin: 2.2rem auto;
}

.wp-block-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin: 1.8rem 0;
}

.wp-block-button__link,
.button {
  display: inline-block;
  border-radius: 999px;
  background: var(--accent-strong);
  color: #fff;
  font-weight: 800;
  padding: 0.75rem 1.15rem;
  text-decoration: none;
}

.wp-block-button__link:hover,
.wp-block-button__link:focus,
.button:hover,
.button:focus {
  background: var(--accent);
  color: #fff;
}

.wp-block-gallery,
.wp-block-jetpack-tiled-gallery,
.tiled-gallery__gallery {
  display: grid;
  gap: 12px;
}

.wp-block-gallery.has-nested-images {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.tiled-gallery__row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.tiled-gallery__item img,
.wp-block-gallery img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-header { margin-bottom: 2rem; }
.post-meta {
  color: var(--muted);
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 0.55rem;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 3rem;
}

.post-tags span {
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--muted);
  font-size: 0.78rem;
  padding: 0.22rem 0.62rem;
}

.post-list {
  list-style: none;
  padding: 0;
  margin: 2.3rem 0 0;
}

.post-list li {
  border-top: 1px solid var(--line);
  padding: 1.2rem 0;
}

.post-list a {
  display: block;
  color: var(--ink);
  font-size: 1.28rem;
  font-weight: 800;
  line-height: 1.25;
  text-decoration: none;
}

.post-list a:hover,
.post-list a:focus { color: var(--accent); }

.post-list time {
  color: var(--muted);
  display: block;
  font-size: 0.86rem;
  font-weight: 700;
  margin-bottom: 0.35rem;
}

.site-footer {
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 0.85rem;
  padding: 24px 0 34px;
}

.site-footer p { margin: 0; }

@media (max-width: 720px) {
  body { font-size: 17px; }
  .site-header { align-items: flex-start; flex-direction: column; }
  .site-nav { justify-content: flex-start; }
  .site-main { padding-top: 38px; }
}
""")
    write(REPO / "404.html", front_matter({"layout": "page", "title": "Page not found"}) + "<p>The page you were looking for is not here.</p>\n<p><a href=\"/blog/\">Read the blog</a> or head back to the <a href=\"/\">home page</a>.</p>\n")
    write(REPO / "blog.html", front_matter({"layout": "default", "title": "Blog", "permalink": "/blog/"}) + """<section class="blog-index">
  <h1>Blog</h1>
  <ul class="post-list">
    {% for post in site.posts %}
      <li>
        <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%-d %B %Y" }}</time>
        <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
        {% if post.excerpt %}<p>{{ post.excerpt | strip_html | truncate: 180 }}</p>{% endif %}
      </li>
    {% endfor %}
  </ul>
</section>
""")


def generated_dirs() -> None:
    for name in ["_layouts", "_posts", "_drafts", "assets/css", "assets/uploads", "scripts"]:
        (REPO / name).mkdir(parents=True, exist_ok=True)


def remove_old_bootstrap_site() -> None:
    for rel in [
        "javascripts",
        "stylesheets",
        "about.html",
        "contact.html",
        "services.html",
        "thanks.html",
        "now.html",
        "using.html",
        "params.json",
    ]:
        remove_path(REPO / rel)


def write_content(items: list[ET.Element], media_tails: set[str]) -> tuple[int, int, int]:
    published_posts = draft_posts = pages = 0
    for item in items:
        post_type = text(item, "wp:post_type")
        status = text(item, "wp:status")
        if post_type not in {"post", "page"}:
            continue
        if status not in {"publish", "draft"}:
            continue

        title = html.unescape(text(item, "title") or "Untitled")
        date = parse_date(text(item, "wp:post_date"))
        slug = post_name(item)
        content = clean_content(text(item, "content:encoded"), media_tails)
        old_link = text(item, "link")
        wp_id = text(item, "wp:post_id")

        if post_type == "post":
            data = {
                "layout": "post",
                "title": title,
                "date": date.strftime("%Y-%m-%d %H:%M:%S %z").strip() or date.strftime("%Y-%m-%d %H:%M:%S"),
                "permalink": permalink_from_link(item) if status == "publish" else None,
                "categories": category_terms(item, "category"),
                "tags": category_terms(item, "post_tag"),
                "wordpress_id": int(wp_id) if wp_id.isdigit() else wp_id,
                "wordpress_url": old_link,
                "published": False if status == "draft" else None,
            }
            filename = f"{date:%Y-%m-%d}-{slug}.html"
            if status == "publish":
                write(REPO / "_posts" / filename, front_matter(data) + content)
                published_posts += 1
            else:
                data.pop("permalink", None)
                write(REPO / "_drafts" / filename, front_matter(data) + content)
                draft_posts += 1
            continue

        if post_type == "page":
            if status == "draft":
                data = {
                    "layout": "page",
                    "title": title,
                    "date": date.strftime("%Y-%m-%d %H:%M:%S"),
                    "wordpress_id": int(wp_id) if wp_id.isdigit() else wp_id,
                    "wordpress_url": old_link,
                    "published": False,
                }
                write(REPO / "_drafts" / "pages" / f"{slug}.html", front_matter(data) + content)
                continue

            if slug == "blog":
                continue
            if old_link.rstrip("/") == SITE_URL:
                path = REPO / "index.html"
                permalink = "/"
                hide_title = True
            else:
                path = REPO / f"{slug}.html"
                permalink = permalink_from_link(item)
                hide_title = False
            data = {
                "layout": "page",
                "title": title,
                "permalink": permalink,
                "hide_title": hide_title,
                "wordpress_id": int(wp_id) if wp_id.isdigit() else wp_id,
                "wordpress_url": old_link,
            }
            write(path, front_matter(data) + content)
            pages += 1
    return published_posts, draft_posts, pages


def download_media(tails: set[str]) -> tuple[int, list[str]]:
    downloaded = 0
    failures: list[str] = []
    headers = {"User-Agent": "Mozilla/5.0 (Jekyll migration; jonathanpay.com)"}
    context = ssl._create_unverified_context()
    for tail in sorted(tails):
        target = REPO / "assets" / "uploads" / tail
        if target.exists() and target.stat().st_size > 0:
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        url = source_upload_url(tail)
        try:
            request = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(request, timeout=30, context=context) as response:
                data = response.read()
            if not data:
                raise ValueError("empty response")
            target.write_bytes(data)
            downloaded += 1
            time.sleep(0.05)
        except Exception as exc:
            failures.append(f"{url} -> {exc}")
            if target.exists() and target.stat().st_size == 0:
                target.unlink()
    return downloaded, failures


def main() -> int:
    if not REPO.exists():
        print(f"Repository not found: {REPO}", file=sys.stderr)
        return 1
    if not EXPORT.exists():
        print(f"WordPress export not found: {EXPORT}", file=sys.stderr)
        return 1

    raw = EXPORT.read_bytes()
    root = ET.fromstring(clean_xml_bytes(raw))
    items = root.find("channel").findall("item")
    media_tails = collect_media(items)

    generated_dirs()
    remove_old_bootstrap_site()
    static_files()
    posts, drafts, pages = write_content(items, media_tails)
    copy_import_script()
    downloaded, failures = download_media(media_tails)

    manifest = [
        "# WordPress Import Report",
        "",
        f"- Source export: `{EXPORT}`",
        f"- Published posts imported: {posts}",
        f"- Draft posts imported: {drafts}",
        f"- Published pages imported: {pages}",
        f"- Media files referenced: {len(media_tails)}",
        f"- Media files downloaded in this run: {downloaded}",
        f"- Media download failures: {len(failures)}",
        "",
    ]
    if failures:
        manifest.append("## Media download failures")
        manifest.append("")
        manifest.extend(f"- {failure}" for failure in failures)
        manifest.append("")
    write(REPO / "wordpress-import-report.md", "\n".join(manifest))

    print("\n".join(manifest))
    return 0 if not failures else 2


if __name__ == "__main__":
    raise SystemExit(main())
