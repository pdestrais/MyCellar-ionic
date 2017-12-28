import { SearchPage } from './../search/search';
import { TranslateService } from '@ngx-translate/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Component } from '@angular/core';
import { NavController, NavParams, AlertController } from 'ionic-angular';
import { PouchdbService } from './../../services/pouchdb.service';
import { AppellationModel } from '../../models/cellar.model'
import { AlertService } from './../../services/alert.service';

@Component({
  selector: 'page-appellation',
  templateUrl: 'appellation.html'
})
export class AppellationPage {

  public appellation:AppellationModel = new AppellationModel("","","");
  public appellationList:Array<AppellationModel>=[];
  public submitted:boolean;
  public appellationForm:FormGroup;
  public newAppellation:boolean=false;
  
  constructor(public navCtrl: NavController,
              public navParams: NavParams, 
              public pouch:PouchdbService,
              public formBuilder: FormBuilder,
              public alertService:AlertService,
              public alertController:AlertController,
              public translate:TranslateService) {
      this.appellationForm = formBuilder.group({
        courte: ['',Validators.required],
        longue: ['',Validators.required]    
    });
    this.submitted = false;
          
  }

  public ionViewDidLoad() {
    console.log("[AppellationPage - ionViewDidLoad]called");
    // If we come on this page on the first time, the parameter action should be set to 'list', so that we get the see the list of appellations 
    if (this.navParams.get('action')=='list') {
      this.pouch.getDocsOfType('appellation')
      .then(appellations => this.appellationList = appellations);   
        console.log("[AppellationPage - ionViewDidLoad]appellationList : "+JSON.stringify(this.appellationList));        
    } 
    // if we come on this page with the action parameter set to 'edit', this means that we either want to add a new appellation (id parameter is not set)
    // or edit an existing one (id parameter is set)
    else {
      if (this.navParams.get('id')) {
        this.pouch.getDoc(this.navParams.get('id'))
        .then(appellation => {
            this.appellation = appellation;
            console.log("[AppellationPage - ionViewDidLoad]AppellationPage loaded : "+JSON.stringify(this.appellation));
        });
      } else 
        this.newAppellation = true;
    }
  }

  public editAppellation(appellation) {
    if (appellation._id)
      this.navCtrl.push(AppellationPage,{action:'edit',id:appellation._id});
    else
      this.navCtrl.push(AppellationPage,{action:'edit'});
  }

  public saveAppellation() {
    console.debug("[Appellation - saveAppellation]entering");    
    this.submitted = true;
    if (this.appellationForm.valid) {
        // validation succeeded
        console.debug("[Appellation - AppellationVin]Appellation valid");
        this.pouch.saveDoc(this.cleanValidatorModelObject(this.appellation),'appellation')
        .then(response => {
                if (response.ok) { 
                    console.debug("[Appellation - saveAppellation]Appellation "+ JSON.stringify(this.appellation)+"saved");
                    //this.pouch.loadAppellationsRefList();
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

 public deleteAppellation() {
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
              this.pouch.deleteDoc(this.appellation).then(response => {
                  if (response.ok) {
                      //this.pouch.loadAppellationsRefList();                    
                      this.alertService.success(this.translate.instant('appellation.appellationDeleted'),SearchPage,'');
                    } else {
                      this.alertService.error(this.translate.instant('appellation.appellationNotDeleted'),undefined,'');                        
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
