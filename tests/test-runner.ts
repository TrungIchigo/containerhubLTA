import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface TestResult {
  testCase: string;
  status: 'PASS' | 'FAIL' | 'SKIP' | 'WARNING';
  duration: number;
  error?: string;
  category: string;
}

interface TestSummary {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  warnings: number;
  duration: number;
  categories: Record<string, { passed: number; failed: number; total: number }>;
}

class CODTestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;

  async runAllTests(): Promise<TestSummary> {
    console.log('🚀 Starting COD Module Automated Testing...\n');
    this.startTime = Date.now();

    try {
      // Run Playwright tests
      console.log('📋 Running Core Functional Tests...');
      await this.runTestSuite('cod-core-functional.spec.ts', 'Core Functional');

      console.log('⚡ Running Technical & Edge Cases...');
      await this.runTestSuite('cod-technical-edge-cases.spec.ts', 'Technical/Edge Cases');

      console.log('🔒 Running Security Tests...');
      await this.runTestSuite('cod-security.spec.ts', 'Security');

      // Generate summary
      const summary = this.generateSummary();
      
      // Generate reports
      await this.generateHTMLReport(summary);
      await this.generateJSONReport(summary);
      
      console.log('\n📊 Test Execution Complete!');
      this.printSummary(summary);
      
      return summary;

    } catch (error) {
      console.error('❌ Test execution failed:', error);
      throw error;
    }
  }

  private async runTestSuite(testFile: string, category: string): Promise<void> {
    try {
      const command = `npx playwright test tests/${testFile} --reporter=json`;
      const output = execSync(command, { 
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 300000 // 5 minutes timeout
      });

      // Parse Playwright JSON output
      const results = JSON.parse(output);
      this.parsePlaywrightResults(results, category);

    } catch (error: any) {
      console.error(`❌ Failed to run ${testFile}:`, error.message);
      
      // Add failed test results
      this.results.push({
        testCase: `${category} - Suite Failed`,
        status: 'FAIL',
        duration: 0,
        error: error.message,
        category
      });
    }
  }

  private parsePlaywrightResults(results: any, category: string): void {
    if (results.suites) {
      results.suites.forEach((suite: any) => {
        suite.specs?.forEach((spec: any) => {
          spec.tests?.forEach((test: any) => {
            const testResult: TestResult = {
              testCase: test.title,
              status: this.mapPlaywrightStatus(test.outcome),
              duration: test.results?.[0]?.duration || 0,
              error: test.results?.[0]?.error?.message,
              category
            };
            
            this.results.push(testResult);
          });
        });
      });
    }
  }

  private mapPlaywrightStatus(outcome: string): 'PASS' | 'FAIL' | 'SKIP' | 'WARNING' {
    switch (outcome) {
      case 'expected': return 'PASS';
      case 'unexpected': return 'FAIL';
      case 'skipped': return 'SKIP';
      case 'flaky': return 'WARNING';
      default: return 'FAIL';
    }
  }

  private generateSummary(): TestSummary {
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    const summary: TestSummary = {
      totalTests: this.results.length,
      passed: this.results.filter(r => r.status === 'PASS').length,
      failed: this.results.filter(r => r.status === 'FAIL').length,
      skipped: this.results.filter(r => r.status === 'SKIP').length,
      warnings: this.results.filter(r => r.status === 'WARNING').length,
      duration,
      categories: {}
    };

    // Group by category
    this.results.forEach(result => {
      if (!summary.categories[result.category]) {
        summary.categories[result.category] = { passed: 0, failed: 0, total: 0 };
      }
      
      summary.categories[result.category].total++;
      if (result.status === 'PASS') {
        summary.categories[result.category].passed++;
      } else if (result.status === 'FAIL') {
        summary.categories[result.category].failed++;
      }
    });

    return summary;
  }

  private async generateHTMLReport(summary: TestSummary): Promise<void> {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>COD Module Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric.pass { border-left: 4px solid #4CAF50; }
        .metric.fail { border-left: 4px solid #f44336; }
        .metric.warning { border-left: 4px solid #ff9800; }
        .metric.skip { border-left: 4px solid #9e9e9e; }
        .test-results { margin-top: 30px; }
        .test-item { padding: 10px; margin: 5px 0; border-radius: 4px; }
        .test-item.PASS { background: #e8f5e8; }
        .test-item.FAIL { background: #ffeaea; }
        .test-item.WARNING { background: #fff3e0; }
        .test-item.SKIP { background: #f5f5f5; }
        .category { font-weight: bold; color: #666; }
        .error { color: #d32f2f; font-size: 0.9em; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 COD Module Test Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Duration: ${(summary.duration / 1000).toFixed(2)}s</p>
    </div>

    <div class="summary">
        <div class="metric pass">
            <h3>✅ Passed</h3>
            <div style="font-size: 2em; font-weight: bold;">${summary.passed}</div>
        </div>
        <div class="metric fail">
            <h3>❌ Failed</h3>
            <div style="font-size: 2em; font-weight: bold;">${summary.failed}</div>
        </div>
        <div class="metric warning">
            <h3>⚠️ Warnings</h3>
            <div style="font-size: 2em; font-weight: bold;">${summary.warnings}</div>
        </div>
        <div class="metric skip">
            <h3>⏭️ Skipped</h3>
            <div style="font-size: 2em; font-weight: bold;">${summary.skipped}</div>
        </div>
    </div>

    <h2>📊 Results by Category</h2>
    ${Object.entries(summary.categories).map(([category, stats]) => `
        <div class="metric">
            <h4>${category}</h4>
            <p>✅ ${stats.passed} / ❌ ${stats.failed} / 📝 ${stats.total} total</p>
            <div style="background: #f0f0f0; height: 10px; border-radius: 5px;">
                <div style="background: #4CAF50; height: 100%; width: ${(stats.passed / stats.total) * 100}%; border-radius: 5px;"></div>
            </div>
        </div>
    `).join('')}

    <div class="test-results">
        <h2>📋 Detailed Test Results</h2>
        ${this.results.map(result => `
            <div class="test-item ${result.status}">
                <div class="category">[${result.category}]</div>
                <strong>${result.testCase}</strong>
                <span style="float: right;">${result.status} (${result.duration}ms)</span>
                ${result.error ? `<div class="error">Error: ${result.error}</div>` : ''}
            </div>
        `).join('')}
    </div>

    <div style="margin-top: 40px; padding: 20px; background: #f9f9f9; border-radius: 8px;">
        <h3>🎯 Acceptance Criteria Status</h3>
        <ul>
            <li>✅ Core Functional Tests: ${summary.categories['Core Functional']?.passed || 0}/${summary.categories['Core Functional']?.total || 0} (${((summary.categories['Core Functional']?.passed || 0) / (summary.categories['Core Functional']?.total || 1) * 100).toFixed(1)}%)</li>
            <li>🔒 Security Tests: ${summary.categories['Security']?.passed || 0}/${summary.categories['Security']?.total || 0} (${((summary.categories['Security']?.passed || 0) / (summary.categories['Security']?.total || 1) * 100).toFixed(1)}%)</li>
            <li>⚡ Technical Tests: ${summary.categories['Technical/Edge Cases']?.passed || 0}/${summary.categories['Technical/Edge Cases']?.total || 0} (${((summary.categories['Technical/Edge Cases']?.passed || 0) / (summary.categories['Technical/Edge Cases']?.total || 1) * 100).toFixed(1)}%)</li>
        </ul>
        
        <div style="margin-top: 20px; padding: 15px; ${this.getAcceptanceStatus(summary) === 'READY' ? 'background: #e8f5e8; border: 2px solid #4CAF50;' : 'background: #ffeaea; border: 2px solid #f44336;'}">
            <h4>${this.getAcceptanceStatus(summary) === 'READY' ? '🎉 READY FOR PRODUCTION' : '⚠️ NOT READY FOR PRODUCTION'}</h4>
            <p>${this.getAcceptanceMessage(summary)}</p>
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync('test-results/cod-test-report.html', html);
    console.log('📄 HTML report generated: test-results/cod-test-report.html');
  }

  private async generateJSONReport(summary: TestSummary): Promise<void> {
    const report = {
      summary,
      results: this.results,
      timestamp: new Date().toISOString(),
      acceptanceStatus: this.getAcceptanceStatus(summary)
    };

    if (!fs.existsSync('test-results')) {
      fs.mkdirSync('test-results', { recursive: true });
    }

    fs.writeFileSync('test-results/cod-test-results.json', JSON.stringify(report, null, 2));
    console.log('📄 JSON report generated: test-results/cod-test-results.json');
  }

  private getAcceptanceStatus(summary: TestSummary): 'READY' | 'NOT_READY' {
    const corePassRate = (summary.categories['Core Functional']?.passed || 0) / (summary.categories['Core Functional']?.total || 1);
    const securityPassRate = (summary.categories['Security']?.passed || 0) / (summary.categories['Security']?.total || 1);
    const technicalPassRate = (summary.categories['Technical/Edge Cases']?.passed || 0) / (summary.categories['Technical/Edge Cases']?.total || 1);

    // Acceptance criteria from test cases document
    if (corePassRate >= 1.0 && securityPassRate >= 1.0 && technicalPassRate >= 0.8) {
      return 'READY';
    }
    return 'NOT_READY';
  }

  private getAcceptanceMessage(summary: TestSummary): string {
    const status = this.getAcceptanceStatus(summary);
    if (status === 'READY') {
      return 'All critical tests passed. Module meets acceptance criteria for production deployment.';
    } else {
      return 'Some critical tests failed. Please review and fix issues before production deployment.';
    }
  }

  private printSummary(summary: TestSummary): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 COD MODULE TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`📝 Total Tests: ${summary.totalTests}`);
    console.log(`✅ Passed: ${summary.passed}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`⚠️ Warnings: ${summary.warnings}`);
    console.log(`⏭️ Skipped: ${summary.skipped}`);
    console.log(`⏱️ Duration: ${(summary.duration / 1000).toFixed(2)}s`);
    console.log('\n📋 By Category:');
    
    Object.entries(summary.categories).forEach(([category, stats]) => {
      const passRate = ((stats.passed / stats.total) * 100).toFixed(1);
      console.log(`  ${category}: ${stats.passed}/${stats.total} (${passRate}%)`);
    });

    console.log('\n🎯 Acceptance Status:');
    console.log(`   ${this.getAcceptanceStatus(summary) === 'READY' ? '🎉 READY FOR PRODUCTION' : '⚠️ NOT READY FOR PRODUCTION'}`);
    console.log(`   ${this.getAcceptanceMessage(summary)}`);
    console.log('='.repeat(60));
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new CODTestRunner();
  runner.runAllTests()
    .then(summary => {
      process.exit(summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { CODTestRunner }; 