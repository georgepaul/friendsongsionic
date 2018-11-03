import {Component} from "@angular/core";
import {
    AlertController, App, LoadingController, NavController, NavParams, ToastController,
    ViewController
} from "ionic-angular";
import {LoginPage} from "../login/login";
import {FriendSongs} from "../../app/app.component";
import {AuthService} from "../../app/api/services/auth.service";
import {Sql} from "../../app/providers/Sql";
import {FSHelper} from "../../app/helpers/helpers";
import {Facebook} from "ionic-native";
import {InAppBrowser} from "@ionic-native/in-app-browser";
import {LocalNotifications} from "@ionic-native/local-notifications";
import {GooglePlus} from "@ionic-native/google-plus";

declare let $;
declare var window;

@Component({
    selector: 'page-settings',
    templateUrl: 'settings.html',
    providers: [AuthService,GooglePlus]

})
export class SettingsPage {
    currentPasswordType: string = 'password';
    currentPasswordIcon: string = 'eye-off';
    inputPasswordShow: boolean = false;

    newPasswordType: string = 'password';
    newPasswordIcon: string = 'eye-off';

    confirmPasswordType: string = 'password';
    confirmPasswordIcon: string = 'eye-off';

    public user_data: any = FriendSongs.userData
    editProfile: any = {
        push_notification: this.user_data.notification,
        facebookShare: this.user_data.facebook_share != '0' && this.user_data.facebook_share != undefined ? true : false
    };
    public push_notification: boolean
    public facebook_share: boolean
    userData: any = null
    public networkErrorObj = FSHelper.networkErrorObj()

    spotifyloginStatus: any = FriendSongs.spotifyData.login == undefined ? 'false' : FriendSongs.spotifyData.login

    constructor(public viewCtrl: ViewController, public navCtrl: NavController, public app: App, public navParams: NavParams, public alertCtrl: AlertController, private sql: Sql, public toastCtrl: ToastController, public authApi: AuthService, public loadingCtrl: LoadingController, public iab: InAppBrowser, private localNotifications: LocalNotifications, private googlePlus: GooglePlus) {
        this.editProfile.username = this.navParams.get("user_name")
        this.push_notification = this.editProfile.push_notification
        this.facebook_share = this.editProfile.facebookShare
        this.sql.query("SELECT * FROM user_data")
            .then((userData) => {
                this.userData = userData.res.rows.item(0)
                console.log("this.userData",this.userData);
            })
            .catch(e => console.log(e));
    }

    ionViewWillEnter() {
        this.spotifyloginStatus = FriendSongs.spotifyData.login == undefined ? 'false' : FriendSongs.spotifyData.login
    }

    currentPassword() {
        this.inputPasswordShow = !this.inputPasswordShow;
        this.currentPasswordType = this.inputPasswordShow ? 'text' : 'password';
        this.currentPasswordIcon = this.inputPasswordShow ? 'eye' : 'eye-off';
    }

    newPassword() {
        this.inputPasswordShow = !this.inputPasswordShow;
        this.newPasswordType = this.inputPasswordShow ? 'text' : 'password';
        this.newPasswordIcon = this.inputPasswordShow ? 'eye' : 'eye-off';
    }

    confirmPassword() {
        this.inputPasswordShow = !this.inputPasswordShow;
        this.confirmPasswordType = this.inputPasswordShow ? 'text' : 'password';
        this.confirmPasswordIcon = this.inputPasswordShow ? 'eye' : 'eye-off';
    }

    dismiss() {
        this.viewCtrl.dismiss();
    }

