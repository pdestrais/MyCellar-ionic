import { TranslateService } from '@ngx-translate/core';
import { VinModel } from './../../models/cellar.model';
import { PouchdbService } from './../../services/pouchdb.service';
import { Component,NgZone } from '@angular/core';
import { NavController } from 'ionic-angular';
import * as d3 from 'd3';
import * as d3scale from 'd3-scale';
import * as d3shape from 'd3-shape';
import * as d3select from 'd3-selection';


@Component({
  selector: 'page-stats',
  templateUrl: 'stats.html'
})
export class StatsPage {

  private total:number=0;
  private dataset:Array<any>=[];
  private vins:Array<VinModel>;
  private from:number=0;
  private to:number=1;
  private margin:any;
  private width:number;
  private height:number;
  private fromOptions:Array<any>;
  private toOptions:Array<any>;
  private colors:any;
  private ready:boolean=false;
  
  constructor(public navCtrl: NavController, private pouch:PouchdbService, private translate:TranslateService,private zone: NgZone) {
    this.fromOptions=[{value:0,display:this.translate.instant('stats.now')},
                      {value:1,display:this.translate.instant('stats.oneYear')},
                      {value:2,display:this.translate.instant('stats.twoYears')},
                      {value:3,display:this.translate.instant('stats.threeYears')}];   
    this.toOptions=[ {value:1,display:this.translate.instant('stats.oneYear')},
                      {value:2,display:this.translate.instant('stats.twoYears')},
                      {value:3,display:this.translate.instant('stats.threeYears')}];   
  }

  ngOnInit() {
    this.pouch.getDocsOfType('vin').then(vins => { this.vins = vins });
  }

  draw() {
  this.zone.run(() => {
    this.prepareData().then(() => {
      this.ready = true; 
      console.log("ready");
    });
  });
  // I have to delay chart initialization and rendering as angular change detection is not fast enough to generate the table before 
  // the chart renders (and background color setting relies on data in table). I tried using ngZone but it doesn't help. 
  var _self1 = this;
  setTimeout(function(){ _self1.initializeChart(); }, 200)
  }
  
  prepareData() {
     let currentDate = new Date();
     this.total = 0;
     this.dataset = [];
     var _self = this;
     this.vins.forEach(function(item,index){
         if (typeof(item.history) != 'undefined' && item.history.length > 0){
           var _self1 = _self;
           item.history.forEach(function(h,ih) {
             let into = false;
             if (h&&h.type=="update" &&
                (Date.parse(h.date) <= (currentDate.getTime()-(_self.from*365*1000*3600*24)) && 
                Date.parse(h.date) > (currentDate.getTime()-(_self.to*365*1000*3600*24)))) {
                // if dataset already contains the region, add the difference to dataset's count. If not, create dataset element with label and count
                var _self2 = _self1;
                _self.dataset.forEach(function(d,id) {
                    if (d.label == item.origine.region && h.difference < 0) {
                        d.count = d.count - h.difference;
                        _self2.total = _self2.total - h.difference
                        into = true;
                    }
                });
                if (!into && h.difference < 0) {
                    _self.dataset.push({label:item.origine.region,count:-h.difference});
                    _self2.total = _self2.total - h.difference;
                }
             }
           });
         }
     });
     return Promise.resolve();
  }

  initializeChart () {
    this.margin = {
      top:    20,
      right:  20,
      bottom: 30,
      left:   50
    };
    this.width  = 360 - this.margin.left - this.margin.right;
    this.height = 360 - this.margin.top - this.margin.bottom;

    this.renderDonut();
  }


