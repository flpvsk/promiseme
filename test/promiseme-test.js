'use strict';

var _ = require('underscore')
  , promiseme = require('../index.js');

exports.wrapsRegularFunction = function (test) {
  var promise = promiseme.that(function () { return 'food'; });
  test.ok(_.isFunction(promise.then));

  promise.then(function onSuccess(value) {
    test.equal(value, 'food', 'You\'ve promised me food!');
    test.done();
  });
};

exports.wrapsValue = function (test) {
  var promise = promiseme.that('everything is gonna be ok');
  test.ok(_.isFunction(promise.then));

  promise.then(function onSuccess(value) {
    test.equal(value, 'everything is gonna be ok', 'What now!?');
    test.done();
  });
};

exports.valueHandle = function (test) {
  biggerThanZero(1)
    .then(function (result) {
      test.equal(result, 'yep', result + '? 1 is bigger than 0, right?');
      test.done();
    });
};

exports.errorHandle = function (test) {
  biggerThanZero(-1)
    .then(function (result) {
      test.ok(false, 'Value handler was called with ' + result);
      test.done();
    }, function (error) {
      test.equals(error, 'nope', 'Error handler called with bad value');
      test.done();
    });
};

exports.chainedValueHandle = function (test) {
  biggerThanZero(1)
    .then(function (result) {
      return 'Answer is ' + result;
    })
    .then(function (result) {
      test.equal(result, 'Answer is yep');
      test.done();
    });
};

exports.chainedValueErrorHandle = function (test) {
  biggerThanZero(1)
    .then(function () {
      throw new Error('Better check again!');
    })
    .then(undefined, function (error) {
      test.equal('Better check again!', error.message);
      test.done();
    });
};

exports.promiseInValueHandle = function (test) {
  biggerThanZero(1)
    .then(function (result) {
      console.log('Got result', result);
      return biggerThanZero(-1);
    })
    .then(function () {
      test.ok(false, 'Should be in error handler.');
      test.done();
    }, function (error) {
      test.equal(error, 'nope');
      test.done();
    });
};

exports.errorInChain = function (test) {
  biggerThanZero(-1)
    .then(function () { }, function () { return 'handled'; })
    .then(function (value) {
      test.equals(value, 'handled', 'Error was not handled properly');
      test.done();
    }, function (error) {
      test.ok(false, 'Error ' + error + ' was passed to second handler');
      test.done();
    });
};


function biggerThanZero(arg) {
  var later = promiseme.defer();

  if (arg > 0) { later.resolve('yep'); }
  if (arg <= 0) { later.reject('nope'); }

  return later.promise;
}

