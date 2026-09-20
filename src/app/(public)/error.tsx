"use client";

// Customers only ever see this friendly message; the technical error stays in the server log.
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container center-page">
      <h1>Something went wrong</h1>
      <p className="muted" style={{ marginBottom: "1.6rem" }}>Please try again in a moment.</p>
      <button className="btn" onClick={reset}>Try again</button>
    </div>
  );
}
