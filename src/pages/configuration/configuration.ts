import { AlertService } from './../../services/alert.service';
import { Component } from '@angular/core';
import { NavController, AlertController, Platform } from 'ionic-angular';
import { PouchdbService } from './../../services/pouchdb.service';
import {TranslateService} from '@ngx-translate/core';
import { SearchPage } from '../search/search';

@Component({
  selector: 'page-configuration',
  templateUrl: 'configuration.html'
})
export class ConfigurationPage {

  public gender = 'f';
  public config:any = {};
  private locale:string = '';
  public supportedLanguages:Array<any> = [{name:'french',locale:'fr-FR'},{name:'english', locale:'en-US'}];
  public loading:boolean = false;

  constructor(public navCtrl: NavController, 
              public alertCtrl: AlertController, 
              public pouchDB:PouchdbService, 
              public translate: TranslateService,
              public alertService:AlertService) {
//    this.config = {id:'config', serverUrl : 'http://localhost:5984/copy_cave_prod', language:'english' };
  }
  
  ionViewDidLoad() {
    console.log("viewname :"+this.navCtrl.getActive().name);
    this.pouchDB.getDoc("config").then(response => {
      if (response.status == 404) {
        console.log('[configuration - ionViewDidLoad]status 404 received');
        this.config = {id:'config', serverUrl : 'http://localhost:5984/copy_cave_prod', language:'english' };
      }
      else {
        console.log('[configuration - ionViewDidLoad]response received');
        this.config = response;
        this.translate.use(this.convertLanguageToLocale(this.config.language));
      }
    }).catch(err => {
      console.log("error getting config in activate");
      this.alertService.error(this.translate.instant('DBError'));
    });    
  }

  saveConfig() {
    let _self = this;
    this.pouchDB.getListener().subscribe((change) => {
      if (change.message == 'ReplicationStarts') {
        console.log('ReplicationEnds Event received in save config'); 
        _self.loading = true;
      }
      if (change.message == 'ReplicationEnds') {
        console.log('ReplicationEnds Event received in save config'); 
        _self.loading = false;

        /*         let alert = this.alertCtrl.create({
          title: 'Confirmation',
          subTitle: 'url serveur DB changée',
          buttons: ['OK']
        });
        alert.present();
        this.pouchDB.init();
 */       this.navCtrl.setRoot(SearchPage);          
       }
    });
    this.pouchDB.switchDB(this.config);  
  }

  languageChange(val: any) {
    this.config.locale = this.convertLanguageToLocale(val);
    console.log('Language Change:', val);
    this.pouchDB.saveDoc(this.config);
  }

  private convertLanguageToLocale(language:string) {
    let locale:string = '';
    switch (language) {
      case "english" : return('en-US');
      case 'french' : return('fr-FR');
      default : return('en-US');
    }

  }

  showSuccess() {
    this.alertService.success('test success');
  }

  showError() {
    this.alertService.error('test error');
  }

    
}
