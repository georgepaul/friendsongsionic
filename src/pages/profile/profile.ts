import {AfterViewInit, Component, NgZone} from "@angular/core";
import {
    ActionSheetController,
    AlertController, Events,
    LoadingController,
    ModalController,
    NavController,
    NavParams,
    ToastController
} from "ionic-angular";
import {SettingsPage} from "../settings/settings";
import {CommentsPage} from "../comments/comments";
import {VideoDetailPage} from "../video-detail/video-detail";
import {Camera} from "ionic-native";
import {FeedsService} from "../../app/api/services/feeds.service";
import {FSHelper} from "../../app/helpers/helpers";
import {FriendSongs} from "../../app/app.component";
import {VideoService} from "../../app/api/services/video.service";
import {Sql} from "../../app/providers/Sql";
import {AuthService} from "../../app/api/services/auth.service";
import {ProfileImagePage} from "./image/image";
import {SocialSharing} from "@ionic-native/social-sharing";
import {DomSanitizer} from "@angular/platform-browser";
import {MediaObject, MediaPlugin} from "@ionic-native/media";

declare var $;
declare var window;

@Component({
    selector: 'page-profile',
    templateUrl: 'profile.html',
    providers: [FeedsService, VideoService, AuthService]
})

export class ProfilePage implements AfterViewInit {

    private displayImage: any;
    public groupId: any = '';
    public me_likeValue: any = false
    public user_data: any = FriendSongs.userData
    public user_id: any = ''
    private YouTubeIframeLoader: any = FriendSongs.YouTubeIframeLoader;
    private iframe = null
    private card = null
    profile: any = []
    profileFeeds: any = null
    public networkErrorObj = FSHelper.networkErrorObj()
    public activityArray = [];

    /* Variable for media plugin */
    private _music: MediaObject;
    mediaTimer: any;
    duration: any;
    interval: any;
    oldUrl: any
    isPlaying = false;


    constructor(private navCtrl: NavController, public navParams: NavParams, private event: Events, public alertCtrl: AlertController, public actionSheetCtrl: ActionSheetController, private modalCtrl: ModalController, private zone: NgZone, private feedsApi: FeedsService, public loadingCtrl: LoadingController, private videosApi: VideoService, public toastCtrl: ToastController, private sql: Sql, public authApi: AuthService, private ss: SocialSharing, public sanitizer: DomSanitizer, private media: MediaPlugin) {
        let u_id = this.navParams.get("user_id")
        this.user_id = u_id != null ? u_id : this.user_data.id
        this.displayImage = this.user_data.avatar
        this.event.subscribe("event:phoneLock", () => {
            this.pauseAllVideo()
            this.stopMusic()
        });
    }

    ionViewWillLeave() {
        this.destroyAllVideo()
        this.stopMusic()
    }

