import { SearchPage } from './../search/search';
import { TranslateService } from '@ngx-translate/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Component } from '@angular/core';
import { NavController, NavParams, AlertController } from 'ionic-angular';
import { PouchdbService } from './../../services/pouchdb.service';
import { OrigineModel } from '../../models/cellar.model'
import { AlertService } from './../../services/alert.service';
import { LoggerService } from '../../services/log4ts/logger.service';

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
  public list:boolean=true;
  
  constructor(public navCtrl: NavController,
              public navParams: NavParams, 
              public pouch:PouchdbService,
              public formBuilder: FormBuilder,
              public alertService:AlertService,
              public alertController:AlertController,
              public translate:TranslateService,
              public logger:LoggerService) {
      this.origineForm = formBuilder.group({
        pays: ['',Validators.required],
        region: ['',Validators.required]    
      } ,{ asyncValidator: this.noDouble.bind(this) } );
      this.submitted = false;
          
  }

  public ionViewDidLoad() {
    //this.logger.log("[Region - ionViewDidLoad]called");
    // Loading Origine list for validation (double) purposes in case of edit action and to display in case of list action
    this.pouch.getDocsOfType('origine')
    .then(origines => this.origineList = origines.sort((a,b) => { return ((a.pays+a.region)<(b.pays+b.region)?-1:1); } ) );      
  // If we come on this page on the first time, the parameter action should be set to 'list', so that we get the see the list of origines 
    if (this.navParams.get('action')=='list') {
      this.list = true;
    } 
    // if we come on this page with the action parameter set to 'edit', this means that we either want to add a new origine (id parameter is not set)
    // or edit an existing one (id parameter is set)
    else {
      this.list=false;
      if (this.navParams.get('id')) {
        this.pouch.getDoc(this.navParams.get('id'))
        .then(origine => {
            this.origine = origine;
            this.logger.log("[Origine - ionViewDidLoad]Origine loaded : "+JSON.stringify(this.origine));
        });
      } else {
        this.newOrigine = true;
      }
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
    let neworigine:boolean = this.origine._id?false:true;
    if (this.origineForm.valid) {
        // validation succeeded
        console.debug("[Origine - OrigineVin]Origine valid");
        // Save new or modified origine
        this.pouch.saveDoc(this.cleanValidatorModelObject(this.origine),'origine')
        .then(response => {
                if (response.ok) { 
                    console.debug("[Origine - saveOrigine]Origine "+ JSON.stringify(this.origine)+"saved");
                    //this.pouch.loadOriginesRefList();
                    this.alertService.success(this.translate.instant('general.dataSaved'),SearchPage,"");
                    //this.navCtrl.push(SearchPage)
                    // If we modify an origine, update all wines where this origine is used
                    if (!neworigine) {
                      this.pouch.getDocsOfType('vin').then(vinlist => {
                        vinlist.map(v => {
                          if (v.origine._id == response.id) {
                            v.origine = this.cleanValidatorModelObject(this.origine);
                            this.pouch.saveDoc(v,'vin');
                          }
                        });
                      })
                    } 
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
  // Check that this origine isn't used in the database 
  let used=false;
  if (this.origine._id) {
    this.pouch.getDocsOfType('vin')
    .then(vins => {
        vins.forEach(vin => {
          if (vin.origine._id == this.origine._id)
            used = true;
        })
        if (!used) {
          let alert = this.alertController.create({
              title: this.translate.instant('general.confirm'),
              message: this.translate.instant('general.sure'),
              buttons: [
                {
                  text: this.translate.instant('general.cancel'),
                  role: 'cancel',
                  handler: () => {
                    this.logger.log('Cancel clicked');
                  }
                },
                {
                  text: this.translate.instant('general.ok'),
                  handler: () => {
                      this.pouch.deleteDoc(this.origine).then(response => {
                          if (response.ok) {
                              //this.pouch.loadOriginesRefList();                    
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
        } else {
          this.alertService.error(this.translate.instant('origin.cantDeleteBecauseUsed'),undefined,'dialog');
        }
      }
    );
  }
}

  private cleanValidatorModelObject(obj) {
    let result={};
    for (var key in obj) {
        if (key.charAt(0)!='_' || (key=='_id' && obj[key])) result[key]=obj[key];
    }
    return result;
  }

  private noDouble(group: FormGroup) {
    return new Promise( resolve => {
      this.logger.log("form valid ? : "+group.valid);
      if(!group.controls.pays || !group.controls.region) resolve(null);
      let pays = group.value.pays;
      let region = group.value.region;
      this.origineList.map(o => {
        if (o.pays == pays && o.region == region) {
          this.logger.log("[Region.noDouble]double detected");
          resolve({double:true});
        } 
      });
      resolve(null);
    });
  }

}
