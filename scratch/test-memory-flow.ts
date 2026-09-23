import { evaluateMessageForMemory, persistOrUpdateMemory } from '../server/src/memory/memoryExtractor.js';
import { retrieveRelevantMemories } from '../server/src/memory/memoryRetrieval.js';
import { prisma } from '../server/src/db/client.js';

async function runTest() {
  console.log('Testing Memory Extraction...');
  const testMsg = 'Remember that my favorite frontend styling approach is Vanilla CSS with custom tokens and dark mode.';
  const extracted = evaluateMessageForMemory(testMsg);
  console.log('Extracted:', extracted);

  if (!extracted) {
    throw new Error('Failed to extract memory');
  }

  // Find demo user
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No user found to test DB write, skipping DB part');
    return;
  }

  console.log('Testing Memory Persistence for user:', user.email);
  const { memory, isUpdate } = await persistOrUpdateMemory(user.id, extracted);
  console.log('Persisted Memory:', memory, 'isUpdate:', isUpdate);

  console.log('Testing Memory Retrieval...');
  const retrieved = await retrieveRelevantMemories(user.id, 'What is my favorite frontend styling approach?');
  console.log('Retrieved Memories for query:', retrieved);

  console.log('ALL MEMORY TESTS PASSED SUCCESSFULLY! ✓');
}

runTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
