import type { Comment, CommentWithReplies } from './types';

export interface CreateCommentInput {
  news_slug: string;
  parent_id?: number;
  author_name: string;
  author_email?: string;
  content: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * 创建评论（使用 news_slug 关联 Content Collection）
 */
export async function createComment(
  db: D1Database,
  input: CreateCommentInput
): Promise<number> {
  const result = await db.prepare(`
    INSERT INTO comments (
      news_slug, parent_id, author_name, author_email, content, ip_address, user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    input.news_slug,
    input.parent_id || null,
    input.author_name,
    input.author_email || null,
    input.content,
    input.ip_address || null,
    input.user_agent || null
  ).run();

  return result.meta.last_row_id;
}

/**
 * 按新闻 slug 获取评论列表
 */
export async function getCommentsByNewsSlug(
  db: D1Database,
  newsSlug: string,
  onlyApproved: boolean = true
): Promise<Comment[]> {
  const conditions: string[] = ['news_slug = ?'];
  const params: unknown[] = [newsSlug];

  if (onlyApproved) {
    conditions.push('status = ?');
    params.push('approved');
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const result = await db.prepare(`SELECT * FROM comments ${where} ORDER BY created_at DESC`).bind(...params).all<Comment>();
  return result.results;
}

/**
 * 按新闻 slug 获取评论（含回复，树形结构）
 */
export async function getCommentsWithReplies(
  db: D1Database,
  newsSlug: string
): Promise<CommentWithReplies[]> {
  const comments = await getCommentsByNewsSlug(db, newsSlug, true);

  // 构建树形结构
  const commentMap = new Map<number, CommentWithReplies>();
  const rootComments: CommentWithReplies[] = [];

  // 首先创建所有评论的映射
  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // 然后构建树形结构
  comments.forEach(comment => {
    const commentWithReplies = commentMap.get(comment.id)!;
    if (comment.parent_id && commentMap.has(comment.parent_id)) {
      commentMap.get(comment.parent_id)!.replies.push(commentWithReplies);
    } else {
      rootComments.push(commentWithReplies);
    }
  });

  return rootComments;
}

/**
 * 向后兼容：按 news_id 获取评论（遗留数据支持）
 * @deprecated 请使用 getCommentsByNewsSlug
 */
export async function getCommentsByNewsId(
  db: D1Database,
  newsId: number,
  onlyApproved: boolean = true
): Promise<Comment[]> {
  const conditions: string[] = ['news_id = ?'];
  const params: unknown[] = [newsId];

  if (onlyApproved) {
    conditions.push('status = ?');
    params.push('approved');
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const result = await db.prepare(`SELECT * FROM comments ${where} ORDER BY created_at DESC`).bind(...params).all<Comment>();
  return result.results;
}

export async function getCommentById(
  db: D1Database,
  id: number
): Promise<Comment | null> {
  const result = await db.prepare(`
    SELECT * FROM comments WHERE id = ?
  `).bind(id).first<Comment>();

  return result;
}

export async function updateCommentStatus(
  db: D1Database,
  id: number,
  status: 'pending' | 'approved' | 'rejected'
): Promise<boolean> {
  const result = await db.prepare(`
    UPDATE comments SET status = ? WHERE id = ?
  `).bind(status, id).run();

  return result.meta.changes > 0;
}

export async function getPendingComments(
  db: D1Database,
  limit: number = 20,
  offset: number = 0
): Promise<Comment[]> {
  const result = await db.prepare(`
    SELECT * FROM comments WHERE status = 'pending'
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all<Comment>();

  return result.results;
}

/**
 * 获取评论计数
 * 支持 newsSlug 或 newsId 过滤
 */
export async function getCommentCount(
  db: D1Database,
  newsIdentifier?: number | string,
  status?: string
): Promise<number> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (newsIdentifier !== undefined) {
    if (typeof newsIdentifier === 'string') {
      // 按 slug 过滤
      conditions.push('news_slug = ?');
      params.push(newsIdentifier);
    } else {
      // 向后兼容：按 id 过滤
      conditions.push('news_id = ?');
      params.push(newsIdentifier);
    }
  }

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.prepare(`SELECT COUNT(*) as count FROM comments ${where}`).bind(...params).first<{ count: number }>();
  return result?.count || 0;
}
