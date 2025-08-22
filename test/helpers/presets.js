/**
 * @fileoverview Graph data structure representing file dependencies and their relationships.
 * Provides a clear mapping of source files to their dependencies for analysis and visualization.
 *
 * @type {object} Entry
 * @param {string} Graph.entry - Map of file paths to node objects
 * @param {string} Graph.test - Map of source file paths to sets of target file paths
 */

export const suites /** @type {Entry} */ = {
  "src/services/consumer.js": "test/suites/specific/consumer.js",
  "src/services/generator.js": "test/suites/specific/generator.js",
  "src/services/provider.js": "test/suites/specific/provider.js",
  "src/main.js": "test/suites/generic/main.js",
  "src/conf.js": "test/suites/generic/conf.js",
  "bin/cli.js": "test/suites/specific/cli.js",
  "src/utils.js": "test/suites/specific/utils.js",
}

const models /** @type {Entry} */ = {
  "test/models/const/angular-framework": "test/styling/circular.js",
  "test/models/const/circular-structure": "test/styling/diagonal.js",
  "test/models/const/clean-architecture": "test/styling/linear.js",
  "test/models/const/cli-nodejs-library": "test/styling/aligned.js",
  "test/models/const/complex-structure": "test/themed/dark-mode.js",
  "test/models/const/component-library": "test/themed/light-mode.js",
  "test/models/const/ddd-domain-driven": "test/styling/",
  "test/models/const/deeply-nested-project": "test/styling/",
  "test/models/const/event-driven-project": "test/styling/",
  "test/models/const/flattened-structure": "test/styling/",
  "test/models/const/graphql-api-project": "test/styling/",
  "test/models/const/hexagonal-architecture": "test/styling/",
  "test/models/const/large-size-project": "test/styling/",
  "test/models/const/layered-architecture": "test/styling/",
  "test/models/const/medium-size-project": "test/styling/",
  "test/models/const/microservices-project": "test/styling/",
  "test/models/const/mvc-style-project": "test/styling/",
  "test/models/const/plugin-architecture": "test/styling/",
  "test/models/const/react-framework": "test/styling/",
  "test/models/const/rest-api-architecture": "test/styling/",
  "test/models/const/serverless-functions": "test/styling/",
  "test/models/const/small-size-project": "test/styling/",
  "test/models/const/widened-structure": "test/styling/"
}
