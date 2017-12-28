import { AlertService } from './../../services/alert.service';
import { Component, NgZone } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';
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
  public supportedLanguages:Array<any> = [{name:'french',locale:'fr-FR'},{name:'english', locale:'en-US'}];
  public loading:boolean = false;
  public synced:boolean = false;

  constructor(public navCtrl: NavController, 
              public alertCtrl: AlertController, 
              public pouchDB:PouchdbService, 
              public translate: TranslateService,
              public alertService:AlertService,
              public zone:NgZone) {
  }
  
  ionViewDidLoad() {
    console.log("viewname :"+this.navCtrl.getActive().name);
    this.config = this.pouchDB.getSettings();
    if (this.config) {
      if (this.config.language)
        this.translate.use(this.config.language);
      if (this.config.syncUrl)
        this.config.syncUrl?this.synced = true:this.synced=false;
      else {
        this.config = {id:'syncUrl', syncUrl : 'https://userid:password@serverurl/dbname', language:'english' };
        this.synced = false;
      }
    }
  }

  syncWithRemoteDB(overwrite:boolean) {
    this.pouchDB.getPouchDBListener().subscribe((event) => {
      if (event.type == 'replication' && event.message == 'ReplicationStarts') {
        console.log('ReplicationEnds Event received in save config'); 
        this.loading = true;
      }
      if (event.type == 'replication' && event.message == 'ReplicationEnds') {
        console.log('ReplicationEnds Event received in save config'); 
        this.loading = false;
       this.navCtrl.setRoot(SearchPage);          
       }
    });
    if (overwrite)
      this.pouchDB.applySyncUrl(this.config.syncUrl,2);  
    else 
      this.pouchDB.applySyncUrl(this.config.syncUrl,1);
  }

  languageChange(val: any) {
    this.config.language = val;
    console.log('Language Change:', val);
    this.zone.run(() => this.translate.use(this.config.language));
    this.pouchDB.genericSaveDoc(this.pouchDB.getSettingsDB(),this.config);
  }
    
}
