import {Page, NavController} from 'ionic-angular';

/*
  Generated class for the ShopKoreaPage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Page({
  templateUrl: 'build/pages/shop-korea/shop-korea.html',
})
export class ShopKoreaPage {
  static get parameters() {
    return [[NavController]];
  }

  constructor(nav) {
    this.nav = nav;
  }
  
  openRTSP(){
    var url = "rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mov";
    videoplayer.play(url);
  }
}
