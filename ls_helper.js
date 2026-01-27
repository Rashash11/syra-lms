const fs = require('fs');
const path = require('path');

function listFiles(dir) {
    const files = fs.readdirSync(dir);
    console.log(`Directory: ${dir}`);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
            console.log(`[DIR]  ${file}`);
        } else {
            console.log(`[FILE] ${file}`);
        }
    });
}

const target = process.argv[2] || '.';
listFiles(target);
