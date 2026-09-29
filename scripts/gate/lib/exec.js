const { spawnSync } = require('child_process');

function run(command, args, opts = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    ...opts,
  });
  return { code: result.status ?? 1, error: result.error };
}

module.exports = { run };
