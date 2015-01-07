'use strict';

var stripe = require('../testUtils').getSpyableStripe();
var expect = require('chai').expect;

describe('BitcoinTransactions Resource', function() {

  describe('retrieve', function() {

    it('Sends the correct request', function() {

      stripe.bitcoinTransactions.retrieve('transactionId1');
      expect(stripe.LAST_REQUEST).to.deep.equal({
        method: 'GET',
        url: '/v1/bitcoin/transactions/transactionId1',
        data: {}
      });

    });

  });


  describe('list', function() {

    it('Sends the correct request', function() {

      stripe.bitcoinTransactions.list();
      expect(stripe.LAST_REQUEST).to.deep.equal({
        method: 'GET',
        url: '/v1/bitcoin/transactions',
        data: {}
      });

    });

  });
});
