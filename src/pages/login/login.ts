import {Component} from "@angular/core";
import {AlertController, LoadingController, NavController, NavParams, Platform, ToastController} from "ionic-angular";
import {TabsPage} from "../tabs/tabs";
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {Device} from "ionic-native";
import {AuthService} from "../../app/api/services/auth.service";
import {Sql} from "../../app/providers/Sql";
import {FSHelper} from "../../app/helpers/helpers";
import {Facebook, FacebookLoginResponse} from '@ionic-native/facebook';
import {Http} from "@angular/http";
import {FriendSongs} from "../../app/app.component";
import {LocalNotifications} from "@ionic-native/local-notifications";
import {InAppBrowser} from "@ionic-native/in-app-browser";
import {OneSignal} from "@ionic-native/onesignal";
import {GooglePlus} from "@ionic-native/google-plus";


@Component({
    selector: 'page-login',
    templateUrl: 'login.html',
    providers: [AuthService, GooglePlus]
})

export class LoginPage {
    inputPasswordType: string = 'password';
    inputPasswordIcon: string = 'eye-off';
    inputPasswordShow: boolean = false;

    signupPasswordType: string = 'password';
    signupPasswordIcon: string = 'eye-off';

    signupCpasswordType: string = 'password';
    signupCpasswordIcon: string = 'eye-off';
    loginSignup;

    /* FORM GORUP */
    private login: FormGroup
    private signup: FormGroup

    /* DEFINE PARAMETER */
    public emailExist: boolean = true
    public signUpEmail: string = ''
    public userData: Array<Object>;

    static emailCheck: any
    private device_type = Device.platform
    /* GET DEVICE TOKEN ID (uuid) */
    public device_token: any
    public networkErrorObj = FSHelper.networkErrorObj()
    private fbLoader: any;
    private someThingWrong: any

    static http

    /* CONSTRUCTOR */
    constructor(public navCtrl: NavController, public navParams: NavParams, public alertCtrl: AlertController, private formBuilder: FormBuilder, public toastCtrl: ToastController, public authApi: AuthService, private platform: Platform, private sql: Sql, public loadingCtrl: LoadingController, public fb: Facebook, private http: Http, private localNotifications: LocalNotifications, public iab: InAppBrowser, public oneSignal: OneSignal, private googlePlus: GooglePlus) {

        LoginPage.http = this.http
        this.loginSignup = 'Login';
        /* LOGIN VALIDATION */
        this.login = this.formBuilder.group({
            email: ['', Validators.compose([Validators.required, Validators.pattern(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)])],
            password: ['', Validators.required]
        })

        /* SIGNUP VALIDATION */
        this.signup = this.formBuilder.group({
            email: ['', Validators.compose([Validators.required, Validators.pattern(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)]), this.checkExist.bind(this)],
            username: ['', Validators.compose([Validators.required])],
            password: ['', Validators.compose([Validators.required])],
            confirmPassword: ['', Validators.compose([Validators.required, this.checkConfirmPassword.bind(this)])]
        })
        this.someThingWrong = this.toastCtrl.create({
            message: 'Something went wrong.',
            duration: FSHelper.toastMessageTime(2)
        })
    }

    checkExist(control: FormControl): any {
        //Fake a slow response from server
        return new Promise(resolve => {
            let value = control.value
            let re = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
            if (window.navigator.onLine) {
                let validationData = new FormData();
                validationData.append('action', 'user_exists')
                validationData.append('email', value)
                if (re.test(value)) {
                    this.http.post('https://mdev.friendsongs' +
                        '.com/lib/ajax/ajax.php', validationData).toPromise().then((res) => {
                        let result = res.json()
                        let valid = result.success == false ? null : {notA: true};
                        if (valid != null) {
                            this.toastCtrl.create({
                                message: 'This email already exist.',
                                duration: FSHelper.toastMessageTime(2)
                            }).present()
                        }
                        resolve(valid)
                    })
                } else {
                    resolve({notA: true})
                }

            } else {
                resolve({notA: true})
            }
        });

    }

