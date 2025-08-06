#!/usr/bin/env node

/**
 * Script để tự động thay thế các loading spinner cũ bằng LTA Loading
 * Chạy: node scripts/replace-loading.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Các pattern cần thay thế
const replacements = [
  {
    pattern: /import\s*{\s*Loader2\s*}\s*from\s*['"]lucide-react['"]/g,
    replacement: '// Loader2 removed - use LtaLoadingCompact instead'
  },
  {
    pattern: /<Loader2\s+className="[^"]*animate-spin[^"]*"\s*\/?>/g,
    replacement: '<div className="mr-2 w-4 h-4"><LtaLoadingCompact /></div>'
  },
  {
    pattern: /<Loader2\s+className="[^"]*"[^>]*\/?>/g,
    replacement: '<div className="mr-2 w-4 h-4"><LtaLoadingCompact /></div>'
  },
  {
    pattern: /import\s*{\s*Loading\s*}\s*from\s*['"]@\/components\/ui\/loader['"]/g,
    replacement: 'import { LtaLoadingInline } from \'@/components/ui/ltaloading\''
  },
  {
    pattern: /<Loading\s+text="([^"]*)"\s+size="([^"]*)"\s*\/?>/g,
    replacement: '<LtaLoadingInline text="$1" />'
  },
  {
    pattern: /<Loading\s+text="([^"]*)"\s*\/?>/g,
    replacement: '<LtaLoadingInline text="$1" />'
  },
  {
    pattern: /<div\s+className="[^"]*animate-spin[^"]*"[^>]*><\/div>/g,
    replacement: '<LtaLoadingCompact />'
  }
];

// Tìm tất cả file TypeScript/TSX
const files = glob.sync('src/**/*.{ts,tsx}', {
  ignore: [
    'src/components/ui/ltaloading.tsx',
    'src/components/ui/ltalogo.tsx',
    'src/app/test-loading/**',
    'node_modules/**'
  ]
});

let totalReplacements = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let fileChanged = false;
  
  replacements.forEach(({ pattern, replacement }) => {
    const matches = content.match(pattern);
    if (matches) {
      content = content.replace(pattern, replacement);
      fileChanged = true;
      totalReplacements += matches.length;
      console.log(`✅ ${file}: Replaced ${matches.length} occurrences`);
    }
  });
  
  if (fileChanged) {
    // Thêm import nếu cần
    if (content.includes('LtaLoadingCompact') && !content.includes('import { LtaLoadingCompact }')) {
      const importStatement = 'import { LtaLoadingCompact } from \'@/components/ui/ltaloading\'';
      const lastImportIndex = content.lastIndexOf('import');
      const insertIndex = content.indexOf('\n', lastImportIndex) + 1;
      content = content.slice(0, insertIndex) + importStatement + '\n' + content.slice(insertIndex);
      console.log(`📦 ${file}: Added import statement`);
    }
    
    if (content.includes('LtaLoadingInline') && !content.includes('import { LtaLoadingInline }')) {
      const importStatement = 'import { LtaLoadingInline } from \'@/components/ui/ltaloading\'';
      const lastImportIndex = content.lastIndexOf('import');
      const insertIndex = content.indexOf('\n', lastImportIndex) + 1;
      content = content.slice(0, insertIndex) + importStatement + '\n' + content.slice(insertIndex);
      console.log(`📦 ${file}: Added import statement`);
    }
    
    fs.writeFileSync(file, content, 'utf8');
  }
});

console.log(`\n🎉 Hoàn thành! Đã thay thế ${totalReplacements} loading spinner.`);
console.log('📝 Hãy kiểm tra lại các file đã được thay đổi và test để đảm bảo hoạt động đúng.'); 