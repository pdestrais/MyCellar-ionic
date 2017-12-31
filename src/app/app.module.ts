import { NgModule, ErrorHandler } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
//import { NavController } from 'ionic-angular';
import { MyApp } from './app.component';
import { RapportPage } from '../pages/rapport/rapport';
import { RapportPDFPage } from '../pages/rapport-pdf/rapport-pdf';
import { VinPage } from '../pages/vin/vin';
import { ConfigurationPage } from '../pages/configuration/configuration';
import { AppellationPage } from '../pages/appellation/appellation';
import { TypePage } from '../pages/type/type';
import { RegionPage } from '../pages/region/region';
import { StatsPage } from '../pages/stats/stats';
import { SearchPage } from '../pages/search/search';
import { AlertComponent } from '../pages/alert/alert.component';
import { ModalPage } from '../pages/vin/vin'

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { LoggerService } from '../services/logger.service';
import { SimpleCacheService } from '../services/simpleCache.service';
import { PouchdbService } from '../services/pouchdb.service';
import { AlertService } from '../services/alert.service';

import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
//import { HttpModule, Http } from '@angular/http';

export function setTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

@NgModule({
  declarations: [
    MyApp,
    RapportPage,
    RapportPDFPage,
    VinPage,
    ConfigurationPage,
    AppellationPage,
    TypePage,
    RegionPage,
    StatsPage,
    SearchPage,
    AlertComponent,
    ModalPage
  ],
  imports: [
    BrowserModule,
    HttpModule,
    FormsModule,
    HttpClientModule,
    IonicModule.forRoot(MyApp),  
    TranslateModule.forRoot({
      loader: {
          provide: TranslateLoader,
//          useFactory: HttpLoaderFactory,
          useFactory: (setTranslateLoader),
          deps: [HttpClient]
      }
    })
    
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    RapportPage,
    RapportPDFPage,
    VinPage,
    ConfigurationPage,
    AppellationPage,
    TypePage,
    RegionPage,
    StatsPage,
    SearchPage,
    ModalPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    LoggerService,
    SimpleCacheService,
    PouchdbService,
    AlertService
  ]
})
export class AppModule {}
