import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config.js';
import { authRouter } from './auth/authRouter.js';
import { conversationsRouter } from './api/conversationsRouter.js';
import { chatRouter } from './api/chatRouter.js';
import { tasksRouter } from './api/tasksRouter.js';
import { memoriesRouter } from './api/memoriesRouter.js';
import { profileRouter } from './api/profileRouter.js';
import { uploadRouter, UPLOADS_DIR } from './api/uploadRouter.js';

const app = express();

// Middlewares
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

// Serve uploaded media statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    name: 'James AI Agent Backend',
    version: '0.1.0',
    provider: config.aiProvider,
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/memories', memoriesRouter);
app.use('/api/profile', profileRouter);
app.use('/api/upload', uploadRouter);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Unhandled Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Start Server
app.listen(config.port, () => {
  console.log(`\n=================================================`);
  console.log(`🚀 James Personal AI Agent Server running on port ${config.port}`);
  console.log(`🤖 AI Provider: ${config.aiProvider} (${config.aiModel})`);
  console.log(`🔗 Health check: http://localhost:${config.port}/api/health`);
  console.log(`=================================================\n`);
});
