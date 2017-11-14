import { Injectable } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { Observable,BehaviorSubject } from 'rxjs';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class AlertService {
    private subject:Subject<any>;

    constructor() {
        console.log("[AlertService]constructor called");
        this.subject = new Subject();
    }

    // if presentation is "dialog", an alert dialog will be shown. Any other presentation value will mean that a simple message will be shown on the page and disappear after 3 seconds. If no presentation is received, dialog is taken as default.
    // If nextPage is specified, after the alert or message is shown, we are routed to the nextPage
    success(message: string, nextPage?: any, presentation? : string) {
        let self=this;
        this.subject.next({ type: 'success', text: message, nextPage: (typeof nextPage !== 'undefined') ? nextPage : null, presentation : (typeof presentation !== 'undefined') ? presentation : "dialog" });
        setTimeout(function(){
            self.subject.next({type:"off", nextPage: (typeof nextPage !== 'undefined') ? nextPage : null});
        }, 3000)
    }

    error(message: string, nextPage?: any, presentation? : string) {
        this.subject.next({ type: 'error', text: message, nextPage: (typeof nextPage !== 'undefined') ? nextPage : null, presentation : (typeof presentation !== 'undefined') ? presentation : "dialog" });
        let self=this;
        setTimeout(function(){
            self.subject.next({type:"off", nextPage: (typeof nextPage !== 'undefined') ? nextPage : null});}, 3000)
    }

    getMessage(): Observable<any> {
//        return this.subject.asObservable();
        return this.subject;
    }
}