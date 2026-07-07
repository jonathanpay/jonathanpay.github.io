// PostBody.jsx — article body. Renders the post.body[] block array into
// paragraphs, h3s, and pull-quotes.
const PostBody = ({ post, onBack }) => {
  return (
    <article className="jp-article">
      <a className="jp-back" href="#" onClick={(e) => { e.preventDefault(); onBack(); }}>← Back</a>
      <div className="jp-meta">
        <a href="#" className="jp-meta-cat" onClick={(e) => e.preventDefault()}>{post.category}</a>
        <span className="jp-meta-dot">·</span>
        <span>{post.date}</span>
        <span className="jp-meta-dot">·</span>
        <span>{post.readMin} min read</span>
      </div>
      <h1 className="jp-article-title">{post.title}</h1>
      <p className="jp-article-dek">{post.dek}</p>
      <div className="jp-article-body">
        {post.body.map((block, i) => {
          if (block.type === "p")     return <p key={i}>{block.text}</p>;
          if (block.type === "h3")    return <h3 key={i}>{block.text}</h3>;
          if (block.type === "quote") return (
            <blockquote key={i}>
              {block.text}
              {block.cite ? <cite>— {block.cite}</cite> : null}
            </blockquote>
          );
          return null;
        })}
      </div>
    </article>
  );
};

Object.assign(window, { PostBody });
