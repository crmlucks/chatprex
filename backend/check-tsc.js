const { execSync } = require('child_process');
const fs = require('fs');

try {
  const output = execSync('npx tsc', { cwd: 'c:\\Chatprex\\backend', encoding: 'utf-8' });
  fs.writeFileSync('c:\\Chatprex\\backend\\tsc-output.txt', 'SUCCESS\n' + output);
} catch (error) {
  fs.writeFileSync('c:\\Chatprex\\backend\\tsc-output.txt', 'ERROR\n' + error.stdout + '\n' + error.stderr);
}
