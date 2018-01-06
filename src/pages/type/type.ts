import { LoggerService } from './../../services/log4ts/logger.service';
import { TypeModel } from './../../models/cellar.model';
import { SearchPage } from './../search/search';
import { TranslateService } from '@ngx-translate/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Component } from '@angular/core';
import { NavController, NavParams, AlertController } from 'ionic-angular';
import { PouchdbService } from './../../services/pouchdb.service';
import { AlertService } from './../../services/alert.service';

@Component({
  selector: 'page-type',
  templateUrl: 'type.html'
})
export class TypePage {

  public type:TypeModel = new TypeModel("","");
  public typeList:Array<TypeModel>=[];
  public typesMap:Map<any,any>
  public submitted:boolean;
  public typeForm:FormGroup;
  public newType:boolean=false;
  public list:boolean=true;
  
  constructor(public navCtrl: NavController,
              public navParams: NavParams, 
              public pouch:PouchdbService,
              public formBuilder: FormBuilder,
              public alertService:AlertService,
              public alertController:AlertController,
              public translate:TranslateService,
              public logger:LoggerService) {
      this.typeForm = formBuilder.group({
        nom: ['',Validators.required]    
    },{validator:this.noDouble.bind(this)});
    this.submitted = false;
    this.pouch.getDocsOfType('type').then(types => {
        this.typesMap = new Map(types.map((el) => [el.nom, el]));
        this.typeList = types;
        this.logger.log("[TypePage - ionViewDidLoad]typeList : " + JSON.stringify(this.typeList));
      });          
  }

  public ionViewDidLoad() {
    this.logger.log("[TypePage - ionViewDidLoad]called");
    // If we come on this page on the first time, the parameter action should be set to 'list', so that we get the see the list of appellations 
    if (this.navParams.get('action')=='list') {
      this.list = true;
    } 
    // if we come on this page with the action parameter set to 'edit', this means that we either want to add a new appellation (id parameter is not set)
    // or edit an existing one (id parameter is set)
    else {
      this.list = false;
      if (this.navParams.get('id')) {
        this.pouch.getDoc(this.navParams.get('id'))
        .then(type => {
            this.type = type;
            this.logger.log("[AppellationPage - ionViewDidLoad]AppellationPage loaded : "+JSON.stringify(this.type));
        });
      } else 
        this.newType = true;
    }
  }

  private noDouble(group: FormGroup) {
    this.logger.debug("[Type.noDouble]nodouble called");
    if(!group.controls.nom) return(null);
    let testKey = group.value.nom;
    if (this.typesMap && this.typesMap.has(testKey)) {
      this.logger.log("[Type.noDouble]double detected");
      return({double:true});
    } else
      return(null);
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
  let used=false;
  if (this.type._id) {
    this.pouch.getDocsOfType('vin')
    .then(vins => {
        vins.forEach(vin => {
          if (vin.type._id == this.type._id)
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
        } else {
          this.alertService.error(this.translate.instant('type.cantDeleteBecauseUsed'),undefined,'dialog');
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


}
