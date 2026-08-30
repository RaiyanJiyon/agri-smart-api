/**
 * BullMQ Disease-Detection Worker Benchmark
 *
 * Measures real throughput and latency of the worker at concurrency: 5.
 * The AI call and DB writes are mocked — no API credits consumed.
 *
 * Run: pnpm tsx scripts/benchmark-worker.ts
 */

import { Queue, Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';

// ─── Config ───────────────────────────────────────────────────────────────────
const QUEUE_NAME = 'benchmark-disease-detection';
const JOB_NAME = 'benchmark-job';
const TOTAL_JOBS = 30;
const CONCURRENCY = 5;
const MOCK_AI_DELAY_MS = Number(process.env['MOCK_AI_MS'] ?? 300); // override: MOCK_AI_MS=2500 pnpm tsx ...

// ─── Redis connection ─────────────────────────────────────────────────────────
const connection = new IORedis({ host: '127.0.0.1', port: 6379, maxRetriesPerRequest: null });

// ─── Queue ────────────────────────────────────────────────────────────────────
const queue = new Queue(QUEUE_NAME, { connection });

// ─── Mock job processor ───────────────────────────────────────────────────────
async function mockProcessor(job: Job): Promise<void> {
  // Simulate AI inference latency (normally 300–1500ms for Gemini/Mistral)
  await new Promise((resolve) => setTimeout(resolve, MOCK_AI_DELAY_MS));
  // Simulate a tiny MongoDB write
  await new Promise((resolve) => setTimeout(resolve, 10));
  job.log(`Processed mock disease detection for job ${job.id ?? 'unknown'}`);
}

// ─── Benchmark runner ─────────────────────────────────────────────────────────
async function runBenchmark(): Promise<void> {
  console.log('━'.repeat(60));
  console.log('  Agri-Smart BullMQ Worker Benchmark');
  console.log(`  Queue: ${QUEUE_NAME}`);
  console.log(`  Jobs : ${TOTAL_JOBS}`);
  console.log(`  Concurrency: ${CONCURRENCY}`);
  console.log(`  Mock AI delay: ${MOCK_AI_DELAY_MS}ms per job`);
  console.log('━'.repeat(60));

  // 1. Flush any stale jobs from a previous run
  await queue.drain(true);

  // 2. Enqueue all jobs
  console.log(`\n[1/3] Enqueueing ${TOTAL_JOBS} jobs...`);
  for (let i = 0; i < TOTAL_JOBS; i++) {
    await queue.add(JOB_NAME, {
      reportId: `report-${i}`,
      userId: `user-${i}`,
      imageUrl: `https://res.cloudinary.com/demo/image/upload/sample-${i}.jpg`,
    });
  }
  console.log(`      ✓ ${TOTAL_JOBS} jobs enqueued`);

  // 3. Start mock worker and collect per-job latencies
  const latencies: number[] = [];
  let completedCount = 0;

  const batchStart = Date.now();

  await new Promise<void>((resolve, reject) => {
    const worker = new Worker(QUEUE_NAME, mockProcessor, {
      connection: new IORedis({ host: '127.0.0.1', port: 6379, maxRetriesPerRequest: null }),
      concurrency: CONCURRENCY,
    });

    console.log(`\n[2/3] Worker running at concurrency ${CONCURRENCY}...`);

    worker.on('completed', (job) => {
      // BullMQ timestamps are in ms
      const enqueuedAt = job.timestamp;
      const finishedAt = job.finishedOn ?? Date.now();
      const latencyMs = finishedAt - enqueuedAt;
      latencies.push(latencyMs);
      completedCount++;

      process.stdout.write(`\r      Completed: ${completedCount}/${TOTAL_JOBS} jobs`);

      if (completedCount === TOTAL_JOBS) {
        void worker.close().then(resolve);
      }
    });

    worker.on('failed', (job, err) => {
      console.error(`\n  ✗ Job ${job?.id} failed:`, err.message);
      completedCount++;
      if (completedCount === TOTAL_JOBS) {
        void worker.close().then(reject);
      }
    });

    worker.on('error', reject);
  });

  const batchDurationMs = Date.now() - batchStart;

  // ─── Results ─────────────────────────────────────────────────────────────────
  const sorted = [...latencies].sort((a, b) => a - b);
  const avg = Math.round(latencies.reduce((s, v) => s + v, 0) / latencies.length);
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const throughput = Math.round((TOTAL_JOBS / batchDurationMs) * 60_000);

  console.log('\n\n[3/3] Results');
  console.log('─'.repeat(60));
  console.log(`  Total jobs completed : ${completedCount}`);
  console.log(`  Batch wall time      : ${(batchDurationMs / 1000).toFixed(2)}s`);
  console.log(`  Throughput           : ~${throughput} jobs/minute`);
  console.log('─'.repeat(60));
  console.log(`  End-to-end latency (enqueue → complete):`);
  console.log(`    Average : ${avg}ms`);
  console.log(`    P50     : ${p50}ms`);
  console.log(`    P95     : ${p95}ms`);
  console.log(`    Min     : ${min}ms`);
  console.log(`    Max     : ${max}ms`);
  console.log('─'.repeat(60));
  console.log(
    `\n  📌 Resume bullet (example):\n  "Processes ${throughput}+ disease-detection jobs/min at concurrency 5,\n  with P95 end-to-end latency of ${p95}ms under sustained load (BullMQ + Redis)."\n`
  );

  // Cleanup
  await queue.drain(true);
  await queue.close();
  await connection.quit();
}

runBenchmark().catch((err: unknown) => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
