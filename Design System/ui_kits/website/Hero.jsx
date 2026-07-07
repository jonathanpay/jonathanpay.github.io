// Hero.jsx — centered hero on solid navy, italic h1 with gold "second-generation"
// emphasis, two CTAs. Mirrors the layout used on jonathanpay.github.io.
const Hero = ({ onOpenBlog }) => {
  return (
    <section className="jp-hero jp-hero--solid" data-screen-label="Hero">
      <div className="jp-hero-inner">
        <h1 className="jp-hero-title">
          The world's first <em>second-generation</em> email marketer.
        </h1>
        <p className="jp-hero-tagline">
          Email strategist, educator, and maker. Co-founder of Holistic Email Academy.
          Based in Weston-super-Mare.
        </p>
        <div className="jp-hero-actions">
          <a
            href="#"
            className="jp-hero-btn jp-hero-btn--primary"
            onClick={(e) => { e.preventDefault(); onOpenBlog(); }}
          >
            Read the blog
          </a>
          <a
            href="mailto:jonathan@holisticemail.com"
            className="jp-hero-btn jp-hero-btn--outline"
          >
            Get in touch
          </a>
        </div>
      </div>
    </section>
  );
};

Object.assign(window, { Hero });
