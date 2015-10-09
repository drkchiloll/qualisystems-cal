'use strict';
var thinky = require('./dbcon'),
    schema = require('./schema');
module.exports = thinky.createModel('cancellation', schema);
