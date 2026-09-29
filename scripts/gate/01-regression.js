const { run } = require('./lib/exec');

module.exports = async function fullRegressionSuite() {
  const server = run('npm', ['run', 'test', '-w', 'server']);
  if (server.code !== 0) {
    return { passed: false, summary: 'server unit/integration test suite failed' };
  }

  const e2e = run('npx', ['playwright', 'test']);
  if (e2e.code !== 0) {
    return { passed: false, summary: 'playwright e2e suite failed' };
  }

  return {
    passed: true,
    summary: 'server unit/integration tests and the playwright e2e suite all passed',
  };
};
