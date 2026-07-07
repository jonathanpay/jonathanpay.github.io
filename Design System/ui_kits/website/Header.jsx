// Header.jsx — navy bar with JP gold mark and nav: Blog / HEM / HEA.
const Header = ({ onHome, onOpenBlog, route }) => {
  return (
    <header className="jp-header">
      <div className="jp-header-inner">
        <a className="jp-brand" href="#" onClick={(e) => { e.preventDefault(); onHome(); }}>
          <span className="jp-brand-mark" role="img" aria-label="Jonathan Pay"></span>
        </a>
        <nav className="jp-nav">
          <a className={"jp-nav-link" + (route === "blog" ? " is-active" : "")}
             href="#"
             onClick={(e) => { e.preventDefault(); onOpenBlog(); }}>
            Blog
          </a>
          <a className="jp-nav-link"
             href="https://holisticemailmarketing.com"
             target="_blank" rel="noopener">
            Holistic Email Marketing
          </a>
          <a className="jp-nav-link"
             href="https://holisticemailacademy.com"
             target="_blank" rel="noopener">
            Holistic Email Academy
          </a>
        </nav>
      </div>
    </header>
  );
};

Object.assign(window, { Header });
