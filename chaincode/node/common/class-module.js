class MaritimeAuthority {
    constructor(objType, name, country, domain, borders) {
        this.name = name;
        this.country = country; // country is the key
        this.borders = borders;
        this.shipList = [];
    }
    addShips(shipList) {
        return Array.prototype.push.apply(this.shipList, shipList);
    }
}

class Ship {
    constructor(objType, imo, name, shipType, flag, homePort, tonnage, owner) {
        this.imo = imo; // imo is the key
        this.name = name;
        this.flag = flag;
    }
}

class PrivateShipCertificate {
    constructor(objType, certName, certNum, imo, issueDate, expiryDate, certHash) {
        this.certName = certName;
        this.certNum = certNum;
        this.imo = imo; // imo is the key
        this.issueDate = issueDate;
        this.expiryDate = expiryDate;
        this.certHash = certHash;
    }
}
export default MaritimeAuthority;
export default Ship;
export default PrivateShipCertificate;