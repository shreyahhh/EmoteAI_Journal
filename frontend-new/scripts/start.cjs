const path = require('path');
const { appRoot, load } = require('./load-env.cjs');

process.chdir(appRoot);
load();
require('react-scripts/scripts/start');
