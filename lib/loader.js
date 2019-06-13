const path = require("path");
const fs = require("fs");

module.exports = function loader(source) {
  this.addContextDependency(path.join(this.rootContext, "node_modules"));

  const packageJson = require(path.join(this.rootContext, "package.json"));

  const dependencies = new Set([
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(packageJson.devDependencies || {}),
  ]);

  const template = [];
  for (const dependencyName of dependencies) {
    const pathToDependencyPackageJson = require.resolve(`${dependencyName}/package.json`, { paths: [this.rootContext] });
    const dependencyPackageJsonContent = fs.readFileSync(pathToDependencyPackageJson, "utf8");

    template.push(`packages["${dependencyName}"] = ${dependencyPackageJsonContent}`);
  }

  source = source.replace(/{{PACKAGES}}/g, template.join("\n"));

  return source;
};
