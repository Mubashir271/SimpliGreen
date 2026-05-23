import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../app';
import { AppError, asyncHandler } from '../utils/errors';
import { generateJobPDF } from '../services/pdf.service';

// ── Users ────────────────────────────────────────────────────────────────────

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.query;
  const users = await prisma.user.findMany({
    where: role ? { role: String(role) } : undefined,
    include: { installerType: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users.map(u => { const { password, ...safe } = u; return safe; }));
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role, installerTypeId } = req.body;
  if (!name || !email || !password || !role) {
    throw new AppError('name, email, password, and role are required');
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new AppError('Email already in use');

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role, installerTypeId: installerTypeId ?? null },
    include: { installerType: true },
  });
  const { password: _, ...userSafe } = user;
  res.status(201).json(userSafe);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, isActive, installerTypeId } = req.body;
  const data: Record<string, any> = {};
  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = email;
  if (password) data.password = await bcrypt.hash(password, 10);
  if (typeof isActive === 'boolean') data.isActive = isActive;
  if (installerTypeId !== undefined) data.installerTypeId = installerTypeId;

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data,
    include: { installerType: true },
  });
  const { password: _, ...userSafe } = user;
  res.json(userSafe);
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// ── Installer Types ──────────────────────────────────────────────────────────

export const getInstallerTypes = asyncHandler(async (_req: Request, res: Response) => {
  const types = await prisma.installerType.findMany({ orderBy: { name: 'asc' } });
  res.json(types);
});

export const createInstallerType = asyncHandler(async (req: Request, res: Response) => {
  const { name, requiresCertificate } = req.body;
  if (!name) throw new AppError('name is required');
  const type = await prisma.installerType.create({
    data: { name, requiresCertificate: !!requiresCertificate },
  });
  res.status(201).json(type);
});

export const updateInstallerType = asyncHandler(async (req: Request, res: Response) => {
  const { name, requiresCertificate } = req.body;
  const type = await prisma.installerType.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(requiresCertificate !== undefined && { requiresCertificate }),
    },
  });
  res.json(type);
});

export const deleteInstallerType = asyncHandler(async (req: Request, res: Response) => {
  await prisma.installerType.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// ── Jobs ─────────────────────────────────────────────────────────────────────

export const getJobs = asyncHandler(async (_req: Request, res: Response) => {
  const jobs = await prisma.job.findMany({
    include: {
      manager: { select: { id: true, name: true } },
      qa: { select: { id: true, name: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(jobs);
});

export const createJob = asyncHandler(async (req: Request, res: Response) => {
  const { title, address, description, managerId, qaId } = req.body;
  if (!title || !managerId || !qaId) {
    throw new AppError('title, managerId, and qaId are required');
  }
  const job = await prisma.job.create({
    data: { title, address: address ?? null, description, adminId: req.user!.userId, managerId, qaId, status: 'in_progress' },
    include: {
      manager: { select: { id: true, name: true } },
      qa: { select: { id: true, name: true } },
    },
  });
  res.status(201).json(job);
});

export const getJob = asyncHandler(async (req: Request, res: Response) => {
  const job = await prisma.job.findUnique({
    where: { id: req.params.id },
    include: {
      admin: { select: { id: true, name: true } },
      manager: { select: { id: true, name: true } },
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

export const generatePDF = asyncHandler(async (req: Request, res: Response) => {
  const job = await prisma.job.findUnique({
    where: { id: req.params.id },
    include: {
      admin: { select: { name: true } },
      manager: { select: { name: true } },
      qa: { select: { name: true } },
      tasks: {
        include: {
          installer: { select: { name: true, installerType: true } },
          media: true,
        },
        orderBy: { sequenceNumber: 'asc' },
      },
      qaReviews: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!job) throw new AppError('Job not found', 404);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="job-report-${job.id}.pdf"`);
  generateJobPDF(job, res);
});
