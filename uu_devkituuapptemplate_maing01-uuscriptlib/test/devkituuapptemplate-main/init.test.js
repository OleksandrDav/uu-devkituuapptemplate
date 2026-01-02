const { TestHelper } = require("uu_script_devkitg01");

describe("DevKitUuAppTemplateMainInit", () => {
  test("HDS", async () => {
    const session = await TestHelper.login();

    const dtoIn = {};

    const result = await TestHelper.runScript("devkituuapptemplate-main/init.js", dtoIn, session);
    expect(result.isError).toEqual(false);
  });
});
