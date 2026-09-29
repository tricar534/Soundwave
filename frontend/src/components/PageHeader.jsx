function PageHeader({
  title,
  description,
  children,
}) {
  return (
    <header className="page-header">
      <div>
        <h2>{title}</h2>

        {description && (
          <p>{description}</p>
        )}
      </div>

      {children && (
        <div className="page-header-actions">
          {children}
        </div>
      )}
    </header>
  );
}

export default PageHeader;