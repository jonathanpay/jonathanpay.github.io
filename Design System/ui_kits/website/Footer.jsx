// Footer.jsx — navy footer with social glyphs, bio tagline, copyright.
// Social glyphs are Lucide (CDN substitute — flagged in the kit's README).
const SocialIcon = ({ name }) => {
  // Inline SVG for the small set we use — Lucide stroke 1.75, 18px.
  const paths = {
    bluesky: <path d="M6 4 L12 12 L6 20 M18 4 L12 12 L18 20" />,
    linkedin: <><rect x="3" y="3" width="18" height="18" rx="0" /><line x1="7" y1="10" x2="7" y2="17" /><circle cx="7" cy="7" r="0.8" /><path d="M11 17v-4a2 2 0 0 1 4 0v4 M11 13v-3" /></>,
    rss: <><path d="M4 11a9 9 0 0 1 9 9" /><path d="M4 4a16 16 0 0 1 16 16" /><circle cx="5" cy="19" r="1.5" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="0" /><path d="M3 6 L12 13 L21 6" /></>
  };
  return (
    <svg className="jp-social" width="20" height="20" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" strokeWidth="1.75"
         strokeLinecap="round" strokeLinejoin="round" aria-label={name}>
      {paths[name]}
    </svg>
  );
};

const Footer = () => {
  return (
    <footer className="jp-footer on-dark">
      <div className="jp-footer-inner">
        <div className="jp-footer-left">
          <span className="jp-footer-mark" role="img" aria-label="JP"></span>
          <div className="jp-footer-tagline">
            Email marketer. Writer. Weston-super-Mare.
          </div>
        </div>
        <div className="jp-footer-right">
          <div className="jp-social-row">
            <a href="#" aria-label="Bluesky"><SocialIcon name="bluesky" /></a>
            <a href="#" aria-label="LinkedIn"><SocialIcon name="linkedin" /></a>
            <a href="#" aria-label="RSS"><SocialIcon name="rss" /></a>
            <a href="#" aria-label="Email"><SocialIcon name="mail" /></a>
          </div>
          <div className="jp-copy">© 2026 Jonathan Pay. Words by me.</div>
        </div>
      </div>
    </footer>
  );
};

Object.assign(window, { Footer, SocialIcon });
