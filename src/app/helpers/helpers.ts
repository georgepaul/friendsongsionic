import {Injectable} from "@angular/core";
import * as moment from "moment-timezone";
/**
 * Created by Karmdip Joshi on 20/03/17.
 */


@Injectable()
export class FSHelper {

    public static getTime(time){
        let local = moment.tz(time, "YYYY-MM-DD h:mm:ss", "America/New_York").utc().local().fromNow();
        return local
    }
    public static getCommentTime(time){
        let local = moment.utc(time,"YYYY-MM-DD h:mm:ss").local().fromNow()
        return local
    }

    public static getMessage(id){
        let msg = new Array(
            'Check your internet connection..'
        )
        return msg[id]
    }
    public static toastMessageTime(id){
        let time = new Array(0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 8000, 9000, 10000)
        return time[id]
    }

    public static networkErrorObj(){
        return {
            message: FSHelper.getMessage(0),
            duration: FSHelper.toastMessageTime(2)
        }
    }

    public static numberWithCommas = (x) => {
        var parts = x.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    }

    public static abbrNum(number, decPlaces) {
        // 2 decimal places => 100, 3 => 1000, etc
        decPlaces = Math.pow(10,decPlaces);

        // Enumerate number abbreviations
        var abbrev = [ "k", "m", "b", "t" ];

        // Go through the array backwards, so we do the largest first
        for (var i=abbrev.length-1; i>=0; i--) {

            // Convert array index to "1000", "1000000", etc
            var size = Math.pow(10,(i+1)*3);

            // If the number is bigger or equal do the abbreviation
            if(size <= number) {
                // Here, we multiply by decPlaces, round, and then divide by decPlaces.
                // This gives us nice rounding to a particular decimal place.
                number = Math.round(number*decPlaces/size)/decPlaces;

                // Handle special case where we round up to the next abbreviation
                if((number == 1000) && (i < abbrev.length - 1)) {
                    number = 1;
                    i++;
                }

                // Add the letter for the abbreviation
                number += abbrev[i];

                // We are done... stop
                break;
            }
        }

        return number;
    }
}
