import express from 'express';
import { opportunitiesController } from './opportunities.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Jobs
router.get('/jobs', opportunitiesController.getJobs);
router.post('/jobs', requireAuth, opportunitiesController.createJob);
router.delete('/jobs/:id', requireAuth, opportunitiesController.deleteJob);
router.post('/jobs/:id/apply', requireAuth, opportunitiesController.applyJob);

// Companies
router.get(['/companies', '/jobs/companies'], opportunitiesController.getCompanies);
router.post(['/companies', '/jobs/companies'], requireAuth, opportunitiesController.createCompany);

// Scouting
router.post(['/jobs/:id/scout', '/scout'], requireAuth, opportunitiesController.scoutCandidate);
router.get(['/jobs/scout-candidates', '/scout/candidates'], requireAuth, opportunitiesController.getScoutCandidates);

// Applications
router.get('/applications/mine', requireAuth, opportunitiesController.getMyApplications);
router.get('/jobs/:id/applications', requireAuth, opportunitiesController.getJobApplications);
router.post('/applications/:id/decide', requireAuth, opportunitiesController.decideApplication);

export default router;
