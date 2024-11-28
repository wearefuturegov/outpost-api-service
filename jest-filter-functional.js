/**
 * mongodb-memory-server doesn't run in alpine linux, right now its not worth
 * updating the architecture so we're splitting our tests into unit and functional
 *
 * We will test unit and functional outside of docker and we will only run unit tests in docker
 *
 * unit: runs on alpine linux
 * functional: doesn't run on alpine linux
 *
 * @param {*} testPaths
 * @returns
 */
const path = require("path")

const filteringFunction = testPath => {
  return testPath.includes(path.join("__tests__", "functional"))
}

module.exports = testPaths => {
  const allowedPaths = testPaths
    .filter(filteringFunction)
    .map(test => ({ test })) // [{ test: "path1.spec.js" }, { test: "path2.spec.js" }, etc]

  return {
    filtered: allowedPaths,
  }
}
