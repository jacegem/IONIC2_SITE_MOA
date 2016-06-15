import {Page, NavController} from 'ionic-angular';

/*
  Generated class for the HotAndBestPage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Page({
  templateUrl: 'build/pages/hot-and-best/hot-and-best.html',
})
export class HotAndBestPage {
  static get parameters() {
    return [[NavController]];
  }

  constructor(nav) {
    this.nav = nav;
  }
}
