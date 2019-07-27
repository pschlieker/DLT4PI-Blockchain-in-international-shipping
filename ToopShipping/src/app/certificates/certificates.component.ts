import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ToastrService} from 'ngx-toastr';
import * as axios from 'axios';
// import {CertificateService} from "./certificate.service";

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
  public certificateList: any = [
    {certificateId: '1', certificateName: 'Dangerous cargo carrying certificate', file: '/assets/pdf/IMO_Declaration_Form.pdf'},
    {certificateId: '2', certificateName: 'Cargo ship safety certificate', file: '/assets/pdf/IMO_Declaration_Form.pdf'},
    {certificateId: '3', certificateName: 'International oil prevention certificate', file: '/assets/pdf/IMO_Declaration_Form.pdf'},
  ];


  constructor(private route: ActivatedRoute, private toastr: ToastrService) {
    this.route.params.subscribe(params => {
      if (params.country && params.country !== 'undefined') {
        this.selectedCountry = params.country;
        this.shipId = params.shipId;
        this.shipCountry = params.shipCountry;
      } else {
        this.selectedCountry = undefined;
        this.shipId = undefined;
      }
    });
  }

  ngOnInit() {
  }

  uploadFile(event) {
    const files = event.target.files;
    if (files.length > 0) {
      this.newCertificate.data = files[0];
    }
  }

  downloadCertificate() {
    const pdfBlob = new Blob([this.newCertificate.data], {type: 'application/pdf'});
    const fileURL = URL.createObjectURL(pdfBlob);
    window.open(fileURL, '_blank');
  }

  // deleteCertificate(certificateId) {
  //   axios.default.delete('https://jsonplaceholder.typicode.com/todos/1')
  //     .then((response) => {
  //       // handle success
  //       this.removeCertificateFromList(certificateId)
  //       this.toastr.success('Certificate deleted successfully!');
  //     })
  //     .catch((error) => {
  //       // handle error
  //       this.toastr.error('Unable to delete certificate. Try again.');
  //       console.log(error);
  //     });
  // }

  deleteCertificate(certificateId) {
    this.removeCertificateFromList(certificateId)
    this.toastr.success('Certificate deleted successfully!');
  }

  removeCertificateFromList(certificateId) {
    const index = this.certificateList.findIndex(certificate => certificate.certificateId === certificateId);
    if (index !== -1) {
      this.certificateList.splice(index, 1);
    }

  }

  viewCertificate(fileURL) {
    window.open(fileURL, '_blank');
  }

}
