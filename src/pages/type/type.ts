import { TypeModel } from './../../models/cellar.model';
import { SearchPage } from './../search/search';
import { TranslateService } from '@ngx-translate/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Component } from '@angular/core';
import { NavController, NavParams, AlertController } from 'ionic-angular';
import { PouchdbService } from './../../services/pouchdb.service';
import { AlertService } from './../../services/alert.service';

@Component({
  selector: 'page-typen',
  templateUrl: 'type.html'
})
export class TypePage {

  public type:TypeModel = new TypeModel("","");
  public typeList:Array<TypeModel>=[];
  public submitted:boolean;
  public typeForm:FormGroup;
  public newType:boolean=false;
  
  constructor(public navCtrl: NavController,
              public navParams: NavParams, 
              public pouch:PouchdbService,
              public formBuilder: FormBuilder,
              public alertService:AlertService,
              public alertController:AlertController,
              public translate:TranslateService) {
      this.typeForm = formBuilder.group({
        type: ['',Validators.required]    
    });
    this.submitted = false;
          
  }

  public ionViewDidLoad() {
    console.log("[TypePage - ionViewDidLoad]called");
    // If we come on this page on the first time, the parameter action should be set to 'list', so that we get the see the list of appellations 
    if (this.navParams.get('action')=='list') {
      this.pouch.getDocsOfType('type')
      .then(result => { this.typeList = result;
                        console.log("[TypePage - ionViewDidLoad]typeList : "+JSON.stringify(this.typeList));        
                      });   
    } 
    // if we come on this page with the action parameter set to 'edit', this means that we either want to add a new appellation (id parameter is not set)
    // or edit an existing one (id parameter is set)
    else {
      if (this.navParams.get('id')) {
        this.pouch.getDoc(this.navParams.get('id'))
        .then(type => {
            this.type = type;
            console.log("[AppellationPage - ionViewDidLoad]AppellationPage loaded : "+JSON.stringify(this.type));
        });
      } else 
        this.newType = true;
    }
  }

  public editType(type) {
    if (type._id)
      this.navCtrl.push(TypePage,{action:'edit',id:type._id});
    else
      this.navCtrl.push(TypePage,{action:'edit'});
  }

  public saveType() {
    console.debug("[Type - saveType]entering");    
    this.submitted = true;
    if (this.typeForm.valid) {
        // validation succeeded
        console.debug("[TypePage - save]Type valid");
        this.pouch.saveDoc(this.cleanValidatorModelObject(this.type),'type')
        .then(response => {
                if (response.ok) { 
                    console.debug("[TypePage - saveType]Type "+ JSON.stringify(this.type)+"saved");
                    //this.pouch.loadAppellationsRefList();
                    this.alertService.success(this.translate.instant('general.dataSaved'),SearchPage,"");
                    //this.navCtrl.push(SearchPage)
                } else {
                    this.alertService.error(this.translate.instant('general.DBError'),SearchPage,"");
                }
        });
    } else {
        console.debug("[Type - saveType]type invalid");
        this.alertService.error(this.translate.instant('general.invalidData'),null);
    }
}

 public deleteType() {
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
              this.pouch.deleteDoc(this.type).then(response => {
                  if (response.ok) {
                      //this.pouch.loadAppellationsRefList();                    
                      this.alertService.success(this.translate.instant('type')+this.translate.instant('isDeleted'),SearchPage,'');
                    } else {
                      this.alertService.error(this.translate.instant('type')+this.translate.instant('isNotDeleted'),undefined,'');                        
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
