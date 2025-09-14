// Streams N random-ish bytes to client without caching.
// Use backpressure-aware writes for accuracy.
export default async function handler(req, res) {
  const DEFAULT = 25 * 1024 * 1024; // 25 MB
  const size = Math.max(1, parseInt(req.query.size || DEFAULT, 10) || DEFAULT);

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Disposition", 'inline; filename="data.bin"');

  const chunkSize = 64 * 1024;
  let sent = 0;
  function writeChunk() {
    while (sent < size) {
      const remaining = size - sent;
      const len = Math.min(chunkSize, remaining);
      // Allocate a zeroed buffer (sufficient for throughput testing)
      const buf = Buffer.allocUnsafe(len);
      if (!res.write(buf)) {
        res.once("drain", writeChunk);
        return;
      }
      sent += len;
    }
    res.end();
  }
  writeChunk();
}