    ionViewWillEnter() {
        let playlistDetailLocal =  JSON.parse(localStorage.getItem('playListDetail'));
        let playlistGroupId = playlistDetailLocal ? playlistDetailLocal.group_id : null;
        this.groupId = playlistGroupId != null ? playlistGroupId : 0;

        console.log("this.groupIdprofile",this.groupId)

        $('#fab-back-to-top-profile').hide()
        if (window.navigator.onLine) {
            let that = this
            let loader = this.loadingCtrl.create({
                content: "Loading..."
            });
            if (that.profile == '' || that.profileFeeds == '') {
                loader.present();
                var promises = new Promise((resolve, reject) => {
                    let data = new FormData();
                    data.append('action', 'profile');
                    data.append('user_id', this.user_data.id);
                    data.append('profile_id', this.user_id);
                    that.feedsApi.profileApi(data).subscribe((val) => {
                        that.profile.id = val.id;
                        that.profile.name = val.name
                        that.profile.username = val.username
                        that.profile.avatar = val.avatar
                        that.displayImage = val.avatar
                        that.profile.views = val.views
                        that.profile.followers = FSHelper.abbrNum(val.followers,1)
                        that.profile.following = FSHelper.abbrNum(val.following,1)
                        that.profile.g_point =  FSHelper.abbrNum(val.genius_points,1)
                        that.profile.is_following = val.is_following
                        that.profile.song_count = FSHelper.abbrNum(val.song_count,1)
                        resolve(1);
                    }, (error) => {
                        console.error(error)
                    })
                });
                promises.then(() => {
                    let data = new FormData();
                    data.append('action', 'feed');
                    data.append('r', 'me');
                    data.append('profile_id', this.user_id)
                    data.append('offset', '0');
                    that.feedsApi.meFeeds(data).subscribe((Val) => {
                        let allNewData = [];
                        if (Val) {
                            Val = Val.slice(1);
                            Val.forEach(function (val) {
                                let newData: any = {};
                                let post_time = FSHelper.getTime(val.activity_date)
                                newData.id = val.id
                                newData.user = val.user
                                newData.avatar = val.avatar
                                newData.name = val.name
                                newData.postTime = post_time
                                newData.title = val.title
                                newData.thumb = val.thumb
                                newData.youtube_id = val.youtube_id
                                newData.extra = val.extra
                                newData.user_liked = val.user_liked
                                newData.comments = val.comments
                                newData.likes = val.likes
                                newData.comment_count = val.comment_count
                                newData.activity_id = val.activity_id
                                newData.video_type = val.video_type
                                newData.spotify_id = val.spotify_id
                                newData.spotify_href = val.spotify_href
                                newData.spotify_preview = val.spotify_preview
                                newData.spotify_uri = val.spotify_uri
                                allNewData.push(newData)
                            })
                        }
                        loader.dismiss()
                        that.profileFeeds = allNewData
                    }, (error) => {
                        loader.dismiss()
                        console.error(error)
                    })
                })
            }
            FriendSongs.loaderTimeOut(loader)
        } else {
            this.toastCtrl.create(this.networkErrorObj).present()
        }
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
        let that = this
        $('page-profile .scroll-content').on('scroll', function () {
            if(ProfilePage.isElementInViewport($('#fab-back-to-top-profile'))){
                if($('page-profile .scroll-content').scrollTop() < 350){
                    $('#fab-back-to-top-profile').hide()
                }else{
                    $('#fab-back-to-top-profile').show()
                }
            }
            that.profileFeeds.forEach((data: any, key) => {
                if (data.video_type != 2) {
                    if (that.user_data.id == data.user) {
                        if (ProfilePage.isElementInViewport($("#profile_card" + key + " .videoWrapper"))){
                            if(that.isPlaying){
                                that.pauseMusic()
                            }
                        }
                        if ($('#profile_iframe' + key).attr('src') != undefined && data.video) {
                            if (ProfilePage.isElementInViewport($("#profile_iframe" + key)) && !data.isPlaying && !data.manuallyPaused) {
                                if (data.video != undefined) {
                                    if(that.isPlaying){
                                        that.pauseMusic()
                                    }
                                    //data.video.playVideo()
                                }
                            } else if (!ProfilePage.isElementInViewport($("#profile_iframe" + key))) {
                                data.manuallyPaused = false;
                                if (data.isPlaying) {
                                    data.video.pauseVideo()
                                }
                            }
                        }
                    } else {
                        if (ProfilePage.isElementInViewport($("#other_card" + key + " .videoWrapper"))){
                            if(that.isPlaying){
                                that.pauseMusic()
                            }
                        }
                        if ($('#other_iframe' + key).attr('src') != undefined && data.video) {
                            if (ProfilePage.isElementInViewport($("#other_iframe" + key)) && !data.isPlaying && !data.manuallyPaused) {
                                if (data.video != undefined) {
                                    if(that.isPlaying){
                                        that.pauseMusic()
                                    }
                                    //data.video.playVideo()
                                }
                            } else if (!ProfilePage.isElementInViewport($("#other_iframe" + key))) {
                                data.manuallyPaused = false;
                                if (data.isPlaying) {
                                    data.video.pauseVideo()
                                }
                            }
                        }
                    }
                } else {
                    if (data.spotify_preview == '') {
                        if (that.user_data.id == data.user) {
                            if ($('#profile_spotify_iframe' + key + ' iframe').length == 0) {
                                if (ProfilePage.isElementInViewport($("#profile_card" + key + " .spotifyWrapper"))) {
                                    if(that.isPlaying){
                                        that.pauseMusic()
                                    }
                                    /*$('#profile_card' + key).find('.spotifyWrapper').addClass('hidePlayButton')
                                    let html = '<iframe src="https://open.spotify.com/embed?uri=spotify:track:' + data.spotify_id + '" frameborder="0" allowtransparency="true" id="profileSpotifyIframe' + key + '"></iframe>'
                                    $('#profile_spotify_iframe' + key).append(html)*/
                                } else if (!ProfilePage.isElementInViewport($("#profile_card" + key + " .spotifyWrapper"))) {

                                }
                            } else {
                                if (!ProfilePage.isElementInViewport($("#profile_card" + key + " .spotifyWrapper"))) {
                                    $('#profile_spotify_iframe' + key).empty()
                                    $('#profile_card' + key).find('.spotifyWrapper').removeClass('hidePlayButton')
                                }
                            }
                        } else {
                            if ($('#other_spotify_iframe' + key + ' iframe').length == 0) {
                                if (ProfilePage.isElementInViewport($("#other_spotify_iframe" + key))) {
                                    if(that.isPlaying){
                                        that.pauseMusic()
                                    }
                                    /*$('#other_card' + key).find('.spotifyWrapper').addClass('hidePlayButton')
                                    let html = '<iframe src="https://open.spotify.com/embed?uri=spotify:track:' + data.spotify_id + '" frameborder="0" allowtransparency="true" id="otherSpotifyIframe' + key + '"></iframe>'
                                    $('#other_spotify_iframe' + key).append(html)*/
                                } else if (!ProfilePage.isElementInViewport($("#other_card" + key + " .spotifyWrapper"))) {

                                }
                            } else {
                                if (!ProfilePage.isElementInViewport($("#other_card" + key + " .spotifyWrapper"))) {
                                    $('#other_spotify_iframe' + key).empty()
                                    $('#other_card' + key).find('.spotifyWrapper').removeClass('hidePlayButton')
                                }
                            }
                        }
                    } else {
                        if (that.user_data.id == data.user) {
                            if (ProfilePage.isElementInViewport($("#profile_card" + key + " .audioWrapper"))) {

                            } else if (!ProfilePage.isElementInViewport($("#profile_card" + key + " .audioWrapper"))) {

                            }
                        } else {
                            if (ProfilePage.isElementInViewport($("#other_card" + key + " .audioWrapper"))) {

                            } else if (!ProfilePage.isElementInViewport($("#other_card" + key + " .audioWrapper"))) {

                            }
                        }
                    }
                }

            })
        })
    }