    checkConfirmPassword(fieldControl: FormControl) {
        let valid = fieldControl.value === fieldControl.root.value.password ? null : {notA: true};
        return valid
    }

    chageSegmaent() {
        if (this.loginSignup != 'Login') {
            this.login.reset()
        } else {
            this.signup.reset()
        }
    }

    /* SHOW LOGIN PASSWORD */
    toggleInputPassword() {
        this.inputPasswordShow = !this.inputPasswordShow;
        this.inputPasswordType = this.inputPasswordShow ? 'text' : 'password';
        this.inputPasswordIcon = this.inputPasswordShow ? 'eye' : 'eye-off';
    }

    /* SHOW SIGNUP PASSWORD */
    toggleSignupPassword() {
        this.inputPasswordShow = !this.inputPasswordShow;
        this.signupPasswordType = this.inputPasswordShow ? 'text' : 'password';
        this.signupPasswordIcon = this.inputPasswordShow ? 'eye' : 'eye-off';
    }

    /* SHOW SIGNUP CONFIRM PASSWORD */
    toggleSignupConfirmPassword() {
        this.inputPasswordShow = !this.inputPasswordShow;
        this.signupCpasswordType = this.inputPasswordShow ? 'text' : 'password';
        this.signupCpasswordIcon = this.inputPasswordShow ? 'eye' : 'eye-off';
    }

    /* USER LOGIN */
    userLogin() {
        let loader = this.loadingCtrl.create({
            content: "Loading..."
        });

        /* GET LOGIN FORM VALUE*/
        let loginData = this.login.value

        /* LOGIN SUCCESS TOAST */
        let loginSuccess = this.toastCtrl.create({
            message: 'Login successfully',
            duration: 2000
        });
        /* AUTHENTICATION ERROR TOAST */
        let authError = this.toastCtrl.create({
            message: 'Email or password is wrong',
            duration: 2000
        });
        /* VALIDATION ERORR TOAST */
        let emailRequire = this.toastCtrl.create({
            message: 'Please enter your email.',
            duration: 2000
        });
        let passwordRequire = this.toastCtrl.create({
            message: 'Please enter your password.',
            duration: 2000
        });
        let invalidEmail = this.toastCtrl.create({
            message: 'This email is invalid.',
            duration: 2000
        });

        /* CHECK VALIDATION */
        if (this.login.valid != false) {
            if (window.navigator.onLine) {
                loader.present()
                /* SET DATA IN API PARAMETER */
                let data = new FormData();
                data.append('email', loginData.email);
                data.append('password', loginData.password);
                data.append('ajax', 'true');
                /* CALL LOGIN API */
                this.authApi.loginApi(data).subscribe((Data) => {
                    loader.dismiss();
                    var avatar = ''

                    if (Data.avatar != '') {
                        avatar = Data.avatar
                    } else {
                        avatar = 'assets/img/default-img.png'
                    }

                    /* CHECK PARAMETER VALIDATION */
                    if (Data.success == 'false') {
                        authError.present()
                    } else {
                        if (Data.id) {
                            /* Local Notification start */
                            this.localNotifications.cancelAll().then(() => {
                                this.localNotifications.schedule({
                                    title: 'Friendsongs',
                                    text: 'Recently Added Songs.',
                                    at: new Date(new Date().getTime()),
                                    every: 'week'
                                });
                            });
                            /* Local Notification end */
                            loginSuccess.present();

                            /* get Player ID*/
                            this.oneSignal.getIds().then((id) => {
                                this.device_token = id.userId
                                if (this.device_token != '' || this.device_token != '0' || this.device_token != null) {
                                    let notiData = new FormData();
                                    notiData.append('device_token', this.device_token);
                                    notiData.append('email', loginData.email);
                                    notiData.append('action', 'push_notifications');

                                    this.authApi.pushNotification(notiData).subscribe(() => {
                                        FriendSongs.notification = 'true'
                                    }, err => {
                                        console.log(err)
                                    })

                                } else {
                                    FriendSongs.notification = 'false'
                                }
                                localStorage.setItem('user_id', Data.id)
                                this.dbFinction(Data, this.device_type, this.device_token, avatar, 'normal', FriendSongs.notification, '0', 'false', '', '', '', '')
                            })
                        }
                    }
                })
                FriendSongs.loaderTimeOut(loader)
            } else {
                this.toastCtrl.create(this.networkErrorObj).present()
            }
        } else {
            if (loginData.email == '') {
                emailRequire.present()
            } else if (!(this.validateEmail(loginData.email))) {
                invalidEmail.present()
            } else if (loginData.password == '') {
                passwordRequire.present()
            } else {
                this.someThingWrong.present()
            }

        }
    }

