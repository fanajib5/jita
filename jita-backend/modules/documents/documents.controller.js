import { documentsService } from './documents.service.js';

export const documentsController = {
  async getMine(req, res, next) {
    try {
      const documents = await documentsService.getMyDocuments(req.session.user.id);
      return res.json({ documents });
    } catch (err) {
      next(err);
    }
  },

  async upload(req, res, next) {
    try {
      const document = await documentsService.handleUpload(req.file, req.body, req.session.user);
      return res.status(201).json({ document });
    } catch (err) {
      next(err);
    }
  },

  async deleteDocument(req, res, next) {
    try {
      await documentsService.deleteDocument(Number(req.params.id), req.session.user);
      return res.json({ message: 'Dokumen dihapus' });
    } catch (err) {
      next(err);
    }
  },

  async serveFile(req, res, next) {
    try {
      const safePath = await documentsService.getDocumentFile(Number(req.params.id), req.session.user);
      return res.sendFile(safePath);
    } catch (err) {
      next(err);
    }
  },
};

export default documentsController;
