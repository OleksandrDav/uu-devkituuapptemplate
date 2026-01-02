const { TestHelper } = require("uu_script_devkitg01");

describe("DevKitUuAppTemplateMainInitRollback", () => {
  test("HDS", async () => {
    const session = await TestHelper.login();

    const dtoIn = {};

    const result = await TestHelper.runScript("devkituuapptemplate-main/init-rollback.js", dtoIn, session);
    expect(result.isError).toEqual(false);
  });
});
