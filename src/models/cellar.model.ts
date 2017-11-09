export class VinModel {
  constructor(  public _id:string,
                public nom:string, 
                public annee:string,
                public nbreBouteillesAchat:number,
                public nbreBouteillesReste:number,
                public prixAchat:string,
                public dateAchat:string,
                public remarque:string,
                public localisation:string,
                public contenance:string,
                public history:Array<HistoryModel>,
                public lastUpdated:string,
                public appellation:AppellationModel,
                public origine:OrigineModel,
                public type:TypeModel) {
    this.nom = nom;
    this.annee = annee;
    this.nbreBouteillesAchat = nbreBouteillesAchat;
    this.nbreBouteillesReste = nbreBouteillesReste;
    this.prixAchat = prixAchat;
    this.dateAchat = dateAchat;
    this.remarque = remarque;
    this.localisation = localisation;
    this.contenance = contenance;
    this.history = [];
    this.lastUpdated = '';
    this.appellation = appellation;
    this.origine = origine;
    this.type = type;
  }
} 

export class TypeModel {
  constructor(public id:string,public nom:string) {
      this.id = id;
      this.nom = nom;
  }
}

export class HistoryModel {
  constructor(public type:string,public difference:number, public date:string, public comment:string) {
      this.type = type;
      this.difference = difference;
      this.date = date;
      this.comment = comment;
  }
}

export class AppellationModel {
  constructor(public id:string, public courte:string ,public longue:string) {
    this.id = id
    this.courte = courte;
    this.longue = longue;
  }
}

export class OrigineModel {
  constructor(public id:string, public pays:string, public region:string) {
    this.id = id;
    this.pays = pays;
    this.region = region;
  }
}
