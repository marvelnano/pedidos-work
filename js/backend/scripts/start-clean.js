const cp = require('child_process');

function getPidsByPort(port) {
  try {
    const output = cp.execSync(`netstat -ano -p tcp | findstr :${port}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
    const lines = output.split(/\r?\n/).filter(Boolean);
    const pids = {};
    lines.forEach((line) => {
      const text = line.trim().replace(/\s+/g, ' ');
      const parts = text.split(' ');
      const state = (parts[3] || '').toUpperCase();
      const pid = parts[4];
      if ((state === 'LISTENING' || state === 'ESCUCHANDO') && pid) pids[pid] = true;
    });
    return Object.keys(pids);
  } catch (_err) {
    return [];
  }
}

function killPid(pid) {
  try {
    cp.execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
    return true;
  } catch (_err) {
    return false;
  }
}

const port = process.env.PORT || 3001;
const pids = getPidsByPort(port);

if (pids.length) {
  console.log(`Liberando puerto ${port}. PID(s): ${pids.join(', ')}`);
  pids.forEach((pid) => killPid(pid));
}

require('../server');
