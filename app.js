const logEl = document.getElementById("log");
const latencyEl = document.getElementById("latency");
const downloadEl = document.getElementById("download");
const uploadEl = document.getElementById("upload");
const startBtn = document.getElementById("startBtn");

function log(msg) {
  logEl.textContent += msg + "\n";
  logEl.scrollTop = logEl.scrollHeight;
}

async function measureLatency() {
  const start = performance.now();
  await fetch("/api/ping?ts=" + Date.now(), { cache: "no-store" });
  const end = performance.now();
  const latency = (end - start).toFixed(1);
  latencyEl.textContent = latency;
  log("Latency: " + latency + " ms");
}

async function measureDownload() {
  const start = performance.now();
  const response = await fetch("/api/download?size=5000000", { cache: "no-store" }); // 5MB
  const blob = await response.blob();
  const end = performance.now();
  const seconds = (end - start) / 1000;
  const mbps = ((blob.size * 8) / (seconds * 1e6)).toFixed(2);
  downloadEl.textContent = mbps;
  log("Download: " + mbps + " Mbps");
}

async function measureUpload() {
  const data = new Uint8Array(2 * 1024 * 1024); // 2MB random
  const start = performance.now();
  await fetch("/api/upload", {
    method: "POST",
    body: data,
    headers: { "Content-Type": "application/octet-stream" },
  });
  const end = performance.now();
  const seconds = (end - start) / 1000;
  const mbps = ((data.length * 8) / (seconds * 1e6)).toFixed(2);
  uploadEl.textContent = mbps;
  log("Upload: " + mbps + " Mbps");
}

startBtn.addEventListener("click", async () => {
  logEl.textContent = "";
  latencyEl.textContent = downloadEl.textContent = uploadEl.textContent = "—";

  await measureLatency();
  await measureDownload();
  await measureUpload();

  log("✅ Test complete");
});