  renderDonut() {
    var width = this.width;
    var height = this.height;
    var radius = Math.min(width, height) / 2;
    var donutWidth = 100;                            // NEW
    //var legendRectSize = 15;                                  // NEW
    //var legendSpacing = 2;                                    // NEW
    var color = d3scale.scaleOrdinal(d3scale.schemeCategory20);

    //cleaning up before drawing
    var title = d3.select('#title');
    title.html('');
    var svg = d3.select('#chart');
    svg.html('');
    
    title = d3.select('#title')
        .append('h3')
        .html("total : &nbsp;"+this.total);
    svg = d3.select('#chart')
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', 'translate(' + (width / 2) +
        ',' + (height / 2) + ')');
    var arc = d3shape.arc()
      .innerRadius(radius - donutWidth)             // UPDATED
      .outerRadius(radius);
    var pie = d3shape.pie()
      .value(function(d) { return d.count; })
      .sort(null);
    var tooltip = d3.select('#chart')                               // NEW
      .append('div')                                                // NEW
      .attr('class', 'tooltip');                                    // NEW
    tooltip.append('div')                                           // NEW
      .attr('class', 'label');                                      // NEW
    tooltip.append('div')                                           // NEW
      .attr('class', 'count');                                      // NEW
    tooltip.append('div')                                           // NEW
      .attr('class', 'percent');                                    // NEW
   var path = svg.selectAll('path')
      .data(pie(this.dataset))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', function(d:any, i) {
        return color(d.data.label);
      });
    this.colors = color.domain();
    var _self = this;
    path.on('mouseover', function(d:any) {                            // NEW
      var total = d3.sum(_self.dataset.map(function(d:any) {                // NEW
          return d.count;                                           // NEW
      }));                                                        // NEW
      var percent = Math.round(1000 * d.data.count / total) / 10; // NEW
      tooltip.select('.label').html(d.data.label);                // NEW
      tooltip.select('.count').html(d.data.count);                // NEW
      tooltip.select('.percent').html(percent + '%');             // NEW
      tooltip.style('display', 'block');                          // NEW
      });                                                           // NEW
      path.on('mouseout', function() {                              // NEW
      tooltip.style('display', 'none');                           // NEW
    });                                                           // NEW
    /* OPTIONAL
    path.on('mousemove', function(d) {                            // NEW
    tooltip.style('top', (d3.event.layerY + 10) + 'px')         // NEW
        .style('left', (d3.event.layerX + 10) + 'px');            // NEW
    });                                                           // NEW
    */
/*        var legend = svg.selectAll('.legend')                     // NEW
      .data(color.domain())                                   // NEW
      .enter()                                                // NEW
      .append('g')                                            // NEW
      .attr('class', 'legend')                                // NEW
      .attr('transform', function(d, i) {                     // NEW
        var height = legendRectSize + legendSpacing;          // NEW
        var offset =  height * color.domain().length / 2 / 2;     // NEW
        var horz = -2 * legendRectSize - (width-donutWidth)/4 + i%2 * (width-donutWidth)/5*2 ;                       // NEW
        var vert = Math.trunc(i/2) * height - offset;                       // NEW
        return 'translate(' + horz + ',' + vert + ')';        // NEW
      });                                                     // NEW
    legend.append('rect')                                     // NEW
      .attr('width', legendRectSize)                          // NEW
      .attr('height', legendRectSize)                         // NEW
      .style('fill', color)                                   // NEW
      .style('stroke', color);                                // NEW
    legend.append('text')                                     // NEW
      .attr('x', legendRectSize + legendSpacing)              // NEW
      .attr('y', legendRectSize - legendSpacing)              // NEW
      .text(function(d) { return d.substring(0,18); });                       // NEW
*/        

/*       let temp = d3select.selectAll('.tabcolor');
      let temp3 = d3select.selectAll('p');
      let temp4 = d3select.select('#chartTableBody');
      let temp5 = temp4.selectAll('tr');
      let temp6 = temp5.select('td');
 */
      console.log("adapt table style");
      d3select.selectAll('.tabcolor')
      .data(this.dataset)
      .style('background-color', function(d, i) {
        return color(d.label);
      })
}

}
