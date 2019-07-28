import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ToastrService} from 'ngx-toastr';
const axios = require('axios');

// import {ShipService} from "./ship.service";

@Component({
  selector: 'app-ships',
  templateUrl: './ships.component.html',
  styleUrls: ['./ships.component.css']
})
export class ShipsComponent implements OnInit {
  public selectedCountry = '';
  public testObj: any = {};
  public newShip: any = {imo: '', name: '', flag: '', shipType: '', homePort: '', tonnage: '', owner: ''};
  // public shipList: any = [
  //   {shipId: '1', shipName: 'Ship1', shipCountry: 'Denmark'},
  //   {shipId: '2', shipName: 'Ship2', shipCountry: 'Germany'},
  //   {shipId: '3', shipName: 'Ship3', shipCountry: 'Italy'},
  //   {shipId: '4', shipName: 'Ship1', shipCountry: 'Estonia'},
  // ];
  public shipList: any = [];

  constructor(private route: ActivatedRoute, private router: Router, private toastr: ToastrService) {
    this.route.params.subscribe(params => {
      if (params.country && params.country !== 'undefined') {
        this.selectedCountry = params.country;
        this.newShip.flag = this.selectedCountry;
        this.newShip.shipType = 'Container Ship';
        // this.shipList = this.getShips();
        this.getShips();
      } else {
        this.selectedCountry = undefined;
      }
    });
  }

  ngOnInit() {
  }

  getShips() {
    // let header = {
    //   'Access-Control-Allow-Origin': '*',
    //   'content-type': 'application/json'
    // };
    // debugger;
    axios.get('http://localhost:3000/queryShips')
      .then((response) => {
        // handle success
        // debugger;
        this.shipList = response.data.data;
        // return response.data;
      })
      .catch((error) => {
        // handle error
        // debugger;
        console.log(error);
      });
  }

  saveShip() {
    // this.newShip;
    // this.shipList.push(this.newShip);
    this.newShip;
    axios.post('http://localhost:3000/createShip', this.newShip)
      .then(function (response) {
        console.log(response);
      })
      .catch(function (error) {
        console.log(error);
      });
    this.getShips();
    this.toastr.success('Ship has been successfully added!');
  }

  updateShipObject(key, event) {
    this.newShip[key] = event.target.value;
  }

  viewShipDetails(ship) {
    // if (ship.flag === this.selectedCountry) {
    //   const url = '/certificates/' + this.selectedCountry + '/' + ship.imo + '/' + ship.flag;
    //   this.router.navigateByUrl(url);
    // } else if (this.checkPermission(ship.imo) == true) {
    //   const url = '/certificates/' + this.selectedCountry + '/' + ship.imo + '/' + ship.flag;
    //   this.router.navigateByUrl(url);
    // } else {
    //   // TODO: Check for the consensus
    //   this.toastr.error('You do not have permission to access this ships certificates');
    // }
    const url = '/certificates/' + this.selectedCountry + '/' + ship.imo + '/' + ship.flag;
    this.router.navigateByUrl(url);

  }

  async checkPermission(imo) {
    let flag = false;
    axios.get('http://locahost:3000/quertCertificates/' + imo)
      .then(function (response) {
        debugger;
        console.log(response);
        flag = true;
      })
      .catch(function (error) {
        debugger;
        console.log(error);
        flag = false;
      });
    return flag;
  }

}
