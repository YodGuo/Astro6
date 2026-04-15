/**
 * 域名路由中间件
 * xxxx.com → 前台网站（产品、新闻、询价、评论）
 * cms.xxxx.com → 后台（Keystatic CMS + 管理面板）
 *
 * 使用方式（运行时从 env 注入域名）:
 *   import { createRouting } from '../lib/routing';
 *   const { requireCmsHost } = createRouting({
 *     cmsHostnames: [new URL(env.CMS_SITE_URL).hostname, 'localhost', '127.0.0.1'],
 *     publicHostnames: [new URL(env.PUBLIC_SITE_URL).hostname],
 *     publicRedirectHost: new URL(env.PUBLIC_SITE_URL).hostname,
 *   });
 */

export interface RoutingConfig {
  cmsHostnames: string[];
  publicHostnames: string[];
  publicRedirectHost: string;
}

/**
 * 从 env 变量自动构建路由配置
 * 读取 PUBLIC_SITE_URL 和 CMS_SITE_URL，提取 hostname
 */
export function createRoutingConfig(env: {
  PUBLIC_SITE_URL?: string;
  CMS_SITE_URL?: string;
}): RoutingConfig {
  const publicUrl = env.PUBLIC_SITE_URL || 'https://xxxx.com';
  const cmsUrl = env.CMS_SITE_URL || 'https://cms.xxxx.com';
  const publicHostname = new URL(publicUrl).hostname;

  return {
    cmsHostnames: [new URL(cmsUrl).hostname, publicHostname, 'localhost', '127.0.0.1'],
    publicHostnames: [publicHostname, `www.${publicHostname}`],
    publicRedirectHost: publicHostname,
  };
}

/**
 * 创建域名路由实例（工厂函数）
 * 支持运行时从 env 注入域名配置，避免硬编码
 */
export function createRouting(config?: Partial<RoutingConfig>) {
  const cfg: RoutingConfig = config
    ? { ...createRoutingConfig({}), ...config }
    : createRoutingConfig({});

  function isCmsHost(hostname: string): boolean {
    return cfg.cmsHostnames.includes(hostname);
  }

  function isPublicHost(hostname: string): boolean {
    return cfg.publicHostnames.includes(hostname);
  }

  function getSiteType(hostname: string): 'public' | 'cms' {
    return isCmsHost(hostname) ? 'cms' : 'public';
  }

  /**
   * CMS域名守卫 - 非CMS域名访问时返回 404（不暴露后台域名）
   */
  function requireCmsHost(request: Request): Response | null {
    const hostname = new URL(request.url).hostname;

    if (isCmsHost(hostname)) {
      return null;
    }

    return new Response(
      JSON.stringify({ error: 'Not Found' }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  /**
   * 前台域名守卫 - 非前台域名访问时重定向到前台域名
   */
  function requirePublicHost(request: Request): Response | null {
    const hostname = new URL(request.url).hostname;

    if (isPublicHost(hostname)) {
      return null;
    }

    const publicUrl = new URL(request.url);
    publicUrl.hostname = cfg.publicRedirectHost;
    publicUrl.protocol = 'https:';

    return Response.redirect(publicUrl.toString(), 301);
  }

  return { isCmsHost, isPublicHost, getSiteType, requireCmsHost, requirePublicHost };
}
