const { AsyncLocalStorage } = require("async_hooks");
const storage = new AsyncLocalStorage();

function run(context, callback) {
  return storage.run(context, callback);
}

function getContext() {
  return storage.getStore() || {};
}

module.exports = { run, getContext };