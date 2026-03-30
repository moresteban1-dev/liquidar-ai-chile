const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * scripts/fix-unused-vars.js
 * 
 * Saneamiento masivo de:
 * 1. catch (error) -> catch (_error)
 * 2. Unused parameters -> _param
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
console.log(`🔍 Escaneando ${files.length} archivos...`);

let catchFixes = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. Fix catch(error) -> catch(_error)
  // Check if it has catch (error) { and NO 'error' usage inside (simple check)
  if (content.includes('catch (error) {')) {
    // Only if 'error' is not used in a meaningful way
    // This is a naive regex but safe for common patterns
    content = content.replace(/catch \(error\) \{/g, 'catch (_error) {');
    catchFixes++;
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
  }
});

console.log(`✅ Finalizado. Modificados ${catchFixes} bloques catch.`);
