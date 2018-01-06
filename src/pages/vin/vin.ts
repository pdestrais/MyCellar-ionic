import { LoggerService } from './../../services/log4ts/logger.service';
import { Subject } from 'rxjs/Subject';
import { TranslateService } from '@ngx-translate/core';
import { Component,OnInit,OnDestroy } from '@angular/core';
import { NavController, NavParams, AlertController,ModalController,ViewController,Platform } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PouchdbService } from './../../services/pouchdb.service';
import { VinModel, AppellationModel, OrigineModel,TypeModel, CoteModel } from '../../models/cellar.model'
import { AlertService } from './../../services/alert.service';
import { SearchPage } from '../search/search'
import { Http,Response } from '@angular/http';
import moment from 'moment';
import HTMLParser from 'fast-html-parser'
import 'rxjs/add/operator/map';

@Component({
  selector: 'page-vin',
  templateUrl: 'vin.html'
})
export class VinPage implements OnInit,OnDestroy {

  public paramId:string;
  public nbreAvantUpdate:number = 0;
  public newWine:boolean = true;
  public vin:VinModel;
  public vinsMap:Map<any,object>;
  public origines:Array<any>=[];
  public appellations:Array<any>=[];
  public types:Array<any>=[];
  public comment:string = '';
  public errors:Array<any>;   
  public vinForm:FormGroup;
  public nameYearForm:FormGroup;
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
              public modalCtrl:ModalController,
              public http:Http,
              public logger:LoggerService) {
    this.logger.log('[VinPage constructor]params is :'+JSON.stringify(navParams));
    this.vin = new VinModel('','','',0,0,0,'','','','',[],'',new AppellationModel('','',''),new OrigineModel('','',''),new TypeModel('',''),'',0,[]);
    this.pouch.getDocsOfType('vin').then(vins => this.vinsMap = new Map(vins.map((v) => [v.nom+v.annee, v])));
    this.nameYearForm = formBuilder.group({
            nom: ['',Validators.required],
            annee: ['',Validators.compose([Validators.minLength(4),Validators.maxLength(4), Validators.pattern('[0-9]*'), Validators.required])],
        },
        { validator :this.noDouble.bind(this) }
    );
    this.vinForm = formBuilder.group({
            nameYearForm : this.nameYearForm,
            type: ['',Validators.required],
            origine: ['',Validators.required],
            appellation: ['',Validators.required],
            nbreBouteillesAchat: [0,Validators.required],
            nbreBouteillesReste: [0,Validators.compose([Validators.pattern('[0-9]*'), Validators.required])],
            prixAchat: [0,Validators.compose([Validators.pattern('^[0-9]+((,[0-9]{1,2})|(.[0-9]{1,2}))?$'), Validators.required])],
    //        prixAchat: [0,Validators.required],
            dateAchat: ['',Validators.required],
            localisation: ['',Validators.required],
            apogee:['',Validators.pattern('^[0-9]{4,4}-[0-9]{4,4}$')]      
        }
    );
    this.submitted = false;
  }   
  
  public ngOnInit() {
    this.logger.log("[Vin.ngOnInit]called");
    this.paramId = this.navParams.get('id');
    // event emitted when types are loaded
    this.obs.subscribe(message => {
        if (this.paramId) {
           this.pouch.getDoc(this.paramId)
           .then(vin => {
               this.logger.log("vin "+JSON.stringify(vin));
               Object.assign(this.vin, vin); 
               this.nbreAvantUpdate=this.vin.nbreBouteillesReste; 
               this.newWine=false;
               this.logger.log("[Vin.ngOnInit]Vin loaded : "+JSON.stringify(this.vin));
           });
       } else {
           let now = moment();
           // Search for type that correspond to "red" and use it's _id to initialize the vin attribute
           if (this.types && this.types.length > 0) {
               let preselectedType = this.types.find(e => {
                                                               return (e.nom == "Rouge" || e.nom == "Red")
                                                           });
                //this.logger.log("preselected type is : "+JSON.stringify(preselectedType));
                if (preselectedType)
                    this.vin = new VinModel('','','',0,0,0,now.format('YYYY-MM-DD'),'','','',[],'',
                                       new AppellationModel('','',''),
                                       new OrigineModel('','',''),
                                       new TypeModel(preselectedType._id,preselectedType.nom),'',0,[]);
                else
                    this.vin = new VinModel('','','',0,0,0,now.format('YYYY-MM-DD'),'','','',[],'',
                                            new AppellationModel('','',''),
                                            new OrigineModel('','',''),
                                            new TypeModel('',''),'',0,[]);    
           } else
               this.vin = new VinModel('','','',0,0,0,now.format('YYYY-MM-DD'),'','','',[],'',
                                   new AppellationModel('','',''),
                                   new OrigineModel('','',''),
                                   new TypeModel('',''),'',0,[]);    
       }
   });

   this.pouch.getDocsOfType('origine')
   .then(result => {   
                        this.origines = result;
                       this.origines.sort((a,b) => {
                            return ((a.pays+a.region)<(b.pays+b.region)?-1:1); 
                        });
                       //this.logger.log('[VinPage constructor]origines is :'+JSON.stringify(this.origines));
                   });
   this.pouch.getDocsOfType('appellation')
   .then(result => {   this.appellations = result;
                        this.appellations.sort((a,b) => {
                            return ((a.courte+a.longue)<(b.courte+b.longue)?-1:1); 
                        });
                        //this.logger.log('[VinPage constructor]appellations is :'+JSON.stringify(this.appellations));
                   });
       
   this.pouch.getDocsOfType('type')
   .then(result => {   this.types = result;
                        this.types.sort((a,b) => {
                            return ((a.nom)<(b.nom)?-1:1); 
                        });
                    //this.logger.log('[VinPage constructor]types is :'+JSON.stringify(this.types));
                       this.obs.next('typeLoaded');
                   });  
 }

  public ngOnDestroy() {
    this.logger.log("[Vin.ngOnDestroy]called");
    this.obs.unsubscribe();
  }

  public ionViewWillEnter() {
    this.logger.log("[Vin.ionViewWillEnter]called");    
  }

  public ionViewDidLoad() {
    this.logger.log("[Vin.ionViewDidLoad]called");
  }

  public saveVin() {
    this.logger.debug("[Vin.saveVin]entering");    
    this.submitted = true;
    if (this.vinForm.valid) {
        // validation succeeded
        this.logger.debug("[Vin.saveVin]vin valid");
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
                    this.logger.debug("[Vin.saveVin]vin "+ JSON.stringify(this.vin)+"saved");
                    this.alertService.success(this.translate.instant('general.dataSaved'),SearchPage);
                    //this.navCtrl.push(SearchPage)
                } else {
                    this.alertService.error(this.translate.instant('general.DBError'),SearchPage);
                }
        });
    } else {
        this.logger.debug("[Vin.saveVin]vin invalid");
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
              this.logger.log('Cancel clicked');
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
                    this.logger.log('Cancel clicked');
                }
                },
                {
                text: 'OK',
                handler: data => { 
                        this.logger.log('add comment data : '+data);
                        this.vin.remarque = data.comment;
                        this.logger.log("add comment - save vin");
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
        if (typeof this.vin[attribute] === 'string') {
            this.vin[attribute] = this.vin[attribute].replace(",", '.');
            this.vin[attribute] = parseFloat(this.vin[attribute]);    
        }
        this.logger.log('[Vin.toNumber]'+attribute+' changed: '+this.vin[attribute]);
      }

    public getGWSScore(){
        this.logger.log("[Vin.getGWSScore]called");
        // Create url
        let prefix = '/api/';
        let url = prefix+this.cleanForUrl(this.vin.nom)+"-"+this.cleanForUrl(this.vin.origine.region)+"/"+this.vin.annee+"/";
        //let url1 = '/api/chateau-maucaillou-moulis-en-medoc/2009/'
        this.logger.log("[Vin.getGWSScore]url :"+url);
        this.http.get(url)
                    .map((res:Response,index:number) => res.text()).subscribe((html) => {
                        let root = HTMLParser.parse(html);
                        let score:HTMLElement = root.querySelector('h2.score');
                        let firstNode:any = score.firstChild;
                        let rawScoreTxt:string = firstNode.rawText;
                        if (rawScoreTxt.search("not enough data")==-1)
                            this.vin.GWSScore = parseFloat(rawScoreTxt.trim());
                    },
                (error) => {this.logger.log("http get error : "+JSON.stringify(error.status))});
    
    }

    private cleanForUrl(text:string){
        return text.trim().toLowerCase().replace(/ /g,"-").replace(/'/g,"").replace(/â/g,"a").replace(/é/g,"e").replace(/è/g,"e").replace(/ê/g,"e").replace(/û/g,"u").replace(/ô/g,"o").replace(/î/g,"i");
    }

    private noDouble(group: FormGroup) {
        this.logger.debug("nodouble called");
        if(!group.controls.nom || !group.controls.annee) return(null);
        let testKey = group.value.nom+group.value.annee
        if (this.vinsMap && this.vinsMap.has(testKey)) {
        this.logger.log("[Vin.noDouble]double detected");
        return({double:true});
        } else
        return(null);
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
      public viewCtrl: ViewController,
      public logger: LoggerService
    ) {
      this.vin = this.params.get('vin');
      this.logger.log("[ModalPage - constructor]got vin as param : "+JSON.stringify(this.vin));
    }
  
    dismiss() {
      this.viewCtrl.dismiss();
    }
  }