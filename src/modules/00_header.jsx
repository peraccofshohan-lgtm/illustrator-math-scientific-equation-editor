/* ==========================================================================
 * Math & Scientific Equation Editor for Adobe Illustrator
 * Created by Shohan Khan
 *
 * Module 00 - Header / application namespace
 *
 * The whole runtime lives inside one closure so that nothing leaks into the
 * shared ExtendScript engine. Syntax baseline: ECMAScript 3 (ExtendScript).
 * ========================================================================== */
(function (GLOBAL) {

var MSEE = {};
MSEE.APP_NAME = 'Math & Scientific Equation Editor';
MSEE.APP_TITLE_FULL = 'Adobe Illustrator Advanced Mathematical & Scientific Equation Editor';
MSEE.AUTHOR = 'Shohan Khan';
MSEE.ATTRIBUTION = 'Created by Shohan Khan';
MSEE.VERSION = '@@VERSION@@';
MSEE.DATA_FORMAT = 'MSEE-Library';
MSEE.DATA_FORMAT_VERSION = 1;
MSEE.NOTE_PREFIX = 'MSEE:1:';
MSEE.DATA_FOLDER_NAME = 'ShohanKhan-MathEquationEditor';
MSEE.TEST_MODE = (typeof MSEE_TEST_MODE !== 'undefined' && MSEE_TEST_MODE === true);
