const { console, session } = scriptContext;

async function main() {
  const identity = session.getIdentity();
  const userName = identity.getName();

  console.info(`Hello ${userName}`);

  return {
    message: "Hello",
    user: userName,
    uuAppErrorMap: {},
  };
}

main();
