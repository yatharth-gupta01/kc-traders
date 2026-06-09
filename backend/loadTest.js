const http = require('http');

const API_TARGET = 'http://localhost:5000/api/stock';
const CONCURRENT_STEPS = [100, 500, 1000]; // Concurrency increments for simulation

async function makeRequest(id) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = http.get(API_TARGET, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          id,
          success: res.statusCode === 200,
          status: res.statusCode,
          latency: Date.now() - start
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        id,
        success: false,
        status: 500,
        error: err.message,
        latency: Date.now() - start
      });
    });

    req.setTimeout(5000, () => {
      req.destroy(new Error('Timeout'));
    });
  });
}

async function runLoadBatch(concurrency) {
  console.log(`\n==============================================`);
  console.log(`STRESS TEST: Simulating ${concurrency} Concurrent Requests...`);
  console.log(`==============================================`);

  const start = Date.now();
  const promises = Array.from({ length: concurrency }).map((_, idx) => makeRequest(idx));
  const results = await Promise.all(promises);
  const duration = Date.now() - start;

  const successes = results.filter(r => r.success);
  const failures = results.filter(r => !r.success);
  
  const latencies = results.map(r => r.latency);
  const avgLatency = latencies.reduce((sum, val) => sum + val, 0) / latencies.length;
  const maxLatency = Math.max(...latencies);
  const minLatency = Math.min(...latencies);

  console.log(`Batch Completed in: ${duration}ms`);
  console.log(`Successes: ${successes.length} (${((successes.length / concurrency) * 100).toFixed(1)}%)`);
  console.log(`Failures: ${failures.length} (${((failures.length / concurrency) * 100).toFixed(1)}%)`);
  console.log(`Average Latency: ${avgLatency.toFixed(1)}ms`);
  console.log(`Min Latency: ${minLatency}ms`);
  console.log(`Max Latency: ${maxLatency}ms`);

  if (failures.length > 0) {
    console.log(`Sample failure status codes:`, [...new Set(failures.map(f => f.status))]);
  }
}

async function startStressTest() {
  console.log("Starting Stress Test Suite for KC Traders Vault backend...");
  for (const step of CONCURRENT_STEPS) {
    await runLoadBatch(step);
    // Cool down period between batches
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log("\nStress test suite completed.");
}

startStressTest();
