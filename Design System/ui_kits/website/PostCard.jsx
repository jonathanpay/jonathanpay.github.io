// PostCard.jsx — meta line, italic title, dek. Used in the homepage list.
const PostCard = ({ post, onOpen }) => {
  return (
    <article className="jp-post-card">
      <div className="jp-meta">
        <a href="#" className="jp-meta-cat" onClick={(e) => e.preventDefault()}>{post.category}</a>
        <span className="jp-meta-dot">·</span>
        <span>{post.date}</span>
        <span className="jp-meta-dot">·</span>
        <span>{post.readMin} min read</span>
      </div>
      <h2 className="jp-post-title">
        <a href="#" onClick={(e) => { e.preventDefault(); onOpen(post.id); }}>
          {post.title}
        </a>
      </h2>
      <p className="jp-post-dek">{post.dek}</p>
      <a href="#" className="jp-read-more"
         onClick={(e) => { e.preventDefault(); onOpen(post.id); }}>
        Read on
      </a>
    </article>
  );
};

Object.assign(window, { PostCard });
