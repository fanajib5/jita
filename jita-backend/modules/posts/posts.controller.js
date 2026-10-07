import { postsService } from './posts.service.js';

export const postsController = {
  async getPosts(req, res, next) {
    try {
      const { category, sourceType, search, page, limit } = req.query;
      const result = await postsService.getPosts({
        category,
        sourceType,
        search,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
        publishedOnly: req.session?.user?.role !== 'admin',
      });
      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getPost(req, res, next) {
    try {
      const { slugOrId } = req.params;
      const post = await postsService.getPostBySlugOrId(slugOrId);
      return res.json({ success: true, post });
    } catch (err) {
      next(err);
    }
  },

  async createPost(req, res, next) {
    try {
      const userId = req.session?.user?.id || null;
      const post = await postsService.createPost(req.body, userId);
      return res.status(201).json({ success: true, post });
    } catch (err) {
      next(err);
    }
  },

  async updatePost(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.session?.user?.id || null;
      const post = await postsService.updatePost(id, req.body, userId);
      return res.json({ success: true, post });
    } catch (err) {
      next(err);
    }
  },

  async deletePost(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.session?.user?.id || null;
      await postsService.deletePost(id, userId);
      return res.json({ success: true, message: 'Konten informasi berhasil dihapus.' });
    } catch (err) {
      next(err);
    }
  },
};

export default postsController;
