import { Request, Response } from 'express';
import { prisma } from '../app';
import { AppError, asyncHandler } from '../utils/errors';

export const getTasks = asyncHandler(async (req: Request, res: Response) => {
  const tasks = await prisma.task.findMany({
    where: {
      installerId: req.user!.userId,
      status: { not: 'locked' },
    },
    include: {
      job: { select: { id: true, title: true, status: true } },
      media: true,
    },
    orderBy: [{ job: { createdAt: 'desc' } }, { sequenceNumber: 'asc' }],
  });
  res.json(tasks);
});

export const getTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await prisma.task.findFirst({
    where: {
      id: req.params.taskId,
      installerId: req.user!.userId,
      status: { not: 'locked' },
    },
    include: {
      job: { select: { id: true, title: true } },
      media: true,
      installer: { select: { id: true, name: true, installerType: true } },
    },
  });
  if (!task) throw new AppError('Task not found', 404);
  res.json(task);
});

export const uploadMedia = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No file uploaded');

  const task = await prisma.task.findFirst({
    where: { id: req.params.taskId, installerId: req.user!.userId },
  });
  if (!task) throw new AppError('Task not found', 404);

  const fileType = req.body.fileType as string;
  if (!['image', 'certificate'].includes(fileType)) {
    throw new AppError('fileType must be "image" or "certificate"');
  }

  const media = await prisma.taskMedia.create({
    data: { taskId: task.id, filePath: req.file.path, fileType: fileType as any },
  });
  res.status(201).json(media);
});

export const deleteMedia = asyncHandler(async (req: Request, res: Response) => {
  const media = await prisma.taskMedia.findFirst({
    where: { id: req.params.mediaId, task: { installerId: req.user!.userId } },
  });
  if (!media) throw new AppError('Media not found', 404);

  await prisma.taskMedia.delete({ where: { id: media.id } });
  res.status(204).send();
});

export const submitTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await prisma.task.findFirst({
    where: { id: req.params.taskId, installerId: req.user!.userId },
    include: {
      media: true,
      installer: { include: { installerType: true } },
    },
  });
  if (!task) throw new AppError('Task not found', 404);
  if (!['pending', 'rejected'].includes(task.status)) {
    throw new AppError('Task cannot be submitted in its current state');
  }

  // Note: media validation is enforced on the frontend.
  // A file picker library (e.g. react-native-image-picker) is needed for real uploads.

  await prisma.task.update({ where: { id: task.id }, data: { status: 'submitted' } });
  res.json({ message: 'Task submitted successfully' });
});
