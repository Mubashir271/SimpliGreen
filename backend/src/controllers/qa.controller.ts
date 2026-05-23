import { Request, Response } from 'express';
import { prisma } from '../app';
import { AppError, asyncHandler } from '../utils/errors';

export const getJobs = asyncHandler(async (req: Request, res: Response) => {
  const jobs = await prisma.job.findMany({
    where: {
      qaId: req.user!.userId,
      status: { in: ['in_progress', 'submitted_to_qa', 'approved', 'rejected'] },
    },
    include: {
      manager: { select: { id: true, name: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(jobs);
});

export const getJob = asyncHandler(async (req: Request, res: Response) => {
  const job = await prisma.job.findFirst({
    where: { id: req.params.jobId, qaId: req.user!.userId },
    include: {
      manager: { select: { id: true, name: true } },
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

export const approveJob = asyncHandler(async (req: Request, res: Response) => {
  const job = await prisma.job.findFirst({
    where: { id: req.params.jobId, qaId: req.user!.userId, status: 'submitted_to_qa' },
  });
  if (!job) throw new AppError('Job not ready for QA review', 404);

  await prisma.$transaction([
    prisma.job.update({
      where: { id: job.id },
      data: { status: 'approved', completedAt: new Date() },
    }),
    prisma.qaReview.create({
      data: {
        jobId: job.id,
        qaId: req.user!.userId,
        decision: 'approved',
        comments: req.body.comments ?? null,
      },
    }),
  ]);

  res.json({ message: 'Job approved and finalized' });
});

export const rejectJob = asyncHandler(async (req: Request, res: Response) => {
  const { comments } = req.body;
  if (!comments) throw new AppError('Rejection comments are required');

  const job = await prisma.job.findFirst({
    where: { id: req.params.jobId, qaId: req.user!.userId, status: 'submitted_to_qa' },
  });
  if (!job) throw new AppError('Job not ready for QA review', 404);

  await prisma.$transaction([
    prisma.job.update({ where: { id: job.id }, data: { status: 'rejected' } }),
    prisma.qaReview.create({
      data: { jobId: job.id, qaId: req.user!.userId, decision: 'rejected', comments },
    }),
  ]);

  res.json({ message: 'Job rejected and returned to manager' });
});
