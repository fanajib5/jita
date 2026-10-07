import { opportunitiesService } from './opportunities.service.js';

export const opportunitiesController = {
  async getJobs(req, res, next) {
    try {
      const result = await opportunitiesService.getJobs(req.query, req.session?.user);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getCompanies(req, res, next) {
    try {
      const companies = await opportunitiesService.getCompanies();
      return res.json({ companies });
    } catch (err) {
      next(err);
    }
  },

  async createCompany(req, res, next) {
    try {
      const result = await opportunitiesService.createCompany(req.body, req.session.user.id);
      return res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async createJob(req, res, next) {
    try {
      const result = await opportunitiesService.createJob(req.body, req.session.user.id);
      return res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async deleteJob(req, res, next) {
    try {
      await opportunitiesService.deleteJob(Number(req.params.id), req.session.user.id);
      return res.json({ message: 'Lowongan pekerjaan dihapus' });
    } catch (err) {
      next(err);
    }
  },

  async applyJob(req, res, next) {
    try {
      const { notes } = req.body;
      const result = await opportunitiesService.applyJob(
        Number(req.params.id),
        notes,
        req.session.user
      );
      return res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async scoutCandidate(req, res, next) {
    try {
      const jobId = Number(req.params.id || req.body.job_id);
      const candidateId = Number(req.body.candidate_id);
      const { notes } = req.body;
      const result = await opportunitiesService.scoutCandidate(
        jobId,
        candidateId,
        notes,
        req.session.user
      );
      return res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async getScoutCandidates(req, res, next) {
    try {
      const result = await opportunitiesService.getScoutCandidates(req.query, req.session.user);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getMyApplications(req, res, next) {
    try {
      const result = await opportunitiesService.getMyApplications(req.session.user.id);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getJobApplications(req, res, next) {
    try {
      const result = await opportunitiesService.getJobApplications(
        Number(req.params.id),
        req.session.user
      );
      return res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async decideApplication(req, res, next) {
    try {
      const { status, message } = req.body;
      await opportunitiesService.decideApplication(
        Number(req.params.id),
        { status, message },
        req.session.user
      );
      return res.json({ message: `Status lamaran berhasil diperbarui menjadi ${status}` });
    } catch (err) {
      next(err);
    }
  },
};

export default opportunitiesController;
