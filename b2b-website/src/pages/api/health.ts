import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * 健康检查端点
 * GET /api/health
 *
 * 供外部监控系统（UptimeRobot、Grafana 等）探测
 * 检测 D1、R2、KV 连通性
 */
export const GET: APIRoute = async ({ locals }) => {
  const { env } = locals.runtime;
  const checks: Record<string, { status: string; latency?: number }> = {};

  // D1 检查
  try {
    const start = Date.now();
    await env.DB.prepare('SELECT 1').first();
    checks.db = { status: 'ok', latency: Date.now() - start };
  } catch {
    checks.db = { status: 'error' };
  }

  // R2 检查
  try {
    const start = Date.now();
    await env.MEDIA_BUCKET.list({ limit: 1 });
    checks.r2 = { status: 'ok', latency: Date.now() - start };
  } catch {
    checks.r2 = { status: 'error' };
  }

  // KV 检查
  try {
    const start = Date.now();
    await env.SESSION.get('health:check');
    checks.kv = { status: 'ok', latency: Date.now() - start };
  } catch {
    checks.kv = { status: 'error' };
  }

  const allOk = Object.values(checks).every(c => c.status === 'ok');

  return new Response(JSON.stringify({
    status: allOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  }), {
    status: allOk ? 200 : 503,
    headers: { 'Content-Type': 'application/json' },
  });
};
