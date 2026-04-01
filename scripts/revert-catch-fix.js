const fs = require('fs');
const path = require('path');

/**
 * scripts/revert-catch-fix.js
 * 
 * Invierte el cambio: catch (_error) { -> catch (error) {
 */

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
      }
    } else {
      if (file.endsWith(".ts") || file.endsWith(".tsx")) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles('./src');
console.log(`🔍 Revirtiendo cambios en ${files.length} archivos...`);

let reversions = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  if (content.includes('catch (_error) {')) {
    content = content.replace(/catch \(_error\) \{/g, 'catch (error) {');
    reversions++;
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
  }
});

console.log(`✅ Finalizado. Revertidos ${reversions} bloques catch.`);
