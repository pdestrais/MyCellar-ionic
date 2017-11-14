import { SearchPage } from './../search/search';
import { TranslateService } from '@ngx-translate/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Component } from '@angular/core';
import { NavController, NavParams, AlertController } from 'ionic-angular';
import { SimpleCacheService } from './../../services/simpleCache.service';
import { PouchdbService } from './../../services/pouchdb.service';
import { VinModel, AppellationModel, OrigineModel,TypeModel } from '../../models/cellar.model'
import { AlertService } from './../../services/alert.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'page-region',
  templateUrl: 'region.html'
})
export class RegionPage {

  public origine:OrigineModel = new OrigineModel("","","");
  public origineList:Array<OrigineModel>=[];
  public submitted:boolean;
  public origineForm:FormGroup;
  public newOrigine:boolean=false;
  private testSubject:Subject<any>;
  
  constructor(public navCtrl: NavController,
              public navParams: NavParams, 
              public cache:SimpleCacheService, 
              public pouch:PouchdbService,
              public formBuilder: FormBuilder,
              public alertService:AlertService,
              public alertController:AlertController,
              public translate:TranslateService) {
      this.origineForm = formBuilder.group({
        pays: ['',Validators.required],
        region: ['',Validators.required]    
    });
    this.submitted = false;
    this.testSubject = new Subject();
          
  }

  public ionViewDidLoad() {
    console.log("[Region - ionViewDidLoad]called");
    // If we come on this page on the first time, the parameter action should be set to 'list', so that we get the see the list of origines 
    if (this.navParams.get('action')=='list') {
      this.pouch.getCollection(this.pouch.origineView)
      .then(origines => origines.map(a => 
        this.origineList.push(a.value)));      
    } 
    // if we come on this page with the action parameter set to 'edit', this means that we either want to add a new origine (id parameter is not set)
    // or edit an existing one (id parameter is set)
    else {
      if (this.navParams.get('id')) {
        this.pouch.getDoc(this.navParams.get('id'))
        .then(origine => {
            this.origine = origine;
            console.log("[Origine - ionViewDidLoad]Origine loaded : "+JSON.stringify(this.origine));
        });
      } else 
        this.newOrigine = true;
    }
  }

  public editOrigine(origine) {
    if (origine._id)
      this.navCtrl.push(RegionPage,{action:'edit',id:origine._id});
    else
      this.navCtrl.push(RegionPage,{action:'edit'});
  }

  public saveOrigine() {
    console.debug("[Origine - saveOrigine]entering");    
    this.submitted = true;
    if (this.origineForm.valid) {
        // validation succeeded
        console.debug("[Origine - OrigineVin]Origine valid");
        this.pouch.saveDoc(this.cleanValidatorModelObject(this.origine))
        .then(response => {
                if (response.ok) { 
                    console.debug("[Origine - saveOrigine]Origine "+ JSON.stringify(this.origine)+"saved");
                    this.pouch.loadOriginesRefList();
                    this.alertService.success(this.translate.instant('general.dataSaved'),SearchPage,"");
                    //this.navCtrl.push(SearchPage)
                } else {
                    this.alertService.error(this.translate.instant('general.DBError'),SearchPage,"");
                }
        });
    } else {
        console.debug("[Vin - saveVin]vin invalid");
        this.alertService.error(this.translate.instant('general.invalidData'),null);
    }
}

 public deleteOrigine() {
  let _self = this;
  let alert = this.alertController.create({
      title: this.translate.instant('general.confirm'),
      message: this.translate.instant('general.sure'),
      buttons: [
        {
          text: this.translate.instant('general.cancel'),
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        },
        {
          text: this.translate.instant('general.ok'),
          handler: () => {
              let result = this.pouch.deleteDoc(this.origine).then(response => {
                  if (response.ok) {
                      this.pouch.loadOriginesRefList();                    
                      this.alertService.success(this.translate.instant('origin.originDeleted'),SearchPage,'');
                    } else {
                      this.alertService.error(this.translate.instant('origin.originNotDeleted'),undefined,'');                        
                  }
              });
          }
        }
      ]
  });
  alert.present();
}

  private cleanValidatorModelObject(obj) {
    let result={};
    for (var key in obj) {
        if (key.charAt(0)!='_' || (key=='_id' && obj[key])) result[key]=obj[key];
    }
    return result;
}


}
