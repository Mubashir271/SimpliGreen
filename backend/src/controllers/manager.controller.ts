import { Request, Response } from 'express';
import { prisma } from '../app';
import { AppError, asyncHandler } from '../utils/errors';

export const getJobs = asyncHandler(async (req: Request, res: Response) => {
  const jobs = await prisma.job.findMany({
    where: { managerId: req.user!.userId },
    include: {
      qa: { select: { id: true, name: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(jobs);
});

export const getJob = asyncHandler(async (req: Request, res: Response) => {
  const job = await prisma.job.findFirst({
    where: { id: req.params.id, managerId: req.user!.userId },
    include: {
      qa: { select: { id: true, name: true } },
      tasks: {
        include: {
          installer: { select: { id: true, name: true, installerType: true } },
          media: true,
        },
        orderBy: { sequenceNumber: 'asc' },
      },
      qaReviews: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!job) throw new AppError('Job not found', 404);
  res.json(job);
});

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const { description, installerId, sequenceNumber } = req.body;
  if (!description || !installerId || sequenceNumber === undefined) {
    throw new AppError('description, installerId, and sequenceNumber are required');
  }

  const job = await prisma.job.findFirst({ where: { id: jobId, managerId: req.user!.userId } });
  if (!job) throw new AppError('Job not found', 404);

  const seqNum = Number(sequenceNumber);

  // Task 1 is immediately active; higher sequence tasks start locked
  const task = await prisma.task.create({
    data: {
      jobId,
      description,
      installerId,
      sequenceNumber: seqNum,
      status: seqNum === 1 ? 'pending' : 'locked',
    },
    include: { installer: { select: { id: true, name: true, installerType: true } } },
  });

  if (job.status === 'pending') {
    await prisma.job.update({ where: { id: jobId }, data: { status: 'in_progress' } });
  }

  res.status(201).json(task);
});

export const approveTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await prisma.task.findFirst({
    where: { id: req.params.taskId, job: { managerId: req.user!.userId } },
  });
  if (!task) throw new AppError('Task not found', 404);
  if (task.status !== 'submitted') throw new AppError('Task must be in submitted state to approve');

  await prisma.task.update({
    where: { id: task.id },
    data: { status: 'approved', managerComments: req.body.comments ?? null },
  });

  // Unlock the next sequential task
  const nextTask = await prisma.task.findFirst({
    where: { jobId: task.jobId, sequenceNumber: task.sequenceNumber + 1 },
  });
  if (nextTask) {
    await prisma.task.update({ where: { id: nextTask.id }, data: { status: 'pending' } });
  }

  res.json({ message: 'Task approved', nextTaskUnlocked: !!nextTask });
});

export const rejectTask = asyncHandler(async (req: Request, res: Response) => {
  const { comments, newInstallerId } = req.body;
  if (!comments) throw new AppError('Rejection comments are required');

  const task = await prisma.task.findFirst({
    where: { id: req.params.taskId, job: { managerId: req.user!.userId } },
  });
  if (!task) throw new AppError('Task not found', 404);
  if (task.status !== 'submitted') throw new AppError('Task must be in submitted state to reject');

  await prisma.task.update({
    where: { id: task.id },
    data: {
      status: 'rejected',
      managerComments: comments,
      ...(newInstallerId && { installerId: newInstallerId }),
    },
  });

  res.json({ message: 'Task rejected' });
});

export const submitJobToQA = asyncHandler(async (req: Request, res: Response) => {
  const job = await prisma.job.findFirst({
    where: { id: req.params.jobId, managerId: req.user!.userId },
    include: { tasks: true },
  });
  if (!job) throw new AppError('Job not found', 404);
  if (job.tasks.length === 0) throw new AppError('Job must have at least one task before submitting');

  const allApproved = job.tasks.every(t => t.status === 'approved');
  if (!allApproved) throw new AppError('All tasks must be approved before submitting to QA');

  await prisma.job.update({ where: { id: job.id }, data: { status: 'submitted_to_qa' } });
  res.json({ message: 'Job submitted to QA' });
});
