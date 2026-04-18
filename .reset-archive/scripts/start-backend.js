const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, '..', 'backend', 'server.py');
const proc = spawn('/usr/bin/python3', [serverPath], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  env: { ...process.env }
});

proc.on('error', (err) => {
  console.error('Failed to start backend:', err.message);
  process.exit(1);
});

proc.on('exit', (code) => {
  process.exit(code || 0);
});
