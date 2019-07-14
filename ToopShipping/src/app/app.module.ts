import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {RouterModule, Routes} from '@angular/router';
import {AppComponent} from './app.component';
import {CountrySelectComponent} from './country-select/country-select.component';
import {ShipsComponent} from './ships/ships.component';
import {CertificatesComponent} from './certificates/certificates.component';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [
    AppComponent,
    CountrySelectComponent,
    ShipsComponent,
    CertificatesComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule.forRoot([
      {path: '', component: CountrySelectComponent},
      {path: 'ships/:country', component: ShipsComponent},
      {path: 'certificates/:country/:shipId', component: CertificatesComponent},
    ]),
    BrowserAnimationsModule,
    ToastrModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
