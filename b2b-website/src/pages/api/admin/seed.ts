import type { APIRoute } from 'astro';
import { createAuth } from '../../../lib/auth';
import { createRouting } from '../../../lib/routing';
import { toErrorResponse, ValidationError } from '../../../lib/errors';

/**
 * 管理员 Seed 端点
 * POST /api/admin/seed
 *
 * 首次部署后调用，创建管理员账号
 * 需要提供 BETTER_AUTH_SECRET 作为 Bearer Token 鉴权
 * 支持幂等调用：如果管理员已存在则返回已有信息
 *
 * Body: { email: string, password: string, name: string }
 */
export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  // 域名守卫
  const { requireCmsHost } = createRouting(locals.runtime?.env);
  const cmsGuard = requireCmsHost(request);
  if (cmsGuard) return cmsGuard;

  // Bearer Token 鉴权
  const authHeader = request.headers.get('Authorization');
  const secret = locals.runtime?.env?.BETTER_AUTH_SECRET;

  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== secret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = locals.runtime?.env?.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 解析请求体
  let email: string, password: string, name: string;
  try {
    const body = await request.json();
    email = body.email;
    password = body.password;
    name = body.name || 'Admin';
  } catch {
    return toErrorResponse(new ValidationError('Invalid JSON body'));
  }

  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'email and password are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (password.length < 8) {
    return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const auth = createAuth(db);

    // 幂等检查：查询是否已存在同名用户
    const existingUser = await db
      .prepare('SELECT id, email, name FROM "user" WHERE email = ?')
      .bind(email)
      .first<{ id: string; email: string; name: string }>();

    if (existingUser) {
      return new Response(JSON.stringify({
        success: true,
        message: `Admin user already exists: ${email}`,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
        },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 使用 Better Auth API 创建用户
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error.message || 'Failed to create admin' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Admin user created: ${email}`,
      user: {
        id: result.user?.id,
        email: result.user?.email,
        name: result.user?.name,
      },
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
};
