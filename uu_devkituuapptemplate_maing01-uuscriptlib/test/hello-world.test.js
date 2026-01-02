const { TestHelper } = require("uu_script_devkitg01");

const SCRIPT_NAME = "hello-world.js";
describe("create", () => {
  test("HDS", async () => {
    const session = await TestHelper.login("Reader");

    const dtoIn = {};

    const result = await TestHelper.runScript(SCRIPT_NAME, dtoIn, session);
    expect(result.isError).toEqual(false); // no error was logged
    expect(result.scriptResult.dtoIn).toBeDefined();
    expect(result.scriptResult.uuAppErrorMap).toEqual({});
  });
});
