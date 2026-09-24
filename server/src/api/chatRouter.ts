import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth/authMiddleware.js';
import { processChatMessage } from '../agent/agentService.js';

const router = Router();
router.use(requireAuth);

router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { conversationId, content, attachments, provider, apiKey, baseUrl, model } = req.body;

    if (!conversationId || (!content && (!attachments || attachments.length === 0))) {
      res.status(400).json({ error: 'conversationId and content or attachments are required.' });
      return;
    }

    const result = await processChatMessage({
      userId,
      conversationId,
      content: (content || '').trim(),
      attachments: attachments || [],
      providerOverride: provider,
      apiKeyOverride: apiKey,
      baseUrlOverride: baseUrl,
      modelOverride: model,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Chat processing error:', error);
    res.status(500).json({ error: error.message || 'Error processing chat message.' });
  }
});

export const chatRouter = router;
