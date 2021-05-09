import programParser from "../src/";
import * as globby from "globby";
import * as path from "path";
import * as fs from "fs-extra";
import "jest-specific-snapshot";

// expect.extend({
//   toMatchSpecificSnapshot: (received, actual) => {
//     return toMatchSpecificSnapshot()
//   }
// })

const testCases = globby
  .sync(["./**/**/*.ts", "!runner.spec.ts"], { cwd: __dirname })
  .map((file) => file.split("/"))
  .map(([description, testCase, file]) => ({
    description,
    testCase,
    file,
    filePath: path.resolve([__dirname, description, testCase, file].join("/")),
    snapshotFile: path.resolve(
      [__dirname, description, testCase, file.replace(/\.(\w)+$/, ".snapshot")].join(
        "/"
      )
    ),
  }));

testCases.map(({ description, testCase, filePath, snapshotFile }) => {
  describe(description, () => {
    describe(testCase, () => {
      it("should match snapshot", () => {
        const result = programParser(filePath);
        expect(programParser(filePath)).toMatchSpecificSnapshot(snapshotFile);
      });
    });
  });
});
