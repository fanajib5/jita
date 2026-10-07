import { api } from './index';
import { MOCK_POSTS, type Post, type PostCategory, type PostSourceType } from '../data/mockPosts';

export type { Post, PostCategory, PostSourceType };

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PostsResponse {
  posts: Post[];
  pagination: PaginationMeta;
}

export interface CreatePostPayload {
  title: string;
  title_jp?: string;
  slug?: string;
  category: PostCategory;
  source_name: string;
  source_type: PostSourceType;
  author_name?: string;
  excerpt?: string;
  content: string;
  cover_image?: string;
  event_date?: string;
  event_location?: string;
  external_link?: string;
  tags?: string;
  is_pinned?: boolean | number;
  is_published?: boolean | number;
}

export const postsApi = {
  async listPosts(
    params: {
      category?: string;
      sourceType?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PostsResponse> {
    try {
      const res = await api.get<{ success: boolean; posts: Post[]; pagination: PaginationMeta }>(
        '/api/posts',
        { params }
      );
      if (res.data?.posts && res.data.posts.length > 0) {
        return {
          posts: res.data.posts,
          pagination: res.data.pagination || {
            page: params.page || 1,
            limit: params.limit || 10,
            total: res.data.posts.length,
            totalPages: 1,
          },
        };
      }
    } catch {
      // Graceful fallback to mock data
    }

    // Client-side filtering on mock data
    let filtered = [...MOCK_POSTS];
    if (params.category && params.category !== 'all') {
      filtered = filtered.filter((p) => p.category === params.category);
    }
    if (params.sourceType && params.sourceType !== 'all') {
      filtered = filtered.filter((p) => p.source_type === params.sourceType);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.source_name.toLowerCase().includes(q) ||
          (p.excerpt && p.excerpt.toLowerCase().includes(q))
      );
    }

    const page = params.page || 1;
    const limit = params.limit || 10;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return {
      posts: paginated,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit) || 1,
      },
    };
  },

  async getPost(slugOrId: string | number): Promise<Post> {
    try {
      const res = await api.get<{ success: boolean; post: Post }>(`/api/posts/${slugOrId}`);
      if (res.data?.post) {
        return res.data.post;
      }
    } catch {
      // Fallback
    }

    const found = MOCK_POSTS.find(
      (p) => p.slug === String(slugOrId) || String(p.id) === String(slugOrId)
    );
    if (found) {
      return found;
    }
    throw new Error('Konten informasi tidak ditemukan.');
  },

  async createPost(payload: CreatePostPayload): Promise<Post> {
    const res = await api.post<{ success: boolean; post: Post }>('/api/posts', payload);
    return res.data.post;
  },

  async updatePost(id: number, payload: Partial<CreatePostPayload>): Promise<Post> {
    const res = await api.put<{ success: boolean; post: Post }>(`/api/posts/${id}`, payload);
    return res.data.post;
  },

  async deletePost(id: number): Promise<{ success: boolean; message: string }> {
    const res = await api.delete<{ success: boolean; message: string }>(`/api/posts/${id}`);
    return res.data;
  },
};
