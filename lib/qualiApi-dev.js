var request = require('request'),
    Promise = require('bluebird');


module.exports = (function() {
  var quaService = {};

  quaService.login = function(user, pass, ns) {
    return new Promise(function(resolve, reject) {
      resolve('logged in successfully');
    });
  };

  quaService.getScheduledReservations = function(from, to) {
    return new Promise(function(resolve, reject) {
      request.get('http://localhost:9999/quali', function(err, res, body) {
        resolve(body);
      });
    });
  };

  return quaService;
}());