    saveProfile() {
        let change_password = this.toastCtrl.create({
            message: 'Password change successfully',
            duration: FSHelper.toastMessageTime(2)
        });
        let userValidation = this.toastCtrl.create({
            message: 'Please enter username.',
            duration: 2000
        });
        let change_user_name = this.toastCtrl.create({
            message: 'Username change successfully',
            duration: FSHelper.toastMessageTime(2)
        });
        let newPasswordValidation = this.toastCtrl.create({
            message: 'Please enter new password',
            duration: FSHelper.toastMessageTime(2)
        });
        let confirmPasswordValidation = this.toastCtrl.create({
            message: 'Please confirm new password.',
            duration: FSHelper.toastMessageTime(2)
        });
        let confirmPassword = this.toastCtrl.create({
            message: 'New password and confirm password field values do not match.',
            duration: FSHelper.toastMessageTime(2)
        });

        if (this.editProfile.current_password) {
            if (this.editProfile.current_password != '') {
                if (this.editProfile.new_password) {
                    if (this.editProfile.confirm_password) {
                        if (this.editProfile.new_password != '') {
                            if (this.editProfile.confirm_password != '') {
                                if (this.editProfile.new_password == this.editProfile.confirm_password) {
                                    if (window.navigator.onLine) {
                                        let data = new FormData();
                                        data.append('action', 'change_password');
                                        data.append('old_password', this.editProfile.current_password);
                                        data.append('password', this.editProfile.new_password);
                                        data.append('password_confirm', this.editProfile.confirm_password);
                                        data.append('email', this.user_data.email);
                                        this.authApi.changePassword(data).subscribe((Data) => {
                                            this.editProfile.confirm_password = ''
                                            this.editProfile.new_password = ''
                                            this.editProfile.current_password = ''
                                            if (Data.success == false) {
                                                let passwordVerification = this.toastCtrl.create({
                                                    message: Data.message,
                                                    duration: 2000
                                                });
                                                passwordVerification.present()
                                            } else {
                                                change_password.present()
                                            }

                                        })
                                    } else {
                                        this.toastCtrl.create(this.networkErrorObj).present()
                                    }
                                } else {
                                    confirmPassword.present()
                                }
                            } else {
                                confirmPasswordValidation.present()
                            }
                        } else {
                            newPasswordValidation.present()
                        }
                    } else {
                        confirmPasswordValidation.present()
                    }
                } else {
                    newPasswordValidation.present()
                }
            }
        }

        if (this.editProfile.username) {
            if (this.editProfile.username != '') {
                if (this.editProfile.username != this.user_data.name) {
                    if (window.navigator.onLine) {
                        let new_username = this.editProfile.username

                        let data = new FormData();
                        data.append('action', 'change_username');
                        data.append('user_id', this.user_data.id);
                        data.append('username', new_username);

                        this.authApi.changeUsername(data).subscribe((Data) => {

                            if (Data.success == "true") {
                                change_user_name.present();

                                this.sql.query("UPDATE user_data set name='" + new_username + "'", []).then((data) => {
                                    console.log("updated: " + JSON.stringify(data));
                                }, (error) => {
                                    console.log("ERROR: " + JSON.stringify(error.err));
                                });

                                this.sql.query("SELECT name FROM user_data", []).then((data) => {
                                    FriendSongs.userData.name = data.res.rows.item(0).name;
                                    console.log("Get: " + JSON.stringify(data));
                                }, (error) => {
                                    console.log("ERROR: " + JSON.stringify(error.err));
                                });
                            }else{
                                this.toastCtrl.create({message: Data.message,duration: FSHelper.toastMessageTime(2)}).present()
                            }
                        })
                    } else {
                        this.toastCtrl.create(this.networkErrorObj).present()
                    }
                }
            } else {
                userValidation.present()
            }

        } else {
            userValidation.present()
        }
        // this.viewCtrl.dismiss();
    }

    facebookLogout() {
        return Facebook.logout().then((result) => {
            return result
        })
    }

    gmillogOut(){
        this.googlePlus.logout();
    }

