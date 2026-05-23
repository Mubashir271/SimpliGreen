import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../app';
import { AppError, asyncHandler } from '../utils/errors';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password are required');

  const user = await prisma.user.findUnique({
    where: { email },
    include: { installerType: true },
  });
  if (!user || !user.isActive) throw new AppError('Invalid credentials', 401);

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AppError('Invalid credentials', 401);

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any,
  );

  const { password: _, ...userSafe } = user;
  res.json({ token, user: userSafe });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { installerType: true },
  });
  if (!user) throw new AppError('User not found', 404);
  const { password: _, ...userSafe } = user;
  res.json(userSafe);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;
  const avatarFile = (req as any).file;

  const data: { name?: string; avatar?: string } = {};
  if (name?.trim()) data.name = name.trim();
  if (avatarFile) data.avatar = avatarFile.filename;

  if (Object.keys(data).length === 0) throw new AppError('Nothing to update', 400);

  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data,
    include: { installerType: true },
  });
  const { password: _, ...userSafe } = user;
  res.json(userSafe);
});
