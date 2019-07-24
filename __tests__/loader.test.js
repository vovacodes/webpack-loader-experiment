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

  it("should inject packages json data and update it when it changes", (done) => {
    const tempProjectDirPath = prepareFixtureProject('project1');
    const compiler = getCompiler(tempProjectDirPath);
    let buildCount = 0;

    const watching = compiler.watch({ aggregateTimeout: 0 }, (err, stats) => {
      if (err) return done(err);
      if (stats.hasErrors()) return done(new Error(stats.toJson().errors));

      buildCount++;
      const output = stats.toJson().modules[0].source;

      expect(output).toMatchSnapshot();

      if (buildCount === 1) {
        fs.writeFileSync(
          path.join(tempProjectDirPath, "node_modules", "nanoid", "package.json"),
          '{ "name": "modified" }'
        );
      }

      if (buildCount === 2) {
        watching.close(() => {
          done();
        });
      }
    });
  });

  it("should update packages data when package.json changes", (done) => {
    const tempProjectDirPath = prepareFixtureProject('project1');
    const compiler = getCompiler(tempProjectDirPath);
    let buildCount = 0;

    const watching = compiler.watch({ aggregateTimeout: 0 }, (err, stats) => {
      if (err) return done(err);
      if (stats.hasErrors()) return done(new Error(stats.toJson().errors));

      buildCount++;
      const output = stats.toJson().modules[0].source;

      expect(output).toMatchSnapshot();

      if (buildCount === 1) {
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
      }

      if (buildCount === 2) {
        watching.close(() => {
          done();
        });
      }
    });
  });

  it("should not re-read the packages data if nothing changed", (done) => {
    const tempProjectDirPath = prepareFixtureProject('project1');
    const compiler = getCompiler(tempProjectDirPath);
    let buildCount = 0;

    const watching = compiler.watch({ aggregateTimeout: 0 }, (err, stats) => {
      if (err) return done(err);
      if (stats.hasErrors()) return done(new Error(stats.toJson().errors));

      buildCount++;
      const output = stats.toJson().modules[0].source;

      expect(output).toMatchSnapshot();

      if (buildCount === 1) {
        watching.invalidate()
      }

      if (buildCount === 2) {
        watching.close(() => {
          done();
        });
      }
    });
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
    entry: "../../__fixtures__/module.js",
    output: {
      path: "/",
      filename: 'bundle.js',
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
