export function ErrorNotice({ message }) {
  if (!message) return null;
  return <div className="error-notice" role="alert">{message}</div>;
}

