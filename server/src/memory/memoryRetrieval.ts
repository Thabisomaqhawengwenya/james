import { prisma } from '../db/client.js';

export interface ScoredMemory {
  id: string;
  category: string;
  content: string;
  importance: number;
  score: number;
}

export async function retrieveRelevantMemories(
  userId: string,
  userQuery: string,
  limit = 10
): Promise<string[]> {
  const allMemories = await prisma.memory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  if (allMemories.length === 0) return [];

  const queryTerms = new Set(
    userQuery
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((term) => term.length > 2)
  );

  const scored: ScoredMemory[] = allMemories.map((m) => {
    let score = m.importance * 1.5; // baseline importance
    const contentWords = m.content.toLowerCase().split(/\s+/);

    // Boost score for direct keyword matches
    for (const word of contentWords) {
      if (queryTerms.has(word)) {
        score += 3.0;
      }
    }

    // Boost category matches
    if (queryTerms.has(m.category.toLowerCase())) {
      score += 2.0;
    }

    return {
      id: m.id,
      category: m.category,
      content: m.content,
      importance: m.importance,
      score,
    };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((m) => `[${m.category.toUpperCase()}] ${m.content}`);
}
