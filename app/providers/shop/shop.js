import {Injectable} from 'angular2/core';
import {Http} from 'angular2/http';
import 'rxjs/add/operator/map';

/*
  Generated class for the Shop provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class Shop {
  static get parameters() {
    return [[Http]]
  }

  constructor(http) {
    this.http = http;
    this.data = null;
  }

  load() {
    if (this.data) {
      // already loaded data
      return Promise.resolve(this.data);
    }

    // don't have the data yet
    return new Promise(resolve => {
      // We're using Angular Http provider to request the data,
      // then on the response it'll map the JSON data to a parsed JS object.
      // Next we process the data and resolve the promise with the new data.
      this.http.get('path/to/data.json')
        .map(res => res.json())
        .subscribe(data => {
          // we've got back the raw data, now generate the core schedule data
          // and save the data for later reference
          this.data = data;
          resolve(this.data);
        });
    });
  }

  saveDealbadaData(url, path) {
    this.http.get(url).subscribe(data => {
      var parser = new DOMParser();
      var doc = parser.parseFromString(data.text(), "text/html");
      var elements = doc.querySelectorAll('div.tbl_head01 tr');

      for (var i in elements) {
        if (i == 'length') break;
        var item = {};
        item.imgSrc = elements[i].querySelector('td.td_img img'); // 이미지
        if (item.imgSrc) item.imgSrc = item.imgSrc.src;
        item.url = elements[i].querySelector('td.td_img a');
        if (item.url) item.url = item.url.getAttribute('href'); //URL

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
}

