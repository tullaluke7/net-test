export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
  }
  res.status(200).json({ received: bytes });
}
