import functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API Routes
// Add your API routes here
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Musical Note Generator API is running'
  });
});

// Example API route structure
// app.get('/api/example', (req, res) => {
//   res.json({ message: 'Example endpoint' });
// });

// app.post('/api/example', (req, res) => {
//   const data = req.body;
//   res.json({ received: data });
// });

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
});

// Export the Express app as a Cloud Function
export const api = functions.https.onRequest(app);
