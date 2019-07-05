'use strict';

const { Contract } = require('fabric-contract-api');

class Shipping extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');

    }
}