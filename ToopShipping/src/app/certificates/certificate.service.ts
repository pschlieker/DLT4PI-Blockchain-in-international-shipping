import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Certificate } from './certificate';
import { fabricClient } from '../../../../application/javascript/fabric-module';
import * as path from 'path';

@Injectable({
  providedIn: 'root'
})
export class CertificateService {

  channelName = 'mychannel';
  fabricUser = 'user1';
  ccpPath = path.resolve('..', '..', 'fabric-network', 'connection-dma.json');

  constructor() { }

  public findCert(imo: string): Observable<Certificate> {
    return fabricClient.queryCert(this.ccpPath, this.fabricUser, this.channelName, imo);
  }

  public saveShipCertificate(country: string, certName: string, certNum: string, imo: string, filePath: string): void {
    const today =  new Date();
    const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
    fabricClient.createShipCertificate(this.ccpPath, this.fabricUser, this.channelName, country, certName, certNum, imo,
      today.toISOString(), nextYear.toISOString(), filePath);
  }

  public requestShipCert(imo: string): void {
    fabricClient.requestShipCert(this.ccpPath, this.fabricUser, this.channelName, imo);
  }
}
