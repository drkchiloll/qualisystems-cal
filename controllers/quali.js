//Objects Needed
var QualiApi    = require('../lib/QualiApi'),
    GeeCal      = require('../lib/GeeCal'),
    db          = require('./reservations'),
    config      = require('../config');

var qualiUser = config.qualiUser,
    qualiPass = config.qualiPass;

// Node Modules Needed
var Promise = require('bluebird'),
    moment  = require('moment');

var loginActions = function() {
  var gcal  = new GeeCal(),
      quali = new QualiApi();
  return Promise.all([
    gcal._auth(),
    quali.login(qualiUser, qualiPass, 'Global')
  ])
  .then(function(results) {
    results.push(gcal);
    results.push(quali);
    return results;
  })
};

var modelReservations = function(reservations) {
  return reservations.map(function(res) {
    return {
      id : res.$.Id,
      desc   : res.$.Description || '',
      name   : res.$.Name,
      start  : {
        googTime : moment(Date.parse(res.$.StartTime)).format(),
        qualTime : res.$.StartTime,
      },
      end    : {
        googTime : moment(Date.parse(res.$.EndTime)).format(),
        qualTime : res.$.EndTime,
      },
      googId : ''
    };
  });
};

var addUpdateReservation = function(cal, reservations) {
  var gcal = cal.cal,
      oauth = cal.auth;
  return Promise.map(reservations, function(reservation) {
    return Promise.all([
      db.insert('temp', reservation),
      db.query('quali', reservation.id),
    ])
    .then(function(results) {
      var matched = results[1];
      if (!matched) {
        return gcal.addEvent(oauth, reservation).then(function(data) {
          reservation['googId'] = data.id;
          return db.insert('quali', reservation).then(function() {
            console.log(reservation.name + ' was added.');
            return 'added';
          })
        })
      } else if (matched !== null) {
        if (matched.start.qualTime !== reservation.start.qualTime ||
          matched.end.qualTime !== reservation.end.qualTime) {
          // RESERVATION Exists BUT
          // TIME CHANGE: Update the DB and the Calendar
          return Promise.all([
            db.updateTime(reservation.id, reservation),
            db.query('quali', reservation.id)
          ])
          .then(function(updatedReservation) {
            return gcal.updateEvent(oauth, updatedReservation[0]);
          })
          .then(function(data) {
            console.log(reservation.name + ' was updated.');
            return 'updated';
          })
        }
      }
    })

  }, { concurrency : 2 });
};

var removeOrArchiveReservations = function(cal, reservations) {
  var gcal = cal.cal,
      oauth = cal.auth;

  return Promise.map(reservations, function(reservation) {
    return db.query('temp', reservation.id).then(function(data) {
      if (!data) {
        // Record in DB Doesn't Exist in QUALISYSTEMS
        // CANCELATION OR OLD?
        var timeOfReservationRequest = moment(new Date());
        var reservationEndingTime = new Date(reservation.end.qualTime);
        if (timeOfReservationRequest.isBefore(reservationEndingTime)) {
          // This is a Canceled Reservation:
          // REMOVE IT FROM THE DB and Calendar
          return Promise.all([
            gcal.remove(oauth, 'primary', reservation.googId),
            db.remove(reservation.id),
            db.insert('cancellation', reservation)
          ])
          .then(function() {
            console.log(reservation.name + ' was removed.');
            return 'canceled';
          });
        } else {
          //ARCHIVE the Record
          return Promise.all([
            db.remove(reservation.id),
            db.insert('archive', reservation)
          ])
          .then(function() {
            console.log(reservation.name + ' was archived.');
            return 'archived';
          })
        }
      } else {
        return 'skipped';
      }
    });
  }, { concurrency : 5 });
};

var init = function() {
  // Date Handling to Get Reservations
  var qualiDt = 'MM/DD/YYYY HH:mm',
      from    = moment().format(qualiDt),
      to      = moment().add(60, 'days').format(qualiDt);

  var reservations;
  var calendar = {};

  return loginActions().then(function(loginResults) {
    var quali  = loginResults[3],
        gcal   = loginResults[2],
        oauth2 = loginResults[0];
    calendar = { cal : gcal, auth : oauth2 };
    return quali.getScheduledReservations(from, to);
  })
  .then(function(data) {
    reservations = modelReservations(data);
    return addUpdateReservation(calendar, reservations);
  })
  .then(function() {
    return db.queryAll().then(function(currentReservations) {
      return removeOrArchiveReservations(calendar, currentReservations);
    });
  })
  .then(function() {
    db.deleteTemp().then(function(result) {
      if (result) return;
    })
  })
};

module.exports.init = function(timer) {
  setInterval(function() {
    init().then(function() {
      console.log('Process Complete');
    }).catch(function() {
      console.log('Error Thrown');
    })
  }, timer);
};
