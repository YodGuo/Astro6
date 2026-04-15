# B2B 网站改进计划 - 产品需求文档

## Overview
- **Summary**: 基于审计报告，对 B2B 网站进行小批次改进，优先解决关键问题，确保网站稳定运行并提升性能和安全性。
- **Purpose**: 解决审计报告中识别的 critical 和 high 级别的问题，同时处理部分 medium 级别问题，确保网站在 Astro 6 升级前的稳定性。
- **Target Users**: 网站开发团队和维护人员。

## Goals
- 修复数据库迁移脚本，确保所有迁移文件都能被正确执行
- 统一代码风格，解决 Astro.locals 和裸 locals 的混用问题
- 优化 SEO，确保 JSON-LD 数据从设置中动态读取
- 提升网站性能和安全性
- 为未来 Astro 6 升级做准备

## Non-Goals (Out of Scope)
- 大规模重构代码
- 引入新的第三方库
- 实现新功能
- 完全迁移到 Astro 6

## Background & Context
- 项目是基于 Astro 5 + React 18 + Tailwind CSS 3 的 B2B 网站
- 部署在 Cloudflare Workers 上，使用 D1 数据库、R2 存储、KV 缓存等 Cloudflare 服务
- 审计报告识别了多个需要修复的问题，包括 critical、high、medium 和 improvement 级别的问题
- 项目当前版本为 v1.8.5

## Functional Requirements
- **FR-1**: 修复数据库迁移脚本，确保 003_comment_slug.sql 被包含在迁移命令中
- **FR-2**: 统一代码风格，将 admin/index.astro 中的裸 locals 改为 Astro.locals
- **FR-3**: 优化 SEO，确保 index.astro 中的 JSON-LD 数据从 settings 中动态读取
- **FR-4**: 改进评论限流机制，减少竞态条件的可能性
- **FR-5**: 优化 Google Fonts 加载，减少首屏渲染阻塞

## Non-Functional Requirements
- **NFR-1**: 代码质量：确保代码风格一致，遵循最佳实践
- **NFR-2**: 性能：减少首屏渲染时间，提升用户体验
- **NFR-3**: 安全性：确保网站安全，减少潜在的安全漏洞
- **NFR-4**: 可维护性：确保代码易于理解和维护

## Constraints
- **Technical**: 保持现有技术栈不变，不引入新的依赖
- **Business**: 小批次修复，不进行大规模重构
- **Dependencies**: 依赖 Cloudflare 服务（D1、R2、KV、Queue）

## Assumptions
- 项目已经正确部署在 Cloudflare Workers 上
- 所有环境变量都已正确配置
- 数据库迁移脚本本身是正确的，只是未被包含在迁移命令中

## Acceptance Criteria

### AC-1: 数据库迁移脚本修复
- **Given**: 执行 db:migrate 命令
- **When**: 迁移脚本运行
- **Then**: 003_comment_slug.sql 被正确执行，comments 表包含 news_slug 列
- **Verification**: `programmatic`
- **Notes**: 确保 db:migrate 和 db:migrate:remote 命令都包含 003_comment_slug.sql

### AC-2: 代码风格统一
- **Given**: 查看 admin/index.astro 文件
- **When**: 检查代码风格
- **Then**: 所有 locals 访问都使用 Astro.locals 前缀，无裸 locals 调用
- **Verification**: `programmatic`
- **Notes**: 确保代码风格一致，为未来 Astro 6 升级做准备

### AC-3: SEO 优化
- **Given**: 访问网站首页
- **When**: 检查 JSON-LD 数据
- **Then**: JSON-LD 中的公司信息从 settings 中动态读取，不是硬编码
- **Verification**: `programmatic`
- **Notes**: 确保搜索引擎索引到正确的公司信息

### AC-4: 评论限流改进
- **Given**: 并发提交评论
- **When**: 测试评论限流机制
- **Then**: 限流机制能够正确处理并发请求，减少竞态条件的可能性
- **Verification**: `programmatic`
- **Notes**: 可以考虑添加随机 jitter delay 降低并发概率

### AC-5: Google Fonts 优化
- **Given**: 加载网站页面
- **When**: 检查字体加载
- **Then**: Google Fonts 加载不阻塞首屏渲染，或使用本地字体
- **Verification**: `human-judgment`
- **Notes**: 可以考虑使用 fontsource 包本地化字体或添加 font-display: swap

## Open Questions
- [ ] 是否需要在本次改进中处理 Astro 6 迁移的准备工作？
- [ ] 是否需要进一步优化其他页面的 JSON-LD 数据？
- [ ] 是否需要添加更多的性能优化措施？