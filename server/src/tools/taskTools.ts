import { prisma } from '../db/client.js';
import { ToolDefinition } from '../ai/types.js';

export const TASK_TOOLS: ToolDefinition[] = [
  {
    name: 'create_task',
    description: 'Creates a new task in the database for the user with title, priority, description, and optional due date.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'The title of the task to be completed.' },
        description: { type: 'string', description: 'Detailed notes or sub-tasks.' },
        priority: {
          type: 'string',
          enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
          description: 'Priority level (default: MEDIUM).',
        },
        dueDate: {
          type: 'string',
          description: 'Due date as an ISO date string or natural relative description like tomorrow.',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'get_tasks',
    description: 'Retrieves all tasks for the user, optionally filtered by status.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
          description: 'Filter tasks by status.',
        },
      },
    },
  },
  {
    name: 'complete_task',
    description: 'Marks a specified task as COMPLETED in the database.',
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'The unique ID of the task.' },
        title: { type: 'string', description: 'Title or partial title match if taskId is not known.' },
      },
    },
  },
  {
    name: 'update_task',
    description: 'Updates a task status, priority, title, or due date.',
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'The unique ID of the task.' },
        title: { type: 'string', description: 'Title or partial title match to find the task.' },
        newTitle: { type: 'string', description: 'Updated title.' },
        status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
        priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
        dueDate: { type: 'string' },
      },
    },
  },
  {
    name: 'delete_task',
    description: 'Permanently deletes a task from the database.',
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'The unique ID of the task.' },
        title: { type: 'string', description: 'Title or partial title match to find the task.' },
      },
    },
  },
];

export async function executeCreateTask(userId: string, args: Record<string, any>) {
  const { title, description, priority, dueDate } = args;

  if (!title || !String(title).trim()) {
    throw new Error('Task title is required');
  }

  // Parse relative due dates like "tomorrow"
  let parsedDueDate: Date | null = null;
  if (dueDate) {
    const raw = String(dueDate).toLowerCase().trim();
    if (raw === 'tomorrow') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      parsedDueDate = d;
    } else if (raw === 'today') {
      parsedDueDate = new Date();
    } else {
      const parsed = new Date(dueDate);
      if (!isNaN(parsed.getTime())) parsedDueDate = parsed;
    }
  }

  const validPriority = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(String(priority).toUpperCase())
    ? String(priority).toUpperCase()
    : 'MEDIUM';

  const task = await prisma.task.create({
    data: {
      userId,
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      priority: validPriority,
      status: 'TODO',
      dueDate: parsedDueDate,
    },
  });

  return {
    success: true,
    action: 'created',
    task: {
      id: task.id,
      title: task.title,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate?.toISOString() || null,
    },
  };
}

export async function executeGetTasks(userId: string, args: Record<string, any>) {
  const { status } = args;
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      ...(status ? { status: String(status).toUpperCase() } : {}),
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });

  return {
    success: true,
    count: tasks.length,
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate?.toISOString() || null,
    })),
  };
}

export async function executeCompleteTask(userId: string, args: Record<string, any>) {
  const { taskId, title } = args;

  let targetTask = null;
  if (taskId) {
    targetTask = await prisma.task.findFirst({ where: { id: taskId, userId } });
  } else if (title) {
    targetTask = await prisma.task.findFirst({
      where: {
        userId,
        title: { contains: String(title).trim() },
        status: { not: 'COMPLETED' },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  if (!targetTask) {
    throw new Error(`Task matching "${title || taskId}" was not found.`);
  }

  const updated = await prisma.task.update({
    where: { id: targetTask.id },
    data: { status: 'COMPLETED' },
  });

  return {
    success: true,
    action: 'completed',
    task: {
      id: updated.id,
      title: updated.title,
      status: updated.status,
    },
  };
}

export async function executeUpdateTask(userId: string, args: Record<string, any>) {
  const { taskId, title, newTitle, status, priority, dueDate } = args;

  let targetTask = null;
  if (taskId) {
    targetTask = await prisma.task.findFirst({ where: { id: taskId, userId } });
  } else if (title) {
    targetTask = await prisma.task.findFirst({
      where: { userId, title: { contains: String(title).trim() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  if (!targetTask) {
    throw new Error(`Task matching "${title || taskId}" was not found.`);
  }

  const updated = await prisma.task.update({
    where: { id: targetTask.id },
    data: {
      ...(newTitle && { title: String(newTitle).trim() }),
      ...(status && { status: String(status).toUpperCase() }),
      ...(priority && { priority: String(priority).toUpperCase() }),
      ...(dueDate && { dueDate: new Date(dueDate) }),
    },
  });

  return {
    success: true,
    action: 'updated',
    task: updated,
  };
}

export async function executeDeleteTask(userId: string, args: Record<string, any>) {
  const { taskId, title } = args;

  let targetTask = null;
  if (taskId) {
    targetTask = await prisma.task.findFirst({ where: { id: taskId, userId } });
  } else if (title) {
    targetTask = await prisma.task.findFirst({
      where: { userId, title: { contains: String(title).trim() } },
    });
  }

  if (!targetTask) {
    throw new Error(`Task matching "${title || taskId}" was not found.`);
  }

  await prisma.task.delete({ where: { id: targetTask.id } });

  return {
    success: true,
    action: 'deleted',
    deletedTaskId: targetTask.id,
    deletedTitle: targetTask.title,
  };
}
