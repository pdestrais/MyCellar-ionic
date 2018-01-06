import { LoggerService } from './../../services/log4ts/logger.service';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Http } from '@angular/http';

/**
 * Generated class for the AboutPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-about',
  templateUrl: 'about.html',
})
export class AboutPage {

  public appInfo:any={name : "MyCellar", version : "1.1.0", author: "Philippe Destrais"};

  constructor(public navCtrl: NavController, public navParams: NavParams, public http:Http, public logger:LoggerService) {
  }


  ionViewDidLoad() {
    this.logger.log('Entering');
  }

}
