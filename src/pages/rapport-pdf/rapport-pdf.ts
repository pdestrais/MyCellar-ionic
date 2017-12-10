import { VinModel } from './../../models/cellar.model';
import { PouchdbService } from './../../services/pouchdb.service';
import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import * as jsPDF from 'jspdf';
import * as d3 from 'd3';

@Component({
  selector: 'page-rapport-pdf',
  templateUrl: 'rapport-pdf.html'
})
export class RapportPDFPage {

  private doc;
  private vins:Array<VinModel>;
  private vinsFiltered;
  private typesGrouping:Array<any> =[];
  private typesOrigineGrouping:Array<any> =[];
  private typesOrigineYearGrouping:Array<any> =[];

  constructor(public navCtrl: NavController, private pouch:PouchdbService) {
    this.doc = new jsPDF("landscape","cm","a4");    
  }
  
  public ionViewDidLoad() {
    this.cellarToPDF();
  }

  public cellarToPDF () {
      // PDF doc initialization
    var yPageMax = 20;
    var startY = 2.2;
    var y = startY;
    var pageNum = 0;

    this.pouch.getDocsOfType('vin').then(vins => {
        this.vins = vins;
        console.log("[Rapport - cellarToPDF]#wine loaded : "+this.vins.length);
        // first report dimension is wine type
        this.typesGrouping = d3.nest()
        .key(function(d:any) { return d.type.nom; })
        .rollup(function(v) { return d3.sum(v, function(d:any) { return d.nbreBouteillesReste; }); })
        .entries(this.vins.filter(function(d) { return (d.nbreBouteillesReste !=0) }));
        console.log("[Rapport - ionViewDidLoad]typesGrouping : "+JSON.stringify(this.typesGrouping));

        this.typesGrouping.forEach((itemType:any,iType:any) => 
          {
            // Page construction - Types
            pageNum++;
            y=startY;
            this.createNewPDFPageAndHeader(pageNum);
            this.doc.setLineWidth(0.05);
            this.doc.setDrawColor(0.1);
            this.doc.setFillColor(255);
            this.doc.rect(1,y,28,0.8,"DF");
            y=y+0.5;
            this.doc.setFontSize(12);
            this.doc.setTextColor(0);
            this.doc.setFontStyle('bold');
            this.doc.text(1.2,y,itemType.key+" ("+itemType.value+")");
            y=y+0.3;

            // second report dimension is wine origin
            this.typesOrigineGrouping = d3.nest()
            .key(function(d:any) { return d.origine.pays+' - '+d.origine.region; })
            .rollup(function(v) { return d3.sum(v, function(d:any) { return d.nbreBouteillesReste; }); })
            .entries(this.vins.filter(function(d) { return (d.nbreBouteillesReste !=0 && 
                                                            d.type.nom == itemType.key) 
                                                  }));
            this.typesOrigineGrouping.forEach((itemOrigine:any,iOrigine:any) => 
            {
                // check if we have enough space for origine and at least one extra line bellow
                if (y+0.8+0.3>=yPageMax) {
                    pageNum++;
                    y=startY;
                    this.createNewPDFPageAndHeader(pageNum);						
                }
                this.doc.setLineWidth(0.02);
                this.doc.setDrawColor(120);
                this.doc.setFillColor(150);
                this.doc.rect(1,y,28,0.5,"DF");
                y=y+0.35;
                this.doc.setFontSize(12);
                this.doc.setFontStyle('normal');
                this.doc.setTextColor(0);
                this.doc.text(2.2,y,itemOrigine.key+" ("+itemOrigine.value+")");
                y=y+0.25;
                /* create year divider */
                this.doc.setFontSize(9);
                this.doc.setTextColor(0);
                this.doc.setDrawColor(0);					

                // third report dimension is wine years            
                this.typesOrigineYearGrouping = d3.nest()
                .key(function(d:any) { return d.annee; })
                .rollup(function(v) { return d3.sum(v, function(d:any) { return d.nbreBouteillesReste; }); })
                .entries(this.vins.filter(function(d) { return (d.nbreBouteillesReste !=0 && 
                                                                d.type.nom == itemType.key && 
                                                                d.origine.pays+' - '+d.origine.region == itemOrigine.key) 
                                                      }));
                // sort by year
                this.typesOrigineYearGrouping.sort(function (a, b) {
                    if (a.key < b.key) { return -1; }
                    if (a.key > b.key) { return 1; }
                    // names must be equal
                    return 0;
                });
  
                this.typesOrigineYearGrouping.forEach((itemYear:any,iYear:any) => 
                {
                  this.vinsFiltered = this.vins.filter(v => {
                                                          return (v.nbreBouteillesReste != 0 && 
                                                              v.type.nom == itemType.key && 
                                                              v.origine.pays+' - '+v.origine.region == itemOrigine.key &&
                                                              v.annee == itemYear.key ); 
                                                        });
                    this.vinsFiltered.forEach((wineItem:any,iWineItem:number) => {
                        let ytemp,ymax,c;
                            //Compute how much space is needed for the next line to display :
                            //- minimum 0.3 in no comment history, and only one location.
                            //- otherwize : 0.3 * max (# of comments in history, # of locations) 
                            let commentsHistoryNbr = 0;
                            if (wineItem.history)
                                wineItem.history.map( (value,index) =>  
                                    {   
                                        if (value.comment && value.type=="comment" && value.comment.trim()!="") {
                                            commentsHistoryNbr++;
                                        }
                                    });
                            let locationNbr = 0;
                            wineItem.localisation.split("&").map((value,index) =>   {   locationNbr++;})
        
                            ymax = y + (Math.max(commentsHistoryNbr,locationNbr))*0.3 + 0.1
                            if (ymax>=yPageMax) {
                                pageNum++;
                                y=startY+0.1;
                                ymax = y + (Math.max(commentsHistoryNbr,locationNbr))*0.3 + 0.1
                                this.createNewPDFPageAndHeader(pageNum);
                                this.doc.setFontSize(9);
                                this.doc.setTextColor(0);
                                this.doc.setDrawColor(0);					
                            }
                            y=y+0.3;
                            if (iWineItem==0)
                                this.doc.text(1.2,y,wineItem.annee+" ("+itemYear.value+")");
                            this.doc.text(3,y,wineItem.nom);
                            this.doc.text(11,y,wineItem.appellation.courte);
                            this.doc.text(13.3,y,""+wineItem.prixAchat);
                            this.doc.text(15.5,y,""+wineItem.nbreBouteillesReste);
                            //Display Localisation on multiple lines if needed
                            ytemp = y;
                            c = 0;
                            wineItem.localisation.split("&").map((value,index) =>   {   ytemp = y+ c * 0.3;
                                                                                        this.doc.text(17,ytemp,value.trim());
                                                                                        c++;
                                                                                    });
                            //this.doc.text(17,y,wineItem.localisation);
                            //Display either a remarque (old style)
                            wineItem.remarque?this.doc.text(18.5,y,wineItem.remarque):this.doc.text(18.5,y,"");
                            //... or a new remark created based on history ... on multiple lines
                            ytemp = y;
                            c = 0;
                            if (wineItem.history)
                                wineItem.history.map( (value,index) => { if (value.comment && value.type=="comment" && value.comment.trim()!="") {
                                                                            ytemp = y + c * 0.3; 
                                                                            this.doc.text(18.5,ytemp,value.date.slice(0,10)+": "+value.comment);
                                                                            c++;
                                                                        }
                                                                        });
                            //y=y+0.1;
                            y = ymax;
                            this.doc.setLineWidth(0.02);
                            this.doc.rect(1,y,28,0.0,"DF");
                        },this);
                },this);
            },this);
              }
    )// = vins.map(v => v.doc))
    /* after type level */		
    this.doc.setFontSize(14);
    this.doc.setTextColor(0);
    this.doc.setDrawColor(0);					
    if (y+1.2>=yPageMax) {
      pageNum++;
      y=startY;
      this.createNewPDFPageAndHeader(pageNum);
    }
      this.doc.save('Contenu cave.pdf');
      console.log("after pdf generation");
  });
  }
      

