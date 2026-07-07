// Client helper: ask Next to bust a public cache tag after an admin mutation.
export async function bustCache(tag: "settings" | "content" | "gallery" | "members") {
  try {
    await fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag }),
    });
  } catch {
    /* best-effort */
  }
}
