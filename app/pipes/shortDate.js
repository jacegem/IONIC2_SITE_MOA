import {Injectable, Pipe} from 'angular2/core';

/*
  Generated class for the ShortDate pipe.

  See https://angular.io/docs/ts/latest/guide/pipes.html for more info on
  Angular 2 Pipes.
*/
@Pipe({
  name: 'shortDate'
})
@Injectable()
export class ShortDate {
  /*
    Takes a value and makes it lowercase.
   */
  transform(value, args) {    
    return value.substring(5,16);    
  }
}