    /* FACEBOOK SIGNUP */
    signupFacebook() {
        if (window.navigator.onLine) {
            this.getFacebookStatus()
        } else {
            this.toastCtrl.create(this.networkErrorObj).present()
        }
    }

    getFacebookStatus() {
        if (window.navigator.onLine) {
            this.fb.getLoginStatus().then((val) => {
                if (val.status == 'connected') {
                    this.fbLoader = this.loadingCtrl.create({
                        content: "Loading..."
                    })
                    this.fbLoader.present()
                    this.fb.api("/" + val.authResponse.userID + "?fields=id,name,email,first_name,picture.type(large),friends", []).then(fbUser => {
                        let ids = '';
                        if (fbUser.friends) {
                            let ids = fbUser.friends.data.map(function (item) {
                                return item['id'];
                            });
                            ids = ids.toString()
                        }


                        if (fbUser.email) {
                            /*Onesignal get player id*/
                            this.oneSignal.getIds().then((id) => {
                                this.device_token = id.userId
                                if (this.device_token != '' || this.device_token != '0' || this.device_token != null) {
                                    let notiData = new FormData();
                                    notiData.append('device_token', this.device_token);
                                    notiData.append('email', fbUser.email);
                                    notiData.append('action', 'push_notifications');

                                    this.authApi.pushNotification(notiData).subscribe(() => {
                                        FriendSongs.notification = 'true'
                                    }, err => {
                                        console.log(err)
                                    })
                                } else {
                                    FriendSongs.notification = 'false'
                                }

                                let data = new FormData();
                                data.append('id', fbUser.id);
                                data.append('name', fbUser.name);
                                data.append('accessToken', val.authResponse.accessToken);
                                data.append('picture', fbUser.picture.data.url);
                                data.append('email', fbUser.email);
                                data.append('friendIds', ids);
                                data.append('device_type', this.device_type);
                                data.append('device_token', this.device_token);
                                data.append('ajax', 'true');
                                data.append('type', '1');
                                this.authApi.fbLoginApi(data).subscribe((fbData) => {
                                    console.log("fbData13>>>>>>>>", fbData)
                                    this.fbLoader.dismiss()
                                    if (fbData.success == 'true') {
                                        /* Local Notification start */
                                        this.localNotifications.cancelAll().then(() => {
                                            this.localNotifications.schedule({
                                                title: 'Friendsongs',
                                                text: 'Recently Added Songs.',
                                                at: new Date(new Date().getTime()),
                                                every: 'week'
                                            });
                                        });
                                        /* Local Notification end */
                                        let Data1 = {
                                            id: fbUser.id,
                                            name: fbUser.name,
                                            email: fbUser.email
                                        }
                                        if (this.device_token) {
                                            FriendSongs.notification = 'true'
                                        }
                                        localStorage.setItem('user_id', Data1.id)
                                        this.dbFinction(Data1, this.device_type, this.device_token, fbData.avatar, 'social', FriendSongs.notification, fbData.social_share, 'false', '', '', '', '')
                                    } else {
                                        this.toastCtrl.create({
                                            message: 'Something went wrong. Please try again65456.',
                                            duration: FSHelper.toastMessageTime(2)
                                        }).present()
                                    }
                                })
                            })

                        } else {

                            this.fbLoader.dismiss()
                            this.toastCtrl.create({
                                message: 'Your Facebook account doesn’t provide your email address. Kindly check and try again.',
                                duration: FSHelper.toastMessageTime(4)
                            }).present()
                        }
                    }, error => {
                        this.fbLoader.dismiss()
                        this.toastCtrl.create({
                            message: 'Something went wrong. Please try again.',
                            duration: FSHelper.toastMessageTime(4)
                        }).present()
                    })
                } else {
                    /* CALL FACEBOOK LOGIN */
                    this.facebookLogin()
                }
            }).catch(e => {
                this.toastCtrl.create({
                    message: 'Something went wrong. Please try again.',
                    duration: FSHelper.toastMessageTime(2)
                }).present()
            });
        } else {
            this.toastCtrl.create(this.networkErrorObj).present()
        }
    }

