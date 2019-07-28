const packageJson = require('../package.json');

const packageInfo = {
  packageJson,
  sourceModules: {},
  dependencies: {},
}

const ctx = require.context("../code", true, /\.(t|j)s(x?)|\.css$/)

ctx.keys().forEach(key => {
  packageInfo.sourceModules[key] = () => ctx(key)
})

const packages = {};

{{PACKAGES}}

module.exports = {
  packageJson,
  packages,
  packageInfo,
};
