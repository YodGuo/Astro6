import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { createComment } from '../lib/db/comments';
import { sendCommentNotification } from '../lib/notifications';
import { deleteCache } from '../lib/cache';
import { verifyTurnstile } from '../lib/turnstile';

// IP 频率限制配置
const RATE_LIMIT_MAX = 3; // 每窗口最多 3 条评论
const RATE_LIMIT_WINDOW = 60; // 60 秒窗口

export const comment = defineAction({
  accept: 'form',
  input: z.object({
    newsSlug: z.string().min(1, '无效的文章标识'),
    parentId: z.coerce.number().positive().optional(),
    authorName: z.string().min(2, '姓名至少2个字符').max(50, '姓名不能超过50个字符'),
    authorEmail: z.string().email('请输入有效的邮箱').optional().or(z.literal('')),
    content: z.string()
      .min(5, '评论内容至少5个字符')
      .max(1000, '评论内容不能超过1000个字符'),
    // Honeypot field for spam protection
    website: z.string().max(0).optional(),
    // Cloudflare Turnstile token
    cfTurnstileToken: z.string().min(1, '人机验证失败，请重试'),
  }),
  handler: async (input, context) => {
    const { env } = context.locals.runtime;
    const request = context.request;

    // 垃圾评论检测 - 如果honeypot字段有值，说明是机器人
    if (input.website && input.website.length > 0) {
      throw new ActionError({
        code: 'BAD_REQUEST',
        message: 'Invalid submission'
      });
    }

    // ========== Turnstile 人机验证 ==========
    const clientIp = request.headers.get('CF-Connecting-IP') || undefined;
    const turnstileResult = await verifyTurnstile(
      input.cfTurnstileToken,
      env.TURNSTILE_SECRET_KEY,
      clientIp
    );

    if (!turnstileResult.success) {
      throw new ActionError({
        code: 'BAD_REQUEST',
        message: '人机验证失败，请刷新页面重试'
      });
    }

    // 添加随机 jitter delay 降低并发概率，减少竞态条件
    const jitter = Math.random() * 1000; // 0-1000ms 随机延迟
    await new Promise(resolve => setTimeout(resolve, jitter));

    // ========== IP 频率限制 ==========
    const ip = request.headers.get('CF-Connecting-IP') ||
               request.headers.get('X-Forwarded-For') ||
               'unknown';

    if (env.SESSION) {
      const rateLimitKey = `ratelimit:comment:${ip}`;
      const rateLimitCount = await env.SESSION.get(rateLimitKey);
      if (rateLimitCount && parseInt(rateLimitCount) >= RATE_LIMIT_MAX) {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: '评论过于频繁，请稍后再试'
        });
      }
    }

    try {
      // 保存评论（使用 news_slug 关联 Content Collection）
      const commentId = await createComment(env.DB, {
        news_slug: input.newsSlug,
        parent_id: input.parentId,
        author_name: input.authorName,
        author_email: input.authorEmail || undefined,
        content: input.content,
        ip_address: ip,
        user_agent: request.headers.get('User-Agent') || ''
      });

      // 递增频率限制计数
      if (env.SESSION) {
        const rateLimitKey = `ratelimit:comment:${ip}`;
        const current = await env.SESSION.get(rateLimitKey);
        await env.SESSION.put(rateLimitKey, String((current ? parseInt(current) : 0) + 1), {
          expirationTtl: RATE_LIMIT_WINDOW
        });
      }

      // 发送通知给管理员
      await sendCommentNotification(env, {
        id: commentId,
        news_title: input.newsSlug,
        author_name: input.authorName,
        content: input.content
      });

      // 清除评论缓存
      if (env.SESSION) {
        await deleteCache(env.SESSION, `comments:news:${input.newsSlug}`, { namespace: 'comments' });
        await deleteCache(env.SESSION, `comment-count:news:${input.newsSlug}`, { namespace: 'comments' });
      }

      return {
        success: true,
        message: '评论已提交，等待审核后显示',
        commentId
      };
    } catch (error) {
      console.error('Comment submission error:', error);
      throw new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
        message: '评论提交失败，请稍后重试'
      });
    }
  }
});
