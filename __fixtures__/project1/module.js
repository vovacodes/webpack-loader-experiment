const packageJson = require('./package.json');
const packages = {};

{{PACKAGES}}

module.exports = {
  packageJson,
  packages
};
