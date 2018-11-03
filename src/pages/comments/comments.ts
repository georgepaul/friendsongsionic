import {Component} from "@angular/core";
import {
    Events,
    LoadingController,
    NavController,
    NavParams, ToastController,
    ViewController
} from "ionic-angular";
import {VideoService} from "../../app/api/services/video.service";
import {FriendSongs} from "../../app/app.component";
import {Keyboard} from "ionic-native";
import {FeedsService} from "../../app/api/services/feeds.service";
import {FSHelper} from "../../app/helpers/helpers";
import {ProfilePage} from "../profile/profile";

declare var $;

@Component({
    selector: 'page-comments',
    templateUrl: 'comments.html',
    providers: [VideoService, FeedsService]
})
export class CommentsPage {

    commentData: any = []
    public user_data: any = FriendSongs.userData
    public video_id: any
    public activity_id: any
    private peopleFilterData: any = [];
    public new_comment: any = ''
    private new_comment_btn = false
    public networkErrorObj = FSHelper.networkErrorObj()

    constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController, private videosApi: VideoService, public feedsApi: FeedsService, public loadingCtrl: LoadingController, public toastCtrl: ToastController, private event: Events) {
        this.video_id = this.navParams.get("video_id")
        this.activity_id = this.navParams.get("activity_id")
        Keyboard.disableScroll(true)
    }

    ionViewWillLeave() {
        this.event.unsubscribe('event:addComment')
    }

    ionViewWillEnter() {
        if (window.navigator.onLine) {
            let that = this
            /* Start loader */
            let loader = this.loadingCtrl.create({
                content: "Loading..."
            });
            loader.present();

            let promises = new Promise((resolve, reject) => {
                let data = new FormData();
                data.append('action', 'comments');
                data.append('video_id', this.video_id);
                that.videosApi.videoCommentList(data).subscribe((Data) => {
                    loader.dismiss()
                    let allData = [];
                    if (Data) {
                        if (Data.success != false) {
                            Data.forEach(function (val) {
                                let newData: any = {};
                                newData.user_id = val.id
                                newData.sender_id = val.sender_id
                                newData.name = val.name
                                newData.avatar = val.avatar
                                newData.postTime = FSHelper.getTime(val.created)
                                newData.message = val.comment_text
                                allData.push(newData)
                            })
                        }
                    }
                    that.commentData = allData
                    resolve(1);
                }, (error) => {
                    console.error(error)
                })
            });

            promises.then(() => {
                setTimeout(() => {
                    $("#commentList .scroll-content").scrollTop($(".commentsList").height())
                }, 50)
            })
        } else {
            this.toastCtrl.create(this.networkErrorObj).present()
        }
    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad CommentsPage');
    }

    findPeople() {
        let that = this
        let string: string = that.new_comment.substr(that.new_comment.lastIndexOf('@') + 1, that.new_comment.lenght)
        let condition = !that.patternValidation(that.new_comment.substr(that.new_comment.lastIndexOf('@') - 1, 1))
        if (that.new_comment.length == 0) {
            that.peopleFilterData = []
        }
        if (that.new_comment.substr(-1) == '@' && condition) {
            this.searchAPI("")
        } else {
            that.peopleFilterData = []
        }
        if (string.length > 0 && that.new_comment.lastIndexOf('@') > -1) {
            this.searchAPI(string)
            /*that.peopleFilterData = that.peopleData.filter((people) => {
                return people.name.toLowerCase().search(string.toLowerCase()) >= 0
            })*/
        }
    }

    patternValidation(str) {
        let EMAIL_REGEXP = new RegExp('[a-zA-Z0-9._-]$', 'i');
        return EMAIL_REGEXP.test(str)
    }

    addComment() {
        console.log("1");
        if (this.new_comment != '') {
            if (window.navigator.onLine) {
                console.log("2");
                this.new_comment_btn = true
                var promise = new Promise((resolve, reject) => {
                    let data = new FormData();
                    data.append('action', 'add_comment');
                    data.append('video_id', this.video_id);
                    data.append('activity_id', this.activity_id);
                    data.append('user_id', this.user_data.id);
                    data.append('comment', this.new_comment);
                    console.log("3");
                    this.videosApi.addComment(data).subscribe((Data) => {
                        console.log("4", Data);
                        let that = this
                        let newData: any = {};
                        if (Data) {
                            if (Data.success != false) {
                                Data.forEach(function (val) {
                                    newData.user_id = val.id
                                    newData.sender_id = val.sender_id
                                    newData.name = val.name
                                    newData.avatar = val.avatar
                                    newData.postTime = FSHelper.getTime(val.created)
                                    newData.message = val.comment_text
                                    that.commentData.push(newData)
                                })
                            }
                        }
                        this.event.publish("event:addComment", Data[0])
                        this.new_comment = ''
                        this.new_comment_btn = false
                        resolve(1);
                    }, (error) => {
                        this.new_comment_btn = false
                        console.error(error)
                    })
                })
                promise.then(() => {
                    setTimeout(() => {
                        $("#commentList .scroll-content").scrollTop($(".commentsList").height())
                    }, 50)
                })
            } else {
                this.toastCtrl.create(this.networkErrorObj).present()
            }
        }

    }

    closeCommntsModel() {
        this.viewCtrl.dismiss()
    }

    selectPeople(people) {
        let string: string = this.new_comment.substr(this.new_comment.lastIndexOf('@') + 1, this.new_comment.lenght)
        this.new_comment = this.new_comment.substr(0, this.new_comment.length - string.length).concat(people.name + ' ')
        this.peopleFilterData = []
    }

    searchAPI(string) {
        if (window.navigator.onLine) {
            let data = new FormData();
            data.append('action', 'profile_search');
            data.append('key', string)
            this.feedsApi.peopleFeeds(data).subscribe((Data) => {
                this.peopleFilterData = Data
            }, (error) => {
                console.error(error)
            })
        } else {
            this.toastCtrl.create(this.networkErrorObj).present()
        }
    }

    goToProfile(id) {
        this.navCtrl.push(ProfilePage, {"user_id": id})
    }
}