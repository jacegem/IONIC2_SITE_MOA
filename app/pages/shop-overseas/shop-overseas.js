import {Platform, Page, Alert, NavController} from 'ionic-angular';
import {Http} from 'angular2/http';
import {InAppBrowser} from 'ionic-native';
import {ArraySort} from '../../pipes/arraySort';
import {NgZone} from 'angular2/core';
/*
  Generated class for the ShopOverseasPage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
var dateFormat1;

@Page({
  templateUrl: 'build/pages/shop-overseas/shop-overseas.html',
  pipes: [ArraySort],
})
export class ShopOverseasPage {
  static get parameters() {
    return [[NavController], [Http], [Platform], [NgZone]];
  }

  constructor(nav, http, platform, ngZone) {
    this.nav = nav;
    this.http = http;
    this.platform = platform;
    this.ngZone = ngZone;
    this.readCnt = 0;
    this.items = [];
    this.itemsShow = [];
    this.urlMap = {};
    this.page = 1;
    //this.ngZone.run(() => { console.log('loadClien Done!') });
    this.loadDatas(3);
  }

  doStarting() {
    console.log("doStarting");
  }
  doRefresh(event) {
    if (event.state != "refreshing") {
      return;
    }

    debugger;
    console.log("doRefresh" + event);

    this.itemsShow = [];
    this.items = [];
    this.page = 1;

    this.loadDatas(3);

    event.complete();
  }

  loadDatas(pages) {
    for (var i = 0; i < pages; i++) {
      this.loadClien(this.page);
      //this.loadDdanzi(this.page);
      //this.loadPpomppu(this.page);
      this.page += 1;
    }
  }


  doPulling(event) {
    debugger;
    console.log("doPulling" + event);
  }


  openLink(item) {
    //debugger;
    this.platform.ready().then(() => {
      //debugger;
      //window.open(item.url, "_system", "location=yes");
      window.open(item.url, '_blank');
      //InAppBrowser.open(item.url, "_system", "location=yes");
      //cordova.InAppBrowser.open(item.url, "_system", "location=yes");
    });
  }

  addUrlMap(url) {
    this.urlMap[url] = 'true';
  }
  deleteUrlMap(url) {

    delete this.urlMap[url];

    var cnt = Object.keys(this.urlMap).length;
    console.log("CNT:" + cnt);

    if (cnt == 0) {
      this.sortArray();
      console.log("ARRAY_SORTED");
    }
  }

  loadClien(page) {
    var url = "http://m.clien.net/cs3/board?bo_style=lists&bo_table=jirum&spt=&page=" + page;

    this.addUrlMap(url);

    this.http.get(url).subscribe(data => {
      this.readCnt++;
      let parser = new DOMParser();
      let doc = parser.parseFromString(data.text(), "text/html");
      let elements = doc.querySelectorAll('table.tb_lst_normal tbody tr');

      for (let i in elements) {
        var item = {};
        //debugger;
        //console.log(i);
        if (i == 'length') break;
        item.category = elements[i].querySelector('span.lst_category');  // 카테고리
        if (!item.category) continue;
        if (!item.category.textContent.trim().startsWith('[해외구매')) continue;

        item.url = elements[i].querySelector('div.wrap_tit').getAttribute('onclick'); // url
        var pattern = /.+?='(.+)'/;
        var match = pattern.exec(item.url);
        if (!match) { continue; }

        item.url = "http://m.clien.net/cs3/board" + match[1].trim();
        item.title = elements[i].querySelector('span.lst_tit').textContent.trim();
        item.reply = elements[i].querySelector('span.lst_reply').textContent.trim();
        this.items.push(item);

        this.addUrlMap(item.url);

        this.http.get(item.url).subscribe(data => {
          this.readCnt++;
          let parser = new DOMParser();
          let url = data.url;
          let item = {};
          for (let i in this.items) {
            if (this.items[i].url == url) {
              item = this.items[i];
              this.items.splice(i, 1);
              break;
            }
          }
          let doc = parser.parseFromString(data.text(), "text/html");
          item.imgSrc = doc.querySelector('div.post_ct img[src]');
          if (item.imgSrc) {
            item.imgSrc = item.imgSrc.getAttribute('src');
            item.imgSrc = item.imgSrc.replace("http://cache.", "https://");
          }
          var date = doc.querySelector('span.view_info').textContent.trim();
          var pattern = /([0-9\- :]+) .+?(\d+)/;
          var match = pattern.exec(date);
          if (match) {
            item.date = this.getDate(match[1]);
            item.dateFormat = this.getDateFormat(item.date);
            item.read = match[2];

            var now = new Date();
            var yyyy = now.getFullYear();
            var str = yyyy + '-' + match[2] + '-' + match[3] + 'T' + match[4] + ':' + match[5];
            item.dateSort = new Date(str);
          }
          //debugger;
          if (item.url) this.items.push(item);
          //this.ngZone.run(() => { console.log('loadClien Done!') });
          this.deleteUrlMap(item.url);
        });
      }


      this.deleteUrlMap(url);
    });

  }
  
  getDateFormat(date){
    debugger;
    return dateFormat(date, "YYYY-MM-DD HH:MM");  
  }
  
  getDate(dateStr){
    var now = new Date();
    var yyyy = now.getFullYear();    
    var mm = now.getMonth() + 1;
    var dd = now.getDate();
    var hh = now.getHours();
    var mi = now.getMinutes();
    
    var pattern = /(\d{2})-(\d{2}) (\d{2}):(\d{2})/;    // 06-02 09:45
    var match = pattern.exec(dateStr);
    
    if (match){      
      mm = match[1];
      dd = match[2];      
      hh = match[3];
      mi = match[4];      
      return new Date(yyyy, mm, dd, hh, mi);
    }
    
    pattern = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/;  //2016-06-02 13:43
    match = pattern.exec(dateStr);
    if (match) {
      yyyy = match[1];
      mm = match[2];
      dd = match[3];
      hh = match[4];
      mi = match[5];
      return new Date(yyyy,mm,dd,hh,mi);
    }
  }
  
  
  getDateSort(itemDate) {
    var pattern = /(\d+)(.)(\d+).(\d+)/;
    var match = pattern.exec(itemDate);
    var date;
    //console.log(match);
    if (match[2] == ':') {
      var now = new Date();
      var dd = ("0" + now.getDate()).slice(-2);
      var mm = ("0" + (now.getMonth() + 1)).slice(-2);
      var yyyy = now.getFullYear();
      var str = yyyy + '-' + mm + '-' + dd + 'T' + match[1] + ':' + match[3] + ':' + match[4];
      //console.log("STR:" + str);
      date = new Date(str);
    }
    else {
      if (match[1].length < 4) match[1] = '20' + match[1];
      date = new Date(match[1] + '-' + match[3] + '-' + match[4]);
    }
    return date;
  }

  loadPpomppu(page) {
    this.readCnt++;

    var url = "http://m.ppomppu.co.kr/new/bbs_list.php?id=ppomppu4&page=" + page;
    //let headers = new Headers({ 'Referer': 'http://m.ppomppu.co.kr' });
    //let options = new RequestOptions({ headers: headers });
    this.addUrlMap(url);

    this.http.get(url).subscribe(data => {
      let parser = new DOMParser();
      let doc = parser.parseFromString(data.text(), "text/html");
      let elements = doc.querySelectorAll('ul.bbsList .none-border');

      for (let i in elements) {
        if (i == 'length') break;

        var item = {};
        item.title = elements[i].querySelector('span.title').textContent.trim();  // 제품명
        item.imgSrc = elements[i].querySelector('div.thmb img').src; // 이미지\
        item.imgSrc = item.imgSrc.replace("http://cache.", "https://");
        item.category = elements[i].querySelector('span.ty').textContent.trim();  // 카테고리
        item.writer = elements[i].querySelector('span.ty_02').textContent.trim(); // 글쓴이
        item.reply = elements[i].querySelector('div.com_line span');
        if (item.reply) item.reply = item.reply.textContent.trim(); //  댓글 수 
        item.good = elements[i].querySelector('span.recom').textContent.trim();;  // 추천                   
        //item.read = elements[i].querySelectorAll('td[nowrap]')[3]; //조회

        var dateText = elements[i].querySelector('span.info').textContent.trim(); //  08:07:15 | 조회 1234        
        var pattern = /(\d{2}.\d{2}.\d{2}).+?(\d+)/;
        var match = pattern.exec(dateText);
        item.date = match[1].trim();
        item.read = match[2];

        item.dateSort = this.getDateSort(item.date);

        item.url = "http://m.ppomppu.co.kr/new/" + elements[i].querySelector('a[href]').getAttribute('href'); // url
        item.soldOut = elements[i].querySelector('span.title span');
        //item.soldOut = soldOut;
        //console.log(item.soldOut);        
        this.items.push(item);
      }

      ///this.sortArray();
      this.deleteUrlMap(url);
      //this.ngZone.run(() => { console.log('loadPpomppu Done!') });
    });
  }


  sortArray() {
    this.ngZone.run(() => {
      this.items.sort((a, b) => {
        //console.log("A:" + a.date + " : " + b.date);
        //console.log("B:" + b);
        if (a.dateSort < b.dateSort) {
          return 1;
        } else if (a.dateSort > b.dateSort) {
          return -1;
        } else {
          return 0;
        }
      });
      this.itemsShow = this.items;
    });
  }


  


  loadDdanzi(page) {
    var url = "http://www.ddanzi.com/index.php?mid=pumpout&m=1&page=" + page;
    this.addUrlMap(url);

    this.http.get(url).subscribe(data => {
      var parser = new DOMParser();
      var doc = parser.parseFromString(data.text(), "text/html");
      var elements = doc.querySelectorAll('ul.lt li');
      //console.log(elements.length);

      for (var i in elements) {
        if (i == 'length') break;
        if (elements[i].querySelector('span.notice')) continue;
        var item = {};

        item.imgSrc = elements[i].querySelector('img.thumb_preview'); // 이미지
        if (item.imgSrc) item.imgSrc = item.imgSrc.src
        item.url = elements[i].querySelector('div.titleCell a[href]').getAttribute('href'); // url 
        item.title = elements[i].querySelector('span.title').textContent.trim();  // 제품명
        var date = elements[i].querySelector('span.time').textContent.trim();
        item.date = this.getDate(date);
        item.dateFormat = this.getDateFormat(item.date);
        item.reply = elements[i].querySelector('span.cnt em');
        if (item.reply) item.reply = item.reply.textContent;
        item.read = elements[i].querySelector('span.cnt').textContent.trim();
        var pattern = /\d+/;
        var match = pattern.exec(item.read);
        item.read = match[0];
        item.price = elements[i].querySelector('div.price span').textContent.trim();
        //debugger;
        //console.log("item price:" + item.price);
        item.soldOut = elements[i].querySelector('span.title img[src$="end_icon.png"]');
        this.items.push(item);

        //console.log(elements[i]);
      }
      //this.sortArray();
      this.deleteUrlMap(url);
      //this.ngZone.run(() => { console.log('loadDdanzi Done!') });
    });
  }


  doInfinite(infiniteScroll) {
    //this.loadDatas();
    // 추가 페이지를 조회하지 않음, 정렬될때, 순서가 바뀌게 되어, 혼란스러워짐. 
    infiniteScroll.complete();
    return;
  }
}
