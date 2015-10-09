var Promise    = require('bluebird'),
    google     = require('googleapis'),
    googleAuth = require('google-auth-library'),
    calendar   = google.calendar('v3'),
    config     = require('../config'),
    fs         = require('fs');

var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'gcal-api1.json';

function GeeCal() {
  this.oauth2Client;
}

var createEventObject = function(evnt) {
  return {
    calendarId : 'primary',
    resource : {
      start : {
        dateTime : evnt.start.googTime,
        timeZone : evnt.timezone
      },
      end : {
        dateTime : evnt.end.googTime,
        timeZone : evnt.timezone
      },
      summary : evnt.name,
      description : evnt.desc
    }
  };
};

GeeCal.prototype._auth = function() {
  var clientSecret = config.clientSecret;
  var clientId = config.clientId;
  var redirectUrl = config.redirectUri;
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
  // Check if we have previously stored a token.
  return new Promise(function(resolve, reject) {
    fs.readFile(TOKEN_PATH, function(err, token) {
      oauth2Client.credentials = JSON.parse(token);
      resolve(oauth2Client);
    });
  })
};

GeeCal.prototype.getEvents = function(auth) {
  return new Promise(function(resolve, reject) {
    calendar.events.list({
      auth: auth,
      calendarId: 'primary',
      timeMin: (new Date('05/01/2015')).toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime'
    }, function(err, response) {
      if (err) {
        console.log('There was an error contacting the Calendar service: ' + err);
        reject(err);
      }
      var events = response.items;
      if (events.length == 0) {
        console.log('No upcoming events found.');
      } else {
        console.log('Upcoming 10 events:');
        resolve(events);
      }
    })
  });
};

GeeCal.prototype.addEvent = function(auth, evnt) {
  return new Promise(function(resolve, reject) {
    calendar.events.insert({
      auth : auth,
      calendarId : 'primary',
      resource : {
        start : {
          dateTime : evnt.start.googTime,
          timeZone : evnt.timezone
        },
        end : {
          dateTime : evnt.end.googTime,
          timeZone : evnt.timezone
        },
        summary : evnt.name,
        description : evnt.desc
      }
    }, function(err, data) {
      if (err) return reject(err);
      resolve(data);
    })
  });
};

GeeCal.prototype.updateEvent = function(auth, evnt) {
  var gooEvnt = {};
  gooEvnt = createEventObject(evnt);
  gooEvnt['auth'] = auth;
  gooEvnt['eventId'] = evnt.googId;
  return new Promise(function(resolve, reject) {
    calendar.events.update(gooEvnt, function(err, data) {
      if (err) console.log(err);
      resolve(data);
    });
  });
};

GeeCal.prototype.remove = function(auth, calId, evtId) {
  return new Promise(function(resolve, reject) {
    calendar.events.delete({
      auth: auth,
      calendarId : calId,
      eventId : evtId
    }, function(err, data) {
      if (err) reject(err);
      resolve({statusCode : 204});
    })
  });
};

module.exports = GeeCal;
