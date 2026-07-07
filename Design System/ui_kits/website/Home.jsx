// Home.jsx — the sectioned front page. Modelled on the live jonathanpay.com
// homepage (portrait, bio, services, companies, writing, talk CTA, socials)
// reframed in the image-overlay/slash-heading visual system.
const SectionHeading = ({ children }) => (
  <h2 className="jp-section-h">
    <span className="jp-section-h-text">{children}</span>
    <span className="jp-section-slash"> /</span>
  </h2>
);

const IntroHero = () => (
  <section className="jp-intro" data-screen-label="Intro">
    <div className="jp-intro-inner">
      <h1 className="jp-intro-name">Jonathan Pay</h1>
      <div className="jp-intro-portrait" role="img" aria-label="Portrait of Jonathan Pay"></div>
      <p className="jp-intro-tagline">
        <em>
          Christian. Husband. Father. Feminist, increasingly socialist, always
          anti-fascist. Antipodean immigrant in the UK. Cinephile. Jack-of-all
          email marketing trades. Board game &amp; RPG enthusiast. Stroke survivor.
        </em>
      </p>
    </div>
  </section>
);

const AboutSection = () => (
  <section className="jp-home-section" data-screen-label="About">
    <SectionHeading>About</SectionHeading>
    <h3 className="jp-about-headline">
      The world's first <em>second-generation</em> email marketer
    </h3>
    <div className="jp-about-body">
      <p>I've worked in email since before Gmail existed. Literally.</p>
      <p>
        My mum ran one of Australia's first email service providers, and I helped
        manage campaigns from her home office. That's where I learned the craft.
      </p>
      <p>
        Since then, I've gathered more than 18 years of experience across strategy,
        testing, design, deliverability, and copy. I've worked with and most parts
        of the email channel.
      </p>
      <p>
        These days, I co-lead Holistic Email Marketing and Holistic Email Academy
        alongside Kath Pay. Between us, we cover the full range of what email
        actually requires: strategy, testing, deliverability, copywriting, and
        training.
      </p>
      <p>
        Email gets reduced to tools and metrics more often than it should. I care
        about the writing as much as the data. If you need a clear head on your
        programme, I'm up for that conversation.
      </p>
    </div>
  </section>
);

const ServicesSection = () => (
  <section className="jp-home-section" data-screen-label="Services">
    <SectionHeading>Services</SectionHeading>
    <div className="jp-services-grid">
      {(window.SERVICES || []).map((s) => (
        <div key={s.id} className="jp-service-card">
          <h3 className="jp-service-card-title">{s.title}</h3>
          <p className="jp-service-card-body">{s.body}</p>
        </div>
      ))}
    </div>
  </section>
);

const CompaniesSection = () => (
  <section className="jp-home-section" data-screen-label="Companies">
    <SectionHeading>Companies</SectionHeading>
    <ImageOverlayCardGrid>
      <ImageOverlayCard
        href="https://holisticemailmarketing.com"
        bgClass="jp-image-card--hem"
        target="_blank" rel="noopener"
        eyebrow="Consultancy"
        title="Holistic Email Marketing">
        Strategic email consultancy helping brands build programmes that actually
        work — from acquisition to loyalty.
      </ImageOverlayCard>
      <ImageOverlayCard
        href="https://holisticemailacademy.com"
        bgClass="jp-image-card--hea"
        target="_blank" rel="noopener"
        eyebrow="Education"
        title="Holistic Email Academy">
        The email marketing education platform I co-founded with Kath Pay. Courses,
        community, and practical guidance.
      </ImageOverlayCard>
    </ImageOverlayCardGrid>
  </section>
);

const WritingSection = ({ onOpenBlog }) => {
  const posts = (window.POSTS || []).slice(0, 5);
  const [lead, ...rest] = posts;
  return (
    <section className="jp-home-section" data-screen-label="Writing">
      <SectionHeading>Writing</SectionHeading>
      {lead && (
        <ImageOverlayCard
          href={lead.url}
          bgClass={`jp-image-card--wide ${lead.bgClass}`}
          target="_blank" rel="noopener"
          eyebrow={`${lead.category} · ${lead.date}`}
          title={lead.title}>
          {lead.dek}
        </ImageOverlayCard>
      )}
      <div className="jp-image-card-grid jp-writing-grid">
        {rest.map((p) => (
          <ImageOverlayCard
            key={p.id}
            href={p.url}
            bgClass={p.bgClass}
            target="_blank" rel="noopener"
            eyebrow={`${p.category} · ${p.date}`}
            title={p.title}>
            {p.dek}
          </ImageOverlayCard>
        ))}
      </div>
      <div className="jp-writing-more">
        <a href="#" className="jp-link-arrow"
           onClick={(e) => { e.preventDefault(); onOpenBlog(); }}>
          See all writing →
        </a>
      </div>
    </section>
  );
};

const TalkSection = () => (
  <section className="jp-home-section jp-home-section--cta" data-screen-label="Let's talk">
    <SectionHeading>Curious? Let's talk.</SectionHeading>
    <div className="jp-talk-body">
      <p>
        Tell me what you're working on. Whether it's strategy, testing, or team
        training, I'd love to dig in. No pitch. Just a conversation.
      </p>
      <a className="jp-hero-btn jp-hero-btn--primary"
         href="mailto:jonathan@holisticemail.com">
        Email me
      </a>
    </div>
  </section>
);

const FindMeSection = () => (
  <section className="jp-home-section" data-screen-label="Find me">
    <SectionHeading>Find me</SectionHeading>
    <ul className="jp-find-list">
      {(window.SOCIALS || []).map((s) => (
        <li key={s.id}>
          <a href={s.url} target="_blank" rel="noopener">{s.label}</a>
        </li>
      ))}
    </ul>
  </section>
);

const Home = ({ onOpenBlog, onOpenPost }) => (
  <main className="jp-home">
    <AboutSection />
    <ServicesSection />
    <CompaniesSection />
    <WritingSection onOpenBlog={onOpenBlog} />
    <TalkSection />
    <FindMeSection />
  </main>
);

Object.assign(window, { Home, IntroHero, SectionHeading });
