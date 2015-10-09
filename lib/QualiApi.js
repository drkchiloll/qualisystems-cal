var request = require('request'),
    Promise = require('bluebird'),
    xml2js  = require('xml2js');

var builder = new xml2js.Builder(),
    parser  = new xml2js.Parser();

function QualiApi() {
  this.qualUri = 'http://qualihost:8029/ResourceManagerAPIService/';
  this.authHeader = 'Username=admin;MachineName=TrafficJam;LoggedInDomainId=';
  this.authHash;
  this.options = {
    uri     : String,
    method  : 'POST',
    body    : String,
    headers : {
      'Content-Type'     : 'text/xml',
      'Content-Length'   : Number,
      'DateTimeFormat'   : 'MM/dd/yyyy HH:mm',
      'ClientTimeZoneId' : 'Central America Standard Time',
      'Authorization'    : String
    },
    timeout : 10000
  };
}

QualiApi.prototype._setOptions = function(options) {
  var self = this;
  self.options['uri'] = options.uri;
  self.options['body'] = options.body;
  self.options.headers['Content-Length'] = options.len;
};

QualiApi.prototype._req = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    request(self.options, function(err, res, body) {
      if (err) reject(err);
      if (!res) {
        // throw new Error('Connection Error');
        return reject();
      }
      if (res.statusCode === 200) {
        //Parse the Body into An Object
        parser.parseString(body, function(err, data) {
          if (err) reject(err);
          // console.log(data);
          resolve(data.Response.ResponseInfo[0]);
        });
      }
    });
  })
};

QualiApi.prototype.login = function(user, pass, domId) {
  var self = this;
  var xml = builder.buildObject({
    'Logon' : {
      username   : user,
      password   : pass,
      domainName : domId
    }
  });
  self.options.headers['Authorization'] = self.authHeader + domId;
  self._setOptions({
    uri : self.qualUri + 'Logon',
    body : xml,
    len : xml.length
  });
  return self._req().then(function(data) {
    var domainId = data.Domain[0].$.DomainId;
    self.options.headers['Authorization'] = self.authHeader + domainId;
    return domainId;
  })
};

QualiApi.prototype.getCurrentReservations = function() {
  var self = this;
  var xml = builder.buildObject({
    'GetCurrentReservations' : {
      reservationOwner : '',
    }
  });
  self._setOptions({
    uri : self.qualUri + 'GetCurrentReservations',
    body : xml,
    len : xml.length
  });
  return self._req().then(function(data) {
    return data.Reservations[0].Reservation;
  });
};

QualiApi.prototype.getRsrcAvail = function(resource) {
  var self = this;
  var method = 'GetResourceAvailability';
  var rsrc = {};
  rsrc[method] = {
    resourcesNames : { string : resource },
    showAllDomains : 1
  };
  self._setOptions({
    uri : self.qualUri + method,
    body : builder.buildObject(rsrc),
    len : builder.buildObject(rsrc).length
  });
  return self._req().then(function(data) {
    return data;
  });
};

QualiApi.prototype.getRsrcDetails = function(resource) {
  var self = this;
  var method = 'GetResourceDetails';
  var rsrc = {};
  rsrc[method] = {
    resourceFullPath : resource,
    showAllDomains   : 1
  };
  self._setOptions({
    uri : self.qualUri + method,
    body : builder.buildObject(rsrc),
    len : builder.buildObject(rsrc).length
  });
  return self._req().then(function(data) {
    return data;
  })
};

QualiApi.prototype.getScheduledReservations = function(from, to) {
  /*
    :param from: '05/01/2015 08:00'
    :param   to: '05/10/2015 17:00'
  */
  var self = this;
  var method = 'GetScheduledReservations';
  var schedRes = {};
  schedRes[method] = { fromTime : from, untilTime : to };
  var xml = builder.buildObject(schedRes);
  self._setOptions({
    uri : self.qualUri + method,
    body : xml,
    len : xml.length
  });
  return self._req().then(function(data) {
    return data.Reservations[0].Reservation;
  })
};

QualiApi.prototype.getSchedResDetail = function(resId) {
  var self = this;
  var method = 'GetReservationDetails';
  var resDetail = {};
  resDetail[method] = {
    reservationId : resId
  };
  self._setOptions({
    uri : self.qualUri + method,
    body : builder.buildObject(resDetail),
    len : builder.buildObject(resDetail).length
  });
  return self._req().then(function(data) {
    var resDetail = data.ReservationDescription[0];
    return resDetail;
  })
};

module.exports = QualiApi;
