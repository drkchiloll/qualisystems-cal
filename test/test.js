describe('Quali Reservations', function() {

  describe('successful quali login', function() {

    it('returns a domain id used for login', function() {

    });

  });

  describe('valid date format used/accepted by Qualisystems', function() {

    it('is in mm/dd/yyyy hh:mm format', function() {

    });

    it('adds a minimum numbers of days for searches', function() {

    });

  });

  describe('retrieve reservations in quali in Date Range', function() {

    it('models the data of the current reservations that were downloaded', function() {

    });

    it('compares the current reservations with the reservations in the db', function() {

    });

    it('adds only new reservations (not in db) to a new list', function() {

    });

  });


  describe('cancelled reservations should be removed from the db', function() {

  });

  describe('reservations with changed start/end times should be modified in the db', function() {

  });

  describe('reservations with end times that occur before the request should be archived', function() {

  });

  describe('reservations that are current are skipped.', function() {

  });

});
