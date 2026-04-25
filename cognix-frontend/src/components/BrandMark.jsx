export default function BrandMark({ compact = false }) {
  return (
    <div className={`brandmark${compact ? " compact" : ""}`}>
      <div className="brandmark-orbit">
        <span className="brandmark-ring brandmark-ring-a" />
        <span className="brandmark-ring brandmark-ring-b" />
        <span className="brandmark-core" />
      </div>
      <div className="brandmark-copy">
        <div className="brandmark-word">cognix</div>
        <div className="brandmark-sub">autonomous defense platform</div>
      </div>
    </div>
  );
}
