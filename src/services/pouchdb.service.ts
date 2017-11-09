import { TranslateService } from '@ngx-translate/core';
import { AlertService } from './alert.service';
import { ConfigurationPage } from './../pages/configuration/configuration';
import { Injectable, EventEmitter } from '@angular/core';
//import { NavController } from 'ionic-angular';
import { SimpleCacheService } from './simpleCache.service';
import PouchDB from 'pouchdb';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class PouchdbService {

    private database: any;
    private DBlistener = new Subject<any>();
    private subject = new Subject<any>();

    private remoteServerUrl:string = '';
    private locale:string = '';
    private dbUpToDate:boolean = false;
  
    public vinView:string = 'indexVin';
    public appellationView:string = 'indexAppellation';
    public origineView:string = 'indexOrigine';
    public typeView:string = 'indexType';

    public constructor(/* public navCtrl: NavController, */ 
                        private cache:SimpleCacheService, 
                        private alertService:AlertService, 
                        private translateService:TranslateService) {
      // this.init();
     }

    public sync(remote: string) { 
      let remoteDatabase = new PouchDB(remote);
      this.database.sync(remoteDatabase, {
          live: true, since: 'now', include_docs: true
      }).on('change', change => {
          this.DBlistener.next({change:change,message:'change received'});
          this.handleEventChanges(change);
      });
    }

    private handleEventChanges(change) {
      if (change.deleted){ 
        this.cache.delete(change.doc.type+'List', change.doc._id)
      } else 
        this.cache.set(change.doc.type+'List',change.doc._id,change.doc)
    }

    public getListener() { 
      return this.DBlistener;
    }

    public getMessage(): Observable<any> {
      return this.subject.asObservable();
    }

    public switchDB(newConfig) {
      let _self = this;
      this.database.destroy().then(response => {
        // destroy local database
        console.info("database destroyed");
        this.database = new PouchDB('cave');
        // replicate remote DB to local
        this.DBlistener.next({change:undefined,message:'ReplicationStarts'});          
        PouchDB.replicate(newConfig.serverUrl,this.database)
        .on('complete', function (info) {
          // handle complete
          _self.DBlistener.next({change:undefined,message:'ReplicationEnds'});
          // store new config in local db
          _self.put('config', newConfig)
          .then(result => {
            console.info("new config saved");
            _self.alertService.success(_self.translateService.instant('newConfigSaved'));
            _self.syncDB();
          })
          .catch(err => {
            console.info("new config not saved");
            _self.alertService.success(_self.translateService.instant('newConfigNotSaved'))
          });
        })
        .on('error', function (err) {
          // handle error
          _self.DBlistener.next({error:err,message:'ReplicationError'});
        });;
      });		
    }
  

    public init() {
      console.log("[PouchDBService init]called");
      let _self = this;
      this.database = new PouchDB('cave');
      //this.database.setMaxListeners(20);
      this.database.info().then( info => {
        console.log('We have a database: ' + JSON.stringify(info));
        this.database.get('config').then(result => {
          _self.remoteServerUrl = result.serverUrl;
          _self.locale = result.locale;
          //result.locale
          //  ?this.i18n.setLocale(result.locale).then(() => console.log('Langue adaptée -> '+result.locale))
          //  :this.i18n.setLocale("en-US").then(() => console.log('Langue par défaut -> '+"en-US"));
         // _self.createdatabaseViews();
          _self.DBlistener.next({change:undefined,message:'SyncStarts'});
          console.info('Start syncing with: ' + _self.remoteServerUrl);
          _self.syncDB();
        })
        .catch(err => this.subject.next({ type: 'error', message: 'DB not configured' }));
      });
    }
  
    public syncDB() {
      console.log("[PouchDBService syncDB]called")
      let _self = this;
      this.database.sync(this.remoteServerUrl, {
  //		this.database.sync('cave', "https://pdestrais:id513375@pdestrais.cloudant.com/cave", {
        live: true,
        retry: true
        })
      .on('change', function (info) {
        console.info('Database changed : ' + JSON.stringify(info));
      }).on('paused', function (err) {
        _self.dbUpToDate = true;
          console.info('Database paused');
          console.info('databaseUpToDate Event emitted '+JSON.stringify(err));
          _self.loadRefDataInCache();
        _self.DBlistener.next({change:undefined,message:'dbUpToDate'});
      }).on('active', function () {
        console.info('Database active : ');
      }).on('denied', function (err) {
        console.info('Database access denied : ' + JSON.stringify(err));
      }).on('complete', function (info) {
        console.info('Database access completed : ' + JSON.stringify(info));
        _self.DBlistener.next({change:undefined,message:'SyncEnds'});
      }).on('error', function (err) {
        console.error('Database error : ' + JSON.stringify(err));
      });
    }
  
    public loadOriginesRefList() {
      return this.database.query('indexOrigine',{include_docs:true})
              .then(result => result.rows.map(doc => this.cache.set('origineList',doc.id, doc.value)))
    }
  
    public loadAppellationsRefList() {
      return this.database.query('indexAppellation',{include_docs:true})
            .then(result => result.rows.map(doc => this.cache.set('appellationList',doc.id, doc.value)))
    }
  
    public loadTypesRefList() {
      return this.database.query('indexType',{include_docs:true})
            .then(result => result.rows.map(doc => {
                this.cache.set('typeList',doc.id, doc.value);
              }
            ))
    }
  
    public loadRefDataInCache() {
      return Promise.all([this.loadOriginesRefList(),this.loadAppellationsRefList(),this.loadTypesRefList()]);
    }
  
    private createDesignDoc(name, mapFunction, reduceFunction) {
      let ddoc = {
        _id: '_design/' + name,
        views: {
        }
      };
      if (reduceFunction) {
        ddoc.views[name] = { map: mapFunction.toString(), reduce: reduceFunction.toString() };
      } else {
        ddoc.views[name] = { map: mapFunction.toString() };
      }
      return ddoc;
    }
  
    public createdatabaseViews() {
      // Creation des view dans database locale
      console.info("Création des vues ...");
      // view used to check if there is no wine already with this name|annee
      let indexVinView = this.createDesignDoc('indexVin',
                                              "function (doc) { if (doc && doc._id.substring(0,3) == 'vin') {emit(doc.nom+'|'+doc.annee,doc);} }",
                                              undefined);
      this.database.put(indexVinView)
      .then(doc => console.info('indexVinView created'))
      .catch(err => console.info('indexVinView already exists: ' + JSON.stringify(err)));
  
      // view used to check if there is no appellation already with this appellation courte|longue
      let indexAppellationView = this.createDesignDoc('indexAppellation',
                                                      "function (doc) { if (doc && doc.courte && doc.longue) {emit(doc.courte+'|'+doc.longue,doc);} }",
                                                      undefined);
      this.database.put(indexAppellationView)
      .then(doc => console.info('indexAppellationView created'))
      .catch(err => console.info('indexAppellationView already exists: ' + JSON.stringify(err)));
  
      // view used to check if there is no origine already with this pays|region
      let indexOrigineView = this.createDesignDoc('indexOrigine',
                                                  "function (doc) { if (doc && doc.pays && doc.region) {emit(doc.pays+'|'+doc.region,doc);} }",
                                                  undefined);
      this.database.put(indexOrigineView)
      .then(doc => console.info('indexOrigineView created'))
      .catch(err => console.info('indexOrigineView already exists: ' + JSON.stringify(err)));
          
      // view used to check if there is no type already with this name
      let indexTypeView = this.createDesignDoc('indexType',
                                                "function (doc) { if (doc && doc._id.substring(0,4)=='type') {emit(doc.nom,doc);} }",
                                                undefined);
      this.database.put(indexTypeView)
      .then(doc => console.info('indexTypeView created'))
      .catch(err => console.info('indexTypeView already exists: ' + JSON.stringify(err)));
          
      // view used to check if there is no type already with this name
      let usedAppellationView = this.createDesignDoc('usedAppellation',
                                                      "function (doc) { if (doc && doc._id.substring(0,3) == 'vin') {emit(doc.appellation.id);} }",
                                                      undefined);
      this.database.put(usedAppellationView)
      .then(doc => console.info('usedAppellationView created'))
      .catch(err => console.info('usedAppellationView already exists: ' + JSON.stringify(err)));
      
      // view used to check if there is no type already with this name
      let selectAppellationView = this.createDesignDoc('selectAppellation',
                                                      "function (doc) { if (doc && doc._id.substring(0,3) == 'vin') {emit(doc.appellation.id,doc);} }",
                                                      undefined);
      this.database.put(selectAppellationView)
      .then(doc => console.info("selectAppellationView created"))
      .catch(err => console.info("selectAppellationView already exists: " + JSON.stringify(err)));
  
      // view used to check if there is no type already with this name
      var selectOrigineView = this.createDesignDoc('selectOrigine',
                                                    "function (doc) { if (doc && doc._id.substring(0,3) == 'vin') {emit(doc.origine.id,doc);} }",
                                                    undefined);
      this.database.put(selectOrigineView)
      .then(doc => console.info('selectOrigineView created'))
      .catch(err => console.info('selectOrigineView already exists: ' + JSON.stringify(err)));
  
      // view to be used for reports
      let reportVinView = this.createDesignDoc('reportVin',
          `function(doc) { if(doc && doc.nbreBouteillesReste && parseInt(doc.nbreBouteillesReste,10)>0) { 
                emit([doc.type.nom,doc.origine.pays,doc.origine.region,doc.nom,doc.annee], parseInt(doc.nbreBouteillesReste,10));
            }
          }`,'_sum');
      this.database.put(reportVinView)
      .then(doc => console.info('reportVinView created'))
      .catch(err => console.info('reportVinView already exists: ' + JSON.stringify(err)));
    }
  
/*     public nuke() {
      return this.database.destroy();
    }
 */  

 /*     public createSettings(config){
      let _self = this;
      return this.database.get(config.id).then(doc => {
        // config doc exists, doc._rev is used to update)
        console.info("existing config loaded");
        return _self.database.put({
          _id: 'config',
          _rev: doc._rev,
          serverUrl: config.serverUrl,
          locale : config.locale
        });
      }).catch(function (err) {
        // no config document exists
        console.info("no existing config "+JSON.stringify(err));
        return _self.database.put({
          _id: 'config',
          serverUrl: config.serverUrl,
          locale : config.locale
        });
      });
    }
 */  
    /*******************************************************************
  
              GENERIC
  
    ********************************************************************/
    public fetch() {
      return this.database.allDocs({include_docs: true});
     }

    public put(id: string, document: any) { 
      document._id = id;
      return this.getDoc(id).then(result => {
          document._rev = result._rev;
          return this.database.put(document);
        }, error => {
          if(error.status == "404") {
              return this.database.put(document);
          } else {
              return new Promise((resolve, reject) => {
                  reject(error);
              });
          }
        });
    }

    public test(){
      console.log("test");
    }

    public newGetDoc( id:string ) {
      return this.database.get(id);
    }

    public getDoc( id:string ) {
      return this.database.get(id).then( result => {
        return result;
      }).catch( error => {
        console.error( error );
        return error;
      });
    }
  
    public deleteDoc( doc ) {
      return this.database.remove(doc._id, doc._rev).then( result => {
        return result;
      }).catch( error => {
        console.error( error );
        return error;
      });
    }
  
    public saveDoc(doc) {
      let _self = this;
      if (doc._id) {
        return this.database.get(doc._id).then(resultDoc => {
          doc._rev = resultDoc._rev;
          return _self.database.put(doc);
        }).then(response => {
          return response;
        }).catch(err => {
          if (err.status == 404) {
            return this.database.put(doc).then(response => { return response }
                ).catch(err => {
                  console.error(err);
                  return err;
                });
          } else {
            console.error(err);
            return err;
          }
        });
      } else {
        return this.database.post(doc)
                .then(response => { return response }
                ).catch(err => {
                  console.error(err);
                  return err;
                });
      }		
    }
  
    public createDoc(doc) {
      return this.database.put(doc).then(response => { return response }
        ).catch(err => {
          console.error(err);
          return err;
        });
    }
  
    public getCollection(viewName){
      return this.database.query(viewName,{include_docs:true})
      .then(result => {return result.rows}).catch(err => {console.error(err); return err;});
    }
  
    /*******************************************************************
  
              VINS
  
    ********************************************************************/
    public getVins() {
      return this.database.allDocs({include_docs: true}).then( result => {
        return result.rows.filter( row => {
          if( !row.doc._id.match(new RegExp("^vin","i")) ) {
            return false;
          } else {
            return true;
          }
        });
      });
    }
  
    public saveVin (vin) {
      let _self = this;
      let newVin = vin;
      let newId = "vin|"+vin.nom+"|"+vin.annee;
      if (!vin._id) {
        //Nouveau vin à créer avec l'Id généré.
        newVin._id = newId;
        return this.createDoc(newVin).then(result => {return result}).catch(err => {return err});
      } else if (vin._id == newId) {
        // Existing wine and No update in name or year => just update wine
        return this.saveDoc(vin).then(result => {return result}).catch(err => {return err});			
      } else {
        // existing wine and update done in name or year => create a new wine (with newId) and delete the one with previous id (vin.id).
        return this.createDoc(newVin).then(_self.deleteDoc(vin).then(result => {})).catch(err => {return err});
      }
    
    }
  
    /*******************************************************************
  
              SETTINGS
  
    ********************************************************************/
  
    public getSettings() {
      return this.database.get('settings').then( result => {
        return result;
      }).catch( error => {
        console.warn('Settings do not exist yet');
  
      });
    }
  
    public updateConfig( config ) {
      return this.database.get('config').then( configDoc => {
        config._rev = configDoc._rev;
        config._id = 'config';
          return this.database.put( config ).then( result => {
            return config;
          });
      }).catch( err => {
        console.error( err );
          return undefined;
      });
    }
  
     /**
     * Generates a GUID string.
     * @returns {String} The generated GUID.
     * @example af8a8416-6e18-a307-bd9c-f2c947bbb3aa
     * @author Slavik Meltser (slavik@meltser.info).
     * @link http://slavik.meltser.info/?p=142
     */
    public guid() {
      function _p8(s) {
        let p = (Math.random().toString(16)+"000000000").substr(2,8);
    //        return s ? "-" + p.substr(0,4) + "-" + p.substr(4,4) : p ;
    // modified version to return 32 characters as a cloudant id
        return s ? p.substr(0,4) + p.substr(4,4) : p ;
      }
      return _p8(false) + _p8(true) + _p8(true) + _p8(false);
    }
  
}