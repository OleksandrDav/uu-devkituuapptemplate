// npm run uu5DocUpdateExamples
// prettier-ignore
module.exports = {
  BOOK_AWID: null, // null <=> try to read it from uuapp.json (docUri); otherwise it can be e.g. "12345678901234567890123456789012"
  INCLUDE_NAMESPACE: true, // example code is with/without library namespace e.g. "exampleUu5BricksMyComponent00" vs. "exampleMyComponent00"
  COMPONENTS: [
    // e.g. "MyComponent" - expects examples at demo/my-component/e00.html, e01.html, ...
    // e.g. "Workspace.MyComponent" - expects examples at demo/workspace/my-component/e00.html, e01.html, ...
  ],
};