    doRefresh(refresher) {
        if (window.navigator.onLine) {
            setTimeout(() => {
                let that = this
                var promises = new Promise((resolve, reject) => {
                    let data = new FormData();
                    data.append('action', 'profile');
                    data.append('user_id', this.user_data.id);
                    data.append('profile_id', this.user_id);
                    that.feedsApi.profileApi(data).subscribe((val) => {
                        that.profile.id = val.id
                        that.profile.name = val.name
                        that.profile.username = val.username
                        that.profile.avatar = val.avatar
                        that.profile.views = val.views
                        that.profile.followers = val.followers
                        that.profile.following = val.following
                        that.profile.g_point = val.genius_points
                        that.profile.is_following = val.is_following
                        resolve(1);
                    }, (error) => {
                        console.error(error)
                    })
                });

                promises.then(() => {
                    let data = new FormData();
                    data.append('action', 'feed');
                    data.append('r', 'me');
                    data.append('user_id', this.user_id)
                    data.append('offset', '0');
                    that.feedsApi.meFeeds(data).subscribe((Val) => {
                        let allNewData = [];
                        if (Val) {
                            Val = Val.slice(1);
                            Val.forEach(function (val) {
                                let newData: any = {};
                                let post_time = FSHelper.getTime(val.activity_date)
                                newData.id = val.id
                                newData.user = val.user
                                newData.avatar = val.avatar
                                newData.name = val.name
                                newData.postTime = post_time
                                newData.title = val.title
                                newData.thumb = val.thumb
                                newData.youtube_id = val.youtube_id
                                newData.extra = val.extra
                                newData.user_liked = val.user_liked
                                newData.comments = val.comments
                                newData.likes = val.likes
                                newData.comment_count = val.comment_count
                                newData.activity_id = val.activity_id
                                newData.video_type = val.video_type
                                newData.spotify_id = val.spotify_id
                                newData.spotify_href = val.spotify_href
                                newData.spotify_preview = val.spotify_preview
                                newData.spotify_uri = val.spotify_uri
                                allNewData.push(newData)
                            })
                        }
                        that.profileFeeds = allNewData
                    }, (error) => {
                        console.error(error)
                    })
                })
                refresher.complete();
            }, 2000);
        } else {
            refresher.complete();
            this.toastCtrl.create(this.networkErrorObj).present()
        }
    }

