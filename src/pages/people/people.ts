import {AfterViewInit, Component} from "@angular/core";
import {LoadingController, NavController, NavParams, ToastController} from "ionic-angular";
import {VideoDetailPage} from "../video-detail/video-detail";
import {ProfilePage} from "../profile/profile";
import {FriendSongs} from "../../app/app.component";
import {FeedsService} from "../../app/api/services/feeds.service";
import {VideoService} from "../../app/api/services/video.service";
import {FSHelper} from "../../app/helpers/helpers";
import {Facebook} from "@ionic-native/facebook";

declare var $;
declare var window;
/*
 Generated class for the Alerts page.

 See http://ionicframework.com/docs/v2/components/#navigation for more info on
 Ionic pages and navigation.
 */
@Component({
    selector: 'page-people',
    templateUrl: 'people.html',
    providers: [FeedsService, VideoService]
})
export class PeoplePage implements AfterViewInit {
    public user_data = FriendSongs.userData
    public networkErrorObj = FSHelper.networkErrorObj()

    peopleData: any = [];
    public searchValues: any = '';
    private searchValue: boolean = false;
    private suggestion: boolean = true;
    private subscriber = null;

    constructor(public navCtrl: NavController, public navParams: NavParams, public loadingCtrl: LoadingController, private feedsApi: FeedsService, public toastCtrl: ToastController, private videosApi: VideoService, public facebook:Facebook) {
    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad PeoplePage');
    }

    ionViewWillLeave(){
        this.searchValues = ''
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
            if(that.peopleData == ''){
                loader.present();
                data.append('action', 'profile_feed');
                data.append('user_id', that.user_data.id)
                that.feedsApi.everyoneFeeds(data).subscribe((Data) => {
                    console.log("Data",JSON.stringify(Data))
                    loader.dismiss()
                    if (Data != null) {
                        that.peopleData = Data
                    } else {
                        console.log("Null")
                    }
                }, (error) => {
                    loader.dismiss()
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
        if(el){
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
            if(PeoplePage.isElementInViewport($('#fab-back-to-top-people'))){
                if($('page-people .scroll-content').scrollTop() < 350){
                    $('#fab-back-to-top-people').hide()
                }else{
                    $('#fab-back-to-top-people').show()
                }
            }
        })
    }

    goToDetail(activity_id) {
        this.navCtrl.push(VideoDetailPage, {"video_id": activity_id});
    }

    goToProfile(u_id) {
        this.navCtrl.push(ProfilePage, {"user_id": u_id})
    }

    searchEvent() {
        this.searchValue = this.searchValue != false ? false : true
    }

    onInput(searchValues) {
        this.suggestion = this.searchValues.length <= 0 ? true : false
        let that = this;
        if (that.subscriber) {
            that.subscriber.unsubscribe()
        }
        if(searchValues != ''){
            let data = new FormData();
            data.append('action', 'profile_search');
            data.append('user_id', this.user_data.id);
            data.append('key', searchValues);
            if (window.navigator.onLine) {
                    setTimeout(() => {
                        that.subscriber =  this.videosApi.searchYoutube(data).subscribe((Data) => {
                        if (Data) {
                            if (Data.success != false) {
                                this.peopleData = Data
                            } else {
                                this.peopleData = null
                            }
                        }
                    }, (error) => {
                        console.error(error)
                    })
                }, 1000)
            } else {
                this.toastCtrl.create(this.networkErrorObj).present()
            }
        }else{
            let data = new FormData();
            data.append('action', 'profile_feed');
            data.append('user_id', that.user_data.id)
            if (window.navigator.onLine) {
                setTimeout(() => {
                    that.subscriber =  that.videosApi.searchYoutube(data).subscribe((Data) => {
                        if (Data) {
                            if (Data.success != false) {
                                this.peopleData = Data
                            } else {
                                this.peopleData = null
                            }
                        }
                    }, (error) => {
                        console.error(error)
                    })
                }, 1000)
            } else {
                this.toastCtrl.create(this.networkErrorObj).present()
            }
        }

    }

    onCancel($event){
        console.log($event)
        this.searchValue = false
        this.searchValues = ''
        if (window.navigator.onLine) {
            let that = this
            let data = new FormData();
            data.append('action', 'profile_feed');
            data.append('user_id', that.user_data.id)
            that.feedsApi.everyoneFeeds(data).subscribe((Data) => {
                if (Data != null) {
                    that.peopleData = Data
                } else {
                    console.log("Null")
                }
            }, (error) => {
                console.error(error)
            })
        } else {
            this.toastCtrl.create(this.networkErrorObj).present()
        }
    }

    onClear($event){

    }

    goToYoutube(){
        this.navCtrl.parent.select(2)
    }

    invitePeople() {
        let options = {
            url: "https://fb.me/776977562468301",
            picture: "https://www.iconfinder.com/data/icons/seo-and-marketing-volume-1/256/72-512.png"
        }
        this.facebook.appInvite(options)
    }

    doRefresh(refresher) {
        if (window.navigator.onLine) {
            let that = this
            let data = new FormData();
                data.append('action', 'profile_feed');
                data.append('user_id', that.user_data.id)
                that.feedsApi.everyoneFeeds(data).subscribe((Data) => {
                    if (Data != null) {
                        that.peopleData = []
                        that.peopleData = Data
                    } else {
                        console.log("Null")
                    }
                }, (error) => {
                    console.error(error)
                })
            refresher.complete();
        } else {
            refresher.complete();
            this.toastCtrl.create(this.networkErrorObj).present()
        }
    }

    followuser(id, index) {

        if (window.navigator.onLine) {
            let loader = this.loadingCtrl.create({
                content: "Loading..."
            });
            loader.present();
            let followuser = this.toastCtrl.create({
                message: 'You are following this user.',
                duration: 2000
            });
            let errorcase = this.toastCtrl.create({
                message: 'Something went wrong!',
                duration: 2000
            })

            let data = new FormData();
            data.append('action', 'follow');
            data.append('user_id', this.user_data.id)
            data.append('following', id)
            this.peopleData[index].is_following = true
            this.feedsApi.followUser(data).subscribe((Data) => {
                loader.dismiss()
                if (Data.success == true || Data != null) {
                    followuser.present()
                } else {
                    errorcase.present()
                }
            }, (error) => {
                loader.dismiss()
                console.error(error)
            })
            FriendSongs.loaderTimeOut(loader)
        } else {
            this.toastCtrl.create(this.networkErrorObj).present()
        }
    }

    unfollowUser(id, index) {
        let unfollowuser = this.toastCtrl.create({
            message: 'You are unfollow this user.',
            duration: 2000
        });
        let errorcase = this.toastCtrl.create({
            message: 'Something went wrong!',
            duration: 2000
        })
        if (window.navigator.onLine) {
            let loader = this.loadingCtrl.create({
                content: "Loading..."
            });
            loader.present();

            let data = new FormData();
            data.append('action', 'unfollow');
            data.append('user_id', this.user_data.id)
            data.append('following', id)
            this.peopleData[index].is_following = false
            this.feedsApi.unfollowUser(data).subscribe((Data) => {
                if (Data.success == true || Data != null) {
                    unfollowuser.present()
                } else {
                    errorcase.present()
                }
            }, (error) => {
                loader.dismiss()
                console.error(error)
            })
            FriendSongs.loaderTimeOut(loader)
        } else {
            this.toastCtrl.create(this.networkErrorObj).present()
        }
    }

    backToTop(){
        $(".scroll-content").scrollTop(0)
    }
}
