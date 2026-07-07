// PostList.jsx — grid of image-overlay post cards linking to the live articles.
const PostList = ({ posts, onOpen }) => {
  if (!posts || posts.length === 0) {
    return (
      <div className="jp-empty">
        <p>Nothing in this category yet. Which is fine. Try another.</p>
      </div>
    );
  }
  return (
    <div className="jp-image-card-grid jp-writing-grid">
      {posts.map((p) => (
        <ImageOverlayCard
          key={p.id}
          href={p.url || "#"}
          bgClass={p.bgClass}
          target={p.url ? "_blank" : undefined}
          rel={p.url ? "noopener" : undefined}
          eyebrow={`${p.category} · ${p.date}`}
          title={p.title}
          onClick={p.url ? undefined : (e) => { e.preventDefault(); onOpen && onOpen(p.id); }}>
          {p.dek}
        </ImageOverlayCard>
      ))}
    </div>
  );
};

Object.assign(window, { PostList });
