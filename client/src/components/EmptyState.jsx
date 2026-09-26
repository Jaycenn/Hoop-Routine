export function EmptyState({ eyebrow = 'Nothing here yet', title, children }) {
  return (
    <section className="empty-state">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{children}</p>
    </section>
  );
}
