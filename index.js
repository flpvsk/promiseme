'use strict';

var _ = require('underscore');

exports.that = that;
exports.defer = defer;

function that(x) {
  return {
      then: function (successFn) {
        var result;
        try {
          result = x;

          if (isPromise(x)) { result = x; }

          if (_.isFunction(x)) { result = x.apply(undefined); }

        } catch(err) {
          throw err;
        }
        if (successFn) {
          successFn.call(undefined, result);
        }
      }
    };
}

function resolveStack(stack, value, error) {
  if (stack.length === 0) { return; }

  var entry = stack.shift();
  if (error) {
    if (entry.handleError) { return exec(entry, 'handleError', error); }
    return resolveStack(stack, undefined, error);
  }
  if (entry.handleValue) { return exec(entry, 'handleValue', value); }

  return resolveStack(stack, value, undefined);


  function exec(entry, method, arg) {
    var val;
    try {
      val = entry[method].call(undefined, arg);
    } catch (err) {
      resolveStack(stack, undefined, err);
    }

    if (isPromise(val)) {
      return val.then(function (v) {
        return resolveStack(stack, v);
      }, function (e) {
        return resolveStack(stack, undefined, e);
      });
    }

    resolveStack(stack, val, undefined);
  }
}

function defer() {
  var promise = createPromise();

  function resolve (value) {
    process.nextTick(function () {
      return resolveStack(promise.stack, value);
    });
  }

  function reject (error) {
    process.nextTick(function () {
      return resolveStack(promise.stack, undefined, error);
    });
  }

  return {
    resolve: resolve
  , reject: reject
  , promise: promise
  };
}

function isPromise(x) {
  return _.isObject(x) && _.has(x, 'then') && _.isFunction(x.then);
}

function createPromise() {
  var promise = {
    stack: []
  , then: function (x, y) {
      var entry = {};
      if (x) { entry.handleValue = x; }
      if (y) { entry.handleError = y; }
      promise.stack.push(entry);
      return promise;
    }
  };
  return promise;
}
