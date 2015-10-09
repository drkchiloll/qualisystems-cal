'use strict';
var Quali = require('../models/quali'),
    Temp  = require('../models/temp'),
    Cancellation = require('../models/cancel'),
    Queued = require('../models/queued'),
    Archive = require('../models/archive');

var getDb = function(model, reservation) {
  switch(model) {
    case 'quali':
      return new Quali(reservation);
    case 'temp':
      return new Temp(reservation);
    case 'archive':
      return new Archive(reservation);
    case 'queued':
      return new Queued(reservation);
    case 'cancellation':
      return new Cancellation(reservation);
  }
};

var getModel = function(model) {
  switch(model) {
    case 'quali':
      return Quali;
    case 'temp':
      return Temp;
    case 'archive':
      return Archive;
  }
};

module.exports.query = function(model, id) {
  var Model = getModel(model);
  return Model.get(id).error(function(err) {
    // Just because it doesn't match doesn't make it bad
    return null;
  });
};

module.exports.queryAll = function() {
  return Quali.run().error(function(err) {
    return null;
  });
};

module.exports.insert = function(model, reservation) {
  var db = getDb(model, reservation);
  return db.save();
};

module.exports.updateTime = function(id, reservation) {
  return Quali.get(id).run().then(function(record) {
    return record.merge({
      start : reservation.start,
      end   : reservation.end
    }).save();
  });
};

module.exports.remove = function(id) {
  return Quali.get(id).then(function(record) {
    return record.delete();
  })
};

module.exports.deleteTemp = function() {
  return Temp.delete();
};
