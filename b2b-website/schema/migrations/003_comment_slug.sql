-- Migration 003: 评论表添加 news_slug 列
-- 统一评论关联方式：从 news_id (INTEGER) 改为 news_slug (TEXT)
-- 与 Content Collection 的 slug 对齐，消除双数据源一致性问题

-- 添加 news_slug 列
ALTER TABLE comments ADD COLUMN news_slug TEXT;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_comments_news_slug ON comments(news_slug);

-- 数据迁移：从现有 news_id 关联查出 slug 填入 news_slug
-- 注意：如果 news 表中无对应记录，news_slug 将为 NULL
UPDATE comments
SET news_slug = (
  SELECT slug FROM news WHERE news.id = comments.news_id
)
WHERE news_id IS NOT NULL;

-- 注意：保留 news_id 列作为向后兼容
-- 后续版本确认 news_slug 工作正常后可移除 news_id
