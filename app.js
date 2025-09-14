const logEl = document.getElementById("log");
const latencyEl = document.getElementById("latency");
const downloadEl = document.getElementById("download");
const uploadEl = document.getElementById("upload");
const barLatency = document.getElementById("bar-latency");
const barDownload = document.getElementById("bar-download");
const barUpload = document.getElementById("bar-upload");
const startBtn = document.getElementById("startBtn");

function log(msg){
  logEl.textContent += msg + "\n";
  logEl.scrollTop = logEl.scrollHeight;
}
const sleep = (ms)=> new Promise(r=>setTimeout(r,ms));
const toMbps = (bytes, seconds)=> (bytes * 8 / 1e6) / (seconds || 1e-9);
const clamp = (n,min,max)=> Math.max(min, Math.min(max, n));

async function measureLatency(rounds=6){
  log("Measuring latency...");
  let samples = [];
  for (let i=0;i<rounds;i++){
    const start = performance.now();
    await fetch(`/api/ping?ts=${Date.now()}&r=${Math.random()}`, { cache: "no-store" });
    const end = performance.now();
    samples.push(end - start);
    await sleep(80);
  }
  // discard first sample (warmup), use median
  samples.shift();
  samples.sort((a,b)=>a-b);
  const median = samples[Math.floor(samples.length/2)];
  latencyEl.textContent = median.toFixed(0);
  barLatency.style.width = clamp(100 - median, 5, 100) + "%";
  log(`Latency: ${median.toFixed(2)} ms`);
  return median;
}

async function downloadWorker(bytes){
  const t0 = performance.now();
  let got = 0;
  // stream fetch to count exact bytes
  const res = await fetch(`/api/download?size=${bytes}&r=${Math.random()}`, { cache: "no-store" });
  const reader = res.body.getReader();
  while(true){
    const { done, value } = await reader.read();
    if (done) break;
    got += value.byteLength;
  }
  const t1 = performance.now();
  return { bytes: got, seconds: (t1 - t0) / 1000 };
}

async function measureDownload(threads, mbPerThread){
  const size = mbPerThread * 1024 * 1024;
  log(`Downloading ~${mbPerThread}MB × ${threads} threads...`);
  const workers = Array.from({ length: threads }, ()=> downloadWorker(size));
  let bytes = 0, seconds = 0;
  const results = await Promise.all(workers);
  for (const r of results){ bytes += r.bytes; seconds = Math.max(seconds, r.seconds); }
  const mbps = toMbps(bytes, seconds);
  downloadEl.textContent = mbps.toFixed(1);
  barDownload.style.width = clamp((mbps / 500) * 100, 2, 100) + "%"; // scale up to 500 Mbps bar
  log(`Download: ${(bytes/1e6).toFixed(1)} MB in ${seconds.toFixed(2)} s → ${mbps.toFixed(2)} Mbps`);
  return mbps;
}

function makeRandomBlob(bytes){
  // Create pseudo-random data without huge memory spikes—chunk fill
  const chunk = new Uint8Array(1024 * 1024);
  crypto.getRandomValues(chunk);
  const chunks = [];
  let left = bytes;
  while (left > 0){
    const take = Math.min(left, chunk.byteLength);
    chunks.push(chunk.slice(0, take));
    left -= take;
  }
  return new Blob(chunks, { type: "application/octet-stream" });
}

async function uploadWorker(bytes){
  const blob = makeRandomBlob(bytes);
  const t0 = performance.now();
  await fetch(`/api/upload?r=${Math.random()}`, {
    method: "POST",
    body: blob,
    headers: { "Content-Type": "application/octet-stream", "x-no-store": "1" },
  });
  const t1 = performance.now();
  return { bytes, seconds: (t1 - t0) / 1000 };
}

async function measureUpload(threads, mbPerThread){
  const size = mbPerThread * 1024 * 1024;
  log(`Uploading ~${mbPerThread}MB × ${threads} threads...`);
  const workers = Array.from({ length: threads }, ()=> uploadWorker(size));
  const results = await Promise.all(workers);
  let bytes = 0, seconds = 0;
  for (const r of results){ bytes += r.bytes; seconds = Math.max(seconds, r.seconds); }
  const mbps = toMbps(bytes, seconds);
  uploadEl.textContent = mbps.toFixed(1);
  barUpload.style.width = clamp((mbps / 500) * 100, 2, 100) + "%";
  log(`Upload: ${(bytes/1e6).toFixed(1)} MB in ${seconds.toFixed(2)} s → ${mbps.toFixed(2)} Mbps`);
  return mbps;
}

startBtn.addEventListener("click", async ()=>{
  try{
    startBtn.disabled = true;
    logEl.textContent = "";
    latencyEl.textContent = downloadEl.textContent = uploadEl.textContent = "—";
    barLatency.style.width = barDownload.style.width = barUpload.style.width = "0%";

    const threads = parseInt(document.getElementById("threads").value, 10);
    const mb = parseInt(document.getElementById("megabytes").value, 10);

    await measureLatency();
    await measureDownload(threads, mb);
    await measureUpload(threads, Math.max(8, Math.round(mb/2))); // uploads often need less data

    log("✅ Test complete.");
  }catch(err){
    console.error(err);
    log("❌ Error: " + (err && err.message ? err.message : String(err)));
  }finally{
    startBtn.disabled = false;
  }
});
