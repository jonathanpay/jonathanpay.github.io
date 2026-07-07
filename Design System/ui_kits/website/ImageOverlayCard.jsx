// ImageOverlayCard.jsx — photo background + navy gradient + gold eyebrow + italic title.
// Lifted from jonathanpay.github.io (the personal landing page) and added as a kit primitive.
// Use it for "Work" tiles, project tiles, or any time you want a card that pulls weight
// visually. Pair with `--jp-image-card-grid` for the responsive grid.
//
// Background source:
//   - `bgClass`: preferred. A CSS class that sets background-image. Bundler-safe.
//   - `image`:   fallback. Inline URL string; works at dev-time but won't survive bundling.
const ImageOverlayCard = ({ href, image, bgClass, eyebrow, title, children, target, rel, onClick }) => {
  const className = "jp-image-card" + (bgClass ? " " + bgClass : "");
  const style = !bgClass && image ? { backgroundImage: `url("${image}")` } : undefined;
  const handleClick = onClick || ((e) => { if (!href || href === "#") e.preventDefault(); });
  return (
    <a
      className={className}
      href={href || "#"}
      target={target}
      rel={rel}
      style={style}
      onClick={handleClick}
    >
      <div className="jp-image-card__inner">
        {eyebrow && <div className="jp-image-card__eyebrow">{eyebrow}</div>}
        {title && <h3 className="jp-image-card__title">{title}</h3>}
        {children && <p className="jp-image-card__body">{children}</p>}
      </div>
    </a>
  );
};

const ImageOverlayCardGrid = ({ children }) => (
  <div className="jp-image-card-grid">{children}</div>
);

Object.assign(window, { ImageOverlayCard, ImageOverlayCardGrid });

