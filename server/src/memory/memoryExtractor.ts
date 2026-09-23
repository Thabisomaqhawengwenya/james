import { prisma } from '../db/client.js';

export interface ExtractedMemory {
  content: string;
  category: 'preference' | 'project' | 'profile' | 'instruction' | 'general';
  importance: number;
}

export function evaluateMessageForMemory(userMessage: string): ExtractedMemory | null {
  const trimmed = userMessage.trim();
  const lower = trimmed.toLowerCase();

  // 1. Explicit directive: "Remember that...", "Remember:...", "Please remember..."
  const explicitMatch = trimmed.match(/^(?:please\s+)?remember(?:\s+that|:)?\s+(.+)$/i);
  if (explicitMatch && explicitMatch[1]) {
    const rawContent = explicitMatch[1].trim();
    return categorizeMemory(rawContent, 4);
  }

  // 2. Explicit "Keep in mind that...", "Note that..."
  const keepInMindMatch = trimmed.match(/^(?:please\s+)?(?:keep in mind|note)(?:\s+that)?\s+(.+)$/i);
  if (keepInMindMatch && keepInMindMatch[1]) {
    return categorizeMemory(keepInMindMatch[1].trim(), 4);
  }

  // 3. User preference statements: "I prefer...", "My favorite...", "Always use..."
  const preferMatch = trimmed.match(/^I\s+(?:strongly\s+)?prefer\s+(.+)$/i);
  if (preferMatch && preferMatch[1]) {
    return {
      content: `Prefers ${preferMatch[1].trim()}`,
      category: 'preference',
      importance: 4,
    };
  }

  // 4. User profile/identity statements: "My profession is...", "I am a [profession]...", "I work as a..."
  const workMatch = trimmed.match(/^I\s+(?:work as a|am an?)\s+([a-zA-Z\s]+)(?:\s+in\s+([a-zA-Z\s]+))?$/i);
  if (workMatch && workMatch[1]) {
    const profession = workMatch[1].trim();
    const location = workMatch[2]?.trim();
    return {
      content: location ? `Works as a ${profession} in ${location}` : `Works as a ${profession}`,
      category: 'profile',
      importance: 5,
    };
  }

  // 5. Tech stack / Project declarations: "My project uses...", "My portfolio is built with..."
  const projectMatch = trimmed.match(/^My\s+(?:project|app|portfolio|website)\s+(?:uses|is built with)\s+(.+)$/i);
  if (projectMatch && projectMatch[1]) {
    return {
      content: `Project tech stack: ${projectMatch[1].trim()}`,
      category: 'project',
      importance: 4,
    };
  }

  // Ephemeral or non-durable conversation should not be stored
  return null;
}

function categorizeMemory(content: string, importance: number): ExtractedMemory {
  const lower = content.toLowerCase();

  let category: ExtractedMemory['category'] = 'general';

  if (lower.includes('prefer') || lower.includes('favorite') || lower.includes('like') || lower.includes('dislike')) {
    category = 'preference';
  } else if (lower.includes('project') || lower.includes('app') || lower.includes('stack') || lower.includes('built with')) {
    category = 'project';
  } else if (lower.includes('never') || lower.includes('always') || lower.includes('rule') || lower.includes('format')) {
    category = 'instruction';
  } else if (lower.includes('work') || lower.includes('living in') || lower.includes('name is') || lower.includes('role is')) {
    category = 'profile';
  }

  return {
    content: content.replace(/^that\s+/i, '').trim(),
    category,
    importance,
  };
}

/**
 * Checks existing memories to either update an overlapping memory or insert a new one.
 */
export async function persistOrUpdateMemory(userId: string, extracted: ExtractedMemory) {
  // Check for existing memories in the same category
  const existingMemories = await prisma.memory.findMany({
    where: { userId, category: extracted.category },
  });

  // Calculate simple word overlap to detect if user is updating an existing preference
  const newWords = new Set(extracted.content.toLowerCase().split(/\s+/).filter(w => w.length > 3));

  let matchedId: string | null = null;
  for (const m of existingMemories) {
    const existingWords = m.content.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const overlap = existingWords.filter(w => newWords.has(w)).length;
    // If more than 50% overlap, treat as an update
    if (overlap >= 2 && overlap / Math.max(newWords.size, existingWords.length) > 0.4) {
      matchedId = m.id;
      break;
    }
  }

  if (matchedId) {
    const updated = await prisma.memory.update({
      where: { id: matchedId },
      data: {
        content: extracted.content,
        importance: Math.max(extracted.importance, 3),
      },
    });
    return { memory: updated, isUpdate: true };
  } else {
    const created = await prisma.memory.create({
      data: {
        userId,
        content: extracted.content,
        category: extracted.category,
        importance: extracted.importance,
      },
    });
    return { memory: created, isUpdate: false };
  }
}
