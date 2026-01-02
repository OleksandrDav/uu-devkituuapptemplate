const { TestHelper } = require("uu_script_devkitg01");

describe("DevKitUuAppTemplateMainSetStateClosed", () => {
  test("HDS", async () => {
    const session = await TestHelper.login();

    const dtoIn = {};

    const result = await TestHelper.runScript("devkituuapptemplate-main/set-state-closed.js", dtoIn, session);
    expect(result.isError).toEqual(false);
  });
});
