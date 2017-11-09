import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import {Logger} from 'angular2-logger/core';
import {Config} from './config';

/*
  Generated class for the LoggerService provider.
  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class LoggerService {

  public log: Logger;

  constructor(public logger: Logger) {
    this.log = this.logger;
    // Set the log level using the config value
    switch(Config.LogLevel) {
      case "OFF":
        this.log.level = this.logger.Level.OFF;
        break;
      case "ERROR":
        this.log.level = this.logger.Level.ERROR;
        break;
      case "WARN":
        this.log.level = this.logger.Level.WARN;
        break;
      case "INFO":
        this.log.level = this.logger.Level.INFO;
        break;
      case "DEBUG":
        this.log.level = this.logger.Level.DEBUG;
        break;
      default:
        this.log.level = this.logger.Level.LOG;
    }
    console.log("Log level is ", this.log.level);
  }

}