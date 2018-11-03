import {Component, ViewChild} from "@angular/core";
import {AlertController, App, Events, IonicApp, LoadingController, Nav, Platform, Tabs} from "ionic-angular";
import {Splashscreen, StatusBar} from "ionic-native";
import {Storage} from "@ionic/storage";
import {LoginPage} from "../pages/login/login";
import {TabsPage} from "../pages/tabs/tabs";
import {Sql} from "./providers/Sql";
import {LocalNotifications} from "@ionic-native/local-notifications";
import {OneSignal} from "@ionic-native/onesignal";
import {VideoDetailPage} from "../pages/video-detail/video-detail";
import {ProfilePage} from "../pages/profile/profile";
import {AuthService} from "./api/services/auth.service";

declare var window

@Component({
    templateUrl: 'app.html'
})

export class FriendSongs {

    // public database: SQLiteObject;
    static userData: any = [];
    static spotifyData: any = [];
    static clientId: any = '67f7034acc0748c19166b80cc59ea407';
    static clientSecret: any = '9a86de38855b4d3c8c6b1dae8c18771b';
    static YouTubeIframeLoader: any;
    static pushNotification: boolean;
    static pushDataID: any;
    static notification :any
    @ViewChild('myTab') tabRef: Tabs
    @ViewChild(Nav, {}) nav: Nav
    rootPage: any;
    pageName: any = '';
    loader: any;

