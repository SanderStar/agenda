const { execSync } = require("child_process");

const defaultPorts = [4004, 8080, 8081, 8082, 8083, 8084, 8085];
const inputPorts = process.argv
  .slice(2)
  .map((value) => Number(value))
  .filter((value) => Number.isInteger(value) && value > 0);
const ports = inputPorts.length ? inputPorts : defaultPorts;

function getPidsForPortWindows(port) {
  try {
    const output = execSync(`netstat -ano -p tcp | findstr :${port}`, { encoding: "utf8" });
    return output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && line.includes("LISTENING"))
      .map((line) => line.split(/\s+/).pop())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function getPidsForPortUnix(port) {
  try {
    const output = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, { encoding: "utf8" });
    return output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function killPidWindows(pid) {
  try {
    execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function killPidUnix(pid) {
  try {
    execSync(`kill -9 ${pid}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const pidSet = new Set();
for (const port of ports) {
  const pids = process.platform === "win32" ? getPidsForPortWindows(port) : getPidsForPortUnix(port);
  for (const pid of pids) {
    if (pid !== String(process.pid)) {
      pidSet.add(pid);
    }
  }
}

if (pidSet.size === 0) {
  console.log(`No running listeners found on ports: ${ports.join(", ")}`);
  process.exit(0);
}

const kill = process.platform === "win32" ? killPidWindows : killPidUnix;
const killed = [];
const failed = [];

for (const pid of pidSet) {
  if (kill(pid)) {
    killed.push(pid);
  } else {
    failed.push(pid);
  }
}

if (killed.length) {
  console.log(`Stopped processes: ${killed.join(", ")}`);
}
if (failed.length) {
  console.log(`Could not stop processes: ${failed.join(", ")}`);
}