    logout() {
        let alert = this.alertCtrl.create({
            title: 'Log out',
            message: 'Are you sure you want to logout?',
            buttons: [
                {
                    text: 'No',
                    role: 'no',
                    handler: () => {
                        console.log('Cancel clicked');
                    }
                },
                {
                    text: 'Yes',
                    handler: () => {
                        let loader = this.loadingCtrl.create({
                            content: "Loading..."
                        });
                        loader.present();
                        let logoutSuccess = this.toastCtrl.create({
                            message: 'Logout successfully',
                            duration: FSHelper.toastMessageTime(2)
                        });

                        /* LOGOUT SUCCESS TOAST */
                        if (window.navigator.onLine) {
                            localStorage.clear();
                            let data = new FormData();
                            data.append('action', 'push_notifications');
                            data.append('device_token', 0);
                            data.append('email', this.userData.email);

                            this.authApi.pushNotification(data).subscribe((Data) => {
                                this.sql.query("UPDATE user_data set notification='" + this.editProfile.push_notification + "'", []).then((data) => {
                                    FriendSongs.userData.notification = this.editProfile.push_notification
                                }, (error) => {
                                    console.log("ERROR: " + JSON.stringify(error))
                                });
                            }, err => {
                                console.log(err)
                            })

                            this.sql.query('DROP table user_data').then(() => {
                                this.localNotifications.cancelAll().then(() => {
                                    console.log('clear all notification')
                                })
                                if (FriendSongs.userData.login_type == 'social') {
                                    this.facebookLogout()
                                    logoutSuccess.present()
                                    loader.dismiss()
                                    this.viewCtrl.dismiss()
                                    this.spotifyloginStatus = 'false';
                                    this.app.getRootNav().setRoot(LoginPage);
                                } else if(FriendSongs.userData.login_type == 'gmail'){
                                    this.gmillogOut()
                                    logoutSuccess.present()
                                    loader.dismiss()
                                    this.viewCtrl.dismiss()
                                    this.spotifyloginStatus = 'false';
                                    this.app.getRootNav().setRoot(LoginPage);
                                }
                                else {
                                    logoutSuccess.present()
                                    loader.dismiss()
                                    this.viewCtrl.dismiss()
                                    this.spotifyloginStatus = 'false';
                                    this.app.getRootNav().setRoot(LoginPage);
                                }

                            })
                            FriendSongs.loaderTimeOut(loader)
                        } else {
                            loader.dismiss()
                            this.toastCtrl.create(this.networkErrorObj).present()
                        }
                        /*/!* DELETE DATA *!/
                         this.sql.query("DELETE FROM user_data", []).then((data) => {
                         this.navCtrl.setRoot(LoginPage)
                         console.log("DELETED: " + JSON.stringify(data));
                         }, (error) => {
                         console.log("ERROR: " + JSON.stringify(error.err));
                         });*/
                        /*Facebook.getLoginStatus().then((val)=>{
                         if (val.status == 'connected'){
                         Facebook.logout()
                         this.navCtrl.push(LoginPage)
                         }else{
                         this.navCtrl.push(LoginPage)
                         }
                         });*/
                    }
                }
            ]
        });
        alert.present();
    }

    logEvent(e) {
        this.editProfile.push_notification = e.checked
    }

    shareLogEvent(e) {
        this.editProfile.facebookShare = e.checked
    }

    statusUpdate() {
        return {
            message: "Status updated.",
            duration: 1500
        }
    }

    pushNotification(Data) {
        console.log("this.userData.device_token", this.userData.device_token)
        if(this.push_notification != Data){
            if (window.navigator.onLine) {
                this.push_notification = Data
                let loader = this.loadingCtrl.create({
                    content: "Loading..."
                });
                loader.present();
                let data = new FormData();
                if (!this.editProfile.push_notification) {
                    data.append('device_token', 0);
                } else {
                    data.append('device_token', this.userData.device_token);
                }
                data.append('email', this.userData.email);
                data.append('action', 'push_notifications');

                this.authApi.pushNotification(data).subscribe((Data) => {
                    loader.dismiss()
                    this.toastCtrl.create(this.statusUpdate()).present();
                    this.sql.query("UPDATE user_data set notification='" + this.editProfile.push_notification + "'", []).then((data) => {
                        FriendSongs.userData.notification = this.editProfile.push_notification
                    }, (error) => {
                        console.log("ERROR: " + JSON.stringify(error))
                    });
                }, err => {
                    console.log(err)
                })
            } else {
                this.toastCtrl.create(this.networkErrorObj).present()
            }
        }
    }

