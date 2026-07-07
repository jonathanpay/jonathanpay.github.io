// data.js — real posts pulled from jonathanpay.com/blog (March 2026).
// Each post links out to the live article — body content lives on the source site.
// bgClass refers to a CSS class in kit.css that sets the background-image.

const POSTS = [
  {
    id: "email-consent-is-sexy",
    category: "Work",
    date: "19 March 2026",
    title: "(Email) Consent Is Sexy",
    dek: "Everyone has an email. Not everyone is on every platform. Here's why consent is the mechanism that makes email marketing work, and why cold email undermines it.",
    bgClass: "jp-image-card--post-consent",
    url: "https://jonathanpay.com/2026/03/19/email-consent-is-sexy/"
  },
  {
    id: "decision-problem-email-marketing",
    category: "Work",
    date: "19 March 2026",
    title: "The Decision Problem in Email Marketing",
    dek: "Why most email campaigns miss the decision happening in the buyer's head, and what understanding psychology actually changes about the way you write.",
    bgClass: "jp-image-card--post-decision",
    url: "https://jonathanpay.com/2026/03/19/the-decision-problem-in-email-marketing/"
  },
  {
    id: "cawing-birdsong-crows",
    category: "Work",
    date: "10 March 2026",
    title: "CAWing: When You Can't Hear the Birdsong for the Crows",
    dek: "When enough people use the same tools, prompted by the same anxiety, the overall soundscape changes. Individual voices don't disappear exactly. They just get harder to find.",
    bgClass: "jp-image-card--post-cawing",
    url: "https://jonathanpay.com/2026/03/10/cawing-when-you-cant-hear-the-birdsong-for-the-crows/"
  },
  {
    id: "co-thinking-with-machines",
    category: "Life",
    date: "9 March 2026",
    title: "Co-thinking with Machines",
    dek: "Caught between the professional necessity and creative unease of using LLMs, I've been reflecting on what it means to think with a machine. On authorship, interpretation, and faith in an age where meaning is predicted, not felt.",
    bgClass: "jp-image-card--post-co-thinking",
    url: "https://jonathanpay.com/2026/03/09/co-thinking-with-machines-on-meaning-intent-and-collaboration/"
  },
  {
    id: "film-that-blew-my-mind",
    category: "Life",
    date: "17 February 2026",
    title: "The Film That Blew My Mind",
    dek: "Birds of Prey was the last film I saw before my stroke, a night that changed everything. Six years later, I'm still here, still learning, still grateful.",
    bgClass: "jp-image-card--post-film",
    url: "https://jonathanpay.com/2026/02/17/the-film-that-blew-my-mind/"
  },
  {
    id: "deus-ex-critical-gaming",
    category: "Fun",
    date: "16 February 2026",
    title: "Deus Ex and the Birth of Critical Gaming",
    dek: "Deus Ex treated its players differently. It assumed we could question authority, notice contradictions, and weigh ethical choices with more than a points system. A game designed to teach critical thinking through play.",
    bgClass: "jp-image-card--post-deus-ex",
    url: "https://jonathanpay.com/2026/02/16/deus-ex-and-the-birth-of-critical-gaming/"
  },
  {
    id: "mystery-that-holds-it-all",
    category: "Faith",
    date: "15 November 2025",
    title: "The Mystery That Holds It All",
    dek: "Does understanding how something works diminish its capacity to move us? Between medical scans, we prayed, and healing came. I don't have to choose between faith and reason.",
    bgClass: "jp-image-card--post-mystery",
    url: "https://jonathanpay.com/2025/11/15/the-mystery-that-holds-it-all/"
  }
];

window.POSTS = POSTS;

// SERVICES — the four capabilities listed on jonathanpay.com/
const SERVICES = [
  {
    id: "consulting",
    title: "Consulting",
    body: "Audits, testing, copywriting, and long-term programme support. I start with what your audience is actually doing, not with assumptions about what ought to work."
  },
  {
    id: "digital-publishing",
    title: "Digital publishing",
    body: "Design and layout for Holistic Email's in-house materials: banners, flyers, multi-page guides, and branded assets. Built to look right and read clearly."
  },
  {
    id: "digital-events",
    title: "Digital events",
    body: "From short webinars to full-day, multi-session events, I oversee production end to end. Speaker logistics, slide prep, tech support, and managing the stage on the day."
  },
  {
    id: "video-editing",
    title: "Video editing",
    body: "Panels, webinars, and roundtables, edited down into something a viewer can actually follow. I cut everything that doesn't need to be there."
  }
];

window.SERVICES = SERVICES;

// SOCIALS — six channels listed on jonathanpay.com/
const SOCIALS = [
  { id: "bluesky",  label: "Bluesky",  url: "https://bsky.app/profile/jonathanpay.bsky.social" },
  { id: "tiktok",   label: "TikTok",   url: "https://www.tiktok.com/@jonathanpay" },
  { id: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/jonathanpay" },
  { id: "youtube",  label: "YouTube",  url: "https://www.youtube.com/c/JonathanPay" },
  { id: "mastodon", label: "Mastodon", url: "https://mastodon.social/@jonathanpay" },
  { id: "pixelfed", label: "Pixelfed", url: "https://pixelfed.social/jonathanpay" }
];

window.SOCIALS = SOCIALS;
