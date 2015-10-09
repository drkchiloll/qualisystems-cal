var thinky = require('./dbcon'),
    schema = require('./schema');
module.exports = thinky.createModel('queued', schema);