    facebookLogin() {
        if (window.navigator.onLine) {

            this.fb.login(['public_profile', 'user_friends', 'email']).then((res: FacebookLoginResponse) => {
                this.fbLoader = this.loadingCtrl.create({
                    content: "Loading..."
                });
                this.fbLoader.present();
                this.fb.api("/" + res.authResponse.userID + "?fields=id,name,email,first_name,picture.type(large),friends", []).then(fbUser => {
                    console.log('fbUser', fbUser)
                    let ids = '';
                    if (fbUser.friends) {
                        let ids = fbUser.friends.data.map(function (item) {
                            return item['id'];
                        });
                        ids = ids.toString()
                    }

                    if (fbUser.email) {
                        /*Onesignal get player id*/
                        this.oneSignal.getIds().then((id) => {
                            this.device_token = id.userId
                            if (this.device_token != '' || this.device_token != '0' || this.device_token != null) {
                                let notiData = new FormData();
                                notiData.append('device_token', this.device_token);
                                notiData.append('email', fbUser.email);
                                notiData.append('action', 'push_notifications');

                                this.authApi.pushNotification(notiData).subscribe(() => {
                                    FriendSongs.notification = 'true'
                                }, err => {
                                    console.log(err)
                                })
                            } else {
                                FriendSongs.notification = 'false'
                            }

                            let data = new FormData();
                            data.append('id', fbUser.id);
                            data.append('name', fbUser.name);
                            data.append('accessToken', res.authResponse.accessToken);
                            data.append('picture', fbUser.picture.data.url);
                            data.append('email', fbUser.email);
                            data.append('friendIds', ids);
                            data.append('device_type', this.device_type);
                            data.append('device_token', this.device_token);
                            data.append('ajax', 'true');
                            data.append('type', '1');
                            this.authApi.fbLoginApi(data).subscribe((fbData) => {

                                this.fbLoader.dismiss()
                                if (fbData.success == 'true') {
                                    /* Local Notification start */
                                    this.localNotifications.cancelAll().then(() => {
                                        this.localNotifications.schedule({
                                            title: 'Friendsongs',
                                            text: 'Recently Added Songs.',
                                            at: new Date(new Date().getTime()),
                                            every: 'week'
                                        });
                                    });
                                    /* Local Notification end */
                                    let Data1 = {
                                        id: fbData.id,
                                        name: fbData.name,
                                        email: fbData.email
                                    }
                                    if (this.device_token) {
                                        FriendSongs.notification = 'true'
                                    }
                                    localStorage.setItem('user_id', Data1.id)
                                    this.dbFinction(Data1, this.device_type, this.device_token, fbData.avatar, 'social', FriendSongs.notification, fbData.social_share, 'false', '', '', '', '')
                                } else {
                                    this.toastCtrl.create({
                                        message: 'Something went wrong. Please try again.',
                                        duration: FSHelper.toastMessageTime(2)
                                    }).present()
                                }
                            })
                        })

                    } else {
                        this.fbLoader.dismiss()
                        this.toastCtrl.create({
                            message: 'Your Facebook account doesn’t provide your email address. Kindly check and try again.',
                            duration: FSHelper.toastMessageTime(4)
                        }).present()
                    }
                }, error => {
                    this.fbLoader.dismiss()
                    this.toastCtrl.create({
                        message: 'Something went wrong. Please try again.',
                        duration: FSHelper.toastMessageTime(4)
                    }).present()
                })
            }).catch(e => {
                this.toastCtrl.create({
                    message: 'Something went wrong. Please try again.',
                    duration: FSHelper.toastMessageTime(2)
                }).present()
            });
        } else {
            this.toastCtrl.create(this.networkErrorObj).present()
        }
    }

