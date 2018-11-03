import "rxjs/add/operator/map";
import "rxjs/add/operator/catch";
import {Injectable} from "@angular/core";
import {Http, Response} from "@angular/http";
import {Observable} from "rxjs";

@Injectable()

export class FeedsService {

    constructor(private http: Http) {
    }

    // Base url
    // private feedsUrl = 'http://m.friendsongs.com/lib/ajax/ajax.php';
    /*private feedsUrl = 'http://mdev.friendsongs.com/lib/ajax/ajax.php';*/
    private feedsUrl = 'http://player.friendsongs.com/lib/ajax/ajax.php';
    private feedsUrlSearch = 'http://player.friendsongs.com/lib/ajax/';

    // private feedsUrl = 'http://192.168.1.22/friendsongs/lib/ajax/ajax1.php';

    public everyoneFeeds(data): Observable<any> {
        /*let header = new Headers();
        header.append('Content-Type', 'multipart/form-data')
        return this.http.post(this.feedsUrl,data, {
            headers: header
        })*/
        return this.http.post(this.feedsUrl, data)
        // .map(this.extractData)
            .map(res => res.json())
            .catch(this.handleError);
    }

    public friendFeeds(data): Observable<any> {
        return this.http.post(this.feedsUrl, data)
        // .map(this.extractData)
            .map(res => res.json())
            .catch(this.handleError);
    }

    public meFeeds(data): Observable<any> {
        return this.http.post(this.feedsUrl, data)
        // .map(this.extractData)
            .map(res => res.json())
            .catch(this.handleError);
    }

    public peopleFeeds(data): Observable<any> {
        return this.http.post(this.feedsUrl, data)
        // .map(this.extractData)
            .map(res => res.json())
            .catch(this.handleError);
    }

    public profileApi(data): Observable<any> {
        return this.http.post(this.feedsUrl, data)
        // .map(this.extractData)
            .map(res => res.json())
            .catch(this.handleError);
    }

    public followUser(data): Observable<any> {
        return this.http.post(this.feedsUrl, data)
        // .map(this.extractData)
            .map(res => res.json())
            .catch(this.handleError);
    }

    public unfollowUser(data): Observable<any> {
        return this.http.post(this.feedsUrl, data)
        // .map(this.extractData)
            .map(res => res.json())
            .catch(this.handleError);
    }

    public searchApi(data): Observable<any> {
        return this.http.post(this.feedsUrl, data)
        // .map(this.extractData)
            .map(res => res.json())
            .catch(this.handleError);
    }

    public playlistForSearch(data): Observable<any> {
        return this.http.post(this.feedsUrl,data)
            .map(res => res.json())
            .catch(this.handleError);
    }


    public serchlistResult(data): Observable<any> {
        return this.http.post(this.feedsUrlSearch + 'searchAddPlaylists.php', data)
            .map(res => res.json())
            .catch(this.handleError);
    }

    /*private extractData(res: Response) {
      let body = res.json();
      return body.data || { };
    }*/

    private handleError(error: Response | any) {
        // In a real world app, we might use a remote logging infrastructure
        let errMsg: string;
        if (error instanceof Response) {
            const body = error.json() || '';
            const err = body.error || JSON.stringify(body);
            errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
        } else {
            errMsg = error.message ? error.message : error.toString();
        }
        console.error(errMsg);
        return Observable.throw(errMsg);
    }
}

