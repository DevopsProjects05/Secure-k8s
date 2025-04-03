// Import dependencies
const path = require('path');
const express = require('express');
const client = require('prom-client'); // Prometheus client library
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { trace } = require('@opentelemetry/api');
const { Resource } = require('@opentelemetry/resources');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-node');

// OpenTelemetry Setup
const resource = new Resource({
  'service.name': 'devsecops-app', // Service name for traces
});
const traceExporter = new OTLPTraceExporter({
  url: 'http://15.207.71.232:4318/v1/traces', // Replace <collector-ip> with your OpenTelemetry Collector IP
});
const tracerProvider = new NodeTracerProvider({ resource });
tracerProvider.addSpanProcessor(new SimpleSpanProcessor(traceExporter));
tracerProvider.register();
const tracer = trace.getTracer('devsecops-tracer');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Prometheus Metrics Setup
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics(); // Default system metrics like CPU, memory, etc.

// Custom HTTP request duration metric
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 1, 1.5], // Define custom buckets
});

// Middleware to measure HTTP request durations
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer(); // Start timer
  res.on('finish', () => {
    end({
      method: req.method,
      route: req.route ? req.route.path : req.url,
      status_code: res.statusCode,
    });
  });
  next();
});

// Expose Prometheus metrics at /metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.send(await client.register.metrics());
});

// Home route with custom span
app.get('/', (req, res) => {
  const span = tracer.startSpan('Home Route Span');
  res.sendFile(path.join(__dirname, 'public/index.html'));
  span.end();
});

// Health check route with custom span
app.get('/health', (req, res) => {
  const span = tracer.startSpan('Health Check Route Span');
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
  span.end();
});

// Custom route with a detailed custom span
app.get('/custom', (req, res) => {
  const span = tracer.startSpan('Custom Route Span');
  span.addEvent('Processing custom route');
  res.send('This is a custom route with OpenTelemetry!');
  span.end();
});

// New additional route for handling errors
app.get('/error', (req, res) => {
  const span = tracer.startSpan('Error Route Span');
  span.addEvent('Simulating error route');
  res.status(500).json({ error: 'Simulated error occurred!' });
  span.end();
});

// Start the server
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

module.exports = app;
