/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');
const request = require('request');


class FabCar extends Contract {

    async getPosition(ctx){
        request('http://192.168.179.58:9001/ship1', { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            console.log(body.result);
        });
    }


}

module.exports = FabCar;
