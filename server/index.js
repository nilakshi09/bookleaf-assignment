import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';

import { JWT_SECRET } from './config/env.js';
import { connectDatabase } from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import authorRoutes from './routes/authorRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setSocketInstance } from './services/socketService.js';

dotenv.config();

const app = express();

// Trust reverse proxy (e.g. Render, Vercel) so rate-limiters identify actual client IPs
app.set('trust proxy', 1);

const server = http.createServer(app);

// CORS configuration supporting credentials and dynamic origins
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const corsOptions = {
  origin: clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoints (public, registered before any auth middleware)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize Socket.IO with CORS settings
const io = new SocketIOServer(server, {
  cors: {
    origin: clientUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Socket.IO Handshake Authentication Middleware
// Verifies JWT token before granting a WebSocket connection
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Unauthorized: Authentication token missing'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = {
      id: decoded.id,
      role: decoded.role,
    };
    next();
  } catch (err) {
    next(new Error('Unauthorized: Invalid or expired token'));
  }
});

// Server-controlled room assignment upon verified connection
io.on('connection', (socket) => {
  // 1. Join verified personal room
  socket.join(socket.user.id.toString());

  // 2. Join verified administrative room if role is admin
  if (socket.user.role === 'admin') {
    socket.join('admins');
  }

  socket.on('disconnect', () => {
    // Graceful disconnect cleanup handled by Socket.IO
  });
});

// Register global Socket.IO instance for server-wide emissions
setSocketInstance(io);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api', authorRoutes);
app.use('/api/admin', adminRoutes);

// Centralized error handler
app.use(errorHandler);

// Establish database connection and start HTTP & WebSocket listener
const PORT = process.env.PORT || 5000;

connectDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`[Server] BookLeaf Support Hub running on port ${PORT}`);
    console.log(`[Server] WebSocket gateway initialized for ${clientUrl}`);
  });
});

export default app;
