import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ToastrService} from 'ngx-toastr';

const axios = require('axios');
const fetch = require('node-fetch');

@Component({
  selector: 'app-certificates',
  templateUrl: './certificates.component.html',
  styleUrls: ['./certificates.component.css']
})
export class CertificatesComponent implements OnInit {
  public shipId = '';
  public shipCountry = '';
  public selectedCountry = '';
  public newCertificate: any = {};
  public permission = undefined;
  public certificateList: any = [];
  public pdf = undefined;
  public date = undefined;

  constructor(private route: ActivatedRoute, private toastr: ToastrService) {
    this.route.params.subscribe(params => {
      if (params.country && params.country !== 'undefined' && params.shipId) {
        this.selectedCountry = params.country;
        this.shipId = params.shipId;
        this.shipCountry = params.shipCountry;
        this.date = new Date();
        this.getCertificates();
      } else {
        this.selectedCountry = undefined;
        this.shipId = undefined;
      }
    });
  }

  ngOnInit() {
  }

  getCertificates() {
    axios.get('http://localhost:3000/queryCertificates/' + this.shipCountry + '/' + this.shipId)
      .then((response) => {
        // handle success
        if (response.data.status === 'ok') {
          this.certificateList = response.data.data;
          this.permission = true;
        }
        else {
          this.permission = false;
        }
        // return response.data;
      })
      .catch((error) => {
        // handle error
        console.log(error);
      });
  }

  async uploadFile(event) {
    const files = event.target.files;
    if (files.length > 0) {
      this.newCertificate.data = files[0];
    }
  }

  viewCertificate(fileURL) {
    axios.get('http://localhost:3000/getCertificate/' + fileURL, {
      responseType: 'arraybuffer',
      headers: {
        'Accept': 'application/pdf'
      }
    }).then((data) => {
      this.pdf = data;
      let file = new Blob([data.data], {type: 'application/pdf'});
      let fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    });
  }

  async uploadCSVFile() {
    let fileForm = document.getElementById("addFileForm");
    let data = new FormData(<HTMLFormElement>fileForm);
    let file = this.newCertificate.data;
    // for (var pair of data.entries()) {
    //   console.log(pair[0] + ', ' + pair[1]);
    // }

    fetch('http://localhost:3000/createCertificate/' + this.shipCountry, {
      method: 'POST',
      body: data,
    }).then((res) => {
      this.getCertificates();
      console.log(res);
    })
      .catch((error) => {
        console.log(error);
      });
  }

}
