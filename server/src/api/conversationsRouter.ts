import { Router, Request, Response } from 'express';
import { prisma } from '../db/client.js';
import { requireAuth } from '../auth/authMiddleware.js';

const router = Router();
router.use(requireAuth);

function getIdParam(req: Request): string {
  const raw = req.params.id;
  return Array.isArray(raw) ? raw[0] : raw;
}

// List all conversations for the authenticated user
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const search = (req.query.search as string)?.trim().toLowerCase();

    const conversations = await prisma.conversation.findMany({
      where: {
        userId,
        ...(search
          ? {
              OR: [
                { title: { contains: search } },
                { messages: { some: { content: { contains: search } } } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const result = conversations.map((c) => ({
      id: c.id,
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      lastMessage: c.messages[0]?.content || '',
    }));

    res.json({ conversations: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch conversations' });
  }
});

// Create a new conversation
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title } = req.body;

    const conversation = await prisma.conversation.create({
      data: {
        userId,
        title: title?.trim() || 'New Conversation',
      },
    });

    res.status(201).json({ conversation });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create conversation' });
  }
});

// Get conversation messages
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = getIdParam(req);

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { toolCalls: true },
        },
      },
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const formattedConversation = {
      ...conversation,
      messages: conversation.messages.map((m) => ({
        ...m,
        attachments: m.attachments ? JSON.parse(m.attachments) : [],
      })),
    };

    res.json({ conversation: formattedConversation });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch conversation' });
  }
});

// Rename conversation
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = getIdParam(req);
    const { title } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId },
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: { title: title.trim() },
    });

    res.json({ conversation: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update conversation' });
  }
});

// Delete conversation
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const id = getIdParam(req);

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId },
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    await prisma.conversation.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Conversation deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete conversation' });
  }
});

export const conversationsRouter = router;
