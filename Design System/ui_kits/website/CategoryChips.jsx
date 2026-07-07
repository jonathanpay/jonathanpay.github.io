// CategoryChips.jsx — Faith / Fun / Life / Work filter row.
const CategoryChips = ({ active, onChange }) => {
  const cats = ["All", "Faith", "Fun", "Life", "Work"];
  return (
    <div className="jp-chips">
      <div className="jp-chips-label">Filed under</div>
      <div className="jp-chips-row">
        {cats.map((c) => (
          <a key={c}
             href="#"
             className={"jp-chip" + ((active || "All") === c ? " is-active" : "")}
             onClick={(e) => { e.preventDefault(); onChange(c === "All" ? null : c); }}>
            {c}
          </a>
        ))}
      </div>
    </div>
  );
};

Object.assign(window, { CategoryChips });
