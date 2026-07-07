/* @ds-bundle: {"format":4,"namespace":"JonathanPayDesignSystem_2e8e13","components":[],"sourceHashes":{"ui_kits/website/CategoryChips.jsx":"73036c66602d","ui_kits/website/Footer.jsx":"4dc6cd1b863f","ui_kits/website/Header.jsx":"ebb7f61a2a13","ui_kits/website/Hero.jsx":"a15528dfe0ad","ui_kits/website/Home.jsx":"7a32719be7f6","ui_kits/website/ImageOverlayCard.jsx":"ac6d05e3ef63","ui_kits/website/Newsletter.jsx":"ba9ae75e1794","ui_kits/website/PostBody.jsx":"b0a7fe1881c9","ui_kits/website/PostCard.jsx":"506278a82e87","ui_kits/website/PostList.jsx":"e43c05cfc042","ui_kits/website/app.jsx":"219b3e8ff959","ui_kits/website/data.js":"c0b2b5bdc2e5"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.JonathanPayDesignSystem_2e8e13 = window.JonathanPayDesignSystem_2e8e13 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// ui_kits/website/CategoryChips.jsx
try { (() => {
// CategoryChips.jsx — Faith / Fun / Life / Work filter row.
const CategoryChips = ({
  active,
  onChange
}) => {
  const cats = ["All", "Faith", "Fun", "Life", "Work"];
  return /*#__PURE__*/React.createElement("div", {
    className: "jp-chips"
  }, /*#__PURE__*/React.createElement("div", {
    className: "jp-chips-label"
  }, "Filed under"), /*#__PURE__*/React.createElement("div", {
    className: "jp-chips-row"
  }, cats.map(c => /*#__PURE__*/React.createElement("a", {
    key: c,
    href: "#",
    className: "jp-chip" + ((active || "All") === c ? " is-active" : ""),
    onClick: e => {
      e.preventDefault();
      onChange(c === "All" ? null : c);
    }
  }, c))));
};
Object.assign(window, {
  CategoryChips
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/CategoryChips.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Footer.jsx
try { (() => {
// Footer.jsx — navy footer with social glyphs, bio tagline, copyright.
// Social glyphs are Lucide (CDN substitute — flagged in the kit's README).
const SocialIcon = ({
  name
}) => {
  // Inline SVG for the small set we use — Lucide stroke 1.75, 18px.
  const paths = {
    bluesky: /*#__PURE__*/React.createElement("path", {
      d: "M6 4 L12 12 L6 20 M18 4 L12 12 L18 20"
    }),
    linkedin: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
      x: "3",
      y: "3",
      width: "18",
      height: "18",
      rx: "0"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "7",
      y1: "10",
      x2: "7",
      y2: "17"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "7",
      cy: "7",
      r: "0.8"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M11 17v-4a2 2 0 0 1 4 0v4 M11 13v-3"
    })),
    rss: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: "M4 11a9 9 0 0 1 9 9"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M4 4a16 16 0 0 1 16 16"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "5",
      cy: "19",
      r: "1.5"
    })),
    mail: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
      x: "3",
      y: "5",
      width: "18",
      height: "14",
      rx: "0"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M3 6 L12 13 L21 6"
    }))
  };
  return /*#__PURE__*/React.createElement("svg", {
    className: "jp-social",
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-label": name
  }, paths[name]);
};
const Footer = () => {
  return /*#__PURE__*/React.createElement("footer", {
    className: "jp-footer on-dark"
  }, /*#__PURE__*/React.createElement("div", {
    className: "jp-footer-inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "jp-footer-left"
  }, /*#__PURE__*/React.createElement("span", {
    className: "jp-footer-mark",
    role: "img",
    "aria-label": "JP"
  }), /*#__PURE__*/React.createElement("div", {
    className: "jp-footer-tagline"
  }, "Email marketer. Writer. Weston-super-Mare.")), /*#__PURE__*/React.createElement("div", {
    className: "jp-footer-right"
  }, /*#__PURE__*/React.createElement("div", {
    className: "jp-social-row"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    "aria-label": "Bluesky"
  }, /*#__PURE__*/React.createElement(SocialIcon, {
    name: "bluesky"
  })), /*#__PURE__*/React.createElement("a", {
    href: "#",
    "aria-label": "LinkedIn"
  }, /*#__PURE__*/React.createElement(SocialIcon, {
    name: "linkedin"
  })), /*#__PURE__*/React.createElement("a", {
    href: "#",
    "aria-label": "RSS"
  }, /*#__PURE__*/React.createElement(SocialIcon, {
    name: "rss"
  })), /*#__PURE__*/React.createElement("a", {
    href: "#",
    "aria-label": "Email"
  }, /*#__PURE__*/React.createElement(SocialIcon, {
    name: "mail"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "jp-copy"
  }, "\xA9 2026 Jonathan Pay. Words by me."))));
};
Object.assign(window, {
  Footer,
  SocialIcon
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Footer.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Header.jsx
try { (() => {
// Header.jsx — navy bar with JP gold mark and nav: Blog / HEM / HEA.
const Header = ({
  onHome,
  onOpenBlog,
  route
}) => {
  return /*#__PURE__*/React.createElement("header", {
    className: "jp-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "jp-header-inner"
  }, /*#__PURE__*/React.createElement("a", {
    className: "jp-brand",
    href: "#",
    onClick: e => {
      e.preventDefault();
      onHome();
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "jp-brand-mark",
    role: "img",
    "aria-label": "Jonathan Pay"
  })), /*#__PURE__*/React.createElement("nav", {
    className: "jp-nav"
  }, /*#__PURE__*/React.createElement("a", {
    className: "jp-nav-link" + (route === "blog" ? " is-active" : ""),
    href: "#",
    onClick: e => {
      e.preventDefault();
      onOpenBlog();
    }
  }, "Blog"), /*#__PURE__*/React.createElement("a", {
    className: "jp-nav-link",
    href: "https://holisticemailmarketing.com",
    target: "_blank",
    rel: "noopener"
  }, "Holistic Email Marketing"), /*#__PURE__*/React.createElement("a", {
    className: "jp-nav-link",
    href: "https://holisticemailacademy.com",
    target: "_blank",
    rel: "noopener"
  }, "Holistic Email Academy"))));
};
Object.assign(window, {
  Header
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Header.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Hero.jsx
try { (() => {
// Hero.jsx — centered hero on solid navy, italic h1 with gold "second-generation"
// emphasis, two CTAs. Mirrors the layout used on jonathanpay.github.io.
const Hero = ({
  onOpenBlog
}) => {
  return /*#__PURE__*/React.createElement("section", {
    className: "jp-hero jp-hero--solid",
    "data-screen-label": "Hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "jp-hero-inner"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "jp-hero-title"
  }, "The world's first ", /*#__PURE__*/React.createElement("em", null, "second-generation"), " email marketer."), /*#__PURE__*/React.createElement("p", {
    className: "jp-hero-tagline"
  }, "Email strategist, educator, and maker. Co-founder of Holistic Email Academy. Based in Weston-super-Mare."), /*#__PURE__*/React.createElement("div", {
    className: "jp-hero-actions"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    className: "jp-hero-btn jp-hero-btn--primary",
    onClick: e => {
      e.preventDefault();
      onOpenBlog();
    }
  }, "Read the blog"), /*#__PURE__*/React.createElement("a", {
    href: "mailto:jonathan@holisticemail.com",
    className: "jp-hero-btn jp-hero-btn--outline"
  }, "Get in touch"))));
};
Object.assign(window, {
  Hero
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Hero.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Home.jsx
try { (() => {
// Home.jsx — the sectioned front page. Modelled on the live jonathanpay.com
// homepage (portrait, bio, services, companies, writing, talk CTA, socials)
// reframed in the image-overlay/slash-heading visual system.
const SectionHeading = ({
  children
}) => /*#__PURE__*/React.createElement("h2", {
  className: "jp-section-h"
}, /*#__PURE__*/React.createElement("span", {
  className: "jp-section-h-text"
}, children), /*#__PURE__*/React.createElement("span", {
  className: "jp-section-slash"
}, " /"));
const IntroHero = () => /*#__PURE__*/React.createElement("section", {
  className: "jp-intro",
  "data-screen-label": "Intro"
}, /*#__PURE__*/React.createElement("div", {
  className: "jp-intro-inner"
}, /*#__PURE__*/React.createElement("h1", {
  className: "jp-intro-name"
}, "Jonathan Pay"), /*#__PURE__*/React.createElement("div", {
  className: "jp-intro-portrait",
  role: "img",
  "aria-label": "Portrait of Jonathan Pay"
}), /*#__PURE__*/React.createElement("p", {
  className: "jp-intro-tagline"
}, /*#__PURE__*/React.createElement("em", null, "Christian. Husband. Father. Feminist, increasingly socialist, always anti-fascist. Antipodean immigrant in the UK. Cinephile. Jack-of-all email marketing trades. Board game & RPG enthusiast. Stroke survivor."))));
const AboutSection = () => /*#__PURE__*/React.createElement("section", {
  className: "jp-home-section",
  "data-screen-label": "About"
}, /*#__PURE__*/React.createElement(SectionHeading, null, "About"), /*#__PURE__*/React.createElement("h3", {
  className: "jp-about-headline"
}, "The world's first ", /*#__PURE__*/React.createElement("em", null, "second-generation"), " email marketer"), /*#__PURE__*/React.createElement("div", {
  className: "jp-about-body"
}, /*#__PURE__*/React.createElement("p", null, "I've worked in email since before Gmail existed. Literally."), /*#__PURE__*/React.createElement("p", null, "My mum ran one of Australia's first email service providers, and I helped manage campaigns from her home office. That's where I learned the craft."), /*#__PURE__*/React.createElement("p", null, "Since then, I've gathered more than 18 years of experience across strategy, testing, design, deliverability, and copy. I've worked with and most parts of the email channel."), /*#__PURE__*/React.createElement("p", null, "These days, I co-lead Holistic Email Marketing and Holistic Email Academy alongside Kath Pay. Between us, we cover the full range of what email actually requires: strategy, testing, deliverability, copywriting, and training."), /*#__PURE__*/React.createElement("p", null, "Email gets reduced to tools and metrics more often than it should. I care about the writing as much as the data. If you need a clear head on your programme, I'm up for that conversation.")));
const ServicesSection = () => /*#__PURE__*/React.createElement("section", {
  className: "jp-home-section",
  "data-screen-label": "Services"
}, /*#__PURE__*/React.createElement(SectionHeading, null, "Services"), /*#__PURE__*/React.createElement("div", {
  className: "jp-services-grid"
}, (window.SERVICES || []).map(s => /*#__PURE__*/React.createElement("div", {
  key: s.id,
  className: "jp-service-card"
}, /*#__PURE__*/React.createElement("h3", {
  className: "jp-service-card-title"
}, s.title), /*#__PURE__*/React.createElement("p", {
  className: "jp-service-card-body"
}, s.body)))));
const CompaniesSection = () => /*#__PURE__*/React.createElement("section", {
  className: "jp-home-section",
  "data-screen-label": "Companies"
}, /*#__PURE__*/React.createElement(SectionHeading, null, "Companies"), /*#__PURE__*/React.createElement(ImageOverlayCardGrid, null, /*#__PURE__*/React.createElement(ImageOverlayCard, {
  href: "https://holisticemailmarketing.com",
  bgClass: "jp-image-card--hem",
  target: "_blank",
  rel: "noopener",
  eyebrow: "Consultancy",
  title: "Holistic Email Marketing"
}, "Strategic email consultancy helping brands build programmes that actually work \u2014 from acquisition to loyalty."), /*#__PURE__*/React.createElement(ImageOverlayCard, {
  href: "https://holisticemailacademy.com",
  bgClass: "jp-image-card--hea",
  target: "_blank",
  rel: "noopener",
  eyebrow: "Education",
  title: "Holistic Email Academy"
}, "The email marketing education platform I co-founded with Kath Pay. Courses, community, and practical guidance.")));
const WritingSection = ({
  onOpenBlog
}) => {
  const posts = (window.POSTS || []).slice(0, 5);
  const [lead, ...rest] = posts;
  return /*#__PURE__*/React.createElement("section", {
    className: "jp-home-section",
    "data-screen-label": "Writing"
  }, /*#__PURE__*/React.createElement(SectionHeading, null, "Writing"), lead && /*#__PURE__*/React.createElement(ImageOverlayCard, {
    href: lead.url,
    bgClass: `jp-image-card--wide ${lead.bgClass}`,
    target: "_blank",
    rel: "noopener",
    eyebrow: `${lead.category} · ${lead.date}`,
    title: lead.title
  }, lead.dek), /*#__PURE__*/React.createElement("div", {
    className: "jp-image-card-grid jp-writing-grid"
  }, rest.map(p => /*#__PURE__*/React.createElement(ImageOverlayCard, {
    key: p.id,
    href: p.url,
    bgClass: p.bgClass,
    target: "_blank",
    rel: "noopener",
    eyebrow: `${p.category} · ${p.date}`,
    title: p.title
  }, p.dek))), /*#__PURE__*/React.createElement("div", {
    className: "jp-writing-more"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    className: "jp-link-arrow",
    onClick: e => {
      e.preventDefault();
      onOpenBlog();
    }
  }, "See all writing \u2192")));
};
const TalkSection = () => /*#__PURE__*/React.createElement("section", {
  className: "jp-home-section jp-home-section--cta",
  "data-screen-label": "Let's talk"
}, /*#__PURE__*/React.createElement(SectionHeading, null, "Curious? Let's talk."), /*#__PURE__*/React.createElement("div", {
  className: "jp-talk-body"
}, /*#__PURE__*/React.createElement("p", null, "Tell me what you're working on. Whether it's strategy, testing, or team training, I'd love to dig in. No pitch. Just a conversation."), /*#__PURE__*/React.createElement("a", {
  className: "jp-hero-btn jp-hero-btn--primary",
  href: "mailto:jonathan@holisticemail.com"
}, "Email me")));
const FindMeSection = () => /*#__PURE__*/React.createElement("section", {
  className: "jp-home-section",
  "data-screen-label": "Find me"
}, /*#__PURE__*/React.createElement(SectionHeading, null, "Find me"), /*#__PURE__*/React.createElement("ul", {
  className: "jp-find-list"
}, (window.SOCIALS || []).map(s => /*#__PURE__*/React.createElement("li", {
  key: s.id
}, /*#__PURE__*/React.createElement("a", {
  href: s.url,
  target: "_blank",
  rel: "noopener"
}, s.label)))));
const Home = ({
  onOpenBlog,
  onOpenPost
}) => /*#__PURE__*/React.createElement("main", {
  className: "jp-home"
}, /*#__PURE__*/React.createElement(AboutSection, null), /*#__PURE__*/React.createElement(ServicesSection, null), /*#__PURE__*/React.createElement(CompaniesSection, null), /*#__PURE__*/React.createElement(WritingSection, {
  onOpenBlog: onOpenBlog
}), /*#__PURE__*/React.createElement(TalkSection, null), /*#__PURE__*/React.createElement(FindMeSection, null));
Object.assign(window, {
  Home,
  IntroHero,
  SectionHeading
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/ImageOverlayCard.jsx
try { (() => {
// ImageOverlayCard.jsx — photo background + navy gradient + gold eyebrow + italic title.
// Lifted from jonathanpay.github.io (the personal landing page) and added as a kit primitive.
// Use it for "Work" tiles, project tiles, or any time you want a card that pulls weight
// visually. Pair with `--jp-image-card-grid` for the responsive grid.
//
// Background source:
//   - `bgClass`: preferred. A CSS class that sets background-image. Bundler-safe.
//   - `image`:   fallback. Inline URL string; works at dev-time but won't survive bundling.
const ImageOverlayCard = ({
  href,
  image,
  bgClass,
  eyebrow,
  title,
  children,
  target,
  rel,
  onClick
}) => {
  const className = "jp-image-card" + (bgClass ? " " + bgClass : "");
  const style = !bgClass && image ? {
    backgroundImage: `url("${image}")`
  } : undefined;
  const handleClick = onClick || (e => {
    if (!href || href === "#") e.preventDefault();
  });
  return /*#__PURE__*/React.createElement("a", {
    className: className,
    href: href || "#",
    target: target,
    rel: rel,
    style: style,
    onClick: handleClick
  }, /*#__PURE__*/React.createElement("div", {
    className: "jp-image-card__inner"
  }, eyebrow && /*#__PURE__*/React.createElement("div", {
    className: "jp-image-card__eyebrow"
  }, eyebrow), title && /*#__PURE__*/React.createElement("h3", {
    className: "jp-image-card__title"
  }, title), children && /*#__PURE__*/React.createElement("p", {
    className: "jp-image-card__body"
  }, children)));
};
const ImageOverlayCardGrid = ({
  children
}) => /*#__PURE__*/React.createElement("div", {
  className: "jp-image-card-grid"
}, children);
Object.assign(window, {
  ImageOverlayCard,
  ImageOverlayCardGrid
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/ImageOverlayCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Newsletter.jsx
try { (() => {
// Newsletter.jsx — subscribe form. Navy ground, gold solid button.
const Newsletter = () => {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState(null);
  const submit = e => {
    e.preventDefault();
    if (!email.includes("@")) {
      setStatus("invalid");
      return;
    }
    console.log("[mock] subscribed:", email);
    setStatus("ok");
    setEmail("");
  };
  return /*#__PURE__*/React.createElement("section", {
    className: "jp-newsletter on-dark"
  }, /*#__PURE__*/React.createElement("div", {
    className: "jp-newsletter-inner"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "jp-newsletter-title"
  }, "Get the next one in your inbox"), /*#__PURE__*/React.createElement("p", {
    className: "jp-newsletter-dek"
  }, "No schedule, no funnels, no growth-hacks. I send when there's something worth sending."), /*#__PURE__*/React.createElement("form", {
    className: "jp-newsletter-form",
    onSubmit: submit
  }, /*#__PURE__*/React.createElement("input", {
    className: "jp-input",
    type: "email",
    placeholder: "you@example.com",
    value: email,
    onChange: e => setEmail(e.target.value),
    "aria-label": "Email address"
  }), /*#__PURE__*/React.createElement("button", {
    className: "jp-btn jp-btn-gold",
    type: "submit"
  }, "Subscribe")), status === "ok" && /*#__PURE__*/React.createElement("p", {
    className: "jp-newsletter-status"
  }, "Thanks. You'll hear from me when it's worth it."), status === "invalid" && /*#__PURE__*/React.createElement("p", {
    className: "jp-newsletter-status jp-error"
  }, "That doesn't look like an email address.")));
};
Object.assign(window, {
  Newsletter
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Newsletter.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/PostBody.jsx
try { (() => {
// PostBody.jsx — article body. Renders the post.body[] block array into
// paragraphs, h3s, and pull-quotes.
const PostBody = ({
  post,
  onBack
}) => {
  return /*#__PURE__*/React.createElement("article", {
    className: "jp-article"
  }, /*#__PURE__*/React.createElement("a", {
    className: "jp-back",
    href: "#",
    onClick: e => {
      e.preventDefault();
      onBack();
    }
  }, "\u2190 Back"), /*#__PURE__*/React.createElement("div", {
    className: "jp-meta"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    className: "jp-meta-cat",
    onClick: e => e.preventDefault()
  }, post.category), /*#__PURE__*/React.createElement("span", {
    className: "jp-meta-dot"
  }, "\xB7"), /*#__PURE__*/React.createElement("span", null, post.date), /*#__PURE__*/React.createElement("span", {
    className: "jp-meta-dot"
  }, "\xB7"), /*#__PURE__*/React.createElement("span", null, post.readMin, " min read")), /*#__PURE__*/React.createElement("h1", {
    className: "jp-article-title"
  }, post.title), /*#__PURE__*/React.createElement("p", {
    className: "jp-article-dek"
  }, post.dek), /*#__PURE__*/React.createElement("div", {
    className: "jp-article-body"
  }, post.body.map((block, i) => {
    if (block.type === "p") return /*#__PURE__*/React.createElement("p", {
      key: i
    }, block.text);
    if (block.type === "h3") return /*#__PURE__*/React.createElement("h3", {
      key: i
    }, block.text);
    if (block.type === "quote") return /*#__PURE__*/React.createElement("blockquote", {
      key: i
    }, block.text, block.cite ? /*#__PURE__*/React.createElement("cite", null, "\u2014 ", block.cite) : null);
    return null;
  })));
};
Object.assign(window, {
  PostBody
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/PostBody.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/PostCard.jsx
try { (() => {
// PostCard.jsx — meta line, italic title, dek. Used in the homepage list.
const PostCard = ({
  post,
  onOpen
}) => {
  return /*#__PURE__*/React.createElement("article", {
    className: "jp-post-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "jp-meta"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    className: "jp-meta-cat",
    onClick: e => e.preventDefault()
  }, post.category), /*#__PURE__*/React.createElement("span", {
    className: "jp-meta-dot"
  }, "\xB7"), /*#__PURE__*/React.createElement("span", null, post.date), /*#__PURE__*/React.createElement("span", {
    className: "jp-meta-dot"
  }, "\xB7"), /*#__PURE__*/React.createElement("span", null, post.readMin, " min read")), /*#__PURE__*/React.createElement("h2", {
    className: "jp-post-title"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onOpen(post.id);
    }
  }, post.title)), /*#__PURE__*/React.createElement("p", {
    className: "jp-post-dek"
  }, post.dek), /*#__PURE__*/React.createElement("a", {
    href: "#",
    className: "jp-read-more",
    onClick: e => {
      e.preventDefault();
      onOpen(post.id);
    }
  }, "Read on"));
};
Object.assign(window, {
  PostCard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/PostCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/PostList.jsx
try { (() => {
// PostList.jsx — grid of image-overlay post cards linking to the live articles.
const PostList = ({
  posts,
  onOpen
}) => {
  if (!posts || posts.length === 0) {
    return /*#__PURE__*/React.createElement("div", {
      className: "jp-empty"
    }, /*#__PURE__*/React.createElement("p", null, "Nothing in this category yet. Which is fine. Try another."));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "jp-image-card-grid jp-writing-grid"
  }, posts.map(p => /*#__PURE__*/React.createElement(ImageOverlayCard, {
    key: p.id,
    href: p.url || "#",
    bgClass: p.bgClass,
    target: p.url ? "_blank" : undefined,
    rel: p.url ? "noopener" : undefined,
    eyebrow: `${p.category} · ${p.date}`,
    title: p.title,
    onClick: p.url ? undefined : e => {
      e.preventDefault();
      onOpen && onOpen(p.id);
    }
  }, p.dek)));
};
Object.assign(window, {
  PostList
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/PostList.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/app.jsx
try { (() => {
// app.jsx — composes the kit. Routes: home (sectioned front page) / blog
// (categorised post list) / post (single article).
const {
  useState,
  useMemo
} = React;
const App = () => {
  const [route, setRoute] = useState({
    name: "home"
  });
  const [category, setCategory] = useState(null);
  const visiblePosts = useMemo(() => {
    if (!category) return window.POSTS;
    return window.POSTS.filter(p => p.category === category);
  }, [category]);
  const goHome = () => {
    setRoute({
      name: "home"
    });
    setCategory(null);
    window.scrollTo({
      top: 0
    });
  };
  const openBlog = () => {
    setRoute({
      name: "blog"
    });
    window.scrollTo({
      top: 0
    });
  };
  const openPost = id => {
    setRoute({
      name: "post",
      id
    });
    window.scrollTo({
      top: 0
    });
  };
  const setNavCategory = c => {
    setCategory(c);
    setRoute({
      name: "blog"
    });
    window.scrollTo({
      top: 0
    });
  };
  const post = route.name === "post" ? window.POSTS.find(p => p.id === route.id) : null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Header, {
    route: route.name,
    onHome: goHome,
    onOpenBlog: openBlog
  }), route.name === "home" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(IntroHero, null), /*#__PURE__*/React.createElement(Home, {
    onOpenBlog: openBlog,
    onOpenPost: openPost
  })), route.name === "blog" && /*#__PURE__*/React.createElement("main", {
    className: "jp-main",
    "data-screen-label": "Blog list"
  }, /*#__PURE__*/React.createElement("div", {
    className: "jp-blog-head"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "jp-blog-title"
  }, "Blog", /*#__PURE__*/React.createElement("span", {
    className: "jp-section-slash"
  }, " /")), /*#__PURE__*/React.createElement("p", {
    className: "jp-blog-dek"
  }, "Faith, Fun, Life, Work. Four categories, one voice.")), /*#__PURE__*/React.createElement(CategoryChips, {
    active: category,
    onChange: setNavCategory
  }), /*#__PURE__*/React.createElement(PostList, {
    posts: visiblePosts,
    onOpen: openPost
  })), route.name === "post" && post && /*#__PURE__*/React.createElement("main", {
    className: "jp-main",
    "data-screen-label": "Post"
  }, /*#__PURE__*/React.createElement(PostBody, {
    post: post,
    onBack: openBlog
  })), (route.name === "blog" || route.name === "post") && /*#__PURE__*/React.createElement(Newsletter, null), /*#__PURE__*/React.createElement(Footer, null));
};
const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/data.js
try { (() => {
// data.js — real posts pulled from jonathanpay.com/blog (March 2026).
// Each post links out to the live article — body content lives on the source site.
// bgClass refers to a CSS class in kit.css that sets the background-image.

const POSTS = [{
  id: "email-consent-is-sexy",
  category: "Work",
  date: "19 March 2026",
  title: "(Email) Consent Is Sexy",
  dek: "Everyone has an email. Not everyone is on every platform. Here's why consent is the mechanism that makes email marketing work, and why cold email undermines it.",
  bgClass: "jp-image-card--post-consent",
  url: "https://jonathanpay.com/2026/03/19/email-consent-is-sexy/"
}, {
  id: "decision-problem-email-marketing",
  category: "Work",
  date: "19 March 2026",
  title: "The Decision Problem in Email Marketing",
  dek: "Why most email campaigns miss the decision happening in the buyer's head, and what understanding psychology actually changes about the way you write.",
  bgClass: "jp-image-card--post-decision",
  url: "https://jonathanpay.com/2026/03/19/the-decision-problem-in-email-marketing/"
}, {
  id: "cawing-birdsong-crows",
  category: "Work",
  date: "10 March 2026",
  title: "CAWing: When You Can't Hear the Birdsong for the Crows",
  dek: "When enough people use the same tools, prompted by the same anxiety, the overall soundscape changes. Individual voices don't disappear exactly. They just get harder to find.",
  bgClass: "jp-image-card--post-cawing",
  url: "https://jonathanpay.com/2026/03/10/cawing-when-you-cant-hear-the-birdsong-for-the-crows/"
}, {
  id: "co-thinking-with-machines",
  category: "Life",
  date: "9 March 2026",
  title: "Co-thinking with Machines",
  dek: "Caught between the professional necessity and creative unease of using LLMs, I've been reflecting on what it means to think with a machine. On authorship, interpretation, and faith in an age where meaning is predicted, not felt.",
  bgClass: "jp-image-card--post-co-thinking",
  url: "https://jonathanpay.com/2026/03/09/co-thinking-with-machines-on-meaning-intent-and-collaboration/"
}, {
  id: "film-that-blew-my-mind",
  category: "Life",
  date: "17 February 2026",
  title: "The Film That Blew My Mind",
  dek: "Birds of Prey was the last film I saw before my stroke, a night that changed everything. Six years later, I'm still here, still learning, still grateful.",
  bgClass: "jp-image-card--post-film",
  url: "https://jonathanpay.com/2026/02/17/the-film-that-blew-my-mind/"
}, {
  id: "deus-ex-critical-gaming",
  category: "Fun",
  date: "16 February 2026",
  title: "Deus Ex and the Birth of Critical Gaming",
  dek: "Deus Ex treated its players differently. It assumed we could question authority, notice contradictions, and weigh ethical choices with more than a points system. A game designed to teach critical thinking through play.",
  bgClass: "jp-image-card--post-deus-ex",
  url: "https://jonathanpay.com/2026/02/16/deus-ex-and-the-birth-of-critical-gaming/"
}, {
  id: "mystery-that-holds-it-all",
  category: "Faith",
  date: "15 November 2025",
  title: "The Mystery That Holds It All",
  dek: "Does understanding how something works diminish its capacity to move us? Between medical scans, we prayed, and healing came. I don't have to choose between faith and reason.",
  bgClass: "jp-image-card--post-mystery",
  url: "https://jonathanpay.com/2025/11/15/the-mystery-that-holds-it-all/"
}];
window.POSTS = POSTS;

// SERVICES — the four capabilities listed on jonathanpay.com/
const SERVICES = [{
  id: "consulting",
  title: "Consulting",
  body: "Audits, testing, copywriting, and long-term programme support. I start with what your audience is actually doing, not with assumptions about what ought to work."
}, {
  id: "digital-publishing",
  title: "Digital publishing",
  body: "Design and layout for Holistic Email's in-house materials: banners, flyers, multi-page guides, and branded assets. Built to look right and read clearly."
}, {
  id: "digital-events",
  title: "Digital events",
  body: "From short webinars to full-day, multi-session events, I oversee production end to end. Speaker logistics, slide prep, tech support, and managing the stage on the day."
}, {
  id: "video-editing",
  title: "Video editing",
  body: "Panels, webinars, and roundtables, edited down into something a viewer can actually follow. I cut everything that doesn't need to be there."
}];
window.SERVICES = SERVICES;

// SOCIALS — six channels listed on jonathanpay.com/
const SOCIALS = [{
  id: "bluesky",
  label: "Bluesky",
  url: "https://bsky.app/profile/jonathanpay.bsky.social"
}, {
  id: "tiktok",
  label: "TikTok",
  url: "https://www.tiktok.com/@jonathanpay"
}, {
  id: "linkedin",
  label: "LinkedIn",
  url: "https://www.linkedin.com/in/jonathanpay"
}, {
  id: "youtube",
  label: "YouTube",
  url: "https://www.youtube.com/c/JonathanPay"
}, {
  id: "mastodon",
  label: "Mastodon",
  url: "https://mastodon.social/@jonathanpay"
}, {
  id: "pixelfed",
  label: "Pixelfed",
  url: "https://pixelfed.social/jonathanpay"
}];
window.SOCIALS = SOCIALS;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/data.js", error: String((e && e.message) || e) }); }

})();
