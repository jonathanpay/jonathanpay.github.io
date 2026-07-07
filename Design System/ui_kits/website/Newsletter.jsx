// Newsletter.jsx — subscribe form. Navy ground, gold solid button.
const Newsletter = () => {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState(null);
  const submit = (e) => {
    e.preventDefault();
    if (!email.includes("@")) { setStatus("invalid"); return; }
    console.log("[mock] subscribed:", email);
    setStatus("ok");
    setEmail("");
  };
  return (
    <section className="jp-newsletter on-dark">
      <div className="jp-newsletter-inner">
        <h2 className="jp-newsletter-title">Get the next one in your inbox</h2>
        <p className="jp-newsletter-dek">
          No schedule, no funnels, no growth-hacks. I send when there's something worth sending.
        </p>
        <form className="jp-newsletter-form" onSubmit={submit}>
          <input className="jp-input"
                 type="email"
                 placeholder="you@example.com"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 aria-label="Email address" />
          <button className="jp-btn jp-btn-gold" type="submit">Subscribe</button>
        </form>
        {status === "ok" && <p className="jp-newsletter-status">Thanks. You'll hear from me when it's worth it.</p>}
        {status === "invalid" && <p className="jp-newsletter-status jp-error">That doesn't look like an email address.</p>}
      </div>
    </section>
  );
};

Object.assign(window, { Newsletter });
