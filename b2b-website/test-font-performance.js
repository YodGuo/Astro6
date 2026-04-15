// 测试 Google Fonts 加载优化的性能效果
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { execSync } from 'child_process';

async function runLighthouseTest(url) {
  // 启动 Chrome
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  
  // 配置 Lighthouse
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance'],
    port: chrome.port,
  };
  
  // 运行 Lighthouse
  console.log(`Running Lighthouse on ${url}...`);
  const result = await lighthouse(url, options);
  
  // 关闭 Chrome
  await chrome.kill();
  
  return result;
}

// 分析性能结果
function analyzeResults(result) {
  const performance = result.lhr.categories.performance;
  const metrics = result.lhr.audits;
  
  console.log('====================================');
  console.log(`Performance Score: ${Math.round(performance.score * 100)}`);
  console.log('====================================');
  
  // 与字体加载相关的指标
  const fontMetrics = {
    'First Contentful Paint': metrics['first-contentful-paint']?.displayValue || 'N/A',
    'Largest Contentful Paint': metrics['largest-contentful-paint']?.displayValue || 'N/A',
    'Time to First Byte': metrics['time-to-first-byte']?.displayValue || 'N/A',
    'Total Blocking Time': metrics['total-blocking-time']?.displayValue || 'N/A',
    'Cumulative Layout Shift': metrics['cumulative-layout-shift']?.displayValue || 'N/A',
    'Font Display': metrics['font-display']?.displayValue || 'N/A',
  };
  
  console.log('Font-related metrics:');
  for (const [name, value] of Object.entries(fontMetrics)) {
    console.log(`${name}: ${value}`);
  }
  
  // 检查字体加载情况
  if (metrics['font-display']) {
    console.log('\nFont Display Analysis:');
    console.log(metrics['font-display'].description);
    if (metrics['font-display'].details) {
      console.log('Fonts found:');
      metrics['font-display'].details.items.forEach(item => {
        console.log(`- ${item.url}`);
      });
    }
  }
  
  return fontMetrics;
}

// 主函数
async function main() {
  try {
    // 启动本地服务器
    console.log('Starting development server...');
    const serverProcess = execSync('npm run dev', { 
      detached: true,
      stdio: 'ignore'
    });
    
    // 等待服务器启动
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 运行 Lighthouse 测试
    const result = await runLighthouseTest('http://localhost:4321');
    
    // 分析结果
    const metrics = analyzeResults(result);
    
    // 停止服务器
    execSync('pkill -f "npm run dev"');
    
    console.log('\n====================================');
    console.log('Test completed successfully!');
    console.log('====================================');
    
    return metrics;
  } catch (error) {
    console.error('Error running performance test:', error);
    // 尝试停止服务器
    try {
      const { execSync } = require('child_process');
      execSync('pkill -f "npm run dev"');
    } catch (e) {
      // 忽略错误
    }
    throw error;
  }
}

// 运行测试
main().catch(console.error);
