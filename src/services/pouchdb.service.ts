import { TranslateService } from '@ngx-translate/core';
import { AlertService } from './alert.service';
import { Injectable } from '@angular/core';
import PouchDB from 'pouchdb';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class PouchdbService {

    private database: any;
    private settingsDB: any;
    private settingsDoc: any;
    private activeSyncUrl: string;
    private activeSync: any;
    private pouchDBServiceSubject: Subject<any>;
  
    public constructor(/* public navCtrl: NavController, */ 
                        private alertService:AlertService, 
                        private translateService:TranslateService) {
      this.settingsDB = new PouchDB('settings');
      this.database = new PouchDB('cave');
      this.pouchDBServiceSubject = new Subject();
      this.settingsDB.get('settings')
        .then((doc) => {
          this.settingsDoc = doc;
          if (this.settingsDoc) {
            if (this.settingsDoc && this.settingsDoc.language && this.settingsDoc.language.length >=0 ) {
              this.translateService.use(this.settingsDoc.language)
            } else {
              this.settingsDoc.language= "english";
              this.translateService.use("english");
            } 
            if (this.settingsDoc.syncUrl)
              this.applySyncUrl(this.settingsDoc.syncUrl, 0);
          }
        }).catch((err) => {
          // first time the application is started. Setting doc is created and saved with default language (english)
          console.log("[PouchDBService Constructor]settings not set" +JSON.stringify(err));
          this.translateService.use("english");
          this.settingsDoc = {
            _id: 'settings',
            language: "english"
          }
          this.settingsDB.put(this.settingsDoc)
          .then((response) => {
            this.settingsDoc._id = response.id;
            this.settingsDoc._rev = response.rev;
            this.alertService.success(this.translateService.instant('general.newAppInstance'),undefined,"dialog")            
          }).catch(function (err) {
            console.log(err);
            this.alertService.success(this.translateService.instant('general.newConfigNotSaved'))
          });  

        });
    }
    
    /*  Start synchronization with a remote DB located with its syncURL.
        parameters :
        - syncType :  0. indicates that the sync continues with the server previously used. All current data remain, sync just starts (most common case)
                      1. indicates that the user chose to start a sync with a new server while keeping its local data. The 2 databases are merged together. Than the synchronisation continues
                      2. indicates that the user deletes all current data and start syncing with a new server. This means that all data from the remote server will be used to initialize the local database.  
    */
    applySyncUrl(syncUrl: string, syncType: number) {
      // if the newly given syncUrl is the same as the previous one, don't do anything
      if (syncUrl != this.activeSyncUrl) {
        switch (syncType) {
          case (1) :
            // sync to new server
            // If this is the first remote DB setup, we need to create a settings document
            if (this.settingsDoc == null) {
              this.settingsDoc = {
                _id: 'settings',
                syncUrl: syncUrl
              }
            }
            else {
              this.settingsDoc["syncUrl"] = syncUrl;
            }
            // new settings are written to settingDB and when done, start syncing
            this.settingsDB.put(this.settingsDoc)
              .then((response) => {
                this.activeSyncUrl = syncUrl;
                this.settingsDoc._id = response.id;
                this.settingsDoc._rev = response.rev;
                this.startSync();
              }).catch(function (err) {
                console.log(err);
                this.alertService.success(this.translateService.instant('general.newConfigNotSaved'))
              });  
          case (2) :
            // replicate, then sync to new server
            // If this is the first remote DB setup, we need to create a settings document
            if (this.settingsDoc == null) {
              this.settingsDoc = {
                _id: 'settings',
                syncUrl: syncUrl
              }
            }
            else {
              this.settingsDoc["syncUrl"] = syncUrl;
            }
            // destroy current database, then start replication.
            // When replication is succesfull,  new settings are written to settingDB and we start replicating.
            this.database.destroy().then(response => {
              // destroy local database
              console.info("database destroyed");
              this.database = new PouchDB('cave');
              // replicate remote DB to local
              this.pouchDBServiceSubject.next({type:"replication",message:'ReplicationStarts'});          
              PouchDB.replicate(syncUrl,this.database)
              .on('complete', (info) => {
                // handle complete
                this.pouchDBServiceSubject.next({type:"replication",message:'ReplicationEnds'});
                // new settings are written to settingDB and when done, start syncing
                this.settingsDB.put(this.settingsDoc)
                  .then((response) => {
                    this.activeSyncUrl = syncUrl;
                    this.settingsDoc._id = response.id;
                    this.settingsDoc._rev = response.rev;
                    this.startSync();
                  }).catch(function (err) {
                    console.log(err);
                    this.alertService.success(this.translateService.instant('general.newConfigNotSaved'))
                  });  
              })
              .on('error', (err) => {
                // handle error
                this.pouchDBServiceSubject.next({type:"error",error:err,message:'ReplicationError'});
              });;
            });		      
          default :
            // standard startup 
            this.activeSyncUrl = syncUrl;
            this.startSync();
        }
      }
    }

     startSync() {
      if (this.activeSync) {
        this.activeSync.cancel()
        this.activeSync = null;
      }
      if (this.activeSyncUrl && this.activeSyncUrl.length > 0) {
        const settings = new PouchDB(this.activeSyncUrl);
        console.log("[PouchDBService]Start syncing with remore DB with settings : "+JSON.stringify(settings));
        console.log("[PouchDBService]Start syncing with remore DB @ : "+this.activeSyncUrl);
        //this.activeSync = this.database.sync(settings, {
        this.activeSync = this.database.sync(this.activeSyncUrl, {
            live: true,
          retry: true
        }).on('change', (change) => {
          console.log("[PouchDBService]change event received - change is : "+JSON.stringify(change));
          if (change.direction == "pull") {
            this.pouchDBServiceSubject.next({type:"activeSync",change:change});
          }
        }).on('error', (err) => {
          this.pouchDBServiceSubject.next({type:"error",error:err});
        });
      }
    }
      
    public getPouchDBListener() { 
      return this.pouchDBServiceSubject;
    }

    public getSettingsDB() {
      return this.settingsDB;
    }

  
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
  
    // saveDoc will use a post command if the doc has no _id attribute, otherwize use the put to update the document
    // if a docClass is given and if the _id doesn't exist (this is a new document), the doc _id will be formed using the docClass
    // This will allow quick and easy retrival of doc types using only the doc's primary key (_id) 
    // returns a promise or an the error object.
    public saveDoc(doc,docClass?) {
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
        if (docClass) {
          doc._id = docClass+'|'+this.guid();
          return this.saveDoc(doc);
        } else return this.database.post(doc)
                .then(response => { return response }
                ).catch(err => {
                  console.error(err);
                  return err;
                });
      }		
    }
  
    public genericSaveDoc(db:any,doc:any,docClass?:string) {
      if (doc._id) {
        return db.get(doc._id).then(resultDoc => {
          doc._rev = resultDoc._rev;
          return db.put(doc);
        }).then(response => {
          return response;
        }).catch(err => {
          if (err.status == 404) {
            return db.put(doc).then(response => { return response }
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
        if (docClass) {
          doc._id = docClass+'|'+this.guid();
          return this.genericSaveDoc(db,doc);
        } else return db.post(doc)
                .then(response => { return response }
                ).catch(err => {
                  console.error(err);
                  return err;
                });
      }		      
    }

    public getDocsOfType(type:string) {
      return this.database.allDocs({include_docs: true,startkey: type+'|', endkey: type+'|\ufff0'})
      .then( result => {
        if (result && result.rows)
          return result.rows.map(res => res.doc);
        else 
          return [];
      }).
      catch((error) => {console.log("result error : "+JSON.stringify(error)); return error});
      
    }

    /*******************************************************************
              UTILITY
    ********************************************************************/

    public checkDataQuality(){
      this.getDocsOfType('vin').then(result => {
        if (result) {
          console.log("[checkDataQuality]# vins : "+result.length)
          // check that all vin.origine have an '_id' attribute
          let countOrigine_id = 0;
          let countOrigineid = 0;
          let countAppellation_id = 0;
          let countAppellationid = 0;
          let countType_id = 0;
          let countTypeid = 0;
          result.map(v => {
            if (v.origine._id) {
              countOrigine_id++;
              console.log("[checkDataQuality]origine._id for vin : "+v.nom+" - "+v.annee);
            }
            else 
            if (v.origine.id) {
              if (!v.origine.id.startsWith("origine|"))
                console.log("[checkDataQuality]DOESN'T Start with origine| for vin : "+v.nom+" - "+v.annee);
              countOrigineid++;
            }
            if (v.appellation._id) {
              countAppellation_id++;
              console.log("[checkDataQuality]appellation._id for vin : "+v.nom+" - "+v.annee);
            }
            else 
            if (v.appellation.id) {
              if (!v.appellation.id.startsWith("appellation|"))
                console.log("[checkDataQuality]DOESN'T Start with appellation| for vin : "+v.nom+" - "+v.annee);
              countAppellationid++;
            }
            if (v.type._id) {
              countType_id++;
              console.log("[checkDataQuality]type._id for vin : "+v.nom+" - "+v.annee);
            }
            else 
            if (v.type.id) {
              if (!v.type.id.startsWith("type|"))
                console.log("[checkDataQuality]DOESN'T Start with type| for vin : "+v.nom+" - "+v.annee);
              countTypeid++;
            }
          });
          console.log("[checkDataQuality]countOrigine_id - countOrigineid : "+countOrigine_id+" - "+countOrigineid);
          console.log("[checkDataQuality]countAppellation_id - countAppellationid : "+countAppellation_id+" - "+countAppellationid);
          console.log("[checkDataQuality]countType_id - countTypeid : "+countType_id+" - "+countTypeid);
        }
      })
    }

    public adaptDBStruct() {
      this.getDocsOfType('vin').then(result => {
        if (result) {
          result.map(v => {
            let changed=false;
            if (v.origine.id && v.origine.id.startsWith('origine|')) {
              v.origine._id = v.origine.id;
              delete v.origine.id;   
              changed = true;          
            }
            if (v.appellation.id && v.appellation.id.startsWith('appellation|')) {
              v.appellation._id = v.appellation.id;
              delete v.appellation.id;  
              changed = true;           
            }
            if (v.type.id && v.type.id.startsWith('type|')) {
              v.type._id = v.type.id;
              delete v.type.id;    
              changed = true;         
            }
            if (v.id) {
              delete v.id;   
              changed = true;          
            }            
            if (changed) {
              this.saveDoc(v,'vin');
              console.log("vin adapté :"+JSON.stringify(v));
            }
          });
        }
      });
    }

    /*******************************************************************
              SETTINGS
    ********************************************************************/
  
    public getSettings() {
      return this.settingsDoc;
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

    public cleanModelObject(obj) {
      let result={};
      for (var key in obj) {
          if (key.charAt(0)!='_' || (key=='_id' && obj[key])) result[key]=obj[key];
      }
      return result;
  }
  
  
}