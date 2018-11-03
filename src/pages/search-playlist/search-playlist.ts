///<reference path="../home/home.ts"/>
import {AfterViewInit, Component, NgZone} from "@angular/core";
import {
    ActionSheetController, AlertController, Events,
    LoadingController,
    NavController,
    NavParams,
    ToastController,
    ViewController
} from "ionic-angular";
import {FriendSongs} from "../../app/app.component";
import {FeedsService} from "../../app/api/services/feeds.service";
import {VideoService} from "../../app/api/services/video.service";
import {FSHelper} from "../../app/helpers/helpers";
import {Facebook} from "@ionic-native/facebook";
import {HomePage} from "../home/home";
import {Camera} from "ionic-native";
import {AuthService} from "../../app/api/services/auth.service";
import {Sql} from "../../app/providers/Sql";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";

declare var $;
declare var window;

/*
 Generated class for the Alerts page.

 See http://ionicframework.com/docs/v2/components/#navigation for more info on
 Ionic pages and navigation.
 */
@Component({
    selector: 'page-search-playlist',
    templateUrl: 'search-playlist.html',
    providers: [FeedsService, VideoService]
})

export class SearchPlaylistPage implements AfterViewInit {

    private newplaylist: FormGroup;
    public user_data = FriendSongs.userData
    public networkErrorObj = FSHelper.networkErrorObj()
    private displayImage: any;
    searchData: any = [];
    public searchValues: any = '';
    private searchValue: boolean = false;
    private suggestion: boolean = true;
    private subscriber = null;
    public base64Blob: any;
    public resultcount: boolean = false;

    constructor(public navCtrl: NavController, public navParams: NavParams, public loadingCtrl: LoadingController, private feedsApi: FeedsService, public toastCtrl: ToastController, private videosApi: VideoService, public facebook: Facebook, public viewCtrl: ViewController, public actionSheetCtrl: ActionSheetController, private zone: NgZone, public authApi: AuthService, public alertCtrl: AlertController, private sql: Sql, private formBuilder: FormBuilder, private event: Events) {
        this.newplaylist = this.formBuilder.group({
            name: ['', Validators.compose([Validators.required])],
            description: ['', Validators.compose([Validators.required])]
        })
    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad PeoplePage');
    }

    ionViewWillLeave() {
        this.searchValues = ''
        this.searchValues = null
        this.searchValue = false
    }

    ionViewWillEnter() {

        $('#fab-back-to-top-people').hide()
        let loader = this.loadingCtrl.create({
            content: "Loading..."
        });
        if (window.navigator.onLine) {
            let that = this
            let data = new FormData();
            if (that.searchData == '') {
                data.append('action', 'group_list');
                that.feedsApi.playlistForSearch(data).subscribe((Data) => {
                    loader.dismiss();
                    that.searchData = []
                    if (Data != null) {
                        that.searchData = Data;
                        that.resultcount = that.searchData.length == 0 ? true : false;
                    } else {
                        that.searchData = []
                        that.resultcount = true;
                    }
                }, (error) => {
                    that.searchData = []
                    loader.dismiss();
                    this.resultcount = true;
                    console.error(error)
                })
            }
        } else {
            this.toastCtrl.create(this.networkErrorObj).present()
        }
        FriendSongs.loaderTimeOut(loader)
    }

