function MediaCard({
  title,
  subtitle,
  image,
  type,
  onSelect,
}) {
  return (
    <article
      className="media-card"
      onClick={onSelect}
    >
      <img
        className="media-card-image"
        src={image}
        alt={`${title} ${type} artwork`}
      />

      <div className="media-card-info">
        <h3>{title}</h3>

        {subtitle && (
          <p>{subtitle}</p>
        )}

        <span className="media-card-type">
          {type}
        </span>
      </div>
    </article>
  );
}

export default MediaCard;