    constructor(public platform: Platform, public loadingCtrl: LoadingController, event: Events, public storage: Storage, private sql: Sql, public app: App, private ionicApp: IonicApp, public alertCtrl: AlertController, private localNotifications: LocalNotifications, private oneSignal: OneSignal,public authApi: AuthService) {
        localStorage.removeItem('shuffle');
        localStorage.removeItem('rendom');

        document.addEventListener('pause', () => {
            event.publish("event:phoneLock")
            localStorage.removeItem('shuffle');
            localStorage.removeItem('rendom');
        });

        /* LOCAL NOTIFICATION (DAILY)*/

        FriendSongs.YouTubeIframeLoader = {
            src: 'https://www.youtube.com/iframe_api',
            loading: false,
            loaded: false,
            listeners: [],

            load: function (callback) {
                let YouTubeIframeLoader = this;
                YouTubeIframeLoader.listeners.push(callback);

                if (YouTubeIframeLoader.loaded) {
                    setTimeout(function () {
                        YouTubeIframeLoader.done();
                    });
                    return;
                }

                if (YouTubeIframeLoader.loading) {
                    return;
                }

                YouTubeIframeLoader.loading = true;

                window.onYouTubeIframeAPIReady = function () {
                    YouTubeIframeLoader.loaded = true;
                    YouTubeIframeLoader.done();
                };

                let script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = this.src;
                document.body.appendChild(script);
            },

            done: function () {
                delete window.onYouTubeIframeAPIReady;

                while (this.listeners.length) {
                    this.listeners.pop()(window.YT);
                }
            }
        };


        this.platform.ready().then(() => {
            Splashscreen.hide();


            /* Notification on click event */
            this.localNotifications.on("click", () => {
                this.sql.query("SELECT * FROM user_data").then((data) => {
                    if (data.res.rows.length > 0) {
                        this.rootPage = TabsPage;
                    } else {
                        this.rootPage = LoginPage;
                    }
                })
            });

            /* Check intro screen */
            /*this.storage.get('introShown').then((result) => {
                if (result) {*/
            /* Get Data from database */
            this.sql.query("SELECT * FROM user_data").then((data) => {
                if (data.res.rows.length > 0) {
                    /* Set root page */
                    this.oneSignal.getIds().then((id) => {
                        console.log("5", id)
                        FriendSongs.userData.device_token = id.userId
                        if (FriendSongs.userData.device_token != '' || FriendSongs.userData.device_token != '0' || FriendSongs.userData.device_token != null) {
                            this.rootPage = TabsPage;
                            /* Set globally data for user */
                            FriendSongs.userData.id = data.res.rows.item(0).id;
                            FriendSongs.userData.name = data.res.rows.item(0).name;
                            FriendSongs.userData.email = data.res.rows.item(0).email;
                            FriendSongs.userData.avatar = data.res.rows.item(0).avatar;
                            FriendSongs.userData.device_type = data.res.rows.item(0).device_type;
                            // FriendSongs.userData.device_token = data.res.rows.item(0).device_token;
                            FriendSongs.userData.login_type = data.res.rows.item(0).login_type;
                            FriendSongs.userData.notification = data.res.rows.item(0).notification;
                            FriendSongs.userData.facebook_share = data.res.rows.item(0).social_share;
                            /* Set globally data for Spotify */
                            FriendSongs.spotifyData.id = data.res.rows.item(0).spotify_id;
                            FriendSongs.spotifyData.login = data.res.rows.item(0).spotify_login;
                            FriendSongs.spotifyData.token = data.res.rows.item(0).spotify_token;
                            FriendSongs.spotifyData.name = data.res.rows.item(0).spotify_uname;
                            FriendSongs.spotifyData.uri = data.res.rows.item(0).spotify_uri;

                            let notiData = new FormData();
                            notiData.append('device_token', FriendSongs.userData.device_token);
                            notiData.append('email', FriendSongs.userData.email);
                            notiData.append('action', 'push_notifications');

                            this.authApi.pushNotification(notiData).subscribe(() => {
                                FriendSongs.notification = 'true'
                            }, err => {console.log(err)})
                        } else {
                            FriendSongs.notification = 'false'
                        }
                    })
                } else {
                    /* Set root page if user not login */
                    this.rootPage = LoginPage;
                }

            }, (error) => {
                /* Set root page if user not login or something wrong with login */
                this.rootPage = LoginPage;
                console.log("ERROR: " + JSON.stringify(error));
            })

            this.oneSignal.startInit('40d1f6ce-6d08-47a6-b6d8-45592e2e31c1', '169913218542');

            this.oneSignal.inFocusDisplaying(this.oneSignal.OSInFocusDisplayOption.Notification);

            this.oneSignal.handleNotificationReceived().subscribe((data) => {
                console.log('NotificationReceivedData >>> ', data)
                // do something when notification is received
            });

            this.oneSignal.handleNotificationOpened().subscribe((data) => {
                let that = this
                var type = data.notification.payload.additionalData.type
                var id = data.notification.payload.additionalData.id
                FriendSongs.pushNotification = true
                FriendSongs.pushDataID = id
                this.nav.pop();
                setTimeout(function () {
                    if(type != 3){
                        if (that.rootPage == TabsPage) {
                            that.nav.push(VideoDetailPage, {activity_id: FriendSongs.pushDataID})
                        } else {
                            setTimeout(function () {
                                that.nav.push(VideoDetailPage, {activity_id: FriendSongs.pushDataID})
                            },1000)
                        }
                    }
                    if(type == 3){
                        if (that.rootPage == TabsPage) {
                            that.nav.push(ProfilePage, {user_id: FriendSongs.pushDataID})
                        } else {
                            setTimeout(function () {
                                that.nav.push(ProfilePage, {user_id: FriendSongs.pushDataID})
                            },1000)
                        }
                    }
                },1000)
                // do something when a notification is opened
            });

            this.oneSignal.endInit();
            /*} else {
                /!* set root page to intro if app start first time *!/
                this.rootPage = IntroPage;
                /!* set locally for intro show only once *!/
                this.storage.set('introShown', true);
            }*/
         /*   this.loader.dismiss();*/
            StatusBar.styleDefault();
            /*Splashscreen.hide();*/
        });
        let that = this
        that.platform.resume.subscribe(() => {
            that.sql.query("SELECT * FROM user_data").then((data) => {
                if (data.res.rows.length > 0) {
                    /* Set root page */
                    that.oneSignal.getIds().then((id) => {
                        FriendSongs.userData.device_token = id.userId
                        if (FriendSongs.userData.device_token != '' || FriendSongs.userData.device_token != '0' || FriendSongs.userData.device_token != null) {
                            let notiData = new FormData();
                            notiData.append('device_token', FriendSongs.userData.device_token);
                            notiData.append('email', FriendSongs.userData.email);
                            notiData.append('action', 'push_notifications');

                            that.authApi.pushNotification(notiData).subscribe(() => {
                                FriendSongs.notification = 'true'
                            }, err => {console.log(err)})
                        } else {
                            FriendSongs.notification = 'false'
                        }
                    })
                }

            }, (error) => {
                /* Set root page if user not login or something wrong with login */
                that.rootPage = LoginPage;
                console.log("ERROR: " + JSON.stringify(error));
            })
        })
    }

    /* Default loader at app start */
    presentLoading() {
        this.loader = this.loadingCtrl.create({
            content: "Please wait..."
        });
        this.loader.present();
    }

    /* Globally function for loader timeout */
    static loaderTimeOut(loader) {
        return setTimeout(function () {
            loader.dismiss()
        }, 6000)
    }
}