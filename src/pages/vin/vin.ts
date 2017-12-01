import { TranslateService } from '@ngx-translate/core';
import { Component } from '@angular/core';
import { NavController, NavParams, AlertController,ModalController,ViewController,Platform } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SimpleCacheService } from './../../services/simpleCache.service';
import { PouchdbService } from './../../services/pouchdb.service';
import { VinModel, AppellationModel, OrigineModel,TypeModel } from '../../models/cellar.model'
import { AlertService } from './../../services/alert.service';
import { SearchPage } from '../search/search'

@Component({
  selector: 'page-vin',
  templateUrl: 'vin.html'
})
export class VinPage {

  public paramId:string;
  public nbreAvantUpdate:number = 0;
  public newWine:boolean = true;
  public vin:VinModel;
  public origines:Array<any>=[];
  public appellations:Array<any>=[];
  public types:Array<any>=[];
  public comment:string = '';
  public errors:Array<any>;   
  public vinForm:FormGroup;
  public submitted:boolean;

  constructor(public navCtrl: NavController, 
              public navParams: NavParams, 
              public cache:SimpleCacheService, 
              public pouch:PouchdbService,
              public formBuilder: FormBuilder,
              public alertService:AlertService,
              public translate:TranslateService,
              public alertController:AlertController,
              public modalCtrl: ModalController) {
    console.log('[VinPage constructor]params is :'+JSON.stringify(navParams));
    this.paramId = navParams.get('id');
    this.pouch.getDocsOfType('origine')
    .then(result => {   this.origines = result;
                        //console.log('[VinPage constructor]origines is :'+JSON.stringify(this.origines));
                    });
    this.pouch.getDocsOfType('appellation')
    .then(result => {   this.appellations = result;
                        //console.log('[VinPage constructor]appellations is :'+JSON.stringify(this.appellations));
                    });
        
    this.pouch.getDocsOfType('type')
    .then(result => {   this.types = result;
                        //console.log('[VinPage constructor]types is :'+JSON.stringify(this.types));
                    });  
    this.vin = new VinModel('','','',0,0,0,'','','','',[],'',new AppellationModel('','',''),new OrigineModel('','',''),new TypeModel('',''));
    this.vinForm = formBuilder.group({
        nom: ['',Validators.required],
        annee: ['',Validators.compose([Validators.minLength(4),Validators.maxLength(4), Validators.pattern('[0-9]*'), Validators.required])],
        type: ['',Validators.required],
        origine: ['',Validators.required],
        appellation: ['',Validators.required],
        nbreBouteillesAchat: [0,Validators.required],
        nbreBouteillesReste: [0,Validators.compose([Validators.pattern('[0-9]*'), Validators.required])],
        prixAchat: [0,Validators.compose([Validators.pattern('[0-9]*(?:[.,])[0-9]*'), Validators.required])],
        dateAchat: ['',Validators.required],
        localisation: ['',Validators.required]      
    });
    this.submitted = false;
}
  
  public ionViewDidLoad() {
    console.log("[Vin - ionViewDidLoad]called");
    console.log("[Vin - ionViewDidLoad]Vin initialized : "+JSON.stringify(this.vin));
    if (this.paramId) {
        this.pouch.getDoc(this.paramId)
        .then(vin => {
            console.log("vin "+JSON.stringify(vin));
            Object.assign(this.vin, vin); 
            this.nbreAvantUpdate=this.vin.nbreBouteillesReste; 
            this.newWine=false;
            console.log("[Vin - ionViewDidLoad]Vin loaded : "+JSON.stringify(this.vin));
        });
    } else
        this.vin = new VinModel('','','',0,0,0,'','','','',[],'',new AppellationModel('','',''),new OrigineModel('','',''),new TypeModel('',''));    
  }

