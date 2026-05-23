import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { upload } from '../middleware/upload';
import * as installer from '../controllers/installer.controller';

const router = Router();
router.use(authenticate, authorize('installer'));

router.get('/tasks', installer.getTasks);
router.get('/tasks/:taskId', installer.getTask);
router.post('/tasks/:taskId/media', upload.single('file'), installer.uploadMedia);
router.delete('/tasks/:taskId/media/:mediaId', installer.deleteMedia);
router.post('/tasks/:taskId/submit', installer.submitTask);

export default router;
