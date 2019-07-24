const path = require("path");
const fs = require("fs");

module.exports = function loader(source) {
  const packageJsonPath = path.join(this.rootContext, "package.json");

  this.addDependency(packageJsonPath);
  this.addContextDependency(path.join(this.rootContext, "node_modules"));

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

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
