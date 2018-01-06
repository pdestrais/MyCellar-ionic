import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

import { Logger } from './logger.service';

const noop = (): any => undefined;

@Injectable()
export class ConsoleLoggerService implements Logger {

  get log() {
    if (!environment.level.OFF && environment.level.LOG) {
      return console.log.bind(console);
    } else {
      return noop;
    }
  }

  get debug() {
    if (!environment.level.OFF && environment.level.DEBUG) {
      return console.debug.bind(console);
    } else {
      return noop;
    }
  }

  get info() {
    if (!environment.level.OFF && environment.level.INFO) {
      return console.info.bind(console);
    } else {
      return noop;
    }
  }

  get warn() {
    if (!environment.level.OFF && environment.level.WARN) {
      return console.warn.bind(console);
    } else {
      return noop;
    }
  }

  get error() {
    if (!environment.level.OFF && environment.level.ERROR) {
      return console.error.bind(console);
    } else {
      return noop;
    }
  }

  invokeConsoleMethod(type: string, args?: any): void {
    const logFn: Function = (console)[type] || console.log || noop;
    logFn.apply(console, [args]);
  }
}
