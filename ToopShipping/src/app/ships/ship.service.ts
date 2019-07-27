// import { Injectable } from '@angular/core';
// import { fabricClient } from '../../../../application/javascript/fabric-module.js';
// import { Observable } from 'rxjs';
// import { Ship } from './ship';
// import * as path from 'path';
// import {Certificate} from '../certificates/certificate';
//
// @Injectable({
//   providedIn: 'root'
// })
// export class ShipService {
//
//   channelName = 'mychannel';
//   fabricUser = 'user1';
//   ccpPath = path.resolve('..', '..', 'fabric-network', 'connection-dma.json');
//
//   constructor() { }
//
//   public findAllShipsByCountry(country: string): Observable<Ship> {
//     return fabricClient.queryAllShipsByCountry(this.ccpPath, this.fabricUser, this.channelName, country);
//   }
//
//   public findShip(country: string, imo: string): Observable<Ship> {
//     return fabricClient.queryShip(this.ccpPath, this.fabricUser, this.channelName, country, imo);
//   }
//
//   public saveShip(imo: string, name: string, shipType: string, flag: string, homePort: string, tonnage: string,
//                   owner: string): void {
//     fabricClient.createShip(this.ccpPath, this.fabricUser, this.channelName,
//       imo, name, shipType, flag, homePort, tonnage, owner);
//   }
//
// }
