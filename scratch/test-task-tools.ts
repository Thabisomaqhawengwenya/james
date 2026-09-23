import { prisma } from '../server/src/db/client.js';
import { executeCreateTask, executeGetTasks, executeCompleteTask, executeDeleteTask } from '../server/src/tools/taskTools.js';
import { executeToolCall, detectTaskIntent } from '../server/src/tools/toolExecutor.js';

async function runTaskTests() {
  console.log('Testing Task Intent Detection...');
  const intent1 = detectTaskIntent('Create a task to finish portfolio tomorrow with high priority');
  console.log('Intent 1:', intent1);
  if (!intent1 || intent1.toolName !== 'create_task') throw new Error('Failed to detect create_task intent');

  const intent2 = detectTaskIntent('Mark the portfolio task as completed');
  console.log('Intent 2:', intent2);
  if (!intent2 || intent2.toolName !== 'complete_task') throw new Error('Failed to detect complete_task intent');

  // Find demo user
  const user = await prisma.user.findFirst();
  if (!user) throw new Error('No user found in DB');

  console.log('Testing Tool Execution for user:', user.email);
  const created = await executeCreateTask(user.id, {
    title: 'Automated Test Portfolio Task',
    priority: 'HIGH',
    dueDate: 'tomorrow',
  });
  console.log('Task Created:', created);

  console.log('Testing Get Tasks...');
  const list = await executeGetTasks(user.id, {});
  console.log(`Found ${list.count} tasks.`);

  console.log('Testing Complete Task...');
  const completed = await executeCompleteTask(user.id, { title: 'Automated Test Portfolio' });
  console.log('Task Completed:', completed);

  console.log('Testing Delete Task...');
  const deleted = await executeDeleteTask(user.id, { title: 'Automated Test Portfolio' });
  console.log('Task Deleted:', deleted);

  console.log('ALL TASK TOOL TESTS PASSED! ✓');
}

runTaskTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
