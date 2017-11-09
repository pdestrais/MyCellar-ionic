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

  private vins:Array<VinModel>;
  public searchTerm: string = '';
  public vinsForSearch:Array<VinModel>;
  public stock:boolean;
  public loading:boolean = false;
  public items:Array<any>;
  public searchControl: FormControl;
  public searching: boolean = false;
  public isInStock:boolean = true;

  constructor(public pouchDB:PouchdbService, public navCtrl: NavController) {
    this.searchControl = new FormControl();
  }

  ionViewDidLoad() {
    console.debug("in ionViewDidLoad");
/*     this.pouchDB.getListener().subscribe((change) => {
      if (change.message == 'SyncStarts') {
        this.loading = true;
      } 
      if (change.message == 'dbUpToDate') {
        console.log('dbUpToDate Event received in ionViewDidLoad'); 
        this.loadVins();               
      }
    });
 */}

  ionViewWillEnter() {
    console.debug("in ionViewWillEnter");
    this.loading = true;
    this.loadVins()
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
      this.pouchDB.getVins().then(vins => {
        this.vins = vins.map(v => v.doc);
        this.loading = false; 
        console.log("[Search]Vin loaded - # vins"+this.vins?this.vins.length:"undefined");
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
