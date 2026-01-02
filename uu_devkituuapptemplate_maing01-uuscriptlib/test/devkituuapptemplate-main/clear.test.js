const { TestHelper } = require("uu_script_devkitg01");

describe("DevKitUuAppTemplateMainClear", () => {
  test("HDS", async () => {
    const session = await TestHelper.login();

    const dtoIn = {};

    const result = await TestHelper.runScript("devkituuapptemplate-main/clear.js", dtoIn, session);
    expect(result.isError).toEqual(false);
  });
});
