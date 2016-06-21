import {Platform, Page, Alert, NavController} from 'ionic-angular';
import {Http} from 'angular2/http';
import {InAppBrowser} from 'ionic-native';
import {ArraySort} from '../../pipes/arraySort';
import {NgZone} from 'angular2/core';
import {Firebase} from '../../providers/firebase/firebase';
import {ShortDate} from '../../pipes/shortDate'
import {Default} from '../../pipes/default'
/*
  Generated class for the ShopOverseas2Page page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Page({
  templateUrl: 'build/pages/shop-overseas-2/shop-overseas-2.html',
  providers: [Firebase],
  pipes: [[ShortDate], [Default]],
})
export class ShopOverseas2Page {
  static get parameters() {
    return [[NavController], [Http], [Platform], [NgZone], [Firebase]];
  }

  /*
  firebase 를 통해 최초에 100건을 가져온다. date descending
  이 후 각 페이지에 접속해서, 새로운 아이템이 있으면, firebase에 저장한다.
  firebase 에서 업데이트 된 정보가 있으면 받아서, 해당 정보를 수정한다. 
  새로운 정보라면, 위에 올려서 출력한다. 
  */

  constructor(nav, http, platform, ngZone, firebase) {
    this.nav = nav;           // 기본으로 있음.
    this.http = http;         // http 요청을 위해 사용
    this.platform = platform;
    this.ngZone = ngZone;
    this.firebase = firebase; // firebase 사용
    this.database = firebase.getDatabase();
    this.path = '2016/site-moa/shop-overseas';  // 저장하는 공간 주소

    this.init();
    this.getItems();
    //setInterval(this.getItems(), 3000);
  }

  init() {
    this.sitePage = 1;        // 사이트 페이지
    this.pageRow = 50;
    this.infoMap = {};
    this.itemsShow = [];      // 출력할 아이템을 담는 곳
    this.lastItem = {};
  }

  // getAddedData() {
  //   this.database.ref(this.path).on('child_added', (snapshot) => {
  //     var item = snapshot.val();
  //     if (item.dateFormat < this.lastDateFormat) return;

  //     this.items[item.url] = item;
  //     this.showItems();
  //   });
  // }

  // 최초에 필요한 데이터를 가져온다. 
  getItems(event) {
    this.itemsShow = [];
    this.database.ref(this.path).orderByChild("dateFormat").limitToLast(this.pageRow).once('value', (snapshot) => {
      var items = snapshot.val();
      items = this.sortList(items);

      this.lastItem = items[Object.keys(items)[0]];

      for (var key in items) this.itemsShow.unshift(items[key]);
      this.showItems();

      if (event) event.complete();

      this.getRealData();
    });
  }

  // 데이터를 추가적으로 가져온다. 
  getItemsMore(infiniteScroll) {
    this.database.ref(this.path).orderByChild("dateFormat").endAt(this.lastItem.dateFormat).limitToLast(this.pageRow).once('value', (snapshot) => {
      var items = snapshot.val();
      items = this.sortList(items);
      var moreItems = [];
      for (var key in items) {
        if (this.lastItem.url != items[key].url) {
          moreItems.unshift(items[key]);
        }
      }
      for (var i in moreItems) this.itemsShow.push(moreItems[i]);
      this.showItems();

      this.lastItem = items[Object.keys(items)[0]];
      if (infiniteScroll) infiniteScroll.complete();

      this.getRealData();
    });
  }

  getRealData() {
    this.loadPpomppu(this.sitePage);
    this.loadClien(this.sitePage);
    this.loadDdanzi(this.sitePage);
    this.loadDealbada(this.sitePage);
    this.sitePage++;
  }

  doInfinite(infiniteScroll) {
    // firebase 에서 더 가져온다.
    this.getItemsMore(infiniteScroll);
    //this.getRealData();

    return;
  }

  doRefresh(event) {
    // if (event.state == "refreshing") {
    //   return;
    // }
    this.init();
    this.getItems(event);
    //this.getRealData();
  }

  loadPpomppu(page) {
    var url = "http://m.ppomppu.co.kr/new/bbs_list.php?id=ppomppu4&page=" + page;

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
        item.url = "http://m.ppomppu.co.kr/new/" + elements[i].querySelector('a[href]').getAttribute('href'); // url
        item.soldOut = elements[i].querySelector('span.title span');

        this.infoMap[item.url] = item;

        this.http.get(item.url).subscribe(data => {
          let url = data.url;
          let parser = new DOMParser();
          let doc = parser.parseFromString(data.text(), "text/html");
          let dateText = doc.querySelector('div.info span.hi').textContent.trim();

          let item = this.infoMap[url];
          delete this.infoMap[url];
          let pattern = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2})/;
          let match = pattern.exec(dateText);
          let date = this.getDate(match[1]);
          item.dateFormat = this.getDateFormat(date);
          this.saveData(item);
        });
      }
    });
  }

  // saveData(newData) {

  //   var key = this.getKey(newData);
  //   this.database.ref(this.path + "/" + key).once('value', (snapshot) => {

  //     var item = snapshot.val();
  //     var data = {};
  //     if (newData.price) data.price = newData.price;
  //     if (newData.good) data.good = newData.good;
  //     if (newData.bad) data.bad = newData.bad;
  //     if (newData.reply) data.reply = newData.reply;
  //     if (newData.read) data.read = newData.read;
  //     if (newData.title) data.title = newData.title;
  //     if (newData.soldOut) data.soldOut = newData.soldOut;
  //     if (newData.imgSrc) data.imgSrc = newData.imgSrc;

  //     if (item) {
  //       this.database.ref(this.path + '/' + key).update(data);
  //     } else {
  //       if (newData.url) data.url = newData.url;
  //       if (newData.dateFormat) data.dateFormat = newData.dateFormat;
  //       this.database.ref(this.path + '/' + key).set(data);
  //     }
  //   });
  // }

  saveData(newData) {
    var data = {};
    if (newData.price) data.price = newData.price;
    if (newData.good) data.good = newData.good;
    if (newData.bad) data.bad = newData.bad;
    if (newData.reply) data.reply = newData.reply;
    if (newData.read) data.read = newData.read;
    if (newData.title) data.title = newData.title;
    if (newData.soldOut) data.soldOut = newData.soldOut;
    if (newData.imgSrc) data.imgSrc = newData.imgSrc;
    if (newData.url) data.url = newData.url;
    if (newData.dateFormat) data.dateFormat = newData.dateFormat;

    var key = this.getKey(newData);
    this.database.ref(this.path + '/' + key).set(data);

    // 마지막 날짜보다 전이고, 없는 데이터 라면, 리스트에 추가한다.
    let bFound = false;
    if (newData.datFormat > this.lastItem.dateFormat) {
      for (let i in this.itemsShow) {
        let item = this.itemsShow[i];
        if (item.url == newData.url) {
          this.itemsShow[i] = newData;
          bFound = true;
          break;
        }
      }
      if (bFound == false) {
        this.sortList(newData);
      }
    }
  }

   // 아이템들을 보여준다.
  sortList(obj) {
    var array = $.map(obj, function(value, index) {
      return [value];
    });

    array.sort((a, b) => {
      if (a.dateFormat > b.dateFormat) {
        return 1;
      } else if (a.dateFormat < b.dateFormat) {
        return -1;
      } else {
        return 0;
      }
    });
    return array;
  }



  getKey(data) {
    let url = data.url;

    let pattern = /(.+)&page=\d+(.*)/;
    let match = pattern.exec(url);
    if (match) url = match[1] + match[2];

    let rep = url.replace(/\./g, "_dot_")
      .replace(/\//g, "_slash_");
    return rep;
  }



  // 아이템들을 보여준다.
  showItems() {
    //this.itemsShow = [];
    this.ngZone.run(() => { });

    // var item;
    // for (var url in this.items) {
    //   item = this.items[url];
    //   this.itemsShow.push(item);
    // }

    // this.ngZone.run(() => {
    //   this.itemsShow.sort((a, b) => {
    //     if (a.dateFormat < b.dateFormat) {
    //       return 1;
    //     } else if (a.dateFormat > b.dateFormat) {
    //       return -1;
    //     } else {
    //       return 0;
    //     }
    //   });
    // });
  }



  // 링크 페이지를 연다.
  openLink(item) {
    this.platform.ready().then(() => {
      window.open(item.url, '_blank');
    });
  }


  loadClien(page) {
    var url = "http://m.clien.net/cs3/board?bo_style=lists&bo_table=jirum&spt=&page=" + page;

    this.http.get(url).subscribe(data => {
      let parser = new DOMParser();
      let doc = parser.parseFromString(data.text(), "text/html");
      let elements = doc.querySelectorAll('table.tb_lst_normal tbody tr');

      for (let i in elements) {
        var item = {};
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

        this.infoMap[item.url] = item;

        this.http.get(item.url).subscribe(data => {
          let parser = new DOMParser();
          let url = data.url;
          let item = this.infoMap[url];
          delete this.infoMap[url];

          let doc = parser.parseFromString(data.text(), "text/html");
          item.imgSrc = doc.querySelector('div.post_ct img[src]');
          if (item.imgSrc) {
            item.imgSrc = item.imgSrc.getAttribute('src');
            item.imgSrc = item.imgSrc.replace("http://cache.", "https://");
          }

          let date = doc.querySelector('span.view_info').textContent.trim();
          let pattern = /([0-9\- :]+) .+?(\d+)/;
          let match = pattern.exec(date);
          if (match) {
            item.date = this.getDate(match[1]);
            item.dateFormat = this.getDateFormat(item.date);
            item.read = match[2];
          }

          if (item.url) {
            this.saveData(item);
          }
        });
      }
    });
  }

  getDateFormat(date) {
    if (window.dateFormat)
      return window.dateFormat(date, "yyyy-mm-dd HH:MM");
  }

  getDate(dateStr) {
    dateStr = dateStr.trim();

    var now = new Date();
    var yyyy = now.getFullYear();
    var mm = now.getMonth();
    var dd = now.getDate();
    var hh = now.getHours();
    var mi = now.getMinutes();

    var pattern = /(\d{2})-(\d{2}) (\d{2}):(\d{2})/;    // 06-02 09:45
    var match = pattern.exec(dateStr);
    if (match) {
      mm = match[1] - 1;
      dd = match[2];
      hh = match[3];
      mi = match[4];
    }

    pattern = /(\d{4}).(\d{2}).(\d{2}) (\d{2}):(\d{2})(:\d{2})?/;  //2016-06-02 13:43
    match = pattern.exec(dateStr);

    if (match) {
      yyyy = match[1];
      mm = match[2] - 1;
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

  loadDealbada(page) {
    var url = "http://www.dealbada.com/bbs/board.php?bo_table=deal_oversea&page=" + page;
    this.http.get(url).subscribe(data => {
      var parser = new DOMParser();
      var doc = parser.parseFromString(data.text(), "text/html");
      var elements = doc.querySelectorAll('div.tbl_head01 tr');

      for (var i in elements) {
        if (i == 'length') break;
        var item = {};
        item.imgSrc = elements[i].querySelector('td.td_img a img'); // 이미지
        if (item.imgSrc.src) {
          item.imgSrc = item.imgSrc.src;
        }else{
          if (item.imgSrc.hasAttribute('data-cfsrc')) item.imgSrc = item.imgSrc.getAttribute('data-cfsrc');
        }
        

        debugger;
        
        item.url = elements[i].querySelector('td.td_img a');
        if (item.url) item.url = item.url.getAttribute('href'); //URL
        if (!item.url) continue;
        
        this.infoMap[item.url] = item;

        this.http.get(item.url).subscribe(data => {
          let parser = new DOMParser();
          let url = data.url;
          let item = this.infoMap[url];
          delete this.infoMap[url];

          let doc = parser.parseFromString(data.text(), "text/html");
          let articleSection = doc.querySelector('#bo_v_info');
          let spans = articleSection.querySelectorAll('div span');
          item.title = spans[0].textContent.trim();
          item.date = spans[7].textContent.trim();
          item.date = this.getDate(item.date);
          item.dateFormat = this.getDateFormat(item.date);

          item.read = spans[9].textContent.trim();
          var pattern = /\d+/;
          var match = pattern.exec(item.read);
          if (match) {
            item.good = spans[12].textContent.trim();
            item.bad = spans[15].textContent.trim();
            item.reply = spans[18].textContent.trim();
          } else {
            item.read = spans[10].textContent.trim();
            item.good = spans[13].textContent.trim();
            item.bad = spans[16].textContent.trim();
            item.reply = spans[19].textContent.trim();
          }

          if (item.url) {
            this.saveData(item);            
          }
        });

      }
    });
  }

  loadDdanzi(page) {
    var url = "http://www.ddanzi.com/index.php?mid=pumpout&m=1&page=" + page;

    this.http.get(url).subscribe(data => {
      var parser = new DOMParser();
      var doc = parser.parseFromString(data.text(), "text/html");
      var elements = doc.querySelectorAll('ul.lt li');

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
        item.soldOut = elements[i].querySelector('span.title img[src$="end_icon.png"]');

        this.infoMap[item.url] = item;

        this.http.get(item.url).subscribe(data => {
          let parser = new DOMParser();
          let url = data.url;
          let item = this.infoMap[url];
          delete this.infoMap[url];

          let doc = parser.parseFromString(data.text(), "text/html");
          let date = doc.querySelector('span.ex').textContent.trim();
          let pattern = /(\d{4}).(\d{2}).(\d{2}) (\d{2}):(\d{2})/;  //2016.06.02 13:43   // 2016.06.09 18:29:53

          var match = pattern.exec(date);
          if (match) {
            item.date = this.getDate(match[0]);
            item.dateFormat = this.getDateFormat(item.date);
          }
          if (item.url) {
            this.saveData(item);
          }

        });
      }

    });
  }




}

