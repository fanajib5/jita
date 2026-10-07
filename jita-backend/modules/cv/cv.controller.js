import { cvService } from './cv.service.js';
import { AuthorizationError } from '../../errors/AppError.js';

export const cvController = {
  async exportMyCv(req, res, next) {
    try {
      const profile = await cvService.getProfileForCv(req.session.user.id);
      cvService.streamCvPdf(profile, res);
    } catch (err) {
      next(err);
    }
  },

  async exportCandidateCv(req, res, next) {
    try {
      const cid = Number(req.params.candidateId);
      const profile = await cvService.getProfileForCv(cid);
      if (req.session.user.role === 'corporate' && !profile.profile_verified) {
        throw new AuthorizationError('Akses ditolak: profil kandidat belum diverifikasi');
      }
      cvService.streamCvPdf(profile, res);
    } catch (err) {
      next(err);
    }
  },
};

export default cvController;
