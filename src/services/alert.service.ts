import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class AlertService {
    private subject = new Subject<any>();

    constructor() {
    }

    success(message: string, nextPage?: any, presentation? : string) {
        this.subject.next({ type: 'success', text: message, nextPage: (typeof nextPage !== 'undefined') ? nextPage : null, presentation : (typeof presentation !== 'undefined') ? presentation : "dialog" });
        let self=this;
        setTimeout(function(){self.subject.next();}, 3000)
    }

    error(message: string, nextPage?: any, presentation? : string) {
        this.subject.next({ type: 'error', text: message, nextPage: (typeof nextPage !== 'undefined') ? nextPage : null, presentation : (typeof presentation !== 'undefined') ? presentation : "dialog" });
        let self=this;
        setTimeout(function(){self.subject.next();}, 3000)
    }

    getMessage(): Observable<any> {
        return this.subject.asObservable();
    }
}