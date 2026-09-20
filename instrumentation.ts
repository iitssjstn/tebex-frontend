// Runs once when the server boots: creates/updates the database schema so no manual step is needed.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { db } = await import("./src/lib/db");
    db();
  }
}
