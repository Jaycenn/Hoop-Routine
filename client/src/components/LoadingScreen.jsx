export function LoadingScreen({ label = 'Loading' }) {
  return (
    <div className="loading-screen" role="status">
      <span className="loader" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