    static isElementInViewport(el): boolean {
        //special bonus for those using jQuery
        if (el instanceof $) {
            el = el[0];
        }
        if (el) {
            let rect = el.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
                rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
            );
        }
    }

    ngAfterViewInit(): void {
        $('page-people .scroll-content').on('scroll', function () {
            if (SearchPlaylistPage.isElementInViewport($('#fab-back-to-top-people'))) {
                if ($('page-people .scroll-content').scrollTop() < 350) {
                    $('#fab-back-to-top-people').hide()
                } else {
                    $('#fab-back-to-top-people').show()
                }
            }
        })
    }

    searchEvent() {
        this.searchValue = this.searchValue != false ? false : true
    }

    onInput(searchValues) {

        let loader = this.loadingCtrl.create({
            content: "Loading..."
        });
        this.suggestion = this.searchValues.length <= 0 ? true : false
        let that = this;
        if (that.subscriber) {
            that.subscriber.unsubscribe()
        }
        if (searchValues != '') {
            let data = new FormData();
            data.append('query', searchValues);
            data.append('ajax', 1);
            data.append('m', true);
            if (window.navigator.onLine) {
                setTimeout(() => {
                    that.subscriber = that.feedsApi.serchlistResult(data).subscribe((Data) => {
                        if (Data) {
                            if (Data.success != false) {
                                that.searchData = Data.items
                                that.resultcount = that.searchData.length == 0 ? true : false;
                            } else {
                                that.searchData = []
                                that.resultcount = true;
                            }
                        } else {
                            that.searchData = []
                            that.resultcount = true;
                        }
                    }, (error) => {
                        that.searchData = []
                        that.resultcount = true;
                    })
                }, 1000)
            } else {
                this.toastCtrl.create(this.networkErrorObj).present()
            }
        } else {
            loader.present();
            that.searchData = [];
            let data = new FormData();
            data.append('action', 'group_list');
            if (window.navigator.onLine) {
                setTimeout(() => {
                    that.subscriber = that.feedsApi.playlistForSearch(data).subscribe((Data) => {
                        loader.dismiss()
                        that.searchData = []
                        if (Data) {
                            if (Data.success != false) {
                                that.searchData = Data
                                that.resultcount = that.searchData.length == 0 ? true : false;
                            } else {
                                that.searchData = []
                                that.resultcount = true;
                            }
                        } else {
                            that.searchData = []
                            that.resultcount = true;
                        }
                    }, (error) => {
                        that.searchData = []
                        loader.dismiss()
                        console.error(error)
                    })
                }, 1000)
            } else {
                this.toastCtrl.create(this.networkErrorObj).present()
            }
        }

    }

    onCancel($event) {
        let loader = this.loadingCtrl.create({
            content: "Loading..."
        });
        loader.present();
        this.searchValue = false;
        this.searchValues = '';
        if (window.navigator.onLine) {
            let that = this
            let data = new FormData();
            data.append('action', 'group_list');
            that.feedsApi.playlistForSearch(data).subscribe((Data) => {
                loader.dismiss();
                if (Data != null) {
                    that.searchData = Data
                    that.resultcount = that.searchData.length == 0 ? true : false;
                } else {
                    that.searchData = []
                    that.resultcount = true;
                }
            }, (error) => {
                loader.dismiss();
                console.error(error)
            })
        } else {
            this.toastCtrl.create(this.networkErrorObj).present()
        }
    }

    doRefresh(refresher) {
        this.searchValues = "";
        this.searchValues = null;
        if (window.navigator.onLine) {
            let that = this
            let data = new FormData();
            data.append('action', 'group_list');
            that.feedsApi.playlistForSearch(data).subscribe((Data) => {
                if (Data != null) {
                    that.searchData = []
                    that.searchData = Data
                    that.resultcount = that.searchData.length == 0 ? true : false;

                } else {
                    that.searchData = []
                    that.resultcount = true;
                }
            }, (error) => {
                that.searchData = []
                console.error(error)
            })
            refresher.complete();
        } else {
            refresher.complete();
            this.toastCtrl.create(this.networkErrorObj).present()
        }
    }

    backToTop() {
        $(".scroll-content").scrollTop(0)
    }


    closeCommntsModel() {
        localStorage.removeItem('follow');
        this.event.publish('event:serch-playlist', {});
        this.navCtrl.pop(HomePage);
    }

    GotoHomeWithselectedItem(name, image, group_id, follow, playDescription) {
        this.event.publish('event:serch-playlist', {
            "playlist_name": name,
            "playlist_image": image,
            "group_id": group_id,
            "playlist_description": playDescription
        });
        this.navCtrl.pop(HomePage);
    }


    /*  Choose image  */
    selectImage() {
        let actionSheet = this.actionSheetCtrl.create({
            title: 'Take picture or use from library',
            buttons: [
                {
                    text: 'Camera',
                    handler: () => {
                        this.getImagePath(1);
                    }
                }, {
                    text: 'Library',
                    handler: () => {
                        this.getImagePath(0);
                    }
                }, {
                    text: 'Cancel',
                    role: 'cancel'
                }
            ]
        });
        actionSheet.present();
    }

    getImagePath(type) {
        var options = {
            destinationType: 0,
            sourceType: type,
            encodingType: 0,
            quality: 100,
            allowEdit: true,
            targetWidth: 128,
            targetHeight: 128,
            saveToPhotoAlbum: false,
            correctOrientation: true
        };

        Camera.getPicture(options).then((data) => {
            var imgdata = "data:image/jpg;base64," + data;
            var Data = data;
            this.zone.run(() => {
                //this.profileObject.image = imgdata
                this.displayImage = imgdata
                this.base64Blob = this.base64toBlob(Data, 'image/jpg')
            });
        }, (error) => {
            let alert = this.alertCtrl.create({
                title: 'Error',
                subTitle: error,
                buttons: [{
                    text: 'Dismiss'
                }]
            });
            alert.present();
        });
    }

    base64toBlob(base64Data, contentType) {
        contentType = contentType || '';
        var sliceSize = 1024;
        var byteCharacters = atob(base64Data);
        var bytesLength = byteCharacters.length;
        var slicesCount = Math.ceil(bytesLength / sliceSize);
        var byteArrays = new Array(slicesCount);

        for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
            var begin = sliceIndex * sliceSize;
            var end = Math.min(begin + sliceSize, bytesLength);

            var bytes = new Array(end - begin);
            for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
                bytes[i] = byteCharacters[offset].charCodeAt(0);
            }
            byteArrays[sliceIndex] = new Uint8Array(bytes);
        }
        return new Blob(byteArrays, {type: contentType});
    }


    userNewplaylist() {
        let that = this
        let loader = this.loadingCtrl.create({
            content: "Loading..."
        });
        let newplaylistData = this.newplaylist.value;
        let data = new FormData();
        data.append('group_name', newplaylistData.name);
        data.append('group_description', newplaylistData.description);
        data.append('group_profile', that.base64Blob);
        data.append('action', 'create_playlist');
        data.append('user_id', this.user_data.id);
        /* SIGN UP VALIDATION TOAST MESSAGE */
        let nameRequire = this.toastCtrl.create({
            message: 'Please enter your name.',
            duration: FSHelper.toastMessageTime(2)
        });
        let descriptionRequire = this.toastCtrl.create({
            message: 'Please enter your description.',
            duration: FSHelper.toastMessageTime(2)
        });

        let imageRequire = this.toastCtrl.create({
            message: 'Please choose the image.',
            duration: FSHelper.toastMessageTime(2)
        });

        let someThingWrong = this.toastCtrl.create({
            message: 'Something went wrong.',
            duration: FSHelper.toastMessageTime(2)
        })


        if (this.base64Blob == '' || this.base64Blob == undefined) {
            imageRequire.present()
            return false;
        }

        /* CALL SIGNUP API */
        if (this.newplaylist.valid != false) {
            if (window.navigator.onLine) {
                loader.present();
                this.videosApi.addPlaylist(data).subscribe((Data) => {
                    loader.dismiss();
                    if (Data.success == true) {
                        localStorage.removeItem('follow');
                        this.event.publish('event:serch-playlist', {
                            "playlist_name": Data.name,
                            "playlist_image": Data.picture,
                            "group_id": Data.id,
                            "playlist_description": Data.description
                        });
                        this.navCtrl.pop(HomePage);

                        this.toastCtrl.create({
                            message: 'Playlist created.',
                            duration: FSHelper.toastMessageTime(2)
                        }).present();
                    } else if (Data.success == false) {
                        this.toastCtrl.create({
                            message: 'Playlist name already exists.',
                            duration: FSHelper.toastMessageTime(2)
                        }).present();
                    } else {
                        this.toastCtrl.create({
                            message: 'Image should be .jpg .png or .gif only.',
                            duration: FSHelper.toastMessageTime(2)
                        }).present();
                    }
                })
            } else {
                this.toastCtrl.create(this.networkErrorObj).present()
            }

        } else {
            if (newplaylistData.name == '') {
                nameRequire.present()
            } else if (newplaylistData.description == '') {
                descriptionRequire.present()
            } else {
                someThingWrong.present()
            }
        }
        FriendSongs.loaderTimeOut(loader)
    }
}
