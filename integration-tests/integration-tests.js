/**
 * Require suites individually to control running order
 * We want basic smoke tests first so they can fail early
 */
require('./test-suites/materials.test');
require('./test-suites/user.test');
require('./test-suites/tools.test');
