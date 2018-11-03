import {AfterViewInit, Component} from "@angular/core";
import {AlertController, Events, LoadingController, NavController, NavParams, ToastController} from "ionic-angular";
import {FeedsService} from "../../app/api/services/feeds.service";
import {FriendSongs} from "../../app/app.component";
import {VideoService} from "../../app/api/services/video.service";
import {ProfilePage} from "../profile/profile";
import {FSHelper} from "../../app/helpers/helpers";
import {SocialSharing} from "@ionic-native/social-sharing";
import {DomSanitizer} from "@angular/platform-browser";
import {MediaPlugin, MediaObject} from '@ionic-native/media';

declare var $;
declare var window;

@Component({
    selector: 'page-search',
    templateUrl: 'search.html',
    providers: [FeedsService, VideoService]
})

export class SearchPage implements AfterViewInit {
    public follow: any = false
    private searchOptions: string = 'youtube';
    public user_data: any = FriendSongs.userData;
    public value: any;
    public searchValues: any = '';
    private YouTubeIframeLoader: any = FriendSongs.YouTubeIframeLoader;
    public networkErrorObj = FSHelper.networkErrorObj()
    public activityArray = [];
    public groupId: any = '';



    private _music: MediaObject;
    mediaTimer: any;
    duration: any;
    interval: any;
    oldUrl: any
    isPlaying = false;
    private subscriber = null;


    videoData: any = [];
    spotifyData: any = [];

    constructor(public navCtrl: NavController, public navParams: NavParams, public alertCtrl: AlertController, event: Events, private feedsApi: FeedsService, public loadingCtrl: LoadingController, private videosApi: VideoService, public toastCtrl: ToastController, private ss: SocialSharing, public sanitizer: DomSanitizer, private media: MediaPlugin) {

        event.subscribe('click_via_plus_sign', () => {
            this.navCtrl.parent.select(1)
            this.searchOptions = 'youtube';
        })
        event.subscribe("event:phoneLock", () => {
            this.pauseAllVideo()
            this.stopMusic()
        });
        let offset = new Date().getTimezoneOffset();
        console.log('offset', offset);

    }

    ionViewWillLeave() {
        this.searchValues = ''
        this.destroyAllVideo()
        this.stopMusic()
    }

