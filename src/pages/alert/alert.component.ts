import { TranslateService } from '@ngx-translate/core';
import { NavController, AlertController } from 'ionic-angular';
import { Component } from '@angular/core';
import { Subscription } from 'rxjs';

import { AlertService } from '../../services/alert.service';

@Component({
    selector: 'alert',
    templateUrl: 'alert.component.html'
})

export class AlertComponent {
    message: any;
    subscription:Subscription;

    constructor(private alertService: AlertService,
                public alertController:AlertController, 
                private navCtrl : NavController, 
                private translate:TranslateService) {            
    }

    ngOnInit() {
        console.log("[AlertComponent] - entering ngOnInit");

        this.subscription = this.alertService.getMessage()
        .subscribe(
            message => { 
                console.log("[AlertComponent]alert component got message :" +JSON.stringify(message));
                this.message = message; 
                if (message && message.presentation=="dialog" && (message.type=="success" || message.type=="error")) {
                    let alert = this.alertController.create({
                        title: this.translate.instant('general.confirm'),
                        message: message.text,
                        buttons: [
                        {
                            text: this.translate.instant('general.ok'),
                            handler: () => {
                                if (message.nextPage && message.nextPage!=null)
                                this.navCtrl.setRoot(message.nextPage);
                            }                        }
                        ],
                        // cssClass: message.type=="success"?'alertDanger':'alertDanger'
                        cssClass: 'testClass'
                    });
                    alert.present();
                }
                else if (message && message.type && message.type=="off") {
                    this.unsubscribe();
                    if (message && message.nextPage && message.nextPage!=null)
                        this.navCtrl.setRoot(message.nextPage)
                }
            }
        );
    }

    ngOnDestroy(){
        console.log("[AlertComponent] - entering ngOnDestroy");
        this.subscription.unsubscribe();
      }

    unsubscribe() {
        this.subscription.unsubscribe();
    }

}