import { Router, Request, Response } from 'express';
import { prisma } from '../db/client.js';
import { requireAuth } from '../auth/authMiddleware.js';

const router = Router();
router.use(requireAuth);

function getIdParam(req: Request): string {
  const raw = req.params.id;
  return Array.isArray(raw) ? raw[0] : raw;
}

// Get memory stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const memories = await prisma.memory.findMany({
      where: { userId },
      select: { category: true },
    });

    const counts: Record<string, number> = {};
    for (const m of memories) {
      counts[m.category] = (counts[m.category] || 0) + 1;
    }

    res.json({
      total: memories.length,
      byCategory: counts,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch memory stats' });
  }
});

// List memories with optional category and search
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const category = req.query.category as string;
    const search = (req.query.search as string)?.trim().toLowerCase();

    const memories = await prisma.memory.findMany({
      where: {
        userId,
        ...(category && category !== 'all' ? { category } : {}),
        ...(search ? { content: { contains: search } } : {}),
      },
      orderBy: [{ importance: 'desc' }, { createdAt: 'desc' }],
    });

    res.json({ memories });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch memories' });
  }
});

// Create memory
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { content, category, importance } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Memory content is required' });
      return;
    }

    const memory = await prisma.memory.create({
      data: {
        userId,
        content: content.trim(),
        category: category || 'general',
        importance: typeof importance === 'number' ? importance : 3,
      },
    });

    res.status(201).json({ memory });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create memory' });
  }
});

// Update memory (content, category, importance)
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = getIdParam(req);
    const { content, category, importance } = req.body;

    const existing = await prisma.memory.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    const updated = await prisma.memory.update({
      where: { id },
      data: {
        ...(content !== undefined && { content: content.trim() }),
        ...(category !== undefined && { category }),
        ...(importance !== undefined && { importance: Number(importance) }),
      },
    });

    res.json({ memory: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update memory' });
  }
});

// Delete memory
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = getIdParam(req);

    const existing = await prisma.memory.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    await prisma.memory.delete({ where: { id } });
    res.json({ success: true, message: 'Memory deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete memory' });
  }
});

export const memoriesRouter = router;
