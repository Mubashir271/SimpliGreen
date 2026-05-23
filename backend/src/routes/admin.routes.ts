import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import * as admin from '../controllers/admin.controller';

const router = Router();
router.use(authenticate, authorize('admin'));

// Users
router.get('/users', admin.getUsers);
router.post('/users', admin.createUser);
router.put('/users/:id', admin.updateUser);
router.delete('/users/:id', admin.deleteUser);

// Installer Types
router.get('/installer-types', admin.getInstallerTypes);
router.post('/installer-types', admin.createInstallerType);
router.put('/installer-types/:id', admin.updateInstallerType);
router.delete('/installer-types/:id', admin.deleteInstallerType);

// Jobs
router.get('/jobs', admin.getJobs);
router.post('/jobs', admin.createJob);
router.get('/jobs/:id', admin.getJob);
router.get('/jobs/:id/pdf', admin.generatePDF);

export default router;
