import "rxjs/add/operator/map";
import "rxjs/add/operator/catch";
import {Injectable} from "@angular/core";
import {Http, Response} from "@angular/http";
import {Observable} from "rxjs";

@Injectable()

export class VideoService{

    constructor(private http : Http){}

    // Base url
    //private feedsUrl = 'http://m.friendsongs.com/lib/ajax/ajax.php';
    private feedsUrl = 'http://mdev.friendsongs.com/lib/ajax/ajax.php';

    //private feedsUrl = 'http://192.168.1.22/friendsongs/lib/ajax/ajax1.php';

    public videoCommentList(data): Observable<any> {
        return this.http.post(this.feedsUrl,data)
            // .map(this.extractData)
            .map(res => res.json())
            .catch(this.handleError);
    }

    public likeVideo(data): Observable<any> {
        return this.http.post(this.feedsUrl,data)
        // .map(this.extractData)
            .map(res => res.json())
            .catch(this.handleError);
    }

    public addComment(data): Observable<any> {
        return this.http.post(this.feedsUrl,data)
        // .map(this.extractData)
            .map(res => res.json())
            .catch(this.handleError);
    }

    public shareVideo(data): Observable<any> {
        return this.http.post(this.feedsUrl,data)
        // .map(this.extractData)
            .map(res => res.json())
            .catch(this.handleError);
    }

    public followersApi(data): Observable<any> {
        return this.http.post(this.feedsUrl,data)
        // .map(this.extractData)
            .map(res => res.json())
            .catch(this.handleError);
    }

    public deleteVideo(data): Observable<any> {
        return this.http.post(this.feedsUrl,data)
        // .map(this.extractData)
            .map(res => res.json())
            .catch(this.handleError);
    }
    public searchYoutube(data): Observable<any> {
        return this.http.post(this.feedsUrl,data)
        // .map(this.extractData)
            .map(res => res.json())
            .catch(this.handleError);
    }
    public videoDetail(data): Observable<any> {
        return this.http.post(this.feedsUrl,data)
        // .map(this.extractData)
            .map(res => res.json())
            .catch(this.handleError);
    }
    public videoWached(data): Observable<any> {
        return this.http.post(this.feedsUrl,data)
        // .map(this.extractData)
            .map(res => res.json())
            .catch(this.handleError);
    }
    public blockSuggestion(data): Observable<any> {
        return this.http.post(this.feedsUrl,data)
        // .map(this.extractData)
            .map(res => res.json())
            .catch(this.handleError);
    }

    public blockUserSuggestion(data): Observable<any> {
        return this.http.post(this.feedsUrl,data)
        // .map(this.extractData)
            .map(res => res.json())
            .catch(this.handleError);
    }

    public followGroup(data): Observable<any> {
        return this.http.post(this.feedsUrl,data)
            .map(res => res.json())
            .catch(this.handleError);
    }

    public disablevideo(data): Observable<any> {
        return this.http.post(this.feedsUrl,data)
            .map(res => res.json())
            .catch(this.handleError);
    }


    public addPlaylist(data): Observable<any> {
        return this.http.post(this.feedsUrl,data)
            .map(res => res.json())
            .catch(this.handleError);
    }

    /*private extractData(res: Response) {
     let body = res.json();
     return body.data || { };
     }*/

    private handleError (error: Response | any) {
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