  public saveVin() {
    console.debug("[Vin - saveVin]entering");    
    this.submitted = true;
    if (this.vinForm.valid) {
        // validation succeeded
        console.debug("[Vin - saveVin]vin valid");
        this.vin.lastUpdated = new Date().toISOString();
        if (this.newWine) {
            this.vin.history.push({type:'creation',difference:this.vin.nbreBouteillesReste,date:this.vin.lastUpdated,comment:''});
        } else {
            if (this.vin.nbreBouteillesReste-this.nbreAvantUpdate!=0)
                this.vin.history.push({type:'update',difference:this.vin.nbreBouteillesReste-this.nbreAvantUpdate,date:this.vin.lastUpdated,comment:''});   
        }
        if (this.vin.remarque && this.vin.remarque!='') {
            this.vin.history.push({type:'comment',date:this.vin.lastUpdated,comment:this.vin.remarque,difference:0});
            this.vin.remarque='';
        }
        this.pouch.saveVin(this.vin)
        .then(response => {
                if (response.ok) { 
                    console.debug("[Vin - saveVin]vin "+ JSON.stringify(this.vin)+"saved");
                    this.alertService.success(this.translate.instant('general.dataSaved'),SearchPage);
                    //this.navCtrl.push(SearchPage)
                } else {
                    this.alertService.error(this.translate.instant('general.DBError'),SearchPage);
                }
        });
    } else {
        console.debug("[Vin - saveVin]vin invalid");
        this.alertService.error(this.translate.instant('general.invalidData'),null);
    }
}

public deleteVin() {
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
                this.pouch.deleteDoc(this.vin).then(response => {
                    if (response.ok) {
                        this.alertService.success(this.translate.instant('wine.wineDeleted'),SearchPage,'dialog');
/*                         this.pouch.getCollection(this.pouch.vinView)
                        .then(vins => vins.map(v => this.cache.set("vinList",v._id,v)));
                        this.navCtrl.setRoot(SearchPage);
 */                    } else {
                        this.alertService.error(this.translate.instant('wine.wineNotDeleted'),undefined,'dialog');                        
                    }
                });
            }
          }
        ]
    });
    alert.present();
}

    public cancel() {
        this.navCtrl.pop();
    }

    public showHistory() {
        let modal = this.modalCtrl.create(ModalPage, {vin:this.vin} );
        modal.present();
    }

    public addComment() {
        let alert = this.alertController.create({
            title: this.translate.instant('wine.addComment'),
            inputs: [
                {
                name: 'comment',
                placeholder: this.translate.instant('wine.comment')
                }
            ],
            buttons: [
                {
                text: this.translate.instant('general.cancel'),
                role: 'cancel',
                handler: data => {
                    console.log('Cancel clicked');
                }
                },
                {
                text: 'OK',
                handler: data => { 
                        console.log('add comment data : '+data);
                        this.vin.remarque = data.comment;
                        console.log("add comment - save vin");
                        this.saveVin();
                    }
                }
            ]
            });
        alert.present();
    }

    public typeChange(val: any) {
        this.pouch.newGetDoc(val).then(result => this.vin.type = new TypeModel(result._id,result.nom));
    }

    public origineChange(val: any) {
        this.pouch.newGetDoc(val).then(result => this.vin.origine = new OrigineModel(result._id,result.pays,result.region));
    }

    public appellationChange(val: any) {
        this.pouch.newGetDoc(val).then(result => this.vin.appellation = new AppellationModel(result._id,result.courte,result.longue));
    }

    public showDate(ISODateString) {
        return ISODateString.substring(0,10)
    } 

    public toNumber(attribute:string){
        this.vin[attribute] = +this.vin[attribute];
        console.log(attribute+' changed: '+this.vin[attribute]);
      }
}

@Component({
    template: `
  <ion-header>
    <ion-navbar>
        <ion-buttons start>
            <button ion-button (click)="dismiss()">Close</button>
        </ion-buttons>
        <ion-title>{{'wine.history' | translate }}</ion-title>
    </ion-navbar>
  </ion-header>
  <ion-content>
    <ion-card *ngFor="let event of vin.history">
        <ion-card-header >
            <div *ngIf="event.difference && event.difference!=0">
                {{'wine.addedExtractedOn' | translate }} : &nbsp; {{event.date}}  
            </div>
            <div *ngIf="event.comment">
                {{'wine.addedOn' | translate }} : &nbsp; {{event.date}}
            </div>
        </ion-card-header>
        <ion-card-content>
            <div *ngIf="event.difference && event.difference!=0">
                {{'wine.difference' | translate }} :&nbsp; <ion-badge item-end>{{event.difference}}</ion-badge>    
            </div>
            <div *ngIf="event.comment">
                {{'wine.comment' | translate }} : &nbsp; {{event.comment}}
            </div>
        </ion-card-content>
    </ion-card>
  </ion-content>
  `
  })
export class ModalPage {
    public vin:VinModel;
  
    constructor(
      public platform: Platform,
      public params: NavParams,
      public viewCtrl: ViewController
    ) {
      this.vin = this.params.get('vin');
      console.log("[ModalPage - constructor]got vin as param : "+JSON.stringify(this.vin));
    }
  
    dismiss() {
      this.viewCtrl.dismiss();
    }
  }