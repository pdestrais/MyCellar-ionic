import { LoggerService } from './../../services/log4ts/logger.service';
import { VinPage } from './../vin/vin';
import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { PouchdbService } from './../../services/pouchdb.service';
import { VinModel } from '../../models/cellar.model'
import * as d3 from 'd3';
import moment from 'moment';
//import { d3 } from 'd3';

@Component({
  selector: 'page-rapport',
  templateUrl: 'rapport.html'
})
export class RapportPage {

  private vins:Array<VinModel>;
  private vinsFiltered:Array<VinModel>;
  private readyToDrinkList:Array<VinModel>;
  private typesGrouping:Array<any> =[];
  private typesOrigineGrouping:Array<any> =[];
  private typesOrigineYearGrouping:Array<any> =[];
  private breadcrumb:Array<any>=[];
  
  constructor(public navCtrl: NavController,public navParams: NavParams, public pouch:PouchdbService, private logger:LoggerService) {
    this.logger.log("[Rapport - constructor]called");
  }
  
  public ionViewWillEnter() {
    this.logger.log("[Rapport - ionViewWillEnter]called");
    let ddStruct = this.navParams.get("ddStruct");
    this.readyToDrinkList = this.navParams.get("readyToDrinkList");
    if (!this.readyToDrinkList) {
      this.pouch.getDocsOfType('vin').then(vins => {
        this.vins = vins.sort((a,b) => { return ((a.annee+a.pays+a.region+a.nom)<(b.annee+b.pays+b.region+b.nom)?-1:1); } );
  
        // Showing list of wines selected by type/origin/year
        if (ddStruct && ddStruct.type && ddStruct.origine && ddStruct.year) {
          //let viewStack:any = this.navCtrl._views;
          this.breadcrumb[0] =  {selected:ddStruct.type,back:3};
          this.breadcrumb[1] =  {selected:ddStruct.origine,back:2};
          this.breadcrumb[2] =  {selected:ddStruct.year,back:1};
          this.vinsFiltered = this.vins.filter(v => {
            return (v.nbreBouteillesReste != 0 && 
                v.type.nom == ddStruct.type.key && 
                v.origine.pays+' - '+v.origine.region == ddStruct.origine.key &&
                v.annee == ddStruct.year.key ); 
          });  
          this.logger.debug("[Rapport - ionViewWillEnter]# vins loaded with type/region/annee: "+this.vinsFiltered.length+" - "+ddStruct.type.key+"/"+ddStruct.origine.key+"/"+ddStruct.year.key);
        } 
        else if (ddStruct && ddStruct.type && ddStruct.origine) {
          //let viewStack:any = this.navCtrl._views;
          this.breadcrumb[0] =  {text:ddStruct.type.key,number:ddStruct.type.value,selected:ddStruct.type,back:2};
          this.breadcrumb[1] =  {text:ddStruct.origine.key,number:ddStruct.origine.value,selected:ddStruct.origine,back:1};
          //this.typesGrouping = undefined;
          //this.typesOrigineGrouping = undefined;
          this.logger.debug("[Rapport - ionViewWillEnter]# vins loaded with type/region: "+this.vins.length+" - "+ddStruct.type.key+"/"+ddStruct.origine.key);
          this.typesOrigineYearGrouping = d3.nest()
            .key(function(d:any) { return d.annee; })
            .rollup(function(v) { return d3.sum(v, function(d:any) { return d.nbreBouteillesReste; }); })
            .entries(this.vins.filter(function(d) { return (d.nbreBouteillesReste !=0 && 
                                                            d.type.nom == ddStruct.type.key && 
                                                            d.origine.pays+' - '+d.origine.region == ddStruct.origine.key) 
                                                  }));
          this.logger.log("[Rapport - ionViewWillEnter]typesOrigineYearGrouping : "+JSON.stringify(this.typesOrigineYearGrouping));
          this.typesOrigineYearGrouping.sort((a,b) => { return (a.key<b.key?-1:1); });
          this.logger.log("[Rapport - ionViewWillEnter]typesOrigineYearGrouping : "+JSON.stringify(this.typesOrigineYearGrouping));
        } 
        else if (ddStruct && ddStruct.type) {
          //let viewStack:any = this.navCtrl._views;
          this.breadcrumb[0] =  {text:ddStruct.type.key,number:ddStruct.type.value,selected:ddStruct.type,back:1};
          //this.typesGrouping = undefined;
          this.logger.debug("[Rapport - ionViewWillEnter]# vins loaded with type: "+this.vins.length+" - "+ddStruct.type.key);
          this.typesOrigineGrouping = d3.nest()
            .key(function(d:any) { return d.origine.pays+' - '+d.origine.region; })
            .rollup(function(v) { return d3.sum(v, function(d:any) { return d.nbreBouteillesReste; }); })
            .entries(this.vins.filter(function(d) { return (+d.nbreBouteillesReste !=0 && 
                                                            d.type.nom == ddStruct.type.key) 
                                                  }));
          this.typesOrigineGrouping.sort((a,b) => { return (a.key<b.key?-1:1); });  
          this.logger.log("[Rapport - ionViewWillEnter]typesGrouping : "+JSON.stringify(this.typesOrigineGrouping));
        } else if (!ddStruct) {
            this.logger.debug("[Rapport - ionViewWillEnter]# vins loaded : "+this.vins.length);
              this.typesGrouping = d3.nest()
              .key(function(d:any) { return d.type.nom; })
              .rollup(function(v) { return d3.sum(v, function(d:any) { return d.nbreBouteillesReste; }); })
              .entries(this.vins.filter(function(d:any) { return (d.nbreBouteillesReste != 0 || d.nbreBouteillesReste != "0") }));
              this.logger.log("[Rapport - ionViewWillEnter]typesGrouping after sort : "+JSON.stringify(this.typesGrouping));
        } 
      });        
    }
    if (this.readyToDrinkList) {

    }
  }

  selectType(type:any) {
    this.navCtrl.push(RapportPage,{ddStruct:{type:type}});
  }

  selectOrigine(type:any,origine:any) {
    this.navCtrl.push(RapportPage,{ddStruct:{type:type,origine:origine}});
  }

  selectYear(type:any,origine:any,year:any) {
    this.navCtrl.push(RapportPage,{ddStruct:{type:type,origine:origine,year:year}});
  }

  selectWine(wine) {
//    this.navCtrl.setRoot(VinPage,{id:wine._id});    
    this.navCtrl.push(VinPage,{id:wine._id});    
  }
  goBack(index:number) {
    for (let i=1;i<=index;i++) {
      this.navCtrl.pop();
    }
  }

  showReadyToDrink() {
    let now = moment();
    this.readyToDrinkList=[];
    this.vins.forEach(v => {
      if (v.apogee) {
        let drinkFromTo = v.apogee.split("-");
        if (parseInt(drinkFromTo[0]) <= now.year() && parseInt(drinkFromTo[1]) >= now.year())
          this.readyToDrinkList.push(v);
      } 
    });       
    this.navCtrl.push(RapportPage,{readyToDrinkList:this.readyToDrinkList});
  }

}
