'use strict';

var path = require('path');
var utils = require('./utils');
var OPTIONAL_REGEX = /^optional!/;

/**
 * Create an API method from the declared spec.
 *
 * @param [spec.method='GET'] Request Method (POST, GET, DELETE, PUT)
 * @param [spec.path=''] Path to be appended to the API BASE_PATH, joined with 
 *  the instance's path (e.g. "charges" or "customers")
 * @param [spec.required=[]] Array of required arguments in the order that they
 *  must be passed by the consumer of the API. Subsequent optional arguments are
 *  optionally passed through a hash (Object) as the penultimate argument
 *  (preceeding the also-optional callback argument
 */
module.exports = function stripeMethod(spec) {

  var commandPath = typeof spec.path == 'function' ? spec.path
                  : utils.makeURLInterpolator( spec.path || '' );
  var requestMethod = (spec.method || 'GET').toUpperCase();
  var urlParams = spec.urlParams || [];

  return function() {
    var self = this;
    var args = [].slice.call(arguments);

    var callback = typeof args[args.length - 1] == 'function' && args.pop();
    var deferred = this.createDeferred(callback);
    var urlData = this.createUrlData();

    for (var i = 0, l = urlParams.length; i < l; ++i) {

      var arg = args[0];
      var param = urlParams[i];

      var isOptional = OPTIONAL_REGEX.test(param);
      param = param.replace(OPTIONAL_REGEX, '');

      if (!arg) {
        if (isOptional) {
          urlData[param] = '';
          continue;
        }
        throw new Error('Stripe: I require argument "' + urlParams[i] + '", but I got: ' + arg);
      }

      urlData[param] = args.shift();
    }

    var auth = null;
    var data = {};
    var headers = {};

    // This is some veyr gross and nested logic :(
    if (args.length == 2) {
      if (utils.isAuthKey(args[1])) {
        auth = args.pop();
      } else if (utils.isOptionsHash(args[1])) {
        var opts = args.pop();
        auth = opts.api_key;
        if (opts.idempotency_key) {
          headers['Idempotency-Key'] = opts.idempotency_key;
        }
      }
      if (utils.isObject(args[0])) {
        data = args.shift();
      }
    } else if (args.length == 1) {
      if (utils.isAuthKey(args[0])) {
        auth = args.pop();
      } else if (utils.isOptionsHash(args[0])) {
        var opts = args.pop();
        auth = opts.api_key;
        if (opts.idempotency_key) {
          headers['Idempotency-Key'] = opts.idempotency_key;
        }
      } else if (utils.isObject(args[0])) {
        data = args.pop();
      }
    }

    if (args.length) {
      throw new Error(
        'Stripe: Unknown arguments (' + args + '). Did you mean to pass an options object? ' +
        'See https://github.com/stripe/stripe-node/wiki/Passing-Options.'
      );
    }

    var requestPath = this.createFullPath(commandPath, urlData);

    self._request(requestMethod, requestPath, data, auth, headers, function(err, response) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(
          spec.transformResponseData ?
            spec.transformResponseData(response) :
            response
        );
      }
    });

    return deferred.promise;

  };
};
