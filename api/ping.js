// Minimal latency endpoint
export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "text/plain");
  res.status(204).end(); // no body
}