    loadYoutubMoreFrame(id) {
        let that = this
        if (that.user_data.id != that.user_id) {
            that.iframe = 'other_iframe'
            that.card = '#other_card'
        } else {
            that.iframe = 'profile_iframe'
            that.card = '#profile_card'
        }
        /*if(that.user_id == that.user_data.id){*/
        that.YouTubeIframeLoader.load((YT) => {
            if (that.profileFeeds) {
                that.profileFeeds.forEach((value: any, key) => {
                    if (id == key && value.video == undefined) {
                        value.isLoading = true
                        value.isPlaying = false
                        value.manuallyPaused = 0
                        value.video = new YT.Player(this.iframe + key, {
                            height: '270',
                            playerVars: {
                                fs: 0,
                                rel: 0,
                                showinfo: 0
                            },
                            videoId: value.youtube_id,
                            events: {
                                'onReady': (event) => {
                                    $(that.card + key + ' iframe').contents().find('.ytp-watermark').hide();
                                    $(that.card + key).find('.videoWrapper').addClass('hidePlayButton');
                                    /**
                                     * @description This code for if any video are playing then pause before current video play
                                     */
                                    that.profileFeeds.forEach((value1: any, key1) => {
                                        if (value1.video_type != 2) {
                                            if (!ProfilePage.isElementInViewport($('#' + this.iframe + key1)) && key != key1 && value1.video != undefined && event.data) {
                                                value1.video.pauseVideo()
                                            }
                                        }
                                    })
                                    value.isLoading = false
                                    event.target.playVideo()
                                    let data = new FormData();
                                    data.append('action', 'watched_activity');
                                    data.append('user_id', this.user_data.id)
                                    data.append('activity_id', value.activity_id);

                                    that.videosApi.videoWached(data).subscribe((Data) => {
                                        console.log('Record Watched Successfully Profile')
                                    }, (error) => {
                                        console.error(error)
                                    })
                                },
                                'onStateChange': (event) => {
                                    that.profileFeeds.forEach((value1: any, key1) => {
                                        if (event.data == 1 && key != key1 && value1.video != undefined) {
                                            value1.video.pauseVideo()
                                        }
                                    })
                                    value.manuallyPaused = event.data == YT.PlayerState.PAUSED
                                    value.isPlaying = event.data == YT.PlayerState.PLAYING
                                    if (event.data == YT.PlayerState.ENDED) {
                                        if (key < (that.profileFeeds.length - 1)) {
                                            $(".scroll-content").animate({scrollTop: $(this.card + (key + 1)).offset().top - ($(this.card + "0").offset().top) + 211}, 2000, () => {
                                                that.loadYoutubMoreFrame(key + 1)
                                            });
                                        }
                                    }
                                }
                            }
                        })
                        return value
                    }
                })
            }
        })
        /*}else{
         that.YouTubeIframeLoader.load((YT) => {
         if(that.profileFeeds){
         that.profileFeeds.forEach((value: any, key) => {
         if (id == key) {
         value.isPlaying = false
         value.manuallyPaused = 0
         value.video = new YT.Player('other_iframe' + key, {
         height: '270',
         playerVars: {
         fs:0,
         rel:0,
         showinfo:0
         },
         videoId: value.youtube_id,
         events: {
         'onReady': (event) => {
         event.target.playVideo()
         },
         'onStateChange': (event) => {
         value.manuallyPaused = event.data == YT.PlayerState.PAUSED
         value.isPlaying = event.data == YT.PlayerState.PLAYING
         if (event.data == YT.PlayerState.ENDED) {
         if (key < (that.profileFeeds.length - 1)) {
         $(".scroll-content").animate({scrollTop: $("#profile_card" + (key + 1)).offset().top - ($("#profile_card0").offset().top)}, 1000, () => {
         that.loadYoutubMoreFrame(key + 1)
         value.video.destroy()
         });
         }
         }
         }
         }
         })
         return value
         }
         })
         }
         })
         }*/
    }

