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
  public shipList: any = [];

  constructor(private route: ActivatedRoute, private router: Router, private toastr: ToastrService) {
    this.route.params.subscribe(params => {
      if (params.country && params.country !== 'undefined') {
        this.selectedCountry = params.country;
        this.newShip.flag = this.selectedCountry;
        this.newShip.shipType = 'Container Ship';
        this.getShips();
      } else {
        this.selectedCountry = undefined;
      }
    });
  }

  ngOnInit() {
  }

  getShips() {
    axios.get('http://localhost:3000/queryShips')
      .then((response) => {
        // handle success
        this.shipList = response.data.data;
      })
      .catch((error) => {
        // handle error
        console.log(error);
      });
  }

  saveShip() {
    // this.newShip;
    this.newShip;
    axios.post('http://localhost:3000/createShip', this.newShip)
      .then(function (response) {
        console.log(response);
      })
      .catch(function (error) {
        console.log(error);
      });
    this.shipList.push(this.newShip);
    this.toastr.success('Ship has been successfully added!');
  }

  updateShipObject(key, event) {
    this.newShip[key] = event.target.value;
  }

  viewShipDetails(ship) {
    const url = '/certificates/' + this.selectedCountry + '/' + ship.imo + '/' + ship.flag;
    this.router.navigateByUrl(url);

  }
}
