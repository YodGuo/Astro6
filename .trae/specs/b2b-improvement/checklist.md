# B2B 网站改进计划 - 验证检查清单

- [ ] 检查点 1: 数据库迁移脚本是否包含 003_comment_slug.sql
- [ ] 检查点 2: admin/index.astro 文件是否无裸 locals 调用
- [ ] 检查点 3: index.astro 中的 JSON-LD 数据是否从 settings 动态读取
- [ ] 检查点 4: comment.ts 中的限流机制是否添加了随机 jitter delay
- [ ] 检查点 5: BaseLayout.astro 中的 Google Fonts 加载是否优化
- [ ] 检查点 6: 运行 npm run build 是否成功
- [ ] 检查点 7: 运行 npm run db:migrate 是否成功
- [ ] 检查点 8: 访问网站首页是否正常显示
- [ ] 检查点 9: 检查 CHANGELOG.md 是否更新
- [ ] 检查点 10: 验证评论功能是否正常工作