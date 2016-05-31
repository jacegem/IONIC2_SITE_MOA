import {Injectable, Pipe} from 'angular2/core';

/*
  Generated class for the ArraySort pipe.

  See https://angular.io/docs/ts/latest/guide/pipes.html for more info on
  Angular 2 Pipes.
*/
@Pipe({
  name: 'arraySort'
})
@Injectable()
export class ArraySort {
  /*
    Takes a value and makes it lowercase.
   */
  transform(value, args) {
    value.sort((a, b) => {
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
  }
  
}
