import { LoggerService } from './../../services/log4ts/logger.service';
import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { PouchdbService } from '../../services/pouchdb.service'
import { FormControl } from '@angular/forms';
import { VinPage } from '../vin/vin';

import { VinModel } from '../../models/cellar.model'
import 'rxjs/add/operator/debounceTime';


@Component({
  selector: 'page-search',
  templateUrl: 'search.html'
})

export class SearchPage {

  public vins:Array<VinModel>=[];
  public searchTerm: string = '';
  public vinsForSearch:Array<VinModel>;
  public stock:boolean;
  public loading:boolean = false;
  public items:Array<any>;
  public searchControl: FormControl;
  public searching: boolean = false;
  public isInStock:boolean = true;

  constructor(public pouchDB:PouchdbService, public navCtrl: NavController, public logger: LoggerService) {
    this.searchControl = new FormControl();
  }

  ionViewDidLoad() {
    this.logger.debug("[SearchPage.ionViewDidLoad]entering ");
    this.pouchDB.getPouchDBListener().subscribe((event) => {
      if (event.type == "activeSync") {
        this.logger.log('[SearchPage.ionViewDidLoad]change received : '+JSON.stringify(event.change));
        this.loadVins();
      } 
    });
 }

  ionViewWillEnter() {
    this.logger.debug("[SearchPage.ionViewWillEnter]entering ");
    this.loading = true;
    this.loadVins();
    this.searchControl.valueChanges.debounceTime(500).subscribe(search => { 
      if (this.searchTerm.length == 0)
        this.items = [];
      if (this.searchTerm.length >=3) {
        this.searching = false; 
        this.setFilteredItems();  
      }
    });
  }

  loadVins() {
    this.logger.debug("[SearchPage.loadVins]entering");
      this.pouchDB.getDocsOfType('vin').then((vins) => {
        this.vins = vins;
        this.loading = false; 
        this.vins?this.logger.log("[SearchPage.loadVins]Vin loaded - # vins : "+this.vins.length):this.logger.log("[SearchPage.loadVins]Vin loaded - # vins : undefined");
      })
      .catch((error) => {
        this.logger.log("[SearchPage.loadVins]problem to load vins - error : "+JSON.stringify(error));
        //this.loading = false;
      });        
  }

  onSearchInput(){
    this.searching = true;
  }

  onInStockChange(){
    this.isInStock = !this.isInStock;
    this.setFilteredItems();
  }

  setFilteredItems(){
    this.items = this.vins.filter((item) => {
        if (this.isInStock)
          return item.nom.toLowerCase().indexOf(this.searchTerm.toLowerCase()) > -1 && item.nbreBouteillesReste > 0;
        else
          return item.nom.toLowerCase().indexOf(this.searchTerm.toLowerCase()) > -1
    });    
  }

  goToVin(params){
    if (!params) params = {};
    this.navCtrl.setRoot(VinPage,{id:params});
  }
}
