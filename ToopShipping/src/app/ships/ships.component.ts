import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ToastrService} from 'ngx-toastr';
import * as axios from 'axios';
import {ShipService} from "./ship.service";

@Component({
  selector: 'app-ships',
  templateUrl: './ships.component.html',
  styleUrls: ['./ships.component.css']
})
export class ShipsComponent implements OnInit {
  public selectedCountry = '';
  public testObj: any = {};
  public newShip: any = {shipId: '', shipName: '', shipCountry: ''};
  public shipList: any = [
    {shipId: '1', shipName: 'Ship1', shipCountry: 'Denmark'},
    {shipId: '2', shipName: 'Ship2', shipCountry: 'Germany'},
    {shipId: '3', shipName: 'Ship3', shipCountry: 'Italy'},
    {shipId: '4', shipName: 'Ship1', shipCountry: 'Estonia'},
  ];

  constructor(private route: ActivatedRoute, private router: Router, private toastr: ToastrService, private shipService: ShipService) {
    this.route.params.subscribe(params => {
      if (params.country && params.country !== 'undefined') {
        this.selectedCountry = params.country;
        this.newShip.shipCountry = this.selectedCountry;
      } else {
        this.selectedCountry = undefined;
      }
    });
  }

  ngOnInit() {
  }

  saveShip() {
    this.newShip;
    this.shipList.push(this.newShip);
    this.toastr.success('Ship has been successfully added!');
  }

  updateShipObject(key, event) {
    this.newShip[key] = event.target.value;
  }

  viewShipDetails(ship) {
    if (ship.shipCountry === this.selectedCountry) {
      const url = '/certificates/' + this.selectedCountry + '/' + ship.shipId + '/' + ship.shipCountry;
      this.router.navigateByUrl(url);
    } else if (this.checkPermission(ship.shipCountry, this.selectedCountry) == true) {
      const url = '/certificates/' + this.selectedCountry + '/' + ship.shipId + '/' + ship.shipCountry;
      this.router.navigateByUrl(url);
    } else {
      // TODO: Check for the consensus
      this.toastr.error('You do not have permission to access this ships certificates');
    }

  }

  testFunc() {
    axios.default.get('https://jsonplaceholder.typicode.com/todos/1')
      .then((response) => {
        // handle success
        this.testObj = response.data;
      })
      .catch((error) => {
        // handle error
        console.log(error);
      });
  }

  checkPermission(shipCountry, destinationCountry) {
    if (shipCountry == "Estonia" && destinationCountry == "Denmark") {
      return true;
    } else {
      return false;
    }
  }

}