  private createNewPDFPageAndHeader(pgNum) {
    if (pgNum>1) {
      this.doc.addPage();
    }
    // adding header
    this.doc.setFontSize(18);
    this.doc.setFontStyle('normal');
    //		doc.setFont("Verdana");
        let reportDate = new Date();
    this.doc.text(12, 0.7, "Contenu cave le "+reportDate.toLocaleDateString('fr-FR'));
    this.doc.setLineWidth(0.05);
    this.doc.setDrawColor(50);
    this.doc.setFillColor(100);
    this.doc.rect(1,1.3,28,1,"DF");
    this.doc.setFontSize(12);
    this.doc.setTextColor(255);
    this.doc.setFontStyle('bold');
    this.doc.text(1.2,1.9,"Année");
    this.doc.text(3,1.9,"Nom");
    this.doc.text(10,1.9,"Appellation");
    this.doc.text(12.7,1.9,"Prix achat");
    this.doc.text(15,1.9,"Reste");
    this.doc.text(16.7,1.65,"Loc.");
    this.doc.text(16.7,2.1,"G/D.y.x");
    this.doc.text(18.6,1.9,"Commentaire");

    // adding footer
    this.doc.setLineWidth(0.05);
    this.doc.setDrawColor(50);
    this.doc.setFillColor(100);
    this.doc.rect(1,20,28,0.0,"DF");
    this.doc.setFontSize(9);
    this.doc.setFontStyle('normal');
    this.doc.setTextColor(0);
    //		doc.setFont("Verdana");
    this.doc.text(1, 20.3, reportDate.toLocaleDateString('fr-FR'));
    this.doc.text(27, 20.3, "page"+pgNum);
  }

/*   private historyAsString(wine) {
    let historyString = "";
    wine.history.map(value => {if (value.comment) historyString = historyString+value.date.slice(0,10)+": "+value.comment+ " | "});
    historyString = historyString.slice(0,historyString.length-2);
    return historyString
  }
 */
}
