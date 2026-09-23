import { Router, Request, Response } from 'express';
import { prisma } from '../db/client.js';
import { requireAuth } from '../auth/authMiddleware.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });
    res.json({ profile });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch profile' });
  }
});

router.put('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      name,
      preferredName,
      location,
      timezone,
      profession,
      interests,
      preferences,
      communicationStyle,
      aiPreferences,
    } = req.body;

    const profile = await prisma.profile.upsert({
      where: { userId },
      update: {
        ...(name && { name }),
        ...(preferredName !== undefined && { preferredName }),
        ...(location !== undefined && { location }),
        ...(timezone && { timezone }),
        ...(profession !== undefined && { profession }),
        ...(interests !== undefined && { interests }),
        ...(preferences !== undefined && { preferences }),
        ...(communicationStyle && { communicationStyle }),
        ...(aiPreferences !== undefined && { aiPreferences }),
      },
      create: {
        userId,
        name: name || 'User',
        preferredName,
        location,
        timezone: timezone || 'UTC',
        profession,
        interests,
        preferences,
        communicationStyle: communicationStyle || 'concise, direct, highly competent',
        aiPreferences,
      },
    });

    res.json({ profile });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

export const profileRouter = router;