    createNewIframe(id) {
        if (window.navigator.onLine) {
            this.loadYoutubMoreFrame(id)
        } else {
            this.toastCtrl.create(this.networkErrorObj).present()
        }
    }

    goToDetail() {
        this.navCtrl.push(VideoDetailPage)
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

    goToSettings(name) {
        this.pauseAllVideo()
        this.stopMusic()
        let modal = this.modalCtrl.create(SettingsPage, {"user_name": name});
        modal.present();
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
                        console.log('Cancel clicked');
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
                                    if (this.user_data.login_type == 'social' && this.user_data.facebook_share == '1') {
                                        let url = "https://www.youtube.com/embed/" + shareData.youtube_id
                                        this.shareViaFacebook(msg_data.about_song, '', url)
                                    }
                                } else {
                                    /*if (this.user_data.login_type == 'social') {
                                     this.shareViaFacebook(msg_data.about_song, shareData.thumb, shareData.source)
                                     }*/
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

    presentActionSheet(activity, type, index) {
        this.pauseAllVideo()
        this.stopMusic()
        if (this.user_data.id == activity.user) {
            var actionSheet = this.actionSheetCtrl.create({
                buttons: [
                    {
                        text: 'Delete',
                        icon: 'trash',
                        role: 'destructive',
                        handler: () => {
                            console.log('Destructive clicked');
                            this.deleteConfirm(activity, type, index)
                        }
                    }, {
                        text: 'Cancel',
                        role: 'cancel',
                        icon: 'close',
                        handler: () => {
                            console.log('Cancel clicked');
                        }
                    }
                ]
            });
        } else {
            var actionSheet = this.actionSheetCtrl.create({
                buttons: [
                    {
                        text: 'Report',
                        icon: 'document',
                        handler: () => {
                            window.open('mailto:Georgepaul@live.ca?subject=Report a post on FriendSongs');
                        }
                    }, {
                        text: 'Cancel',
                        role: 'cancel',
                        icon: 'close',
                        handler: () => {
                            console.log('Cancel clicked');
                        }
                    }
                ]
            });
        }
        actionSheet.present();
    }

    deleteConfirm(activity, type, index) {
        let alert = this.alertCtrl.create({
            title: 'Confirm Delete',
            message: 'Do you want to Delete this ?',
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
                        if (window.navigator.onLine) {
                            let data = new FormData();
                            data.append('action', 'delete_song');
                            data.append('user_id', this.user_data.id);
                            data.append('activity_id', activity.activity_id);
                            this.videosApi.deleteVideo(data).subscribe((Data) => {
                                $("#" + type + "_card" + index).remove();
                                this.profileFeeds.splice(index, 1);
                                if (this.profileFeeds.length == 0) {
                                    this.profileFeeds = []
                                }
                                let deleted = this.toastCtrl.create({
                                    message: 'Video Deleted',
                                    duration: 2000
                                });
                                deleted.present()
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
        alert.present();
    }

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
            var imgdata = "data:image/jpeg;base64," + data;
            var Data = data;
            this.zone.run(() => {
                //this.profileObject.image = imgdata
                this.displayImage = imgdata

                let base64Blob = this.base64toBlob(Data, 'image/jpeg')

                if (window.navigator.onLine) {
                    let data = new FormData();
                    data.append('action', 'change_profile');
                    data.append('user_id', this.user_data.id);
                    data.append('ProfileImage', base64Blob);
                    this.authApi.changeProfilePicture(data).subscribe((Data) => {
                        console.log("Data>>>>>>>>>>>>>>>>>>>>>",Data)

                        console.log("this.user_id>>>>>>>>>>>>>>>>>>>>>",this.user_id)
                        let avatar = new FormData();
                        avatar.append('action', 'profile');
                        avatar.append('user_id', this.user_data.id);
                        avatar.append('profile_id', this.user_id);
                        this.feedsApi.profileApi(avatar).subscribe((val) => {
                            console.log("val123", val)
                            this.user_data.avatar = val.avatar
                            this.sql.query('UPDATE user_data SET avatar="' + val.avatar + '"').then(() => {

                            })
                        }, (error) => {
                            console.error(error)
                        })
                    })
                } else {
                    this.toastCtrl.create(this.networkErrorObj).present()
                }
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

    goToProfile() {
        this.navCtrl.parent.select(4)
    }

    followuser(id) {
        if (window.navigator.onLine) {
            let loader = this.loadingCtrl.create({
                content: "Loading..."
            });
            loader.present();
            let followuser = this.toastCtrl.create({
                message: 'You are following this user.',
                duration: 2000
            });
            let data = new FormData();
            data.append('action', 'follow');
            data.append('user_id', this.user_data.id)
            data.append('following', id)
            this.profile.is_following = 'true'
            this.feedsApi.followUser(data).subscribe((Data) => {
                loader.dismiss()
                if (Data.success == true) {
                    followuser.present()
                }
            }, (error) => {
                console.error(error)
            })
        } else {
            this.toastCtrl.create(this.networkErrorObj).present()
        }
    }

    unfollowUser(id) {
        if (window.navigator.onLine) {
            let loader = this.loadingCtrl.create({
                content: "Loading..."
            });
            loader.present();

            let data = new FormData();
            data.append('action', 'unfollow');
            data.append('user_id', this.user_data.id)
            data.append('following', id)
            this.profile.is_following = 'false'
            this.feedsApi.unfollowUser(data).subscribe((Data) => {
                loader.dismiss()
            }, (error) => {
                console.error(error)
            })
        } else {
            this.toastCtrl.create(this.networkErrorObj).present()
        }
    }

    shareViaFacebook(title, image, url) {
        this.ss.shareViaFacebook(title, image, url).then(() => {
            // Success!
            console.log("success");
        }).catch(() => {
            // Error!
            console.log("fail");

        });
    }

    viewProfileImage() {
        this.pauseAllVideo()
        this.stopMusic()
        let modal = this.modalCtrl.create(ProfileImagePage, {"user_id": this.profile.id});
        modal.present();
    }

    removeAllVideoIframe() {
        if (this.profileFeeds) {
            this.profileFeeds.forEach((value1) => {
                if (value1.video != undefined) {
                    delete value1['video'];
                }
            })
        }
    }

    destroyAllVideo() {
        let that = this
        if (that.profileFeeds) {
            that.profileFeeds.forEach((value1) => {
                if (value1.video_type != '2') {
                    if (value1.video != undefined) {
                        value1.video.destroy()
                    }
                } else {
                    if (value1.spotify_preview == '') {
                        if (that.user_data.id == value1.user) {
                            $('.spotifyWrapper div[id^="profile_spotify_iframe"]').each(function (index) {}).empty();
                            $('.spotifyWrapper').each(function (index) {}).removeClass('hidePlayButton');
                        } else {
                            $('.spotifyWrapper div[id^="other_spotify_iframe"]').each(function (index) {}).empty();
                            $('.spotifyWrapper').each(function (index) {}).removeClass('hidePlayButton');
                        }

                    }
                }
            })
        }
    }

    pauseAllVideo() {
        let that = this
        if (this.profileFeeds) {
            this.profileFeeds.forEach((value1) => {
                if (value1.video_type != '2') {
                    if (value1.video != undefined) {
                        value1.video.pauseVideo()
                    }
                } else {
                    if (value1.spotify_preview == '') {
                        if (that.user_data.id == value1.user) {
                            $('.spotifyWrapper div[id^="profile_spotify_iframe"]').each(function (index) {}).empty();
                            $('.spotifyWrapper').each(function (index) {}).removeClass('hidePlayButton');
                        } else {
                            $('.spotifyWrapper div[id^="other_spotify_iframe"]').each(function (index) {}).empty();
                            $('.spotifyWrapper').each(function (index) {}).removeClass('hidePlayButton');
                        }

                    }
                }
            })
        }
    }

    clickMusic(spotifyData, key) {
        let that = this

        if (spotifyData.spotify_preview != that.oldUrl) {
            that.pauseAllVideo()
            that.stopMusic()
            that._music = null
        }

        that.oldUrl = spotifyData.spotify_preview

        if (that._music == null) {
            console.log("that._music", that._music);
            that._music = that.media.create(spotifyData.spotify_preview, (status) => {
                console.log('status', status)
                if (that.user_data.id == that.user_id) {
                    if (status == 2) {
                        $('#profile_playbutton' + key).hide();
                        $('#profile_pausebutton' + key).show();
                    } else {
                        $('#profile_playbutton' + key).show();
                        $('#profile_pausebutton' + key).hide();
                    }
                } else {
                    if (status == 2) {
                        $('#other_playbutton' + key).hide();
                        $('#other_pausebutton' + key).show();
                    } else {
                        $('#other_playbutton' + key).show();
                        $('#other_pausebutton' + key).hide();
                    }
                }

            }, (onSuccess) => console.log('onSuccess'), (onError) => console.log('onError', onError));
            that.playMusic(spotifyData.activity_id);
        }
        else {
            if (that.isPlaying) {
                that.stopMusic()
            }
            else {
                that.playMusic(spotifyData.activity_id);
            }
        }
    }

    stopMusic() {
        let that = this
        console.log('music', that._music)
        if (that._music != null) {
            that._music.pause();
            that._music = null
        }
        that.isPlaying = false;
    }

    playMusic(activity_id) {
        let that = this
        that._music.play();
        if(this.activityArray.indexOf(activity_id) < 0 ){
            this.activityArray.push(activity_id)
            let data = new FormData();
            data.append('action', 'watched_activity');
            data.append('user_id', this.user_data.id)
            data.append('activity_id', activity_id);

            that.videosApi.videoWached(data).subscribe((Data) => {}, (error) => {
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

    createNewSpotifyIframe(id, data) {
        let that = this
        if (that.user_data.id == data.user) {
            if ($('#profile_spotify_iframe' + id + ' iframe').length == 0) {
                $('#profile_card' + id).find('.spotifyWrapper').addClass('hidePlayButton')
                let html = '<iframe src="https://open.spotify.com/embed?uri=spotify:track:' + data.spotify_id + '" frameborder="0" allowtransparency="true"></iframe>'
                $('#profile_spotify_iframe' + id).append(html)

                if(this.activityArray.indexOf(data.activity_id) < 0 ){
                    this.activityArray.push(data.activity_id)
                    let spotifyData = new FormData();
                    spotifyData.append('action', 'watched_activity');
                    spotifyData.append('user_id', this.user_data.id)
                    spotifyData.append('activity_id', data.activity_id);

                    that.videosApi.videoWached(spotifyData).subscribe((Data) => {}, (error) => {
                        console.error(error)
                    })
                }
            }
        } else {
            if ($('#other_spotify_iframe' + id + ' iframe').length == 0) {
                $('#other_card' + id).find('.spotifyWrapper').addClass('hidePlayButton')
                let html = '<iframe src="https://open.spotify.com/embed?uri=spotify:track:' + data.spotify_id + '" frameborder="0" allowtransparency="true"></iframe>'
                $('#other_spotify_iframe' + id).append(html)

                if(this.activityArray.indexOf(data.activity_id) < 0 ){
                    this.activityArray.push(data.activity_id)
                    let spotifyData = new FormData();
                    spotifyData.append('action', 'watched_activity');
                    spotifyData.append('user_id', this.user_data.id)
                    spotifyData.append('activity_id', data.activity_id);

                    that.videosApi.videoWached(spotifyData).subscribe((Data) => {}, (error) => {
                        console.error(error)
                    })
                }
            }
        }

    }

    backToTop(){
        $(".scroll-content").scrollTop(0)
    }
}