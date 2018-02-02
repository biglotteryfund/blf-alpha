/**
 * Require suites individually to control running order
 * We want basic smoke tests first so they can fail early
 * And a11y tests last as they take longer to run
 */
require('./test-suites/server.test');
require('./test-suites/locale.test');
require('./test-suites/legacy.test');
require('./test-suites/sections.test');
require('./test-suites/survey.test');
require('./test-suites/materials.test');
require('./test-suites/user.test');
require('./test-suites/tools.test');
// temporarily disabled due to build issues
// require('./test-suites/a11y.test');
