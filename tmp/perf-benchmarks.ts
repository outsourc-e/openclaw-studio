/**
 * Performance Benchmarking Suite for ClawSuite
 * Tests API response times, database queries, and WebSocket throughput
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

interface BenchmarkResult {
  name: string;
  iterations: number;
  totalMs: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  opsPerSecond: number;
}

interface APIBenchmarkConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  iterations?: number;
  concurrency?: number;
}

interface DBBenchmarkConfig {
  connectionString: string;
  queries: Array<{
    name: string;
    sql: string;
    params?: unknown[];
  }>;
  iterations?: number;
}

interface WebSocketBenchmarkConfig {
  url: string;
  messageCount: number;
  messageSize: number;
  concurrentConnections?: number;
}

// ============================================================================
// Utility Functions
// ============================================================================

function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function formatResult(result: BenchmarkResult): string {
  return `
┌─────────────────────────────────────────────────────────────┐
│ ${result.name.padEnd(59)} │
├─────────────────────────────────────────────────────────────┤
│ Iterations:     ${String(result.iterations).padEnd(42)} │
│ Total Time:     ${(result.totalMs.toFixed(2) + ' ms').padEnd(42)} │
│ Avg Time:       ${(result.avgMs.toFixed(3) + ' ms').padEnd(42)} │
│ Min Time:       ${(result.minMs.toFixed(3) + ' ms').padEnd(42)} │
│ Max Time:       ${(result.maxMs.toFixed(3) + ' ms').padEnd(42)} │
│ P50 (Median):   ${(result.p50Ms.toFixed(3) + ' ms').padEnd(42)} │
│ P95:            ${(result.p95Ms.toFixed(3) + ' ms').padEnd(42)} │
│ P99:            ${(result.p99Ms.toFixed(3) + ' ms').padEnd(42)} │
│ Ops/Second:     ${result.opsPerSecond.toFixed(2).padEnd(42)} │
└─────────────────────────────────────────────────────────────┘`;
}

function calculateStats(name: string, times: number[]): BenchmarkResult {
  const totalMs = times.reduce((a, b) => a + b, 0);
  return {
    name,
    iterations: times.length,
    totalMs,
    avgMs: totalMs / times.length,
    minMs: Math.min(...times),
    maxMs: Math.max(...times),
    p50Ms: percentile(times, 50),
    p95Ms: percentile(times, 95),
    p99Ms: percentile(times, 99),
    opsPerSecond: (times.length / totalMs) * 1000,
  };
}

// ============================================================================
// API Response Time Benchmarks
// ============================================================================

export async function benchmarkAPI(config: APIBenchmarkConfig): Promise<BenchmarkResult> {
  const iterations = config.iterations ?? 100;
  const concurrency = config.concurrency ?? 1;
  const times: number[] = [];

  console.log(`\n🔄 Running API benchmark: ${config.method} ${config.url}`);
  console.log(`   Iterations: ${iterations}, Concurrency: ${concurrency}`);

  const runSingleRequest = async (): Promise<number> => {
    const start = performance.now();
    const response = await fetch(config.url, {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: config.body ? JSON.stringify(config.body) : undefined,
    });
    await response.text(); // Consume body
    return performance.now() - start;
  };

  // Run with concurrency control
  const batches = Math.ceil(iterations / concurrency);
  for (let batch = 0; batch < batches; batch++) {
    const batchSize = Math.min(concurrency, iterations - batch * concurrency);
    const batchPromises = Array(batchSize).fill(null).map(() => runSingleRequest());
    const batchTimes = await Promise.all(batchPromises);
    times.push(...batchTimes);
    
    // Progress indicator
    if (batch % 10 === 0) {
      process.stdout.write(`\r   Progress: ${Math.min(100, Math.round(((batch + 1) / batches) * 100))}%`);
    }
  }
  console.log('\r   Progress: 100%');

  return calculateStats(`API: ${config.method} ${config.url}`, times);
}

// Batch API benchmarks with multiple endpoints
export async function benchmarkAPIEndpoints(
  baseUrl: string,
  endpoints: Array<{ path: string; method: APIBenchmarkConfig['method']; body?: unknown }>,
  iterations = 50
): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];
  
  for (const endpoint of endpoints) {
    const result = await benchmarkAPI({
      url: `${baseUrl}${endpoint.path}`,
      method: endpoint.method,
      body: endpoint.body,
      iterations,
      concurrency: 5,
    });
    results.push(result);
  }
  
  return results;
}

// ============================================================================
// Database Query Benchmarks
// ============================================================================

// Generic DB benchmark that works with any driver supporting query()
export async function benchmarkDatabase<T extends { query: (sql: string, params?: unknown[]) => Promise<unknown> }>(
  client: T,
  config: Omit<DBBenchmarkConfig, 'connectionString'>
): Promise<BenchmarkResult[]> {
  const iterations = config.iterations ?? 100;
  const results: BenchmarkResult[] = [];

  console.log(`\n📊 Running database benchmarks`);
  console.log(`   Queries: ${config.queries.length}, Iterations per query: ${iterations}`);

  for (const query of config.queries) {
    const times: number[] = [];
    console.log(`\n   Benchmarking: ${query.name}`);

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await client.query(query.sql, query.params);
      times.push(performance.now() - start);

      if (i % 20 === 0) {
        process.stdout.write(`\r   Progress: ${Math.round((i / iterations) * 100)}%`);
      }
    }
    console.log('\r   Progress: 100%');

    results.push(calculateStats(`DB: ${query.name}`, times));
  }

  return results;
}

// SQLite-specific benchmark (using better-sqlite3 style API)
export function benchmarkSQLiteSync(
  db: { prepare: (sql: string) => { run: (...args: unknown[]) => unknown; all: (...args: unknown[]) => unknown[] } },
  queries: Array<{ name: string; sql: string; params?: unknown[]; type: 'read' | 'write' }>,
  iterations = 1000
): BenchmarkResult[] {
  const results: BenchmarkResult[] = [];

  console.log(`\n📊 Running SQLite benchmarks (sync)`);
  console.log(`   Queries: ${queries.length}, Iterations per query: ${iterations}`);

  for (const query of queries) {
    const times: number[] = [];
    const stmt = db.prepare(query.sql);

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      if (query.type === 'read') {
        stmt.all(...(query.params ?? []));
      } else {
        stmt.run(...(query.params ?? []));
      }
      times.push(performance.now() - start);
    }

    results.push(calculateStats(`SQLite: ${query.name}`, times));
  }

  return results;
}

// ============================================================================
// WebSocket Throughput Benchmarks
// ============================================================================

export async function benchmarkWebSocket(config: WebSocketBenchmarkConfig): Promise<BenchmarkResult> {
  const { url, messageCount, messageSize, concurrentConnections = 1 } = config;
  const times: number[] = [];
  
  console.log(`\n🔌 Running WebSocket benchmark: ${url}`);
  console.log(`   Messages: ${messageCount}, Size: ${messageSize} bytes, Connections: ${concurrentConnections}`);

  const testMessage = 'x'.repeat(messageSize);
  
  const runConnection = async (connectionId: number): Promise<number[]> => {
    const connectionTimes: number[] = [];
    const messagesPerConnection = Math.ceil(messageCount / concurrentConnections);
    
    return new Promise((resolve, reject) => {
      // Node.js WebSocket or browser WebSocket
      const WebSocketClass = typeof WebSocket !== 'undefined' ? WebSocket : require('ws');
      const ws = new WebSocketClass(url);
      let received = 0;
      let sendTime = 0;

      ws.onopen = () => {
        for (let i = 0; i < messagesPerConnection; i++) {
          sendTime = performance.now();
          ws.send(JSON.stringify({ id: i, connectionId, data: testMessage }));
        }
      };

      ws.onmessage = () => {
        connectionTimes.push(performance.now() - sendTime);
        received++;
        if (received >= messagesPerConnection) {
          ws.close();
          resolve(connectionTimes);
        }
      };

      ws.onerror = (error: Error) => {
        reject(error);
      };

      // Timeout after 30 seconds
      setTimeout(() => {
        ws.close();
        resolve(connectionTimes);
      }, 30000);
    });
  };

  // Run concurrent connections
  const connectionPromises = Array(concurrentConnections)
    .fill(null)
    .map((_, i) => runConnection(i).catch(() => [] as number[]));
  
  const allTimes = await Promise.all(connectionPromises);
  times.push(...allTimes.flat());

  // Calculate throughput metrics
  const result = calculateStats(`WebSocket: ${url}`, times);
  
  // Add throughput-specific metrics
  const totalBytes = messageCount * messageSize;
  const throughputMBps = (totalBytes / (result.totalMs / 1000)) / (1024 * 1024);
  console.log(`   Throughput: ${throughputMBps.toFixed(2)} MB/s`);
  
  return result;
}

// Echo server benchmark (measures round-trip latency)
export async function benchmarkWebSocketLatency(
  url: string,
  iterations = 1000,
  warmupIterations = 100
): Promise<BenchmarkResult> {
  console.log(`\n⏱️  Running WebSocket latency benchmark: ${url}`);
  console.log(`   Iterations: ${iterations}, Warmup: ${warmupIterations}`);

  return new Promise((resolve, reject) => {
    const WebSocketClass = typeof WebSocket !== 'undefined' ? WebSocket : require('ws');
    const ws = new WebSocketClass(url);
    const times: number[] = [];
    let currentIteration = 0;
    let sendTime = 0;
    const totalIterations = warmupIterations + iterations;

    ws.onopen = () => {
      sendTime = performance.now();
      ws.send(JSON.stringify({ iteration: currentIteration, timestamp: Date.now() }));
    };

    ws.onmessage = () => {
      const rtt = performance.now() - sendTime;
      
      // Only record after warmup
      if (currentIteration >= warmupIterations) {
        times.push(rtt);
      }
      
      currentIteration++;
      
      if (currentIteration % 100 === 0) {
        process.stdout.write(`\r   Progress: ${Math.round((currentIteration / totalIterations) * 100)}%`);
      }

      if (currentIteration >= totalIterations) {
        console.log('\r   Progress: 100%');
        ws.close();
        resolve(calculateStats(`WebSocket Latency: ${url}`, times));
      } else {
        sendTime = performance.now();
        ws.send(JSON.stringify({ iteration: currentIteration, timestamp: Date.now() }));
      }
    };

    ws.onerror = (error: Error) => reject(error);
    
    setTimeout(() => {
      ws.close();
      if (times.length > 0) {
        resolve(calculateStats(`WebSocket Latency: ${url}`, times));
      } else {
        reject(new Error('Timeout waiting for WebSocket responses'));
      }
    }, 60000);
  });
}

// ============================================================================
// Combined Benchmark Runner
// ============================================================================

export interface FullBenchmarkConfig {
  api?: {
    baseUrl: string;
    endpoints: Array<{ path: string; method: APIBenchmarkConfig['method']; body?: unknown }>;
    iterations?: number;
  };
  db?: {
    client: { query: (sql: string, params?: unknown[]) => Promise<unknown> };
    queries: Array<{ name: string; sql: string; params?: unknown[] }>;
    iterations?: number;
  };
  websocket?: {
    url: string;
    messageCount?: number;
    messageSize?: number;
    latencyTest?: boolean;
  };
}

export async function runFullBenchmark(config: FullBenchmarkConfig): Promise<void> {
  console.log('\n' + '='.repeat(65));
  console.log('  PERFORMANCE BENCHMARK SUITE');
  console.log('='.repeat(65));
  
  const allResults: BenchmarkResult[] = [];
  const startTime = Date.now();

  // API Benchmarks
  if (config.api) {
    console.log('\n📡 API BENCHMARKS');
    console.log('-'.repeat(65));
    const apiResults = await benchmarkAPIEndpoints(
      config.api.baseUrl,
      config.api.endpoints,
      config.api.iterations ?? 50
    );
    allResults.push(...apiResults);
    apiResults.forEach(r => console.log(formatResult(r)));
  }

  // Database Benchmarks
  if (config.db) {
    console.log('\n💾 DATABASE BENCHMARKS');
    console.log('-'.repeat(65));
    const dbResults = await benchmarkDatabase(config.db.client, {
      queries: config.db.queries,
      iterations: config.db.iterations ?? 100,
    });
    allResults.push(...dbResults);
    dbResults.forEach(r => console.log(formatResult(r)));
  }

  // WebSocket Benchmarks
  if (config.websocket) {
    console.log('\n🔌 WEBSOCKET BENCHMARKS');
    console.log('-'.repeat(65));
    
    if (config.websocket.latencyTest) {
      const latencyResult = await benchmarkWebSocketLatency(config.websocket.url);
      allResults.push(latencyResult);
      console.log(formatResult(latencyResult));
    }
    
    const throughputResult = await benchmarkWebSocket({
      url: config.websocket.url,
      messageCount: config.websocket.messageCount ?? 1000,
      messageSize: config.websocket.messageSize ?? 1024,
      concurrentConnections: 5,
    });
    allResults.push(throughputResult);
    console.log(formatResult(throughputResult));
  }

  // Summary
  const totalTime = Date.now() - startTime;
  console.log('\n' + '='.repeat(65));
  console.log('  SUMMARY');
  console.log('='.repeat(65));
  console.log(`  Total benchmarks run: ${allResults.length}`);
  console.log(`  Total time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`  Average ops/sec across all: ${(allResults.reduce((a, r) => a + r.opsPerSecond, 0) / allResults.length).toFixed(2)}`);
  console.log('='.repeat(65) + '\n');
}

// ============================================================================
// Example Usage & CLI
// ============================================================================

// Example: Run benchmarks if executed directly
async function main() {
  // Example API benchmark
  const apiResult = await benchmarkAPI({
    url: 'https://httpbin.org/get',
    method: 'GET',
    iterations: 10,
    concurrency: 2,
  });
  console.log(formatResult(apiResult));

  // Example POST benchmark
  const postResult = await benchmarkAPI({
    url: 'https://httpbin.org/post',
    method: 'POST',
    body: { test: 'data', timestamp: Date.now() },
    iterations: 10,
    concurrency: 2,
  });
  console.log(formatResult(postResult));

  console.log('\n✅ Benchmark suite ready for use!');
  console.log('Import and use benchmarkAPI, benchmarkDatabase, benchmarkWebSocket, or runFullBenchmark');
}

// Run if this is the main module
if (require.main === module) {
  main().catch(console.error);
}

export {
  formatResult,
  calculateStats,
  percentile,
  BenchmarkResult,
  APIBenchmarkConfig,
  DBBenchmarkConfig,
  WebSocketBenchmarkConfig,
};
