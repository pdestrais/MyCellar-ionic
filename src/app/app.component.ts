import { Component, ViewChild, NgZone } from '@angular/core';
import { Platform, Nav } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { VinPage } from '../pages/vin/vin';
import { AppellationPage } from '../pages/appellation/appellation';
import { RegionPage } from '../pages/region/region';
import { RapportPage } from '../pages/rapport/rapport';
import { RapportPDFPage } from '../pages/rapport-pdf/rapport-pdf';
import { StatsPage } from '../pages/stats/stats';
import { ConfigurationPage } from '../pages/configuration/configuration';
import { SearchPage } from '../pages/search/search';
import { TranslateService } from '@ngx-translate/core';
import { PouchdbService } from '../services/pouchdb.service';

@Component({
  templateUrl: 'app.html'
})

export class MyApp {
  @ViewChild(Nav) navCtrl: Nav;
    //rootPage:any = SearchPage;
    //rootPage:any = SearchPage;
    private message:any;

  constructor(platform: Platform, 
              statusBar: StatusBar, 
              splashScreen: SplashScreen, 
              public pouchDB:PouchdbService, 
              private translate: TranslateService,
              private zone:NgZone) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();
      this.message = this.pouchDB.getMessage();
      this.message.subscribe(event => {
        console.log('[App]Event : '+JSON.stringify(event.message));
        this.navCtrl.setRoot(SearchPage);
        // if no config element could be found during PouchDB initialization 
        if (event.type == 'error') {
          // We set the language to 'english' as default and navigate to configuration page.
          this.translate.use('english');
          this.navCtrl.push(ConfigurationPage);          
        } else if (event.type == 'configLoaded') { // config has been loaded from the PouchDB
          if (event.message.language) { // language is found and will be set
            this.zone.run(() => { 
              this.translate.use(event.message.language).subscribe(() => console.log('[App]Setting language to : '+event.message.language)); 
              //this.translate.setDefaultLang(event.message.language); 
            })
          }
          else {// use default language (english)
            console.log('[App]Setting language to default English');
            this.translate.use('english');  
          } 
        }
      });
      this.pouchDB.init();
      //this.navCtrl.setRoot(SearchPage);
      // check if no configuration
      //this.navCtrl.setRoot(SearchPage);
      // this language will be used as a fallback when a translation isn't found in the current language
//      translate.setDefaultLang('en');
      // the lang to use, if the lang isn't available, it will use the current loader to get them
//      translate.use('en');
    });
  }

  goToVin(params){
    if (!params) params = {};
    this.navCtrl.setRoot(VinPage);
  }
  goToAppellation(params){
    if (!params) params = {};
    this.navCtrl.setRoot(AppellationPage,{action:'list'}  );
  }
  goToSearch(params){
    if (!params) params = {};
    this.navCtrl.setRoot(SearchPage);
  }
  goToRegion(){
    this.navCtrl.setRoot(RegionPage,{action:'list'});
  }
  goToRapport(params){
    if (!params) params = {};
    this.navCtrl.setRoot(RapportPage);
  }
  goToRapportPDF(params){
    if (!params) params = {};
    this.navCtrl.setRoot(RapportPDFPage);
  }
  goToStats(params){
    if (!params) params = {};
    this.navCtrl.setRoot(StatsPage);
  }
  goToConfiguration(params){
    if (!params) params = {};
    this.navCtrl.setRoot(ConfigurationPage);
  }
}
