# B2B 网站改进计划 - 实施计划

## [ ] 任务 1: 修复数据库迁移脚本
- **优先级**: P0
- **Depends On**: None
- **Description**: 
  - 修改 package.json 中的 db:migrate 和 db:migrate:remote 脚本
  - 确保 003_comment_slug.sql 被包含在迁移命令中
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `programmatic` TR-1.1: 执行 npm run db:migrate 命令，验证 003_comment_slug.sql 被执行
  - `programmatic` TR-1.2: 检查 comments 表是否包含 news_slug 列
- **Notes**: 这是 critical 级别的问题，必须优先修复

## [ ] 任务 2: 统一 admin/index.astro 中的代码风格
- **优先级**: P0
- **Depends On**: None
- **Description**: 
  - 将 admin/index.astro 中的裸 locals 调用改为 Astro.locals
  - 确保所有 locals 访问都使用统一的前缀
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `programmatic` TR-2.1: 检查 admin/index.astro 文件，确保无裸 locals 调用
  - `programmatic` TR-2.2: 运行 npm run build，确保构建成功
- **Notes**: 这是 high 级别的问题，需要统一代码风格为未来 Astro 6 升级做准备

## [ ] 任务 3: 优化 index.astro 中的 JSON-LD 数据
- **优先级**: P0
- **Depends On**: None
- **Description**: 
  - 修改 index.astro 中的 JSON-LD 数据，从 settings 中动态读取公司信息
  - 确保 name、description、telephone、address 等字段都从 settings 获取
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `programmatic` TR-3.1: 检查 index.astro 文件，确保 JSON-LD 数据从 settings 动态读取
  - `programmatic` TR-3.2: 访问网站首页，检查 JSON-LD 数据是否正确显示公司信息
- **Notes**: 这是 high 级别的问题，影响 SEO 效果

## [ ] 任务 4: 改进评论限流机制
- **优先级**: P1
- **Depends On**: None
- **Description**: 
  - 修改 comment.ts 中的限流实现，添加随机 jitter delay 降低并发概率
  - 减少竞态条件的可能性
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `programmatic` TR-4.1: 测试并发提交评论，验证限流机制是否有效
  - `programmatic` TR-4.2: 运行 npm run build，确保构建成功
- **Notes**: 这是 medium 级别的问题，虽然对 B2B 网站日常影响不大，但仍需改进

## [ ] 任务 5: 优化 Google Fonts 加载
- **优先级**: P1
- **Depends On**: None
- **Description**: 
  - 修改 BaseLayout.astro 中的字体加载方式
  - 考虑添加 font-display: swap 或使用本地字体
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `human-judgment` TR-5.1: 加载网站页面，检查字体加载是否阻塞首屏渲染
  - `programmatic` TR-5.2: 运行 npm run build，确保构建成功
- **Notes**: 这是 medium 级别的问题，影响网站性能

## [ ] 任务 6: 更新 CHANGELOG.md
- **优先级**: P2
- **Depends On**: 任务 1, 任务 2, 任务 3, 任务 4, 任务 5
- **Description**: 
  - 在 CHANGELOG.md 中添加本次改进的记录
  - 包含具体的修改内容和时间戳
- **Acceptance Criteria Addressed**: 无
- **Test Requirements**:
  - `human-judgment` TR-6.1: 检查 CHANGELOG.md 是否包含本次改进的记录
- **Notes**: 确保版本变更历史得到及时更新