    facebookShare(Data) {
        if(this.facebook_share != Data){
            if (window.navigator.onLine) {
                this.facebook_share = Data
                let loader = this.loadingCtrl.create({
                    content: "Loading..."
                });
                loader.present();

                let data = new FormData();
                if (this.editProfile.facebookShare) {
                    data.append('social_share', '1');
                } else {
                    data.append('social_share', '0');
                }
                data.append('email', this.userData.email);
                data.append('action', 'facebook_share');
                var social_share = this.editProfile.facebookShare ? '1' : '0';
                this.authApi.facebookShare(data).subscribe((Data) => {
                    loader.dismiss()
                    this.toastCtrl.create(this.statusUpdate()).present();
                    this.sql.query("UPDATE user_data set social_share='" + social_share + "'", []).then((data) => {
                        FriendSongs.userData.facebook_share = social_share
                    }, (error) => {
                        console.log("ERROR: " + JSON.stringify(error))
                    });
                }, err => {
                    console.log(err)
                })
            } else {
                this.toastCtrl.create(this.networkErrorObj).present()
            }
        }
    }

    newPasswordText() {
        this.editProfile.confirm_password = ''
    }

    connectSpotify() {
        let alert = this.alertCtrl.create({
            title: '<img src="assets/img/spotify.png">',
            subTitle: 'Connect Spotify to play full versions.',
            buttons: [{
                text: 'connect',
                handler: data => {
                    this.spotifyLogin()
                }
            }]
        });
        alert.present();
    }

    spotifyLogin() {
        let url = this.geturl(['user-read-email'])
        let browser = this.iab.create(url, "_blank", "location=no,hardwareback=no,closebuttoncaption=Return to App");
        let promises = new Promise((resolve, reject) => {
            let token = ''
            browser.on('loaderror').subscribe((event) => {
                let fullURL = event.url
                let url = fullURL.slice(44)
                let tokenObj = url.split('&', 1)
                token = tokenObj[0]
                browser.close()
                resolve(token);
            })
        });

        promises.then((token) => {
            this.sql.query("UPDATE user_data set spotify_token='" + token + "'", []).then((data) => {
                console.log("updated: " + JSON.stringify(data));
            }, (error) => {
                console.log("ERROR: " + JSON.stringify(error.err));
            });

            this.sql.query("SELECT spotify_token FROM user_data", []).then((data) => {
                FriendSongs.spotifyData.token = data.res.rows.item(0).spotify_token;
                console.log("Get: " + JSON.stringify(data));
            }, (error) => {
                console.log("ERROR: " + JSON.stringify(error.err));
            });

            this.getUserData(token).then((Data) => {
                this.sql.query("UPDATE user_data set spotify_id='" + Data.id + "', spotify_uname='" + Data.display_name + "', spotify_login='true', spotify_uri='" + Data.uri + "'", []).then((data) => {
                    console.log("updated: " + JSON.stringify(data));
                }, (error) => {
                    console.log("ERROR: " + JSON.stringify(error.err));
                });

                this.sql.query("SELECT * FROM user_data", []).then((data) => {
                    FriendSongs.spotifyData.login = data.res.rows.item(0).spotify_login;
                    FriendSongs.spotifyData.id = data.res.rows.item(0).spotify_id;
                    FriendSongs.spotifyData.name = data.res.rows.item(0).spotify_uname;
                    FriendSongs.spotifyData.uri = data.res.rows.item(0).spotify_uri;
                    this.spotifyloginStatus = FriendSongs.spotifyData.login
                    console.log("Get: " + JSON.stringify(data));
                }, (error) => {
                    console.log("ERROR: " + JSON.stringify(error.err));
                });

            })
        })
    }

    geturl(scopes) {
        let clientId = FriendSongs.clientId
        let REDIRECT_URI = 'friendsongs://friendsongs.com/'
        return 'https://accounts.spotify.com/authorize?client_id=' + clientId +
            '&redirect_uri=' + encodeURIComponent(REDIRECT_URI) +
            '&scope=' + encodeURIComponent(scopes.join(' ')) +
            '&response_type=token';
    }

    getUserData(accessToken) {
        return $.ajax({
            url: 'https://api.spotify.com/v1/me',
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        });
    }

    privecyPolice() {
        this.iab.create('http://m.friendsongs.com/privacy', "_blank", "location=no,hardwareback=no,closebuttoncaption=Return to App");
    }
    termsAndCondition() {
        this.iab.create('http://m.friendsongs.com/terms', "_blank", "location=no,hardwareback=no,closebuttoncaption=Return to App");
    }
}