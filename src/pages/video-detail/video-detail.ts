/* Import plugin */
import {AfterViewInit, Component} from "@angular/core";
import {
    ActionSheetController,
    AlertController,
    Events,
    LoadingController,
    ModalController,
    NavController, NavParams,
    Platform,
    ToastController
} from "ionic-angular";
import {FeedsService} from "../../app/api/services/feeds.service";
import {Facebook} from "ionic-native";
import {FSHelper} from "../../app/helpers/helpers";
import {VideoService} from "../../app/api/services/video.service";
import {FriendSongs} from "../../app/app.component";
import {SocialSharing} from "@ionic-native/social-sharing";
import {Sql} from "../../app/providers/Sql";
import {DomSanitizer} from "@angular/platform-browser";
import {MediaObject, MediaPlugin} from "@ionic-native/media";
import {EmailComposer} from "@ionic-native/email-composer";
import {CommentsPage} from "../comments/comments";

/* Declare extar parameter  */
declare let $;
declare let window;

/*Component*/
@Component({
    selector: 'page-video-detail',
    templateUrl: 'video-detail.html',
    providers: [FeedsService, VideoService]
})
export class VideoDetailPage implements AfterViewInit {
    /* Declare variable */
    public user_data: any = FriendSongs.userData;
    public YouTubeIframeLoader: any = FriendSongs.YouTubeIframeLoader
    public vDetail_data: any = null;
    public activityArray = [];
    public networkErrorObj = FSHelper.networkErrorObj()
    mediaTimer: any;
    public groupId: any = '';
    duration: any;
    interval: any;
    oldUrl: any
    rootPage: any;
    isPlaying = false;
    private actionSheet: any;
    private activity_id: any;
    /* Variable for media plugin */
    private _music: MediaObject;

    /* Constructor */
    constructor(public modalCtrl: ModalController, public alertCtrl: AlertController, private navCtrl: NavController, public actionSheetCtrl: ActionSheetController, private event: Events, private feedsApi: FeedsService, private videosApi: VideoService, public loadingCtrl: LoadingController, private sql: Sql, public toastCtrl: ToastController, private ss: SocialSharing, public platform: Platform, public sanitizer: DomSanitizer, private media: MediaPlugin, private emailComposer: EmailComposer,public navParms:NavParams) {
        this.activity_id = this.navParms.get('activity_id')
        this.event.subscribe("event:phoneLock", () => {
            this.pauseAllVideo()
            this.stopMusic()
        });
    }

