import { Router, Request, Response } from 'express';
import { prisma } from '../db/client.js';
import { requireAuth } from '../auth/authMiddleware.js';

const router = Router();
router.use(requireAuth);

function getIdParam(req: Request): string {
  const raw = req.params.id;
  return Array.isArray(raw) ? raw[0] : raw;
}

// Get all tasks for user
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const status = req.query.status as string;

    const tasks = await prisma.task.findMany({
      where: {
        userId,
        ...(status ? { status } : {}),
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    res.json({ tasks });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch tasks' });
  }
});

// Create a task
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, description, priority, dueDate, status } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Task title is required' });
      return;
    }

    const task = await prisma.task.create({
      data: {
        userId,
        title: title.trim(),
        description: description?.trim() || null,
        priority: priority || 'MEDIUM',
        status: status || 'TODO',
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    res.status(201).json({ task });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create task' });
  }
});

// Update a task
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = getIdParam(req);
    const { title, description, status, priority, dueDate } = req.body;

    const existing = await prisma.task.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
    });

    res.json({ task });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update task' });
  }
});

// Delete a task
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = getIdParam(req);

    const existing = await prisma.task.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    await prisma.task.delete({ where: { id } });
    res.json({ success: true, message: 'Task deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete task' });
  }
});

export const tasksRouter = router;
