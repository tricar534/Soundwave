function MediaSection({ title, children }) {
  return (
    <section className="media-section">
      <h2>{title}</h2>
      <div className="media-grid">{children}</div>
    </section>
  );
}

export default MediaSection;