    static isElementInViewport(el): boolean {
        //special bonus for those using jQuery
        if (el instanceof $) {
            el = el[0];
        }
        let rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
            rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
        );
    }

    ionViewWillLeave() {
        this.destroyAllVideo()
        this.stopMusic()
    }

    ionViewWillEnter() {
        let playlistDetailLocal =  JSON.parse(localStorage.getItem('playListDetail'));
        let playlistGroupId = playlistDetailLocal ? playlistDetailLocal.group_id : null;
        this.groupId = playlistGroupId != null ? playlistGroupId : 0;

        console.log("this.groupvideodetail",this.groupId)


        let loader = this.loadingCtrl.create({
            content: "Loading..."
        });
        if (window.navigator.onLine) {
            let that = this
            var data = new FormData();
            $(".scroll-content").scrollTop(0)
            if (that.vDetail_data == '' || that.vDetail_data == null) {
                loader.present();
                data.append('action', 'video_detail');
                data.append('activity_id', that.activity_id);
                that.videosApi.videoDetail(data).subscribe((Data) => {
                    loader.dismiss()
                    let allData = [];
                    if (Data != null) {
                        let newData: any = {};
                        let post_time = FSHelper.getTime(Data.activity_date)
                        newData.id = Data.object
                        newData.user = Data.user
                        newData.avatar = Data.avatar
                        newData.name = Data.name
                        newData.postTime = post_time
                        newData.title = Data.title
                        newData.thumb = Data.thumb
                        newData.youtube_id = Data.youtube_id
                        newData.source = Data.source
                        newData.extra = Data.extra
                        newData.user_liked = Data.user_liked
                        newData.comments = Data.comments
                        newData.likes = Data.likes
                        newData.comment_count = Data.comment_count
                        newData.activity_id = Data.activity_id
                        newData.video_type = Data.video_type
                        newData.spotify_id = Data.spotify_id
                        newData.spotify_href = Data.spotify_href
                        newData.spotify_preview = Data.spotify_preview
                        newData.spotify_uri = Data.spotify_uri
                        allData.push(newData)

                        that.vDetail_data = []
                        that.vDetail_data = allData
                    } else {
                        that.vDetail_data = []
                    }
                }, (error) => {
                    console.error(error)
                })
            }
        } else {
            this.toastCtrl.create(this.networkErrorObj).present()
        }
        FriendSongs.loaderTimeOut(loader)
    }

    ngAfterViewInit(): void {
        let that = this
        $('.scroll-content').on('scroll', function () {
            if (that.vDetail_data.video_type != '2') {
                if (VideoDetailPage.isElementInViewport($("#vDetail_card .videoWrapper"))) {
                    if (that.isPlaying) {
                        that.pauseMusic()
                    }
                }
                if ($('#iframe').attr('src') != undefined && that.vDetail_data.video) {
                    if (VideoDetailPage.isElementInViewport($("#iframe")) && !that.vDetail_data.isPlaying && !that.vDetail_data.manuallyPaused) {
                        if (that.vDetail_data.video != undefined) {
                            if (that.isPlaying) {
                                that.pauseMusic()
                            }
                        }
                    } else if (!VideoDetailPage.isElementInViewport($("#iframe"))) {
                        that.vDetail_data.manuallyPaused = false;
                        if (that.vDetail_data.isPlaying) {
                            that.vDetail_data.video.pauseVideo()
                        }
                    }
                }
            } else {
                if (that.vDetail_data.spotify_preview == '') {
                    if ($('#vDetail_spotify_iframe' + ' iframe').length == 0) {
                        if (VideoDetailPage.isElementInViewport($("#vDetail_card .spotifyWrapper"))) {
                            if (that.isPlaying) {
                                that.pauseMusic()
                            }
                        } else if (!VideoDetailPage.isElementInViewport($("#vDetail_card .spotifyWrapper"))) {
                        }
                    } else {
                        if (!VideoDetailPage.isElementInViewport($("#vDetail_card .spotifyWrapper"))) {
                            $('#vDetail_spotify_iframe').empty()
                            $('#vDetail_card').find('.spotifyWrapper').removeClass('hidePlayButton')
                        }
                    }
                } else {
                    if (VideoDetailPage.isElementInViewport($("#vDetail_card .audioWrapper"))) {
                    } else if (!VideoDetailPage.isElementInViewport($("#vDetail_card .audioWrapper"))) {
                    }
                }
            }
        })
    }

    /*private playVideo(key) {
     let that = this
     console.log("mainData(play video)==> ", that.mainData)
     if (that.mainData.hasOwnProperty(key) && !that.mainData[key].manuallyPaused && !that.mainData[key].isPlaying) {
     that.mainData[key].video.playVideo()
     }
     }*/
    loadYoutubMoreFrame(id) {
        console.log('loadYoutubMoreFrame >>>>>',id)
        let that = this
        that.YouTubeIframeLoader.load((YT) => {
            that.vDetail_data.forEach((value: any, key) => {
                console.log('value >>>>',value)
                if (value.video_type != 2) {
                    if (id == key && value.video == undefined) {
                        value.isLoading = true
                        value.isPlaying = false
                        value.manuallyPaused = 0
                        value.video = new YT.Player('iframe', {
                            height: '270',
                            videoId: value.youtube_id,
                            playerVars: {
                                fs: 0,
                                rel: 0,
                                showinfo: 0
                            },
                            events: {
                                'onReady': (event) => {
                                    $('#vDetail_card iframe').contents().find('.ytp-watermark').hide();
                                    $('#vDetail_card').find('.videoWrapper').addClass('hidePlayButton');
                                    /**
                                     * @description This code for if any video are playing then pause before current video play
                                     */
                                    that.vDetail_data.forEach((value1: any, key1) => {
                                        if (value1.video_type != 2) {
                                            if (!VideoDetailPage.isElementInViewport($("#iframe")) && key != key1 && value1.video != undefined) {
                                                value1.video.pauseVideo()
                                            }
                                        }
                                    })
                                    event.target.playVideo()
                                    value.isLoading = false
                                    let data = new FormData();
                                    data.append('action', 'watched_activity');
                                    data.append('user_id', this.user_data.id)
                                    data.append('activity_id', value.activity_id);
                                    that.videosApi.videoWached(data).subscribe((Data) => {
                                    }, (error) => {
                                        console.error(error)
                                    })
                                },
                                'onStateChange': (event) => {
                                    that.vDetail_data.forEach((value1: any, key1) => {
                                        if (event.data == 1 && key != key1 && value1.video != undefined) {
                                            value1.video.pauseVideo()
                                        }
                                    })
                                    value.manuallyPaused = event.data == YT.PlayerState.PAUSED
                                    value.isPlaying = event.data == YT.PlayerState.PLAYING
                                }
                            }
                        })
                        return value
                    }
                }
            })
        })
    }

    createNewIframe(id) {
        console.log('id >>>>>',id)
        if (window.navigator.onLine) {
            this.loadYoutubMoreFrame(id)
        } else {
            this.toastCtrl.create(this.networkErrorObj).present()
        }
    }

    likeVideo(videoData, user_id) {
        if (videoData.user_liked == false) {
            if (window.navigator.onLine) {
                // Body parameter
                let data = new FormData();
                data.append('action', 'like_video');
                data.append('video_id', videoData.id);
                data.append('activity_id', videoData.activity_id);
                data.append('user_id', user_id);
                videoData.user_liked = true
                videoData.likes++
                this.videosApi.likeVideo(data).subscribe((Data) => {
                    let videoLike = this.toastCtrl.create({
                        message: 'Song Liked successfully',
                        duration: 2000
                    });
                    videoLike.present()
                }, (error) => {
                    videoData.user_liked = false
                    videoData.likes--
                })
            } else {
                this.toastCtrl.create(this.networkErrorObj).present()
            }
        }
    }

    openCommentList(videoData) {
        this.pauseAllVideo()
        this.stopMusic()
        let modal = this.modalCtrl.create(CommentsPage, {"video_id": videoData.id,"activity_id": videoData.activity_id})
        this.event.subscribe("event:addComment", (data) => {
            videoData.comments.splice(0, 0, data)
        });
        modal.present();
    }

    shareVideo(shareData) {
        this.pauseAllVideo()
        this.stopMusic()
        let prompt = this.alertCtrl.create({
            title: '',
            message: "Say something about this song.",
            cssClass: "sharePopupMain",
            inputs: [
                {
                    name: 'about_song',
                    placeholder: ''
                },
            ], buttons: [
                {
                    text: 'Cancel',
                    handler: data => {
                    }
                }, {
                    text: 'Share',
                    handler: msg_data => {
                        if (window.navigator.onLine) {
                            let data = new FormData();
                            data.append('action', 'share-video');
                            data.append('video_id', shareData.id);
                            data.append('user_id', this.user_data.id);
                            data.append('group_id', this.groupId);
                            data.append('activity_id', shareData.activity_id);
                            data.append('message', msg_data.about_song);
                            this.videosApi.shareVideo(data).subscribe((Data) => {
                                if (Data.success) {
                                    let followers_data = new FormData();
                                    followers_data.append('action', 'followers');
                                    followers_data.append('user_id', this.user_data.id);
                                    this.videosApi.followersApi(data)
                                    this.toastCtrl.create({
                                        message: 'Successfully shared song.',
                                        duration: FSHelper.toastMessageTime(2)
                                    }).present()
                                    let url = Data.url != '' ? Data.url : ''
                                    if (this.user_data.login_type == 'social' && this.user_data.facebook_share == '1') {
                                        this.shareViaFacebook(msg_data.about_song, '', url)
                                    }
                                } else {
                                    this.toastCtrl.create({
                                        message: 'You already shared this song.',
                                        duration: FSHelper.toastMessageTime(2)
                                    }).present()
                                }
                            }, (error) => {
                                console.error(error)
                            })
                        } else {
                            this.toastCtrl.create(this.networkErrorObj).present()
                        }
                    }
                }
            ]
        });
        prompt.present();
    }

    presentActionSheet(activity, type) {
        this.pauseAllVideo()
        this.stopMusic()
        this.actionSheet = this.actionSheetCtrl.create({
            buttons: [
                {
                    text: 'Report',
                    icon: 'document',
                    handler: () => {
                        let email = {
                            to: 'Georgepaul@live.ca',
                            subject: 'Report a post on FriendSongs',
                            body: '',
                            isHtml: true
                        };
                        this.emailComposer.open(email)
                    }
                }, {
                    text: 'Cancel',
                    role: 'cancel',
                    icon: 'close',
                    handler: () => {
                    }
                }
            ]
        });
        this.actionSheet.present();
    }

    invitePeople() {
        let options = {
            url: "https://fb.me/2357106857848720",
            picture: ""
        }
        Facebook.appInvite(options)
    }

    shareViaFacebook(title, image, url) {
        this.ss.shareViaFacebook(title, image, url).then(() => {
            // Success!
        }).catch(() => {
            // Error!
        });
    }

    removeAllVideoIframe() {
        if (this.vDetail_data) {
            this.vDetail_data.forEach((value1) => {
                if (value1.video != undefined) {
                    delete value1['video'];
                }
            })
        }
    }

    destroyAllVideo() {
        this.vDetail_data.forEach((value1) => {
            if (value1.video_type != '2') {
                if (value1.video != undefined) {
                    value1.video.destroy()
                }
            } else {
                if (value1.spotify_preview == '') {
                    $('.spotifyWrapper div[id^="vDetail_spotify_iframe"]').each(function (index) {
                    }).empty();
                    $('.spotifyWrapper').each(function (index) {
                    }).removeClass('hidePlayButton');
                }
            }
        })
    }

    pauseAllVideo() {
        if (this.vDetail_data) {
            this.vDetail_data.forEach((value1) => {
                if (value1.video_type != '2') {
                    if (value1.video != undefined) {
                        value1.video.pauseVideo()
                    }
                } else {
                    if (value1.spotify_preview == '') {
                        $('.spotifyWrapper div[id^="vDetail_spotify_iframe"]').each(function (index) {
                        }).empty();
                        $('.spotifyWrapper').each(function (index) {
                        }).removeClass('hidePlayButton');
                    }
                }
            })
        }
    }

    clickMusic(vDetailData) {
        let that = this

        if (vDetailData.spotify_preview != that.oldUrl) {
            that.pauseAllVideo()
            that._music = null
        }

        that.oldUrl = vDetailData.spotify_preview

        if (that._music == null) {
            that._music = that.media.create(vDetailData.spotify_preview, (status) => {
                if (status == 2) {
                    $('#vDetail_playbutton').hide();
                    $('#vDetail_pausebutton').show();
                } else {
                    $('#vDetail_playbutton').show();
                    $('#vDetail_pausebutton').hide();
                }
            }, (onSuccess) => console.log('onSuccess'), (onError) => console.log('onError', onError));
            that.playMusic(vDetailData.activity_id);
        }
        else {
            if (that.isPlaying) {
                that.stopMusic()
            }
            else {
                that.playMusic(vDetailData.activity_id);
            }
        }
    }

    stopMusic() {
        let that = this
        if (that._music != null) {
            that._music.pause();
            that._music = null
        }
        that.isPlaying = false;
    }

    playMusic(activity_id) {
        let that = this
        that._music.play();
        if (this.activityArray.indexOf(activity_id) < 0) {
            this.activityArray.push(activity_id)
            let data = new FormData();
            data.append('action', 'watched_activity');
            data.append('user_id', this.user_data.id)
            data.append('activity_id', activity_id);

            that.videosApi.videoWached(data).subscribe((Data) => {
            }, (error) => {
                console.error(error)
            })

        }
        that.isPlaying = true;
    }

    pauseMusic() {
        let that = this
        if (that.isPlaying) {
            that._music.pause();
            that.isPlaying = false;
        }
    }

    createNewSpotifyIframe(data) {
        let that = this
        if ($('#vDetail_spotify_iframe iframe').length == 0) {
            $('#vDetail_card').find('.spotifyWrapper').addClass('hidePlayButton')
            let html = '<iframe src="https://open.spotify.com/embed?uri=spotify:track:' + data.spotify_id + '" frameborder="0" allowtransparency="true"></iframe>'
            $('#vDetail_spotify_iframe').append(html)
            if (this.activityArray.indexOf(data.activity_id) < 0) {
                this.activityArray.push(data.activity_id)
                let spotifyData = new FormData();
                spotifyData.append('action', 'watched_activity');
                spotifyData.append('user_id', this.user_data.id)
                spotifyData.append('activity_id', data.activity_id);
                that.videosApi.videoWached(spotifyData).subscribe((Data) => {
                }, (error) => {
                    console.error(error)
                })
            }
        } else {
        }
    }
}
