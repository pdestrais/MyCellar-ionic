import { VinPage } from './../vin/vin';
import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { PouchdbService } from './../../services/pouchdb.service';
import { VinModel } from '../../models/cellar.model'
import * as d3 from 'd3';
//import { d3 } from 'd3';

@Component({
  selector: 'page-rapport',
  templateUrl: 'rapport.html'
})
export class RapportPage {

  private vins:Array<VinModel>;
  private vinsFiltered:Array<VinModel>;
  private typesGrouping:Array<any> =[];
  private typesOrigineGrouping:Array<any> =[];
  private typesOrigineYearGrouping:Array<any> =[];
  private breadcrumb:Array<any>=[];
  
  constructor(public navCtrl: NavController,public navParams: NavParams, public pouch:PouchdbService) {
  }
  
  public ionViewDidLoad() {
    console.log("[Rapport - ionViewDidLoad]called");
    let ddStruct = this.navParams.get("ddStruct");
    if (ddStruct && ddStruct.type && ddStruct.origine && ddStruct.year) {
      //let viewStack:any = this.navCtrl._views;
      this.breadcrumb[0] =  {selected:ddStruct.type,back:3};
      this.breadcrumb[1] =  {selected:ddStruct.origine,back:2};
      this.breadcrumb[2] =  {selected:ddStruct.year,back:1};
      this.pouch.getVins()
      .then(vins => { this.vinsFiltered = vins.filter(v => {
                                              return (v.doc.nbreBouteillesReste != 0 && 
                                                  v.doc.type.nom == ddStruct.type.key && 
                                                  v.doc.origine.pays+' - '+v.doc.origine.region == ddStruct.origine.key &&
                                                  v.doc.annee == ddStruct.year.key ); 
                                            })
                                      .map(v => v.doc);
              
                      console.debug("[Rapport - ionViewDidLoad]# vins loaded with type/region/annee: "+this.vinsFiltered.length+" - "+ddStruct.type.key+"/"+ddStruct.origine.key+"/"+ddStruct.year.key);
      });      
    } else if (ddStruct && ddStruct.type && ddStruct.origine) {
      //let viewStack:any = this.navCtrl._views;
      this.breadcrumb[0] =  {text:ddStruct.type.key,number:ddStruct.type.value,selected:ddStruct.type,back:2};
      this.breadcrumb[1] =  {text:ddStruct.origine.key,number:ddStruct.origine.value,selected:ddStruct.origine,back:1};
      //this.typesGrouping = undefined;
      //this.typesOrigineGrouping = undefined;
      this.pouch.getVins()
      .then(vins => { this.vins = vins.map(v => v.doc);
              console.debug("[Rapport - ionViewDidLoad]# vins loaded with type/region: "+this.vins.length+" - "+ddStruct.type.key+"/"+ddStruct.origine.key);
            this.typesOrigineYearGrouping = d3.nest()
              .key(function(d:any) { return d.annee; })
              .rollup(function(v) { return d3.sum(v, function(d:any) { return d.nbreBouteillesReste; }); })
              .entries(this.vins.filter(function(d) { return (d.nbreBouteillesReste !=0 && 
                                                              d.type.nom == ddStruct.type.key && 
                                                              d.origine.pays+' - '+d.origine.region == ddStruct.origine.key) 
                                                    }));
              console.log("[Rapport - ionViewDidLoad]typesOrigineYearGrouping : "+JSON.stringify(this.typesOrigineYearGrouping));
              this.typesOrigineYearGrouping.sort(function (a, b) {
                if (a.key < b.key) { return -1; }
                if (a.key > b.key) { return 1; }
                // names must be equal
                return 0;
            })
});      
    } else if (ddStruct && ddStruct.type) {
      //let viewStack:any = this.navCtrl._views;
      this.breadcrumb[0] =  {text:ddStruct.type.key,number:ddStruct.type.value,selected:ddStruct.type,back:1};
      //this.typesGrouping = undefined;
      this.pouch.getVins()
      .then(vins => { this.vins = vins.map(v => v.doc);
              console.debug("[Rapport - ionViewDidLoad]# vins loaded with type: "+this.vins.length+" - "+ddStruct.type.nom);
            this.typesOrigineGrouping = d3.nest()
              .key(function(d:any) { return d.origine.pays+' - '+d.origine.region; })
              .rollup(function(v) { return d3.sum(v, function(d:any) { return d.nbreBouteillesReste; }); })
              .entries(this.vins.filter(function(d) { return (+d.nbreBouteillesReste !=0 && 
                                                              d.type.nom == ddStruct.type.key) 
                                                    }));
              console.log("[Rapport - ionViewDidLoad]typesGrouping : "+JSON.stringify(this.typesOrigineGrouping));
      });      
    } else if (!ddStruct) {
      this.pouch.getVins()
      .then(vins => { this.vins = vins.map(v => v.doc);
              console.debug("[Rapport - ionViewDidLoad]# vins loaded : "+this.vins.length);
              this.typesGrouping = d3.nest()
              .key(function(d:any) { return d.type.nom; })
              .rollup(function(v) { return d3.sum(v, function(d:any) { return d.nbreBouteillesReste; }); })
              .entries(this.vins.filter(function(d:any) { return (d.nbreBouteillesReste != 0 || d.nbreBouteillesReste != "0") }));
              console.log("[Rapport - ionViewDidLoad]typesGrouping : "+JSON.stringify(this.typesGrouping));
      });
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
    this.navCtrl.setRoot(VinPage,{id:wine._id});    
  }
  goBack(index:number) {
    for (let i=1;i<=index;i++) {
      this.navCtrl.pop();
    }
  }

}
