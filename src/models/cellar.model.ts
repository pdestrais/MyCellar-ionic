export class VinModel {
  constructor(  public _id:string,
                public nom:string, 
                public annee:string,
                public nbreBouteillesAchat:number,
                public nbreBouteillesReste:number,
                public prixAchat:number,
                public dateAchat:string,
                public remarque:string,
                public localisation:string,
                public contenance:string,
                public history:Array<HistoryModel>,
                public lastUpdated:string,
                public appellation:AppellationModel,
                public origine:OrigineModel,
                public type:TypeModel,
                public apogee:string,
                public GWSScore:number,
                public cotes:Array<CoteModel>) {
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
    this.apogee = apogee;
    this.GWSScore = GWSScore;
    this.cotes = cotes;
  }
} 

export class TypeModel {
  constructor(public _id:string, public nom:string) {
      this._id = _id;
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
  constructor(public _id:string, public courte:string ,public longue:string) {
    this._id = _id
    this.courte = courte;
    this.longue = longue;
  }
}

export class OrigineModel {
  constructor(public _id:string, public pays:string, public region:string) {
    this._id = _id;
    this.pays = pays;
    this.region = region;
  }
}

export class CoteModel {
  constructor(public _id:string, public criticName:string, public score:number) {
    this._id = _id;
    this.criticName = criticName;
    this.score = score;
  }
}

