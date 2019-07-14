import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-country-select',
  templateUrl: './country-select.component.html',
  styleUrls: ['./country-select.component.css']
})
export class CountrySelectComponent implements OnInit {
  public countryList: any = [
    'Germany',
    'Italy',
    'France',
    'Spain',
    'Estonia',
    'Denmark',
  ];

  constructor() { }

  ngOnInit() {
  }

}
