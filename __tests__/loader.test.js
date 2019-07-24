const path = require('path');
const { execSync } = require("child_process");
const fs = require('fs-extra');
const webpack = require('webpack');
const memoryfs = require('memory-fs');

const tempDirPath = path.join(__dirname, '../tmp');

describe("loader", () => {
  afterAll(() => {
    fs.removeSync(tempDirPath);
  });

  it("should inject packages json data and update it when it changes", async () => {
    const tempProjectDirPath = prepareFixtureProject('project1');
    const compiler = getCompiler(tempProjectDirPath);

    const output = await build(compiler);
    expect(output).toMatchSnapshot();

    fs.writeFileSync(
      path.join(tempProjectDirPath, "node_modules", "nanoid", "package.json"),
      '{ "name": "modified" }'
    );

    const output2 = await build(compiler);
    expect(output2).toMatchSnapshot();
  });

  it("should update packages data when package.json changes", async () => {
    const tempProjectDirPath = prepareFixtureProject('project1');
    const compiler = getCompiler(tempProjectDirPath);

    const output = await build(compiler);
    expect(output).toMatchSnapshot();

    fs.writeFileSync(
      path.join(tempProjectDirPath, "package.json"),
      `
            {
              "name": "project1",
              "version": "1.0.0",
              "main": "index.js",
              "license": "MIT",
              "dependencies": {
                "lodash.isarraylike": "^4.2.0"
              }
            }
          `
    );

    const output2 = await build(compiler);
    expect(output2).toMatchSnapshot();
  });

  it("should not re-read the packages data if nothing changed", async () => {
    const tempProjectDirPath = prepareFixtureProject('project1');
    const compiler = getCompiler(tempProjectDirPath);

    const output = await build(compiler);
    expect(output).toMatchSnapshot();

    const output2 = await build(compiler);
    expect(output2).toMatchSnapshot();
  });
});

function prepareFixtureProject(projectName) {
  const tempProjectDirPath = path.join(tempDirPath, projectName);
  const projectPath = path.join(__dirname, '../__fixtures__', projectName);

  fs.emptyDirSync(tempDirPath);
  fs.copySync(projectPath, tempProjectDirPath);
  execSync("yarn", { cwd: tempProjectDirPath });

  return tempProjectDirPath;
}

function getCompiler(projectDirPath) {
  const compiler = webpack({
    context: projectDirPath,
    cache: false,
    entry: "./index.js",
    output: {
      path: "/",
      filename: 'bundle.js',
    },
    optimization: {
      minimize: false,
    },
    module: {
      rules: [{
        test: /module\.js$/,
        use: {
          loader: '../../lib/loader.js',
        }
      }]
    }
  });

  compiler.outputFileSystem = new memoryfs();

  return compiler;
}

function build(compiler) {
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) return reject(err);
      if (stats.hasErrors()) return reject(new Error(stats.toJson().errors));

      const output = compiler.outputFileSystem.readFileSync('/bundle.js', 'utf8');
      resolve(output)
    });
  });
}
