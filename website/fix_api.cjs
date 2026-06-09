const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function getImportStatement(filePath) {
  // Determine relative path to src/config/api
  const dir = path.dirname(filePath);
  let relativePath = path.relative(dir, path.join(srcDir, 'config', 'api'));
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }
  relativePath = relativePath.replace(/\\/g, '/'); // normalize for imports
  return `import { API_URL } from '${relativePath}';\n`;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // If it contains the hardcoded url
      if (content.includes('http://localhost:5000/api')) {
        // 1. Replace the URLs
        // Note: some fetches use backticks: `http://localhost:5000/api/wishlist/${variantId}`
        // some use single quotes: 'http://localhost:5000/api/wishlist'
        
        // Replace single quotes with template literal equivalent if it's a direct string
        content = content.replace(/'http:\/\/localhost:5000\/api([^']*)'/g, '`${API_URL}$1`');
        // Replace inside existing template literals
        content = content.replace(/http:\/\/localhost:5000\/api/g, '${API_URL}');
        
        // 2. Add the import statement if not already there
        if (!content.includes('import { API_URL }')) {
            const importStatement = getImportStatement(fullPath);
            content = importStatement + content;
        }

        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log('All API URLs have been successfully refactored.');
