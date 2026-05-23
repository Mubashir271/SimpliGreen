import { Router } from 'express';
import { login, getMe, updateProfile } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.post('/login', login);
router.get('/me', authenticate, getMe);
router.post('/profile', authenticate, upload.single('avatar'), updateProfile);

export default router;
