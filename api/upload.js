// Accepts arbitrary POST body and discards it; replies when fully received.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  // Avoid caching
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

  let bytes = 0;
  await new Promise((resolve, reject) => {
    req.on("data", (chunk) => { bytes += chunk.length; });
    req.on("end", resolve);
    req.on("error", reject);
  });

  res.status(200).json({ ok: true, bytes });
}
