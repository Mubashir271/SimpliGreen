import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import * as manager from '../controllers/manager.controller';

const router = Router();
router.use(authenticate, authorize('manager'));

router.get('/jobs', manager.getJobs);
router.get('/jobs/:id', manager.getJob);
router.post('/jobs/:jobId/tasks', manager.createTask);
router.post('/jobs/:jobId/submit-to-qa', manager.submitJobToQA);
router.post('/tasks/:taskId/approve', manager.approveTask);
router.post('/tasks/:taskId/reject', manager.rejectTask);

export default router;
