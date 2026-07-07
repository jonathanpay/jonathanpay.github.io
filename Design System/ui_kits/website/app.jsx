// app.jsx — composes the kit. Routes: home (sectioned front page) / blog
// (categorised post list) / post (single article).
const { useState, useMemo } = React;

const App = () => {
  const [route, setRoute] = useState({ name: "home" });
  const [category, setCategory] = useState(null);

  const visiblePosts = useMemo(() => {
    if (!category) return window.POSTS;
    return window.POSTS.filter((p) => p.category === category);
  }, [category]);

  const goHome = () => {
    setRoute({ name: "home" });
    setCategory(null);
    window.scrollTo({ top: 0 });
  };
  const openBlog = () => {
    setRoute({ name: "blog" });
    window.scrollTo({ top: 0 });
  };
  const openPost = (id) => {
    setRoute({ name: "post", id });
    window.scrollTo({ top: 0 });
  };
  const setNavCategory = (c) => {
    setCategory(c);
    setRoute({ name: "blog" });
    window.scrollTo({ top: 0 });
  };

  const post = route.name === "post"
    ? window.POSTS.find((p) => p.id === route.id)
    : null;

  return (
    <>
      <Header route={route.name} onHome={goHome} onOpenBlog={openBlog} />

      {route.name === "home" && (
        <>
          <IntroHero />
          <Home onOpenBlog={openBlog} onOpenPost={openPost} />
        </>
      )}

      {route.name === "blog" && (
        <main className="jp-main" data-screen-label="Blog list">
          <div className="jp-blog-head">
            <h1 className="jp-blog-title">
              Blog<span className="jp-section-slash"> /</span>
            </h1>
            <p className="jp-blog-dek">
              Faith, Fun, Life, Work. Four categories, one voice.
            </p>
          </div>
          <CategoryChips active={category} onChange={setNavCategory} />
          <PostList posts={visiblePosts} onOpen={openPost} />
        </main>
      )}

      {route.name === "post" && post && (
        <main className="jp-main" data-screen-label="Post">
          <PostBody post={post} onBack={openBlog} />
        </main>
      )}

      {(route.name === "blog" || route.name === "post") && <Newsletter />}
      <Footer />
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(<App />);