    /* USER SIGNUP */
    userSignup() {
        let loader = this.loadingCtrl.create({
            content: "Loading..."
        });
        let signupData = this.signup.value

        let data = new FormData();
        data.append('name', signupData.username);
        data.append('email', signupData.email);
        data.append('password', signupData.password);
        data.append('device_type', this.device_type);
        data.append('device_token', this.device_token);
        data.append('action', 'register');

        /* SIGN UP VALIDATION TOAST MESSAGE */
        let signupSuccess = this.toastCtrl.create({
            message: 'Signup successfully',
            duration: FSHelper.toastMessageTime(2)
        });
        let authError = this.toastCtrl.create({
            message: 'This email already exist',
            duration: FSHelper.toastMessageTime(2)
        });
        let emailRequire = this.toastCtrl.create({
            message: 'Please enter your email.',
            duration: FSHelper.toastMessageTime(2)
        });
        let usernameRequire = this.toastCtrl.create({
            message: 'Please enter your username.',
            duration: FSHelper.toastMessageTime(2)
        });
        let passwordRequire = this.toastCtrl.create({
            message: 'Please enter your password.',
            duration: FSHelper.toastMessageTime(2)
        });
        let confirmPasswordRequire = this.toastCtrl.create({
            message: 'Please confirm your password.',
            duration: FSHelper.toastMessageTime(2)
        });
        let passwordNotMatch = this.toastCtrl.create({
            message: 'Password and confirm password field values does not match.',
            duration: FSHelper.toastMessageTime(2)
        });
        let invalidEmail = this.toastCtrl.create({
            message: 'This email is invalid.',
            duration: FSHelper.toastMessageTime(2)
        });

        /* CALL SIGNUP API */
        if (this.signup.valid != false) {
            if (signupData.password == signupData.confirmPassword) {
                if (window.navigator.onLine) {
                    loader.present()
                    this.authApi.signupApi(data).subscribe((Data) => {
                        loader.dismiss();
                        if (Data.success == false) {
                            authError.present()
                        }
                        if (Data.id) {
                            /* Local Notification start */
                            this.localNotifications.cancelAll().then(() => {
                                this.localNotifications.schedule({
                                    title: 'Friendsongs',
                                    text: 'Recently Added Songs.',
                                    at: new Date(new Date().getTime()),
                                    every: 'week'
                                });
                            });

                            signupSuccess.present();

                            /*Onesignal get player id*/
                            this.oneSignal.getIds().then((id) => {
                                this.device_token = id.userId
                                if (this.device_token != '' || this.device_token != '0' || this.device_token != null) {
                                    FriendSongs.notification = 'true'
                                } else {
                                    FriendSongs.notification = 'false'
                                }
                                localStorage.setItem('user_id', Data.id)

                                this.dbFinction(Data, this.device_type, this.device_token, 'assets/img/default-img.png', 'normal', FriendSongs.notification, '0', 'false', '', '', '', '')

                            })
                        }
                    })
                } else {
                    this.toastCtrl.create(this.networkErrorObj).present()
                }
            } else {
                passwordNotMatch.present()
            }
        } else {
            if (signupData.email == '') {
                emailRequire.present()
            } else if (!(this.validateEmail(signupData.email))) {
                invalidEmail.present()
            } else if (signupData.username == '') {
                usernameRequire.present()
            } else if (signupData.password == '') {
                passwordRequire.present()
            } else if (signupData.confirmPassword == '') {
                confirmPasswordRequire.present()
            } else if (signupData.password != signupData.confirmPassword) {
                passwordNotMatch.present()
            } else {
                this.someThingWrong.present()
            }
        }
        FriendSongs.loaderTimeOut(loader)
    }

