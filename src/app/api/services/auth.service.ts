import "rxjs/add/operator/map";
import "rxjs/add/operator/catch";
import {Injectable} from "@angular/core";
import {Http, Response} from "@angular/http";
import {Observable} from "rxjs";

@Injectable()

export class AuthService{

    constructor(private http : Http){}

    // Base url
    //private baseUrl = 'http://m.friendsongs.com/lib/ajax/ajax.php';
      /*private baseUrl = 'http://mdev.friendsongs.com/lib/ajax/ajax.php';*/
      private baseUrl = 'http://player.friendsongs.com/lib/ajax/ajax.php';
   // private baseUrl = 'http://192.168.1.22/friendsongs/lib/ajax/ajax1.php';
    //private loginUrl = 'http://m.friendsongs.com/login';

     /*private loginUrl = 'http://mdev.friendsongs.com/login';*/
     private loginUrl = 'http://player.friendsongs.com/login';

    //private loginUrl = 'http://192.168.1.22/friendsongs/login';

    public loginApi(data): Observable<any> {
        /*let headers = new Headers({ 'Access-Control-Allow-Origin' : '*', 'Access-Control-Allow-Methods' : 'POST, GET, OPTIONS, PUT', 'Content-Type': 'application/json' });
        let options = new RequestOptions({ headers: headers });*/
        return this.http.post(this.loginUrl,data)
        // .map(this.extractData)
            .map(res => res.json())
            .catch(this.handleError);
    }
    public signupApi(data): Observable<any> {
        return this.http.post(this.baseUrl,data)
            .map(res => res.json())
            .catch(this.handleError);
    }
    public forgotPasswordApi(data): Observable<any> {
        return this.http.post(this.baseUrl,data)
            .map(res => res.json())
            .catch(this.handleError);
    }
    public changeUsername(data): Observable<any> {
        return this.http.post(this.baseUrl,data)
            .map(res => res.json())
            .catch(this.handleError);
    }
    public changeProfilePicture(data): Observable<any> {
        return this.http.post(this.baseUrl,data)
            .map(res => res.json())
            .catch(this.handleError);
    }
    public changePassword(data): Observable<any> {
        return this.http.post(this.baseUrl,data)
            .map(res => res.json())
            .catch(this.handleError);
    }
    public pushNotification(data): Observable<any> {
        return this.http.post(this.baseUrl,data)
            .map(res => res.json())
            .catch(this.handleError);
    }
    public facebookShare(data): Observable<any> {
        return this.http.post(this.baseUrl,data)
            .map(res => res.json())
            .catch(this.handleError);
    }
    public userEmailExist(data): Observable<any> {
        return this.http.post(this.baseUrl,data)
            .map(res => res.json())
            .catch(this.handleError);
    }
    public fbLoginApi(data): Observable<any> {
        return this.http.post(this.loginUrl,data)
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