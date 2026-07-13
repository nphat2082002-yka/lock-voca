const fs = require('fs');
const path = require('path');

const outputDir = path.resolve(__dirname, '..', 'web-build');
const indexPath = path.join(outputDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error(`Cannot find generated file: ${indexPath}`);
  process.exit(1);
}

let content = fs.readFileSync(indexPath, 'utf8');
const original = content;

content = content.replace(/(src|href)="\/(?!\/)/g, '$1="./');
content = content.replace(/(src|href)="\.\/\/_expo\//g, '$1="./_expo/');

if (content !== original) {
  fs.writeFileSync(indexPath, content, 'utf8');
  console.log('Updated web-build/index.html to use relative asset paths for GitHub Pages.');
} else {
  console.log('No path updates were needed in web-build/index.html.');
}

const noJekyllPath = path.join(outputDir, '.nojekyll');
fs.writeFileSync(noJekyllPath, '', 'utf8');
console.log('Created web-build/.nojekyll for GitHub Pages.');
