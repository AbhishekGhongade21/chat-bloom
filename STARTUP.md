# Chat Bloom 93 - Startup Guide

## Prerequisites

1. **Node.js** (v16 or higher)
2. **MongoDB** (local installation or MongoDB Atlas account)

## Quick Start

### 1. Start MongoDB

**Option A: Local MongoDB**
```bash
# Make sure MongoDB is running
mongod
```

**Option B: MongoDB Atlas**
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Update `backend/.env` with your connection string

### 2. Start the Backend

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:5000`

### 3. Start the Frontend

In a new terminal:

```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

### 4. Test the Application

1. Open `http://localhost:3000` in your browser
2. Click "Demo Login" to authenticate
3. The app will attempt to connect to the backend
4. If the backend is not running, you'll see an error message but can still use the UI

## Troubleshooting

### "process is not defined" Error
This error is now fixed! The app uses `import.meta.env` for Vite compatibility.

### "Could not establish connection" Error
This means the backend is not running. Start the backend first:

```bash
cd backend
npm run dev
```

### MongoDB Connection Issues
Check your `backend/.env` file:

```env
MONGODB_URI=mongodb://localhost:27017/chat-bloom-93
```

For MongoDB Atlas, use:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chat-bloom-93
```

### Port Conflicts
If port 5000 is in use, change it in `backend/.env`:
```env
PORT=5001
```

And update the frontend `.env`:
```env
VITE_API_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
```

## Features Available

- **Real-time messaging** (when backend is running)
- **Message reactions, edits, deletes**
- **Typing indicators**
- **Online/offline status**
- **File upload support**
- **Search functionality**
- **Group and 1-to-1 chats**
- **Professional UI with React Icons**

## Development

The application gracefully handles backend unavailability:
- Shows error messages when backend is down
- Still allows UI interaction
- Attempts to reconnect when operations are performed

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in backend `.env`
2. Update MongoDB URI to production database
3. Build the frontend: `npm run build`
4. Deploy both frontend and backend to your hosting provider

## Support

If you encounter issues:
1. Check the console for error messages
2. Ensure MongoDB is running
3. Verify backend is started on port 5000
4. Check CORS settings in `backend/.env`