    /* FORGOT PASSWORD */
    forgotPassword() {
        let confirm = this.alertCtrl.create({
            title: 'Recovery your password?',
            message: 'Enter your email address.',
            inputs: [
                {
                    name: 'email',
                    placeholder: 'Email'
                },
            ],
            buttons: [
                {
                    text: 'Cancel',
                    handler: () => {
                        console.log('Cancel clicked');
                    }
                },
                {
                    text: 'Submit',
                    handler: (val) => {
                        if (val.email != '') {
                            if (this.validateEmail(val.email)) {
                                if (window.navigator.onLine) {
                                    let data = new FormData();
                                    data.append('email', val.email);
                                    data.append('action', 'forgot_password');

                                    /* CALL FORGOT PASSWORD API*/
                                    this.authApi.forgotPasswordApi(data).subscribe((Data) => {
                                        if (Data.success == true) {
                                            let forgotPasswordSuccess = this.toastCtrl.create({
                                                message: "Reset password sent on your email.",
                                                duration: FSHelper.toastMessageTime(2)
                                            });
                                            forgotPasswordSuccess.present()
                                        } else {
                                            let wrongEmailId = this.toastCtrl.create({
                                                message: "This email is not register with FriendSongs.",
                                                duration: FSHelper.toastMessageTime(2)
                                            });
                                            wrongEmailId.present()
                                        }
                                    })
                                } else {
                                    this.toastCtrl.create(this.networkErrorObj).present()
                                }
                            } else {
                                this.toastCtrl.create({
                                    message: "Please enter valid email.",
                                    duration: FSHelper.toastMessageTime(2)
                                }).present()
                            }
                        } else {
                            let forgotPasswordBlank = this.toastCtrl.create({
                                message: "Please provide your email.",
                                duration: FSHelper.toastMessageTime(2)
                            });
                            forgotPasswordBlank.present()
                        }
                    }
                }
            ]
        });
        confirm.present();
    }

    dbFinction(Data, device_type, device_token, avatar, type, notification, social_share, spotify_login, spotify_token, spotify_uname, spotify_id, spotify_uri) {

        this.sql.query('CREATE TABLE IF NOT EXISTS user_data(id varchar(55),name varchar(55), email varchar(100),avatar text(256), device_type varchar(50), device_token text(256), login_type text(20), notification text(20),social_share text(20), spotify_login text(20), spotify_token text(256), spotify_uname varchar(55),spotify_id varchar(55),spotify_uri text(256))')
            .then(() => console.log('Table Created'))
            .catch(e => console.log(e));

        /* INSERT DATA */

        this.sql.query("INSERT INTO user_data (id, name, email, avatar, device_type, device_token, login_type, notification, social_share,spotify_login,spotify_token,spotify_uname,spotify_id,spotify_uri) VALUES ('" + Data.id + "', '" + Data.name + "', '" + Data.email + "', '" + avatar + "', '" + device_type + "', '" + device_token + "', '" + type + "', '" + notification + "', '" + social_share + "', '" + spotify_login + "', '" + spotify_token + "', '" + spotify_uname + "', '" + spotify_id + "', '" + spotify_uri + "')", [])
            .then((data) => {
                this.navCtrl.push(TabsPage)
                console.log("INSERTED: " + JSON.stringify(data));
            }, (error) => {
                console.log("ERROR: " + JSON.stringify(error.err));
            });
    }

