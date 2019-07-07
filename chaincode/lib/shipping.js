'use strict';

const { Contract } = require('fabric-contract-api');
const crypto = require('crypto')

class Ship {
    #certHash
    constructor(imo, name, shipType, flag, homePort, tonnage, owner) {
        this.imo = imo;
        this.name = name;
        this.shipType = shipType;
        this.flag = flag;
        this.homePort = homePort;
        this.tonnage = tonnage;
        this.owner = owner;
    }
    getCert() {
        if (this.certHash) {
            return this.certHash;
        } else {
            throw new Error('certHash is empty');
        }
    }
    setCert(certHash) {
        this.#certHash = certHash;
    }
}

class MaritimeAuthority {
    #privKey;
    constructor(name, country, domain, pubKey, privKey) {
        this.name = name;
        this.country = country;
        this.domain = domain;
        this.pubKey = pubKey;
        this.#privKey = privKey;
    }
    getPubKey() {
        return this.pubKey;
    }
    getPrivateKey() {
        return this.privKey
    }
}

class Shipping extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        const denmark = crypto.createDiffieHellman(2048);
        const denmarkKey = denmark.generateKeys('base64');
        const estonia = crypto.createDiffieHellman(2048);
        const estoniaKey = estonia.generateKeys('base64');
        
        const MaritimeAuthorities = [
            new MaritimeAuthority('Danish Maritime Authority', 'Denmark', 'dma.dk', denmarkKey.getPublicKey('base64'), denmarkKey.getPrivateKey('base64')),
            new MaritimeAuthority('Estonian Maritime Administration', 'Estonia', 'veeteedeeamet.ee', estoniaKey.getPublicKey('base64'), estoniaKey.getPrivateKey('base64'))
        ];

        for (let i = 0; i < MaritimeAuthorities.length; i++) {
            await ctx.stub.putState(MaritimeAuthorities[i].country.toUpperCase(), Buffer.from(JSON.stringify(MaritimeAuthorities[i])));
            console.info('Added <--> ', MaritimeAuthorities[i])
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    async queryShip(ctx, imo) {
        const shipAsBytes = await ctx.stub.getState(imo); // get the ship from chaincode state
        if (!shipAsBytes || shipAsBytes.length === 0) {
            throw new Error(`${imo} does not exist`);
        }
        console.log(shipAsBytes.toString());
        return shipAsBytes.toString();
    }
}