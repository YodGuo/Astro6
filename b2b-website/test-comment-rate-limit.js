// 测试评论限流机制的并发请求脚本
import fetch from 'node-fetch';

// 测试配置
const RATE_LIMIT_MAX = 3; // 每窗口最多 3 条评论
const CONCURRENT_REQUESTS = 5; // 并发请求数
const TEST_NEWS_SLUG = 'welcome-to-new-site';

// 模拟评论数据
const commentData = {
  newsSlug: TEST_NEWS_SLUG,
  authorName: 'Test User',
  authorEmail: 'test@example.com',
  content: 'This is a test comment for rate limiting',
  website: '',
  cfTurnstileToken: 'test-token' // 模拟 Turnstile token
};

// 模拟请求函数
async function submitComment() {
  try {
    const response = await fetch('http://localhost:4321/_actions/comment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(commentData)
    });
    
    const result = await response.json();
    console.log(`Response status: ${response.status}, Result:`, result);
    return { status: response.status, result };
  } catch (error) {
    console.error('Error submitting comment:', error);
    return { status: 500, error: error.message };
  }
}

// 运行并发测试
async function runConcurrentTest() {
  console.log(`Running ${CONCURRENT_REQUESTS} concurrent comment requests...`);
  console.log(`Rate limit: ${RATE_LIMIT_MAX} comments per minute`);
  console.log('====================================');
  
  const start = Date.now();
  
  // 并发发送请求
  const promises = [];
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    promises.push(submitComment());
  }
  
  const results = await Promise.all(promises);
  
  const end = Date.now();
  console.log('====================================');
  console.log(`Test completed in ${end - start}ms`);
  
  // 分析结果
  const successCount = results.filter(r => r.status === 200).length;
  const errorCount = results.filter(r => r.status !== 200).length;
  
  console.log(`Success: ${successCount}, Error: ${errorCount}`);
  
  // 检查是否有超过速率限制的情况
  const rateLimitErrors = results.filter(r => 
    r.result && r.result.error && r.result.error.message.includes('评论过于频繁')
  ).length;
  
  console.log(`Rate limit errors: ${rateLimitErrors}`);
  
  if (rateLimitErrors > 0) {
    console.log('✓ Rate limiting is working correctly');
  } else {
    console.log('⚠ Rate limiting may not be working correctly');
  }
}

// 启动测试
runConcurrentTest();
