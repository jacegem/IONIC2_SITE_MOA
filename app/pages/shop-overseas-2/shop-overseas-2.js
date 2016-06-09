import {Platform, Page, Alert, NavController} from 'ionic-angular';
import {Http} from 'angular2/http';
import {InAppBrowser} from 'ionic-native';
import {ArraySort} from '../../pipes/arraySort';
import {NgZone} from 'angular2/core';
import {Firebase} from '../../providers/firebase/firebase';
/*
  Generated class for the ShopOverseas2Page page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Page({
  templateUrl: 'build/pages/shop-overseas-2/shop-overseas-2.html',
  providers: [Firebase],
})
export class ShopOverseas2Page {
  static get parameters() {
    return [[NavController], [Http], [Platform], [NgZone], [Firebase]];
  }

  /*
  firebase 를 통해 최초에 100건을 가져온다. date descending
  이 후 각 페이지에 접속해서, 새로운 아이템이 있으면, firebase에 저장한다.
  firebase 에서 업데이트 된 정보가 있으면 받아서, 해당 정보를 수정한다. 
  새로운 정보라면, 위에 올려서 출력한다. unshift
  */

  constructor(nav, http, platform, ngZone, firebase) {
    this.nav = nav;           // 기본으로 있음.
    this.http = http;         // http 요청을 위해 사용
    this.platform = platform;
    this.ngZone = ngZone;
    this.firebase = firebase; // firebase 사용
    this.database = firebase.getDatabase();

    this.items = [];          // 아이템을 담는곳
    this.itemsShow = [];      // 출력할 아이템을 담는 곳
    this.lastDateFormat = ''  // 지속적으로 데이터를 가져오기 위해 가져온 마지막 시각을 기록한다. 

    this.path = '2016/site-moa/shop-overseas';  // 저장하는 공간 주소

    this.getItems();
    this.getRealData();
    

  }

  // 데이터를 추가적으로 가져온다. 
  getItemsMore(infiniteScroll) {
    //debugger;
    var part = [];    
    this.database.ref(this.path).orderByChild("dateFormat").endAt(lastDateFormat).limitToLast(100).once('value', (snapshot) => {
      var items = snapshot.val();
      for (var key in items) {
        var item = items[key];
        part.unshift(item);
        this.lastDateFormat = item.dateFormat;
      }
      for (var i = 0; i < part.length; i++) {
        this.items.push(part[i]);
      }
      this.showItems();
      infiniteScroll.complete();
    });
  }

  // 최초에 필요한 데이터를 가져온다. 
  getItems() {
    this.items = [];

    this.database.ref(this.path).orderByChild("dateFormat").limitToLast(100).once('value', (snapshot) => {
      var items = snapshot.val();
      debugger;
      console.log(items);
      for (var key in items) {
        var item = items[key];
        this.items.unshift(item);
        this.lastDateFormat = item.dateFormat;
      }
      this.showItems();
    });

    //this.getAddedData();
    this.getUpdatedData();
    this.getRealData();
  }

  getRealData() {
    this.sitePage = 1;
    this.loadPpomppu(this.sitePage);
  }

  loadPpomppu(page) {
    var url = "http://m.ppomppu.co.kr/new/bbs_list.php?id=ppomppu4&page=" + page;

    this.http.get(url).subscribe(data => {
      let parser = new DOMParser();
      let doc = parser.parseFromString(data.text(), "text/html");
      let elements = doc.querySelectorAll('ul.bbsList .none-border');
      let pattern = /(\d{2}.\d{2}.\d{2}).+?(\d+)/;

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
        item.url = "http://m.ppomppu.co.kr/new/" + elements[i].querySelector('a[href]').getAttribute('href'); // url

        let dateText = elements[i].querySelector('span.info').textContent.trim(); //  08:07:15 | 조회 1234   
        let match = pattern.exec(dateText);
        item.date = match[1].trim();
        item.read = match[2];
        let date = this.getDate(item.date);
        item.dateFormat = this.getDateFormat(date);
        console.log("time:"+ item.dateFormat);
        
        item.soldOut = elements[i].querySelector('span.title span');
        
        //todo: 세부 페이지 조회해서 가져오는 기능 추가해야 함.


        this.saveData(item);
      }
    });
  }

  saveData(newData) {

    var key = this.getKey(newData);
    this.database.ref(this.path + "/" + key).once('value', (snapshot) => {
      
      var item = snapshot.val();
      var data = {};
      if (newData.price) data.price = newData.price;
      if (newData.good) data.good = newData.good;
      if (newData.reply) data.reply = newData.reply;
      if (newData.read) data.read = newData.read;
      if (newData.title) data.title = newData.title;
      if (newData.soldOut) data.soldOut = newData.sodlOut;
      if (newData.imgSrc) data.imgSrc = newData.imgSrc;

      if (item) {
        this.database.ref(this.path + '/' + key).update(data);
      } else {
        if (newData.url) data.url = newData.url;
        if (newData.dateFormat) data.dateFormat = newData.dateFormat;
        this.database.ref(this.path + '/' + key).set(data);
      }
    });
  }

  getKey(data) {
    var url = data.url;
    var rep = url.replace(/\./g, "_dot_")
      .replace(/\//g, "_slash_");
    return rep;
  }

  getUpdatedData() {
    //todo      
  }

  getAddedData() {
    // 업데이트 되는 데이터를 처리한다.
    this.database.ref(this.path).on('child_added', (snapshot) => {
      debugger;
      var item = snapshot.val();
      this.items.unshift(item);
      this.showItems();
    });
  }

// 아이템들을 보여준다.
  showItems() {    
    this.itemsShow = [];
    this.ngZone.run(() => {
      this.items.sort((a, b) => {
        if (a.dateFormat < b.dateFormat) {
          return 1;
        } else if (a.dateFormat > b.dateFormat) {
          return -1;
        } else {
          return 0;
        }
      });
      this.itemsShow = this.items;
    });
  }



// 링크 페이지를 연다.
  openLink(item) {
    this.platform.ready().then(() => {
      window.open(item.url, '_blank');
    });
  }


  loadClien(page) {
    var url = "http://m.clien.net/cs3/board?bo_style=lists&bo_table=jirum&spt=&page=" + page;

    this.addUrlMap(url);

    this.http.get(url).subscribe(data => {

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

  getDateFormat(date) {
    if (window.dateFormat)
      return window.dateFormat(date, "yyyy-mm-dd HH:MM");
  }

  getDate(dateStr) {
    var now = new Date();
    var yyyy = now.getFullYear();
    var mm = now.getMonth();
    var dd = now.getDate();
    var hh = now.getHours();
    var mi = now.getMinutes();

    var pattern = /(\d{2})-(\d{2}) (\d{2}):(\d{2})/;    // 06-02 09:45
    var match = pattern.exec(dateStr);

    if (match) {
      mm = match[1];
      dd = match[2];
      hh = match[3];
      mi = match[4];
    }

    pattern = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/;  //2016-06-02 13:43
    match = pattern.exec(dateStr);
    if (match) {
      yyyy = match[1];
      mm = match[2];
      dd = match[3];
      hh = match[4];
      mi = match[5];
    }

    pattern = /(\d{2}):(\d{2}):(\d{2})/;    // 17:44:33
    match = pattern.exec(dateStr);
    if (match) {
      hh = match[1];
      mi = match[2];
    }
    return new Date(yyyy, mm, dd, hh, mi);
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

        this.addUrlMap(item.url);

        this.http.get(item.url).subscribe(data => {

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
          var date = doc.querySelector('span.ex').textContent.trim();
          var pattern = /(\d[0-9\. :]+\d)/;
          var match = pattern.exec(date);
          if (match) {
            item.date = this.getDate(match[1]);
            item.dateFormat = this.getDateFormat(item.date);
          }
          if (item.url) this.items.push(item);
          this.deleteUrlMap(item.url);
        });
      }

      this.deleteUrlMap(url);
    });
  }


  doInfinite(infiniteScroll) {
    // firebase 에서 더 가져온다.
    this.getItemsMore(infiniteScroll);
    // 사이트에서 더 가져온다.
    //infiniteScroll.complete();
    return;
  }
}