    clearConfirmPass() {
        // this.signup.controls['password'].reset('')
        this.signup.controls['confirmPassword'].reset('')
    }

    validateEmail(email) {
        let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }

    privecyPolice() {
        this.iab.create('http://m.friendsongs.com/privacy', "_blank", "location=no,hardwareback=no,closebuttoncaption=Return to App");
    }

    termsAndCondition() {
        this.iab.create('http://m.friendsongs.com/terms', "_blank", "location=no,hardwareback=no,closebuttoncaption=Return to App");
    }

    loginWithGmail() {
        this.fbLoader = this.loadingCtrl.create({
            content: "Loading..."
        })
        this.fbLoader.present()
        this.googlePlus.login({
            scope: 'profile email openid',
            response_type: 'id_token permission'
        })
            .then(res => {
                if (window.navigator.onLine) {
                    if (res.email) {
                        /*Onesignal get player id*/
                        this.oneSignal.getIds().then((id) => {
                            this.device_token = id.userId
                            if (this.device_token != '' || this.device_token != '0' || this.device_token != null) {
                                let notiData = new FormData();
                                notiData.append('device_token', this.device_token);
                                notiData.append('email', res.email);
                                notiData.append('action', 'push_notifications');

                                this.authApi.pushNotification(notiData).subscribe(() => {
                                    FriendSongs.notification = 'true'
                                }, err => {
                                    console.log(err)
                                })
                            } else {
                                FriendSongs.notification = 'false'
                            }
                            let data = new FormData();
                            data.append('id', res.userId);
                            data.append('name', res.givenName);
                            data.append('accessToken', res.accessToken);
                            data.append('picture', res.imageUrl);
                            data.append('email', res.email);
                            // data.append('friendIds', ids);
                            data.append('device_type', this.device_type);
                            data.append('device_token', this.device_token);
                            data.append('ajax', 'true');
                            data.append('type', '2');
                            this.authApi.fbLoginApi(data).subscribe((fbData) => {
                                this.fbLoader.dismiss()
                                if (fbData.success == 'true') {
                                    /* Local Notification start */
                                    this.localNotifications.cancelAll().then(() => {
                                        this.localNotifications.schedule({
                                            title: 'Friendsongs',
                                            text: 'Recently Added Songs.',
                                            at: new Date(new Date().getTime()),
                                            every: 'week'
                                        });
                                    });
                                    /* Local Notification end */
                                    let Data1 = {
                                        id: fbData.id,
                                        name: fbData.name,
                                        email: fbData.email
                                    }
                                    if (this.device_token) {
                                        FriendSongs.notification = 'true'
                                    }
                                    localStorage.setItem('user_id', Data1.id)
                                    this.dbFinction(Data1, this.device_type, this.device_token, fbData.avatar, 'gmail', FriendSongs.notification, fbData.social_share, 'false', '', '', '', '')
                                } else {
                                    this.toastCtrl.create({
                                        message: 'Something went wrong. Please try again.',
                                        duration: FSHelper.toastMessageTime(2)
                                    }).present()
                                }
                            })
                        })

                    } else {
                        this.fbLoader.dismiss()
                        this.toastCtrl.create({
                            message: 'Your Facebook account doesn’t provide your email address. Kindly check and try again.',
                            duration: FSHelper.toastMessageTime(4)
                        }).present()
                    }

                } else {
                    this.fbLoader.dismiss()
                    this.toastCtrl.create(this.networkErrorObj).present()
                }
            })

            .catch(err => {
                console.log("err", err);
                this.fbLoader.dismiss()
                this.toastCtrl.create({
                    message: 'Something went wrong. Please try again.',
                    duration: FSHelper.toastMessageTime(2)
                }).present()
            });
    }
}
