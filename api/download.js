export default function handler(req, res) {
  const size = parseInt(req.query.size || "1000000", 10); // default 1MB
  const buffer = Buffer.alloc(size, "a");
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Cache-Control", "no-store");
  res.send(buffer);
}
