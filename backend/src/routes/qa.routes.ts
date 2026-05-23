import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import * as qa from '../controllers/qa.controller';

const router = Router();
router.use(authenticate, authorize('qa'));

router.get('/jobs', qa.getJobs);
router.get('/jobs/:jobId', qa.getJob);
router.post('/jobs/:jobId/approve', qa.approveJob);
router.post('/jobs/:jobId/reject', qa.rejectJob);

export default router;