    ionViewWillEnter() {
        let playlistDetailLocal =  JSON.parse(localStorage.getItem('playListDetail'));
        let playlistGroupId = playlistDetailLocal ? playlistDetailLocal.group_id : null;
        this.groupId = playlistGroupId != null ? playlistGroupId : 0;

        console.log("this.groupIdserch",this.groupId)



        $('#fab-back-to-top-search').hide()
        let loader = this.loadingCtrl.create({
            content: "Loading..."
        });
        let that = this
        let data = new FormData();
        if (window.navigator.onLine) {
            if (that.searchOptions == 'youtube') {
                if (that.videoData == '') {
                    loader.present();
                    data.append('action', 'search_youtube');
                    data.append('key', '');
                    that.feedsApi.everyoneFeeds(data).subscribe((Data) => {
                        loader.dismiss()
                        if (Data != null) {
                            that.videoData = Data
                        } else {
                            console.log("Null")
                        }
                    }, (error) => {
                        loader.dismiss()
                        console.error(error)
                    })
                }
            } else {
                if (that.spotifyData == '') {
                    loader.present();
                    data.append('action', 'spotify_search');
                    data.append('offset', '0');
                    that.feedsApi.everyoneFeeds(data).subscribe((Data) => {
                        loader.dismiss()
                        if (Data != null) {
                            that.spotifyData = Data

                        } else {
                            console.log("Null")
                        }
                    }, (error) => {
                        loader.dismiss()
                        console.error(error)
                    })
                }
            }
        } else {
            that.toastCtrl.create(this.networkErrorObj).present()
        }
        FriendSongs.loaderTimeOut(loader)
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

    ngAfterViewInit(): void {

        let that = this
        $('page-search .scroll-content').on('scroll', function () {
            if(SearchPage.isElementInViewport($('#fab-back-to-top-search'))){
                if($('page-search .scroll-content').scrollTop() < 350){
                    $('#fab-back-to-top-search').hide()
                }else{
                    $('#fab-back-to-top-search').show()
                }
            }
            if (that.searchOptions == 'youtube') {
                that.videoData.forEach((data: any, key) => {
                    if(SearchPage.isElementInViewport($("#youtube_card" + key + " .videoWrapper"))){
                        if(that.isPlaying){
                            that.pauseMusic()
                        }
                    }
                    if ($('#search_iframe' + key).attr('src') != undefined) {
                        if (SearchPage.isElementInViewport($("#search_iframe" + key)) && !data.isPlaying && !data.manuallyPaused) {
                            if (data.video != undefined) {
                                if(that.isPlaying){
                                    that.pauseMusic()
                                }
                                //data.video.playVideo()
                            }
                        } else if (!SearchPage.isElementInViewport($("#search_iframe" + key))) {
                            data.manuallyPaused = false;
                            if (data.isPlaying) {
                                data.video.pauseVideo()
                            }
                        }
                    }
                })
            } else {
                that.spotifyData.forEach((data: any, key) => {
                    if (data.spotify_preview == '') {
                        if ($('#spotify_iframe' + key + ' iframe').length == 0) {
                            if (SearchPage.isElementInViewport($("#spotify_card" + key + " .spotifyWrapper"))) {
                                if(that.isPlaying){
                                    that.pauseMusic()
                                }
                                /*$('#spotify_card' + key).find('.spotifyWrapper').addClass('hidePlayButton')
                                let html = '<iframe src="https://open.spotify.com/embed?uri=spotify:track:' + data.spotify_id + '" frameborder="0" allowtransparency="true" id="spotifyIframe' + key + '"></iframe>'
                                $('#spotify_iframe' + key).append(html)*/
                            } else if (!SearchPage.isElementInViewport($("#spotify_card" + key + " .spotifyWrapper"))) {

                            }
                        } else {
                            if (!SearchPage.isElementInViewport($("#spotify_card" + key + " .spotifyWrapper"))) {
                                $('#spotify_iframe' + key).empty()
                                $('#spotify_card' + key).find('.spotifyWrapper').removeClass('hidePlayButton')
                            }
                        }
                    }else{
                        if(SearchPage.isElementInViewport($("#spotify_card" + key + " .audioWrapper"))){

                        }else if(!SearchPage.isElementInViewport($("#spotify_card" + key + " .audioWrapper"))){

                        }
                    }
                })
            }

        })
    }

    doRefresh(refresher) {
        if (window.navigator.onLine) {
            this.searchValues = ''
            let that = this
            let data = new FormData();
            if (that.searchOptions == 'youtube') {
                data.append('action', 'search_youtube');
                data.append('key', '');
                that.feedsApi.everyoneFeeds(data).subscribe((Data) => {
                    if (Data != null) {
                            that.videoData = []
                            that.videoData = Data
                    } else {
                        console.log("Null")
                    }
                }, (error) => {
                    console.error(error)
                })
            } else {
                data.append('action', 'spotify_search');
                data.append('offset', '0');
                that.feedsApi.everyoneFeeds(data).subscribe((Data) => {
                    if (Data != null) {
                            that.spotifyData = []
                            that.spotifyData = Data
                    } else {
                        console.log("Null")
                    }
                }, (error) => {
                    console.error(error)
                })
            }
            refresher.complete();
        } else {
            refresher.complete();
            this.toastCtrl.create(this.networkErrorObj).present()
        }
    }

    loadYoutubMoreFrame(id) {
        let that = this
        that.YouTubeIframeLoader.load((YT) => {
            that.videoData.forEach((value: any, key) => {
                if (id == key && value.video == undefined) {
                    value.isLoading = true
                    value.isPlaying = false
                    value.manuallyPaused = 0
                    value.video = new YT.Player('search_iframe' + key, {
                        height: '270',
                        playerVars: {
                            fs: 0,
                            rel: 0,
                            showinfo: 0
                        },
                        videoId: value.youtube_id,
                        events: {
                            'onReady': (event) => {
                                $('#youtube_card' + key + ' iframe').contents().find('.ytp-watermark').hide();
                                $('#youtube_card' + key).find('.videoWrapper').addClass('hidePlayButton');
                                /**
                                 * @description This code for if any video are playing then pause before current video play
                                 */
                                that.videoData.forEach((value1: any, key1) => {
                                    if (value1.video_type != 2) {
                                        if (!SearchPage.isElementInViewport($("#search_iframe" + key1)) && key != key1 && value1.video != undefined && event.data) {
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
                                    console.log('Record Watched Successfully Search')
                                }, (error) => {
                                    console.error(error)
                                })
                            },
                            'onStateChange': (event) => {
                                that.videoData.forEach((value1: any, key1) => {
                                    if (event.data == 1 && key != key1 && value1.video != undefined) {
                                        value1.video.pauseVideo()
                                    }
                                })
                                value.manuallyPaused = event.data == YT.PlayerState.PAUSED
                                value.isPlaying = event.data == YT.PlayerState.PLAYING
                                if (event.data == YT.PlayerState.ENDED) {
                                    if (key < (that.videoData.length - 1)) {
                                        $(".scroll-content").animate({scrollTop: $("#youtube_card" + (key + 1)).offset().top - ($("#youtube_card0").offset().top)}, 1000, () => {
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
        })
    }

    createNewIframe(id) {
        this.removeAllVideoIframe()
        this.stopMusic()
        if (window.navigator.onLine) {
            this.loadYoutubMoreFrame(id)
        } else {
            this.toastCtrl.create(this.networkErrorObj).present()
        }
    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad SearchPage');
    }

    ngOnInIt() {
        this.navCtrl.parent.select(1)
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
                                if (Data) {
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

    goToProfile(id) {
        if (this.user_data.id != id) {
            this.navCtrl.push(ProfilePage, {"user_id": id})
        } else {
            this.navCtrl.parent.select(4)
        }
    }

    onInput(searchValues) {
        let data = new FormData();
        let that = this
        that.pauseAllVideo()
        if(that.isPlaying){
            that.pauseMusic()
        }
        if (this.searchOptions == 'youtube') {
            data.append('action', 'search_youtube');
            data.append('key', searchValues);
        } else {
            data.append('action', 'spotify_search');
            data.append('offset', '0');
            data.append('query', searchValues);
        }

        if (window.navigator.onLine) {
            if (that.subscriber) {
                that.subscriber.unsubscribe()
            }
            that.subscriber = that.videosApi.searchYoutube(data).subscribe((Data) => {
                $(".scroll-content").scrollTop(0)
                if (Data.success != false) {
                    if (this.searchOptions == 'youtube') {
                        this.videoData = []
                        this.videoData = Data
                    } else {
                        this.spotifyData = []
                        this.spotifyData = Data
                    }
                }
            }, (error) => {
                console.error(error)
            })
        } else {
            this.toastCtrl.create(this.networkErrorObj).present()
        }
    }

    onProfile() {
        if (this.searchValues == '') {
            var key = ''
        } else {
            key = this.searchValues
        }
        this.stopMusic()
        let that = this
        this.removeAllVideoIframe()
        $(".scroll-content").scrollTop(0)
        let loader = that.loadingCtrl.create({
            content: "Loading..."
        });
        let data = new FormData();
        setTimeout(() => {
            if (that.subscriber) {
                that.subscriber.unsubscribe()
            }
            if (that.searchOptions == 'youtube') {
                /*if (this.videoData == '') {*/
                data.append('action', 'search_youtube');
                data.append('key', key);
                if (window.navigator.onLine) {
                    loader.present();
                    that.subscriber = that.videosApi.searchYoutube(data).subscribe((Data) => {
                        if (Data) {
                            if (Data.success != false) {
                                that.videoData = []
                                this.videoData = Data
                            }
                        }
                        loader.dismiss()
                    }, (error) => {
                        loader.dismiss()
                        console.error(error)
                    })

                } else {
                    that.toastCtrl.create(this.networkErrorObj).present()
                }
                /*}*/
            } else {
                /*if (that.spotifyData == '') {*/
                loader.present();
                data.append('action', 'spotify_search');
                data.append('offset', '0');
                data.append('query', key);
                that.subscriber = that.feedsApi.everyoneFeeds(data).subscribe((Data) => {
                    loader.dismiss()
                    if (Data != null) {
                        that.spotifyData = []
                        that.spotifyData = Data
                    } else {
                        console.log("Null")
                    }
                }, (error) => {
                    loader.dismiss()
                    console.error(error)
                })
                /*}*/

            }
            FriendSongs.loaderTimeOut(loader)
        }, 500)

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

    onCancel(event) {
        console.log(event.value)
    }

    removeAllVideoIframe() {
        if (this.videoData) {
            this.videoData.forEach((value1) => {
                if (value1.video != undefined) {
                    delete value1['video'];
                }
            })
        }
    }

    destroyAllVideo() {
        let that = this
        if (that.videoData) {
            that.videoData.forEach((value1) => {
                if (value1.video != undefined) {
                    value1.video.destroy()
                }
            })
        }
        if (that.spotifyData) {
            that.spotifyData.forEach((valueSpotify) => {
                if (valueSpotify.spotify_preview == '') {
                    $('.spotifyWrapper div[id^="spotify_iframe"]').each(function (index) {}).empty();
                    $('.spotifyWrapper').each(function (index) {}).removeClass('hidePlayButton');
                }
            })
        }
    }

    pauseAllVideo() {
        let that = this
        if (that.videoData) {
            that.videoData.forEach((value1) => {
                if (value1.video != undefined) {
                    value1.video.pauseVideo()
                }
            })
        }
        if (that.spotifyData) {
            that.spotifyData.forEach((valueSpotify) => {
                if (valueSpotify.spotify_preview == '') {
                    $('.spotifyWrapper div[id^="spotify_iframe"]').each(function (index) {}).empty();
                    $('.spotifyWrapper').each(function (index) {}).removeClass('hidePlayButton');
                }
            })
        }
    }

    clickMusic(spotifyData, key) {
        let that = this

        if (spotifyData.spotify_preview != that.oldUrl) {
            that.pauseAllVideo()
            that._music = null
        }

        that.oldUrl = spotifyData.spotify_preview

        if (that._music == null) {
            that._music = that.media.create(spotifyData.spotify_preview, (status) => {
                if (status == 2) {
                    $('#spotify_playbutton' + key).hide();
                    $('#spotify_pausebutton' + key).show();
                } else {
                    $('#spotify_playbutton' + key).show();
                    $('#spotify_pausebutton' + key).hide();
                }
            }, (onSuccess) => console.log('onSuccess'), (onError) => console.log('onError', onError));
            that.playMusic(spotifyData.activity_id);
        } else {
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
        if(that.isPlaying){
            that._music.pause();
            that.isPlaying = false;
        }
    }

    createNewSpotifyIframe(id, data) {
        let that = this
        if ($('#spotify_iframe' + id + ' iframe').length == 0) {
            $('#spotify_card' + id).find('.spotifyWrapper').addClass('hidePlayButton')
            let html = '<iframe src="https://open.spotify.com/embed?uri=spotify:track:' + data.spotify_id + '" frameborder="0" allowtransparency="true"></iframe>'
            $('#spotify_iframe' + id).append(html)

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

    backToTop(){
        $(".scroll-content").scrollTop(0)
    }
}