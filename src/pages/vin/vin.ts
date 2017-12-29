import { Subject } from 'rxjs/Subject';
import { TranslateService } from '@ngx-translate/core';
import { Component,OnInit,OnDestroy } from '@angular/core';
import { NavController, NavParams, AlertController,ModalController,ViewController,Platform } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PouchdbService } from './../../services/pouchdb.service';
import { VinModel, AppellationModel, OrigineModel,TypeModel } from '../../models/cellar.model'
import { AlertService } from './../../services/alert.service';
import { SearchPage } from '../search/search'
import moment from 'moment';

@Component({
  selector: 'page-vin',
  templateUrl: 'vin.html'
})
export class VinPage implements OnInit,OnDestroy {

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
  private obs:Subject<string> = new Subject();
  public priceRegExp:RegExp = new RegExp("^[0-9]+(,[0-9]{1,2})?$");

  constructor(public navCtrl: NavController, 
              public navParams: NavParams, 
              public pouch:PouchdbService,
              public formBuilder: FormBuilder,
              public alertService:AlertService,
              public translate:TranslateService,
              public alertController:AlertController,
              public modalCtrl:ModalController) {
    console.log('[VinPage constructor]params is :'+JSON.stringify(navParams));
    this.vin = new VinModel('','','',0,0,0,'','','','',[],'',new AppellationModel('','',''),new OrigineModel('','',''),new TypeModel('',''));
    this.vinForm = formBuilder.group({
        nom: ['',Validators.required],
        annee: ['',Validators.compose([Validators.minLength(4),Validators.maxLength(4), Validators.pattern('[0-9]*'), Validators.required])],
        type: ['',Validators.required],
        origine: ['',Validators.required],
        appellation: ['',Validators.required],
        nbreBouteillesAchat: [0,Validators.required],
        nbreBouteillesReste: [0,Validators.compose([Validators.pattern('[0-9]*'), Validators.required])],
        prixAchat: [0,Validators.compose([Validators.pattern('^[0-9]+((,[0-9]{1,2})|(.[0-9]{1,2}))?$'), Validators.required])],
//        prixAchat: [0,Validators.required],
        dateAchat: ['',Validators.required],
        localisation: ['',Validators.required]      
    });
    this.submitted = false;
  }   
  
  public ngOnInit() {
    console.log("[Vin - ngOnInit]called");
    this.paramId = this.navParams.get('id');
    this.obs.subscribe(message => {
        console.log('ngOnInit Subject emitted test message '+message)
        if (this.paramId) {
           this.pouch.getDoc(this.paramId)
           .then(vin => {
               console.log("vin "+JSON.stringify(vin));
               Object.assign(this.vin, vin); 
               this.nbreAvantUpdate=this.vin.nbreBouteillesReste; 
               this.newWine=false;
               console.log("[Vin - ngOnInit]Vin loaded : "+JSON.stringify(this.vin));
           });
       } else {
           let now = moment();
           // Search for type that correspond to "red" and use it's _id to initialize the vin attribute
           if (this.types && this.types.length > 0) {
               let preselectedType = this.types.find(e => {
                                                               return (e.nom == "Rouge" || e.nom == "Red")
                                                           });
                //console.log("preselected type is : "+JSON.stringify(preselectedType));
                if (preselectedType)
                    this.vin = new VinModel('','','',0,0,0,now.format('YYYY-MM-DD'),'','','',[],'',
                                       new AppellationModel('','',''),
                                       new OrigineModel('','',''),
                                       new TypeModel(preselectedType._id,preselectedType.nom));
                else
                    this.vin = new VinModel('','','',0,0,0,now.format('YYYY-MM-DD'),'','','',[],'',
                                            new AppellationModel('','',''),
                                            new OrigineModel('','',''),
                                            new TypeModel('',''));    
           } else
               this.vin = new VinModel('','','',0,0,0,now.format('YYYY-MM-DD'),'','','',[],'',
                                   new AppellationModel('','',''),
                                   new OrigineModel('','',''),
                                   new TypeModel('',''));    
       }
   });

   this.pouch.getDocsOfType('origine')
   .then(result => {   
                        this.origines = result;
                       this.origines.sort((a,b) => {
                            return ((a.pays+a.region)<(b.pays+b.region)?-1:1); 
                        });
                       //console.log('[VinPage constructor]origines is :'+JSON.stringify(this.origines));
                   });
   this.pouch.getDocsOfType('appellation')
   .then(result => {   this.appellations = result;
                        this.appellations.sort((a,b) => {
                            return ((a.courte+a.longue)<(b.courte+b.longue)?-1:1); 
                        });
                        //console.log('[VinPage constructor]appellations is :'+JSON.stringify(this.appellations));
                   });
       
   this.pouch.getDocsOfType('type')
   .then(result => {   this.types = result;
                        this.types.sort((a,b) => {
                            return ((a.nom)<(b.nom)?-1:1); 
                        });
                    //console.log('[VinPage constructor]types is :'+JSON.stringify(this.types));
                       this.obs.next('typeLoaded');
                   });  
 }

  public ngOnDestroy() {
    console.log("[Vin - ngOnDestroy]called");
    this.obs.unsubscribe();
  }

  public ionViewWillEnter() {
    console.log("[Vin - ionViewWillEnter]called");    
  }

  public ionViewDidLoad() {
    console.log("[Vin - ionViewDidLoad]called");
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
        this.pouch.saveDoc(this.vin,'vin')
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
                    } else {
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
        this.vin[attribute] = this.vin[attribute].replace(",", '.');
        this.vin[attribute] = parseFloat(this.vin[attribute]);
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