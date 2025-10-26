# Cloud Functions - Musical Note Generator

This directory contains Firebase Cloud Functions that serve as the backend API for the Musical Note Generator application.

## Structure

```
functions/
├── index.js          # Main Cloud Function (Express app)
├── package.json      # Dependencies
├── .gitignore       # Git ignore rules
└── README.md        # This file
```

## How It Works

The Express app is wrapped in a Cloud Function and exported as `api`. All API routes are automatically handled:

```javascript
// In index.js
export const api = functions.https.onRequest(app);
```

All requests to `/api/*` on your Firebase Hosting domain are automatically routed to this Cloud Function.

## Adding Routes

Edit `index.js` to add new API endpoints:

```javascript
// GET request
app.get('/api/your-endpoint', (req, res) => {
  res.json({ message: 'Your response' });
});

// POST request
app.post('/api/your-endpoint', (req, res) => {
  const data = req.body;
  // Process data
  res.json({ success: true, data });
});
```

## Testing Locally

Use Firebase emulators:

```bash
# From project root
firebase emulators:start
```

## Deployment

Deploy functions:

```bash
# From project root
firebase deploy --only functions
```

## Environment Variables

Set environment variables:

```bash
firebase functions:config:set key="value"
```

Access them:

```javascript
import functions from 'firebase-functions';
const value = functions.config().key;
```

## Logs

View function logs:

```bash
firebase functions:log
```

Or in Firebase Console → Functions → Logs
