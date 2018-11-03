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
import {CommentsPage} from "../comments/comments";
import {FeedsService} from "../../app/api/services/feeds.service";
import {Facebook} from "ionic-native";
import {FSHelper} from "../../app/helpers/helpers";
import {VideoService} from "../../app/api/services/video.service";
import {FriendSongs} from "../../app/app.component";
import {SocialSharing} from "@ionic-native/social-sharing";
import {Sql} from "../../app/providers/Sql";
import {ProfilePage} from "../profile/profile";
import {DomSanitizer} from "@angular/platform-browser";
import {MediaObject, MediaPlugin} from "@ionic-native/media";
import {EmailComposer} from "@ionic-native/email-composer";
import {VideoDetailPage} from "../video-detail/video-detail";
import {SearchPlaylistPage} from "../search-playlist/search-playlist";

/* Declare extar parameter  */
declare let $;
declare let window;

/*Component*/
@Component({
    selector: 'page-home',
    templateUrl: 'home.html',
    providers: [FeedsService, VideoService]
})
/* Main class start */
export class HomePage implements AfterViewInit {

    /* Declare variable */
    public user_data: any = FriendSongs.userData;
    public YouTubeIframeLoader: any = FriendSongs.YouTubeIframeLoader
    public searchValue: any = true
    public everyone_data: any = null;
    public data_id_array : any = [];
    public friend_data: any = null;
    public suffleId: any = null;
    public suffleValue: any = null;
    public suffleKey: any = null;
    public scroll: any = null;
    public me_data: any = null;
    public keyForRendom : any = null;
    public posts = 'Everyone';
    public searchText: any = '';
    public activityArray = [];
    public networkErrorObj = FSHelper.networkErrorObj()
    public playlist: any = '';
    public playImage: any = '';
    public groupId: any = '';
    public follow: boolean = false;
    public skip: boolean = false;
    public playDescription: any = '';
    public suffleExit: boolean = false;
    public followThisGroup: boolean = false;
    mediaTimer: any;
    duration: any;
    interval: any;
    oldUrl: any
    isPlaying = false;
    lastPlaybackId: any
    private actionSheet: any;
    public user_id: any = ''

    /* Variable for media plugin */
    private _music: MediaObject;


    /* Constructor */
    constructor(public modalCtrl: ModalController, public alertCtrl: AlertController, private navCtrl: NavController, public actionSheetCtrl: ActionSheetController, private event: Events, private feedsApi: FeedsService, private videosApi: VideoService, public loadingCtrl: LoadingController, private sql: Sql, public toastCtrl: ToastController, private ss: SocialSharing, public platform: Platform, public sanitizer: DomSanitizer, private media: MediaPlugin, private emailComposer: EmailComposer, public navParams: NavParams) {

        this.event.subscribe("event:serch-playlist", (data) => {
            localStorage.setItem('playListDetail', JSON.stringify(data))
        });
        localStorage.removeItem('shuffle');
        localStorage.removeItem('rendom');
        if (this.user_data.length == 0) {
            let u_id = localStorage.getItem('user_id');
            this.user_id = u_id != null ? u_id : this.user_data.id
        }


        let playlistDetailLocal =  JSON.parse(localStorage.getItem('playListDetail'));
        let playlistName = playlistDetailLocal ? playlistDetailLocal.playlist_name : null;
        let playlistImage = playlistDetailLocal ? playlistDetailLocal.playlist_image : null;
        let playlistDescription = playlistDetailLocal ? playlistDetailLocal.playlist_description : '';
        let playlistGroupId = playlistDetailLocal ? playlistDetailLocal.group_id : null;
        this.playlist = playlistName != null ? playlistName : 'Select a playlist';
        this.playImage = playlistImage != null ? playlistImage : 'assets/img/logo.png';
        this.groupId = playlistGroupId != null ? playlistGroupId : 0;


        if (this.groupId != 0) {
            /* follow check api for follow icon fill and unfill */
            let data = new FormData();
            data.append('action', 'following_group');
            data.append('user_id', this.user_id);
            data.append('group_id', this.groupId);
            this.videosApi.addPlaylist(data).subscribe((Data) => {
                if (Data.success == 'true') {
                    this.followThisGroup = true
                } else {
                    this.followThisGroup = false
                }
            });
        }

        this.playDescription = playlistDescription;
        this.posts = "Everyone";


        /*  get the playlist data from localstorage */

        /* shuffle functinality*/
        if (localStorage.getItem('shuffle') != null && localStorage.getItem('shuffle') != '') {
            this.suffleExit = true;
        }
        /* Get Data */
            this.sql.query("SELECT * FROM user_data").then((data) => {
            if (data.res.rows.length > 0) {
                FriendSongs.userData.id = data.res.rows.item(0).id;
                FriendSongs.userData.name = data.res.rows.item(0).name;
                FriendSongs.userData.email = data.res.rows.item(0).email;
                FriendSongs.userData.avatar = data.res.rows.item(0).avatar;
                FriendSongs.userData.device_type = data.res.rows.item(0).device_type;
                FriendSongs.userData.device_token = data.res.rows.item(0).device_token;
                FriendSongs.userData.login_type = data.res.rows.item(0).login_type;
                FriendSongs.userData.notification = data.res.rows.item(0).notification;
                FriendSongs.userData.facebook_share = data.res.rows.item(0).social_share;
            }
        }, (error) => {
            console.log("ERROR: " + JSON.stringify(error));
        })
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
        /*
                this.playpause(this.suffleKey,this.suffleValue);
        */
        localStorage.removeItem('rendom');
        this.removeAllVideoIframe()
        this.stopMusic()
        localStorage.removeItem('shuffle');
        this.suffleExit = false;
        this.destroyAllVideo()
        this.stopMusic()
    }

    ionViewWillEnter() {
        let playlistDetailLocal =  JSON.parse(localStorage.getItem('playListDetail'));
        let playlistName = playlistDetailLocal ? playlistDetailLocal.playlist_name : null;
        let playlistImage = playlistDetailLocal ? playlistDetailLocal.playlist_image : null;
        let playlistDescription = playlistDetailLocal ? playlistDetailLocal.playlist_description : '';
        let playlistGroupId = playlistDetailLocal ? playlistDetailLocal.group_id : null;
        this.playlist = playlistName != null ? playlistName : 'Select a playlist';
        this.playImage = playlistImage != null ? playlistImage : 'assets/img/logo.png';
        this.groupId = playlistGroupId != null ? playlistGroupId : 0;

        if (this.groupId != 0) {
            /* follow check api for follow icon fill and unfill */
            let data = new FormData();
            data.append('action', 'following_group');
            data.append('user_id', this.user_id);
            data.append('group_id', this.groupId);
            this.videosApi.addPlaylist(data).subscribe((Data) => {
                if (Data.success == 'true') {
                    this.followThisGroup = true
                } else {
                    this.followThisGroup = false
                }
            });
        }

        this.playDescription = playlistDescription;

        $('#fab-back-to-top').hide()
        let loader = this.loadingCtrl.create({
            content: "Loading..."
        });
        if (window.navigator.onLine) {
            let that = this;
            var data = new FormData();
            if (this.posts == "Everyone") {
                this.searchValue = false;
/*
                if (that.everyone_data == '' || that.everyone_data == null) {
*/
                    loader.present();
                    data.append('action', 'feed');
                    data.append('mobile', 'true');
                    data.append('group_id', this.groupId);
                    data.append('offset', '0');
                    data.append('user_id', this.user_id);
                    that.feedsApi.everyoneFeeds(data).subscribe((Data) => {
                        loader.dismiss()
                        if (Data != null) {
                            Data = Data.slice(1);
                            let allData = [];
                            let idGroup = [];
                            Data.forEach(function (val) {
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
                                newData.source = val.source
                                newData.extra = val.extra
                                newData.user_liked = val.user_liked
                                newData.comments = val.comments
                                newData.likes = val.likes
                                newData.comment_count = val.comment_count
                                newData.genius_points = FSHelper.numberWithCommas(val.genius_points)
                                newData.activity_id = val.activity_id
                                newData.video_type = val.video_type
                                newData.spotify_id = val.spotify_id
                                newData.spotify_href = val.spotify_href
                                newData.spotify_preview = val.spotify_preview
                                newData.spotify_uri = val.spotify_uri
                                allData.push(newData)
                                idGroup.push(newData.id)
                            })
                            that.everyone_data = []
                            that.data_id_array = []
                            that.everyone_data = allData
                            that.data_id_array = idGroup

                        } else {
                            that.everyone_data = []
                            that.data_id_array = []
                        }
                    }, (error) => {
                        console.error(error)
                    })
                /*}/!**!/*/
            } else if (this.posts == 'Friends') {
                this.searchValue = true;
/*
                if (that.friend_data == '' || that.friend_data == null) {
*/
                    loader.present();
                    data.append('action', 'feed');
                    data.append('mobile', 'true');
                    data.append('group_id', this.groupId);
                    data.append('r', 'friends');
                    data.append('user_id', this.user_id);
                    data.append('offset', '0');
                    that.feedsApi.everyoneFeeds(data).subscribe((Data) => {
                        loader.dismiss()
                        if (Data != null) {
                            Data = Data.slice(1);
                            let allData = [];
                            let idGroup = [];
                            Data.forEach(function (val) {
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
                                newData.source = val.source
                                newData.extra = val.extra
                                newData.user_liked = val.user_liked
                                newData.comments = val.comments
                                newData.likes = val.likes
                                newData.comment_count = val.comment_count
                                newData.genius_points = FSHelper.numberWithCommas(val.genius_points)
                                newData.activity_id = val.activity_id
                                newData.video_type = val.video_type
                                newData.spotify_id = val.spotify_id
                                newData.spotify_href = val.spotify_href
                                newData.spotify_preview = val.spotify_preview
                                newData.spotify_uri = val.spotify_uri
                                allData.push(newData)
                                idGroup.push(newData.id)
                            })
                            that.friend_data = []
                            that.data_id_array = []
                            that.friend_data = allData
                            that.data_id_array = idGroup
                        } else {
                            that.friend_data = []
                            that.data_id_array = []
                        }
                    }, (error) => {
                        console.error(error)
                    })
                /*}*/
            } else {
                this.searchValue = true;
/*
                if (that.me_data == '' || that.me_data == null) {
*/
                    loader.present();
                    data.append('action', 'feed');
                    data.append('mobile', 'true');
                    data.append('group_id', this.groupId);
                    data.append('r', 'me');
                    data.append('user_id', this.user_id);
                    data.append('offset', '0');
                    that.feedsApi.everyoneFeeds(data).subscribe((Data) => {
                        loader.dismiss()
                        if (Data != null) {
                            Data = Data.slice(1);
                            let allData = [];
                            let idGroup = [];
                            Data.forEach(function (val) {
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
                                newData.source = val.source
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
                                allData.push(newData)
                                idGroup.push(newData.id)
                            })

                            that.me_data = []
                            that.data_id_array = []
                            that.data_id_array = idGroup
                            that.me_data = allData
                        } else {
                            that.me_data = []
                            that.data_id_array = []
                        }
                    }, (error) => {
                        console.error(error)
                    })
                }
            /*}*/
        } else {
            this.toastCtrl.create(this.networkErrorObj).present()
        }
        FriendSongs.loaderTimeOut(loader)
    }

    ngAfterViewInit(): void {
        let that = this
        $('page-home .scroll-content').on('scroll', function () {
            if (HomePage.isElementInViewport($('#fab-back-to-top'))) {
                if ($('page-home .scroll-content').scrollTop() < 350) {
                    $('#fab-back-to-top').hide()
                } else {
                    $('#fab-back-to-top').show()
                }
            }
            if (that.posts == 'Everyone') {
                that.everyone_data.forEach((data: any, key) => {
                    if (data.video_type != '2') {
                        if (HomePage.isElementInViewport($("#everyone_card" + key + " .videoWrapper"))) {
                            if (that.isPlaying) {
                                that.pauseMusic()
                            }
                        }
                        if ($('#iframe' + key).attr('src') != undefined && data.video) {
                            if (HomePage.isElementInViewport($("#iframe" + key)) && !data.isPlaying && !data.manuallyPaused) {
                                if (data.video != undefined) {
                                    if (that.isPlaying) {
                                        that.pauseMusic()
                                    }
                                }
                            } else if (!HomePage.isElementInViewport($("#iframe" + key))) {
                                data.manuallyPaused = false;
                                if (data.isPlaying) {
                                    data.video.pauseVideo()
                                }
                            }
                        }
                    } else {

                        if (data.spotify_preview == '') {
                            if ($('#everyone_spotify_iframe' + key + ' iframe').length == 0) {
                                if (HomePage.isElementInViewport($("#everyone_card" + key + " .spotifyWrapper"))) {
                                    if (that.isPlaying) {
                                        that.pauseMusic()
                                    }
                                } else if (!HomePage.isElementInViewport($("#everyone_card" + key + " .spotifyWrapper"))) {

                                }
                            } else {
                                if (!HomePage.isElementInViewport($("#everyone_card" + key + " .spotifyWrapper"))) {
                                    $('#everyone_spotify_iframe' + key).empty()
                                    $('#everyone_card' + key).find('.spotifyWrapper').removeClass('hidePlayButton')
                                }
                            }
                        } else {
                            if (HomePage.isElementInViewport($("#everyone_card" + key + " .audioWrapper"))) {

                            } else if (!HomePage.isElementInViewport($("#everyone_card" + key + " .audioWrapper"))) {

                            }
                        }

                    }

                })
            } else if (that.posts == 'Friend') {
                that.friend_data.forEach((data: any, key) => {
                    if (data.video_type != '2') {
                        if (HomePage.isElementInViewport($("#friend_card" + key + " .videoWrapper"))) {
                            if (that.isPlaying) {
                                that.pauseMusic()
                            }
                        }
                        if ($('#friend_iframe' + key).attr('src') != undefined && data.video) {
                            if (HomePage.isElementInViewport($("#friend_iframe" + key)) && !data.isPlaying && !data.manuallyPaused) {
                                if (data.video != undefined) {
                                    if (that.isPlaying) {
                                        that.pauseMusic()
                                    }
                                }
                            } else if (!HomePage.isElementInViewport($("#friend_iframe" + key))) {
                                data.manuallyPaused = false;
                                if (data.isPlaying) {
                                    data.video.pauseVideo()
                                }
                            }
                        }
                    } else {
                        if (data.spotify_preview == '') {
                            if ($('#friend_spotify_iframe' + key + ' iframe').length == 0) {
                                if (HomePage.isElementInViewport($("#friend_card" + key + " .spotifyWrapper"))) {
                                    if (that.isPlaying) {
                                        that.pauseMusic()
                                    }
                                } else if (!HomePage.isElementInViewport($("#friend_card" + key + " .spotifyWrapper"))) {

                                }
                            } else {
                                if (!HomePage.isElementInViewport($("#friend_card" + key + " .spotifyWrapper"))) {
                                    $('#friend_spotify_iframe' + key).empty()
                                    $('#friend_card' + key).find('.spotifyWrapper').removeClass('hidePlayButton')
                                }
                            }
                        } else {
                            if (HomePage.isElementInViewport($("#friend_card" + key + " .audioWrapper"))) {

                            } else if (!HomePage.isElementInViewport($("#friend_card" + key + " .audioWrapper"))) {

                            }
                        }
                    }
                })
            } else if (that.posts == 'Me') {
                that.me_data.forEach((data: any, key) => {
                    if (data.video_type != '2') {
                        if (HomePage.isElementInViewport($("#me_card" + key + " .videoWrapper"))) {
                            if (that.isPlaying) {
                                that.pauseMusic()
                            }
                        }
                        if ($('#me_iframe' + key).attr('src') != undefined && data.video) {
                            if (HomePage.isElementInViewport($("#me_iframe" + key)) && !data.isPlaying && !data.manuallyPaused) {
                                if (data.video != undefined) {
                                    if (that.isPlaying) {
                                        that.pauseMusic()
                                    }
                                }
                            } else if (!HomePage.isElementInViewport($("#me_iframe" + key))) {
                                data.manuallyPaused = false;
                                if (data.isPlaying) {
                                    data.video.pauseVideo()
                                }
                            }
                        }
                    } else {
                        if (data.spotify_preview == '') {
                            if ($('#me_spotify_iframe' + key + ' iframe').length == 0) {
                                if (HomePage.isElementInViewport($("#me_card" + key + " .spotifyWrapper"))) {
                                    if (that.isPlaying) {
                                        that.pauseMusic()
                                    }
                                } else if (!HomePage.isElementInViewport($("#me_card" + key + " .spotifyWrapper"))) {

                                }
                            } else {
                                if (!HomePage.isElementInViewport($("#me_card" + key + " .spotifyWrapper"))) {
                                    $('#me_spotify_iframe' + key).empty()
                                    $('#me_card' + key).find('.spotifyWrapper').removeClass('hidePlayButton')
                                }
                            }
                        } else {
                            if (HomePage.isElementInViewport($("#me_card" + key + " .audioWrapper"))) {

                            } else if (!HomePage.isElementInViewport($("#me_card" + key + " .audioWrapper"))) {

                            }
                        }
                    }
                })
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
        let that = this
        that.lastPlaybackId = id
        if (that.posts == 'Everyone') {
            that.YouTubeIframeLoader.load((YT) => {
                that.everyone_data.forEach((value: any, key) => {
                    if (value.video_type != 2) {
                        if (id == key && value.video != undefined) {
                            this.suffleId = id
                            this.suffleValue = value
                            this.suffleKey = key
                            value.video.playVideo()
                        }
                        if (id == key && value.video == undefined) {
                            this.suffleId = id
                            this.suffleValue = value
                            this.suffleKey = key
                            value.isLoading = true
                            value.isPlaying = false
                            value.manuallyPaused = 0
                            value.video = new YT.Player('iframe' + key, {
                                height: '270',
                                videoId: value.youtube_id,
                                playerVars: {
                                    fs: 0,
                                    rel: 0,
                                    showinfo: 0
                                },
                                events: {
                                    'onReady': (event) => {
                                        $('#everyone_card' + key + ' iframe').contents().find('.ytp-watermark').hide();
                                        $('#everyone_card' + key).find('.videoWrapper').addClass('hidePlayButton');

                                        this.scroll = ($("#everyone_card" + (key)).offset().top - ($("#everyone_card0").offset().top)) + 10;
                                        $(".scroll-content").animate({scrollTop: this.scroll}, 1000, () => {
                                        });
                                        localStorage.setItem('shuffle', 'true');
                                        that.suffleExit = true;
                                        /**
                                         * @description This code for if any video are playing then pause before current video play
                                         */
                                        that.everyone_data.forEach((value1: any, key1) => {
                                            if (value1.video_type != 2) {
                                                if (!HomePage.isElementInViewport($("#iframe" + key1)) && key != key1 && value1.video != undefined) {
                                                    value1.video.pauseVideo()
                                                }
                                            }

                                        })
                                        event.target.playVideo()
                                        value.isLoading = false
                                        let data = new FormData();
                                        data.append('action', 'watched_activity');
                                        data.append('user_id', this.user_id)
                                        data.append('activity_id', value.activity_id);

                                        that.videosApi.videoWached(data).subscribe((Data) => {
                                        }, (error) => {
                                            console.error(error)
                                        })
                                    },
                                    'onStateChange': (event) => {

                                        console.log("key",key)
                                        console.log("id",id)


                                        if (event.data == 1) {
                                            if(this.skip == true){
                                                this.skip = false;
                                                $(".scroll-content").animate({scrollTop: ($("#everyone_card" + (key + 1)).offset().top - ($("#everyone_card0").offset().top)) + 6}, 1000, () => {
                                                });
                                            } else {
                                                $(".scroll-content").animate({scrollTop: ($("#everyone_card" + (key)).offset().top - ($("#everyone_card0").offset().top)) + 10 - 6}, 1000, () => {
                                                });
                                            }
                                            localStorage.setItem('shuffle', 'true');
                                            that.suffleExit = true;
                                            $('#everyone_card' + key + ' iframe').contents().find('.ytp-watermark').hide();
                                            $('#everyone_card' + key).find('.videoWrapper').addClass('hidePlayButton');
                                        } else if (event.data == 2) {
                                            this.skip = false;
                                            localStorage.removeItem('shuffle');
                                            that.suffleExit = false;
                                        }
                                        that.everyone_data.forEach((value1: any, key1) => {
                                            if (event.data == 1 && key != key1 && value1.video != undefined) {
                                                value1.video.pauseVideo()
                                            }
                                        })


                                        value.manuallyPaused = event.data == YT.PlayerState.PAUSED
                                        value.isPlaying = event.data == YT.PlayerState.PLAYING
                                        if (event.data == YT.PlayerState.ENDED) {
                                            if (key < (that.everyone_data.length - 1)) {
                                                $(".scroll-content").animate({scrollTop: $("#everyone_card" + (key + 1)).offset().top - ($("#everyone_card0").offset().top)}, 1000, () => {
                                                    that.loadYoutubMoreFrame(key + 1)
                                                });
                                            }
                                        }
                                    },
                                    'onError': (event) => {
                                        let data = new FormData();
                                        data.append('action', 'disable_mobile');
                                        data.append('id', value.activity_id);
                                        that.videosApi.disablevideo(data).subscribe((Data) => {
                                        }, (error) => {
                                            console.error(error)
                                        })


                                        if (key < (that.everyone_data.length - 1)) {
                                            $(".scroll-content").animate({scrollTop: $("#everyone_card" + (key + 1)).offset().top - ($("#everyone_card0").offset().top)}, 1000, () => {
                                                that.loadYoutubMoreFrame(key + 1)
                                            });
                                        }
                                    }
                                }
                            })
                            return value
                        }
                    } else {
                        if (id == key && value.video == undefined) {
                            if (key < (that.everyone_data.length - 1)) {
                                $(".scroll-content").animate({scrollTop: $("#everyone_card" + (key + 1)).offset().top - ($("#everyone_card0").offset().top)}, 1000, () => {
                                    that.loadYoutubMoreFrame(key + 1)
                                });
                            }
                        }
                    }
                })
            })
        } else if (that.posts == 'Friends') {
            that.YouTubeIframeLoader.load((YT) => {
                that.friend_data.forEach((value: any, key) => {
                    if (value.video_type != 2) {
                        if (id == key && value.video != undefined) {
                            this.suffleId = id
                            this.suffleValue = value
                            this.suffleKey = key
                            value.video.playVideo()
                        }
                        if (id == key && value.video == undefined) {
                            this.suffleId = id
                            this.suffleValue = value
                            this.suffleKey = key
                            value.isLoading = true
                            value.isPlaying = false
                            value.manuallyPaused = 0
                            value.video = new YT.Player('friend_iframe' + key, {
                                height: '270',
                                videoId: value.youtube_id,
                                playerVars: {
                                    fs: 0,
                                    rel: 0,
                                    showinfo: 0,
                                    enablejsapi: 1
                                },
                                events: {
                                    'onReady': (event) => {
                                        $('#friend_card' + key + ' iframe').contents().find('.ytp-watermark').hide();
                                        $('#friend_card' + key).find('.videoWrapper').addClass('hidePlayButton');
                                        localStorage.setItem('shuffle', 'true');
                                        this.scroll = ($("#friend_card" + (key)).offset().top - ($("#friend_card0").offset().top)) + 10;
                                        $(".scroll-content").animate({scrollTop: this.scroll}, 1000, () => {
                                        });

                                        that.suffleExit = true;
                                        /**
                                         * @description This code for if any video are playing then pause before current video play
                                         */
                                        that.friend_data.forEach((value1: any, key1) => {
                                            if (value1.video_type != 2) {
                                                if (!HomePage.isElementInViewport($("#friend_iframe" + key1)) && key != key1 && value1.video != undefined && event.data) {
                                                    value1.video.pauseVideo()
                                                }
                                            }
                                        })
                                        event.target.playVideo()
                                        value.isLoading = false
                                        let data = new FormData();
                                        data.append('action', 'watched_activity');
                                        data.append('user_id', this.user_id)
                                        data.append('activity_id', value.activity_id);

                                        that.videosApi.videoWached(data).subscribe((Data) => {
                                        }, (error) => {
                                            console.error(error)
                                        })
                                    },
                                    'onStateChange': (event) => {


                                        if (event.data == 1) {
                                            if(this.skip == true){
                                                this.skip = false;
                                                $(".scroll-content").animate({scrollTop: ($("#friend_card" + (key + 1)).offset().top - ($("#friend_card0").offset().top)) + 6}, 1000, () => {
                                                });
                                            } else {
                                                $(".scroll-content").animate({scrollTop: ($("#friend_card" + (key)).offset().top - ($("#friend_card0").offset().top)) + 10 - 6}, 1000, () => {});
                                            }
                                            localStorage.setItem('shuffle', 'true');
                                            that.suffleExit = true;
                                            $('#friend_card' + key + ' iframe').contents().find('.ytp-watermark').hide();
                                            $('#friend_card' + key).find('.videoWrapper').addClass('hidePlayButton');

                                        } else if (event.data == 2) {
                                            this.skip = false;
                                            localStorage.removeItem('shuffle');
                                            that.suffleExit = false;
                                        }
                                        that.friend_data.forEach((value1: any, key1) => {
                                            if (event.data == 1 && key != key1 && value1.video != undefined) {
                                                value1.video.pauseVideo()
                                            }
                                        })
                                        value.manuallyPaused = event.data == YT.PlayerState.PAUSED
                                        value.isPlaying = event.data == YT.PlayerState.PLAYING
                                        if (event.data == YT.PlayerState.ENDED) {
                                            if (key < (that.friend_data.length - 1)) {
                                                $(".scroll-content").animate({scrollTop: $("#friend_card" + (key + 1)).offset().top - ($("#friend_card0").offset().top)}, 1000, () => {
                                                    that.loadYoutubMoreFrame(key + 1)
                                                });
                                            }
                                        }
                                    },
                                    'onError': (event) => {
                                        let data = new FormData();
                                        data.append('action', 'disable_mobile');
                                        data.append('id', value.activity_id);
                                        that.videosApi.disablevideo(data).subscribe((Data) => {

                                        }, (error) => {
                                            console.error(error)
                                        })

                                        if (key < (that.friend_data.length - 1)) {
                                            $(".scroll-content").animate({scrollTop: $("#friend_card" + (key + 1)).offset().top - ($("#friend_card0").offset().top)}, 1000, () => {
                                                that.loadYoutubMoreFrame(key + 1)
                                            });
                                        }
                                    }
                                }
                            })
                            return value
                        }
                    } else {

                        if (id == key && value.video == undefined) {
                            if (key < (that.friend_data.length - 1)) {
                                $(".scroll-content").animate({scrollTop: $("#friend_card" + (key + 1)).offset().top - ($("#friend_card0").offset().top)}, 1000, () => {
                                    that.loadYoutubMoreFrame(key + 1)
                                });
                            }
                        }
                    }
                })
            })
        } else if (that.posts == 'Me') {
            that.YouTubeIframeLoader.load((YT) => {
                that.me_data.forEach((value: any, key) => {
                    if (value.video_type != 2) {
                        if (id == key && value.video != undefined) {
                            this.suffleId = id
                            this.suffleValue = value
                            this.suffleKey = key
                            value.video.playVideo()
                        }
                        if (id == key && value.video == undefined) {
                            this.suffleId = id
                            this.suffleValue = value
                            this.suffleKey = key
                            value.isLoading = true
                            value.isPlaying = false
                            value.manuallyPaused = 0
                            value.video = new YT.Player('me_iframe' + key, {
                                height: '270',
                                videoId: value.youtube_id,
                                playerVars: {
                                    fs: 0,
                                    rel: 0,
                                    showinfo: 0
                                },
                                events: {
                                    'onReady': (event) => {
                                        $('#me_card' + key + ' iframe').contents().find('.ytp-watermark').hide();
                                        $('#me_card' + key).find('.videoWrapper').addClass('hidePlayButton');
                                        localStorage.setItem('shuffle', 'true');
                                        this.scroll = ($("#me_card" + (key)).offset().top - ($("#me_card0").offset().top)) + 10;
                                        $(".scroll-content").animate({scrollTop: this.scroll}, 1000, () => {
                                        });
                                        that.suffleExit = true;
                                        /**
                                         * @description This code for if any video are playing then pause before current video play
                                         */
                                        that.me_data.forEach((value1: any, key1) => {
                                            if (value1.video_type != 2) {
                                                if (!HomePage.isElementInViewport($("#me_iframe" + key1)) && key != key1 && value1.video != undefined) {
                                                    value1.video.stopVideo()
                                                }
                                            }
                                        })
                                        event.target.playVideo()
                                        value.isLoading = false
                                        let data = new FormData();
                                        data.append('action', 'watched_activity');
                                        data.append('user_id', this.user_id)
                                        data.append('activity_id', value.activity_id);

                                        that.videosApi.videoWached(data).subscribe((Data) => {
                                        }, (error) => {
                                            console.error(error)
                                        })
                                    },
                                    'onStateChange': (event) => {

                                        if (event.data == 1) {
                                            if(this.skip == true){
                                                this.skip = false;
                                                $(".scroll-content").animate({scrollTop: ($("#me_card" + (key + 1)).offset().top - ($("#me_card0").offset().top)) + 6}, 1000, () => {
                                                });
                                            } else {

                                                $(".scroll-content").animate({scrollTop: ($("#me_card" + (key)).offset().top - ($("#me_card0").offset().top)) + 10 - 6}, 1000, () => {
                                                });
                                            }

                                            localStorage.setItem('shuffle', 'true');
                                            that.suffleExit = true;
                                            $('#me_card' + key + ' iframe').contents().find('.ytp-watermark').hide();
                                            $('#me_card' + key).find('.videoWrapper').addClass('hidePlayButton');
                                        } else if (event.data == 2) {
                                            this.skip = false;
                                            localStorage.removeItem('shuffle');
                                            that.suffleExit = false;
                                        }
                                        that.me_data.forEach((value1: any, key1) => {
                                            if (event.data == 1 && key != key1 && value1.video != undefined) {
                                                value1.video.pauseVideo()
                                            }
                                        })
                                        value.manuallyPaused = event.data == YT.PlayerState.PAUSED
                                        value.isPlaying = event.data == YT.PlayerState.PLAYING
                                        if (event.data == YT.PlayerState.ENDED) {
                                            if (key < (that.me_data.length - 1)) {
                                                $(".scroll-content").animate({scrollTop: $("#me_card" + (key + 1)).offset().top - ($("#me_card0").offset().top)}, 1000, () => {
                                                    that.loadYoutubMoreFrame(key + 1)
                                                });
                                            }
                                        }
                                    },
                                    'onError': (event) => {
                                        let data = new FormData();
                                        data.append('action', 'disable_mobile');
                                        data.append('id', value.activity_id);
                                        that.videosApi.disablevideo(data).subscribe((Data) => {
                                        }, (error) => {
                                            console.error(error)
                                        })
                                        if (key < (that.me_data.length - 1)) {
                                            $(".scroll-content").animate({scrollTop: $("#me_card" + (key + 1)).offset().top - ($("#me_card0").offset().top)}, 1000, () => {
                                                that.loadYoutubMoreFrame(key + 1)
                                            });
                                        }
                                    }
                                }
                            })
                            return value
                        }
                    } else {
                        if (id == key && value.video == undefined) {
                            if (key < (that.me_data.length - 1)) {
                                $(".scroll-content").animate({scrollTop: $("#me_card" + (key + 1)).offset().top - ($("#me_card0").offset().top)}, 1000, () => {
                                    that.loadYoutubMoreFrame(key + 1)
                                });
                            }
                        }
                    }
                })
            })
        }
    }

    createNewIframe(id) {

        if (window.navigator.onLine) {
            this.loadYoutubMoreFrame(id)
        } else {
            this.toastCtrl.create(this.networkErrorObj).present()
        }
    }

    doRefresh(refresher) {
        let that = this
        if (window.navigator.onLine) {
            that.searchText = ''
            setTimeout(() => {
                let data = new FormData();
                if (that.posts == 'Everyone') {
                    data.append('action', 'feed');
                    data.append('mobile', 'true');
                    data.append('group_id', this.groupId);
                    data.append('offset', '0');
                    data.append('user_id', this.user_id)

                    that.feedsApi.everyoneFeeds(data).subscribe((Data) => {
                        if (Data != null) {
                            Data = Data.slice(1);
                            let allData = [];
                            let idGroup = [];

                            Data.forEach(function (val) {
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
                                newData.genius_points = FSHelper.numberWithCommas(val.genius_points)
                                newData.activity_id = val.activity_id
                                newData.video_type = val.video_type
                                newData.spotify_id = val.spotify_id
                                newData.spotify_href = val.spotify_href
                                newData.spotify_preview = val.spotify_preview
                                newData.spotify_uri = val.spotify_uri
                                allData.push(newData)
                                idGroup.push(newData.id)
                            })

                            that.everyone_data = []
                            that.everyone_data = allData
                            that.data_id_array = []
                            that.data_id_array = idGroup
                        } else {
                            that.everyone_data = []
                            that.data_id_array = []
                        }
                    }, (error) => {
                        console.error(error)
                    })
                } else if (that.posts == 'Friends') {
                    data.append('action', 'feed');
                    data.append('mobile', 'true');
                    data.append('group_id', this.groupId);
                    data.append('r', 'friends');
                    data.append('user_id', this.user_id)
                    data.append('offset', '0');

                    that.feedsApi.friendFeeds(data).subscribe((Data) => {
                        if (Data != null) {
                            Data = Data.slice(1);
                            let allData = [];
                            let idGroup = [];
                            Data.forEach(function (val) {
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
                                newData.genius_points = FSHelper.numberWithCommas(val.genius_points)
                                newData.activity_id = val.activity_id
                                newData.video_type = val.video_type
                                newData.spotify_id = val.spotify_id
                                newData.spotify_href = val.spotify_href
                                newData.spotify_preview = val.spotify_preview
                                newData.spotify_uri = val.spotify_uri
                                allData.push(newData)
                                idGroup.push(newData.id)
                            })
                            that.friend_data = []
                            that.friend_data = allData
                            that.data_id_array = []
                            that.data_id_array = idGroup
                        } else {
                            that.friend_data = []
                            that.data_id_array = []
                        }
                    }, (error) => {
                        console.error(error)
                    })
                } else {
                    data.append('action', 'feed');
                    data.append('mobile', 'true');
                    data.append('group_id', this.groupId);
                    data.append('r', 'me');
                    data.append('user_id', this.user_id)
                    data.append('offset', '0');

                    that.feedsApi.meFeeds(data).subscribe((Data) => {
                        if (Data != null) {
                            Data = Data.slice(1);
                            let allData = [];
                            let idGroup = [];
                            Data.forEach(function (val) {
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
                                allData.push(newData)
                                idGroup.push(newData.id)

                            })
                            that.me_data = []
                            that.me_data = allData
                            that.data_id_array = []
                            that.data_id_array = idGroup
                        } else {
                            that.me_data = []
                            that.data_id_array = []
                        }
                    }, (error) => {
                        console.error(error)
                    })
                }
                refresher.complete();
            }, 2000);
        } else {
            refresher.complete();
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

    goToDetail(id) {
        this.navCtrl.push(VideoDetailPage, {data: id});
    }

    goToProfile(id) {
        if (this.user_id != id) {
            this.navCtrl.push(ProfilePage, {"user_id": id})
        } else {
            this.navCtrl.parent.select(4)
        }
    }

    goToYoutube() {
        this.navCtrl.parent.select(2)
    }

    openCommentList(videoData) {
        this.pauseAllVideo()
        this.stopMusic()
        let modal = this.modalCtrl.create(CommentsPage, {
            "video_id": videoData.id,
            "activity_id": videoData.activity_id
        })
        this.event.subscribe("event:addComment", (data) => {
            videoData.comments.splice(0, 0, data)
            videoData.comment_count++
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
                            data.append('user_id', this.user_id);
                            data.append('group_id', this.groupId);
                            data.append('activity_id', shareData.activity_id);
                            data.append('message', msg_data.about_song);
                            this.videosApi.shareVideo(data).subscribe((Data) => {
                                if (Data.success) {
                                    let followers_data = new FormData();
                                    followers_data.append('action', 'followers');
                                    followers_data.append('user_id', this.user_id);
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

    presentActionSheet(activity, type, index) {
        this.pauseAllVideo()
        this.stopMusic()
        if (this.user_id == activity.user) {
            this.actionSheet = this.actionSheetCtrl.create({
                buttons: [
                    {
                        text: 'Delete',
                        icon: 'trash',
                        role: 'destructive',
                        handler: () => {
                            this.deleteConfirm(activity, type, index)
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
        } else {
            this.actionSheet = this.actionSheetCtrl.create({
                buttons: [
                    {
                        text: 'Block Suggestion',
                        icon: 'document',
                        handler: () => {
                            this.blockSuggestion(activity, type, index)
                        }
                    },
                    {
                        text: 'Block User Suggestions',
                        icon: 'document',
                        handler: () => {
                            this.blockUserSuggestion(activity, type, index)
                        }
                    },
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
        }
        this.actionSheet.present();
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
                    }
                },
                {
                    text: 'Yes',
                    handler: () => {
                        if (window.navigator.onLine) {
                            let data = new FormData();
                            data.append('action', 'delete_song');
                            data.append('user_id', this.user_id);
                            data.append('activity_id', activity.activity_id);
                            this.videosApi.deleteVideo(data).subscribe((Data) => {
                                $("#" + type + "_card" + index).remove();
                                if (type == 'me') {
                                    this.me_data.splice(index, 1);
                                    if (this.me_data.length == 0) {
                                        this.me_data = []
                                    }
                                }
                                this.toastCtrl.create({
                                    message: 'Video Deleted',
                                    duration: FSHelper.toastMessageTime(2)
                                }).present()
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

    searchEvent() {
        this.searchValue = this.searchValue != false ? false : true
    }

    onChangeSegment() {
        this.suffleKey = 0;
        localStorage.removeItem('rendom');
        this.removeAllVideoIframe()
        this.stopMusic()
        localStorage.removeItem('shuffle');
        this.suffleExit = false;
        let loader = this.loadingCtrl.create({
            content: "Loading..."
        });
        let data = new FormData();
        if (window.navigator.onLine) {
            let that = this
            if (this.posts == "Everyone") {
                this.searchValue = false;
                $(".scroll-content").scrollTop(0)
                /*if (that.everyone_data == '' || that.everyone_data == null) {*/
                loader.present();
                data.append('action', 'feed');
                data.append('mobile', 'true');
                data.append('group_id', this.groupId);
                data.append('offset', '0');
                data.append('user_id', this.user_id);
                that.feedsApi.everyoneFeeds(data).subscribe((Data) => {
                    loader.dismiss()
                    if (Data != null) {
                        Data = Data.slice(1);
                        let allData = [];
                        let idGroup = [];
                        Data.forEach(function (val) {
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
                            newData.genius_points = FSHelper.numberWithCommas(val.genius_points)
                            newData.activity_id = val.activity_id
                            newData.video_type = val.video_type
                            newData.spotify_id = val.spotify_id
                            newData.spotify_href = val.spotify_href
                            newData.spotify_preview = val.spotify_preview
                            newData.spotify_uri = val.spotify_uri
                            allData.push(newData)
                            idGroup.push(newData.id)
                        })
                        that.everyone_data = []
                        that.everyone_data = allData
                        that.data_id_array = []
                        that.data_id_array = idGroup
                    } else {
                        that.everyone_data = []
                        that.data_id_array = []
                    }
                }, (error) => {
                    console.error(error)
                })

            } else if (this.posts == 'Friends') {
                this.searchValue = true;
                $(".scroll-content").scrollTop(0)
                loader.present();
                data.append('action', 'feed');
                data.append('mobile', 'true');
                data.append('group_id', this.groupId);
                data.append('r', 'friends');
                data.append('user_id', this.user_id);
                data.append('offset', '0');
                that.feedsApi.friendFeeds(data).subscribe((Data) => {
                    loader.dismiss()
                    if (Data != null) {
                        Data = Data.slice(1);
                        let allData = [];
                        let idGroup = [];
                        Data.forEach(function (val) {
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
                            newData.genius_points = FSHelper.numberWithCommas(val.genius_points)
                            newData.activity_id = val.activity_id
                            newData.video_type = val.video_type
                            newData.spotify_id = val.spotify_id
                            newData.spotify_href = val.spotify_href
                            newData.spotify_preview = val.spotify_preview
                            newData.spotify_uri = val.spotify_uri
                            allData.push(newData)
                            idGroup.push(newData.id)
                        })

                        that.friend_data = []
                        that.friend_data = allData
                        that.data_id_array = []
                        that.data_id_array = idGroup
                    } else {
                        that.friend_data = []
                        that.data_id_array = []
                    }
                }, (error) => {
                    console.error(error)
                })

            } else {
                this.searchValue = true;
                $(".scroll-content").scrollTop(0)
                /*
                                if (that.me_data == '' || that.me_data == null) {
                */
                loader.present();
                data.append('action', 'feed');
                data.append('mobile', 'true');
                data.append('group_id', this.groupId);
                data.append('r', 'me');
                data.append('user_id', this.user_id);
                data.append('offset', '0');
                that.feedsApi.meFeeds(data).subscribe((Data) => {
                    loader.dismiss()
                    if (Data != null) {
                        Data = Data.slice(1);
                        let allData = [];
                        let idGroup = [];
                        Data.forEach(function (val) {
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
                            allData.push(newData)
                            idGroup.push(newData.id)
                        })
                        that.me_data = []
                        that.me_data = allData
                        that.data_id_array = []
                        that.data_id_array = idGroup
                    } else {
                        that.me_data = []
                        that.data_id_array = []
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

    invitePeople() {
        let options = {
            url: "https://fb.me/100007745981693",
            picture: ""
        }
        Facebook.appInvite(options)
    }

    onInput(searchValues) {
        let that = this
        let data = new FormData();
        if (searchValues != '') {
            if (that.posts == 'Friends') {
                data.append('action', 'search_friend_activity');
            }
            if (that.posts == 'Me') {
                data.append('action', 'search_user_activity');
            }
            data.append('user_id', this.user_id);
            data.append('key', searchValues);
            if (window.navigator.onLine) {
                setTimeout(() => {
                    that.feedsApi.searchApi(data).subscribe((Data) => {
                        if (Data.success != false) {
                            if (Data != null) {
                                let allData = [];
                                let idGroup = [];
                                Data.forEach(function (val) {
                                    let newData: any = {};
                                    let post_time = FSHelper.getTime(val.date)
                                    newData.id = val.vid
                                    newData.user = val.id
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
                                    newData.genius_points = FSHelper.numberWithCommas(val.genius_points)
                                    newData.activity_id = val.activity_id
                                    newData.video_type = val.video_type
                                    newData.spotify_id = val.spotify_id
                                    newData.spotify_href = val.spotify_href
                                    newData.spotify_preview = val.spotify_preview
                                    newData.spotify_uri = val.spotify_uri
                                    allData.push(newData)
                                    idGroup.push(newData.id)
                                })
                                if (this.posts == 'Friends') {
                                    this.friend_data = allData
                                }
                                if (this.posts == 'Me') {
                                    this.me_data = allData
                                }
                                that.data_id_array = idGroup
                            } else {
                                if (this.posts == 'Friends') {
                                    this.friend_data = []
                                }
                                if (this.posts == 'Me') {
                                    this.me_data = []
                                }
                                that.data_id_array = []
                            }

                        }
                    }, (error) => {
                        console.error(error)
                    })
                }, 1000)
            }
        } else {
            data.append('action', 'feed');
            data.append('mobile', 'true');
            data.append('group_id', this.groupId);
            if (that.posts == 'Friends') {
                data.append('r', 'friends');
            }
            if (that.posts == 'Me') {
                data.append('r', 'me');
            }
            data.append('user_id', this.user_id);
            data.append('offset', 0);
            if (window.navigator.onLine) {
                setTimeout(() => {
                    that.feedsApi.searchApi(data).subscribe((Data) => {
                        if (Data.success != false) {
                            if (Data != null) {
                                Data = Data.slice(1);
                                let allData = [];
                                let idGroup = [];
                                Data.forEach(function (val) {
                                    let newData: any = {};
                                    let post_time = FSHelper.getTime(val.date)
                                    newData.id = val.vid
                                    newData.user = val.id
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
                                    newData.genius_points = FSHelper.numberWithCommas(val.genius_points)
                                    newData.activity_id = val.activity_id
                                    newData.video_type = val.video_type
                                    newData.spotify_id = val.spotify_id
                                    newData.spotify_href = val.spotify_href
                                    newData.spotify_preview = val.spotify_preview
                                    newData.spotify_uri = val.spotify_uri
                                    allData.push(newData)
                                    idGroup.push(newData.id)
                                })
                                if (this.posts == 'Friends') {
                                    this.friend_data = allData
                                }
                                if (this.posts == 'Me') {
                                    this.me_data = allData
                                }
                                that.data_id_array = idGroup
                            } else {
                                if (this.posts == 'Friends') {
                                    this.friend_data = []
                                }
                                if (this.posts == 'Me') {
                                    this.me_data = []
                                }
                                that.data_id_array = []
                            }

                        }
                    }, (error) => {
                        console.error(error)
                    })
                }, 1000)
            }
        }

    }

    onCancel($event) {

    }

    shareViaFacebook(title, image, url) {
        this.ss.shareViaFacebook(title, image, url).then(() => {
            // Success!
        }).catch(() => {
            // Error!
        });
    }

    removeAllVideoIframe() {
        if (this.everyone_data) {
            this.everyone_data.forEach((value1) => {
                if (value1.video != undefined) {
                    delete value1['video'];
                }
            })
        }
        if (this.friend_data) {
            this.friend_data.forEach((value1) => {
                if (value1.video != undefined) {
                    delete value1['video'];
                }
            })
        }
        if (this.me_data) {
            this.me_data.forEach((value1) => {
                if (value1.video != undefined) {
                    delete value1['video'];
                }
            })
        }
    }

    destroyAllVideo() {
        if (this.posts == 'Everyone') {
            this.everyone_data.forEach((value1) => {
                if (value1.video_type != '2') {
                    if (value1.video != undefined) {
                        value1.video.destroy()
                    }
                } else {
                    if (value1.spotify_preview == '') {
                        $('.spotifyWrapper div[id^="everyone_spotify_iframe"]').each(function (index) {
                        }).empty();
                        $('.spotifyWrapper').each(function (index) {
                        }).removeClass('hidePlayButton');
                    }
                }

            })

        }
        if (this.posts == 'Friends') {
            this.friend_data.forEach((value1) => {
                if (value1.video_type != '2') {
                    if (value1.video != undefined) {
                        value1.video.destroy()
                    }
                } else {
                    if (value1.spotify_preview == '') {
                        $('.spotifyWrapper div[id^="friend_spotify_iframe"]').each(function (index) {
                        }).empty();
                        $('.spotifyWrapper').each(function (index) {
                        }).removeClass('hidePlayButton');
                    }
                }
            })
        }
        if (this.posts == 'Me') {
            this.me_data.forEach((value1) => {
                if (value1.video_type != '2') {
                    if (value1.video != undefined) {
                        value1.video.destroy()
                    }
                } else {
                    if (value1.spotify_preview == '') {
                        $('.spotifyWrapper div[id^="me_spotify_iframe"]').each(function (index) {
                        }).empty();
                        $('.spotifyWrapper').each(function (index) {
                        }).removeClass('hidePlayButton');
                    }
                }
            })
        }
    }

    stopAllVideo() {
        if (this.posts == 'Everyone') {
            this.everyone_data.forEach((value1) => {
                if (value1.video_type != '2') {
                    if (value1.video != undefined) {
                        value1.video.stopVideo()
                        $('.videoWrapper').each(function (index) {
                        }).removeClass('hidePlayButton');
                    }
                } else {
                    if (value1.spotify_preview == '') {
                        $('.spotifyWrapper div[id^="everyone_spotify_iframe"]').each(function (index) {
                        }).empty();
                        $('.spotifyWrapper').each(function (index) {
                        }).removeClass('hidePlayButton');
                    }
                }

            })

        }
        if (this.posts == 'Friends') {
            this.friend_data.forEach((value1) => {
                if (value1.video_type != '2') {
                    if (value1.video != undefined) {
                        value1.video.stopVideo()
                        $('.videoWrapper').each(function (index) {
                        }).removeClass('hidePlayButton');
                    }
                } else {
                    if (value1.spotify_preview == '') {
                        $('.spotifyWrapper div[id^="friend_spotify_iframe"]').each(function (index) {
                        }).empty();
                        $('.spotifyWrapper').each(function (index) {
                        }).removeClass('hidePlayButton');
                    }
                }
            })
        }
        if (this.posts == 'Me') {
            this.me_data.forEach((value1) => {
                if (value1.video_type != '2') {
                    if (value1.video != undefined) {
                        value1.video.stopVideo()
                        $('.videoWrapper').each(function (index) {
                        }).removeClass('hidePlayButton');
                    }
                } else {
                    if (value1.spotify_preview == '') {
                        $('.spotifyWrapper div[id^="me_spotify_iframe"]').each(function (index) {
                        }).empty();
                        $('.spotifyWrapper').each(function (index) {
                        }).removeClass('hidePlayButton');
                    }
                }
            })
        }
    }

    pauseAllVideo() {
        if (this.everyone_data) {
            this.everyone_data.forEach((value1) => {
                if (value1.video_type != '2') {
                    if (value1.video != undefined) {
                        value1.video.pauseVideo()
                    }
                } else {
                    if (value1.spotify_preview == '') {
                        $('.spotifyWrapper div[id^="everyone_spotify_iframe"]').each(function (index) {
                        }).empty();
                        $('.spotifyWrapper').each(function (index) {
                        }).removeClass('hidePlayButton');
                    }
                }
            })
        }
        if (this.friend_data) {
            this.friend_data.forEach((value1) => {
                if (value1.video_type != '2') {
                    if (value1.video != undefined) {
                        value1.video.pauseVideo()
                    }
                } else {
                    if (value1.spotify_preview == '') {
                        $('.spotifyWrapper div[id^="friend_spotify_iframe"]').each(function (index) {
                        }).empty();
                        $('.spotifyWrapper').each(function (index) {
                        }).removeClass('hidePlayButton');
                    }
                }
            })
        }
        if (this.me_data) {
            this.me_data.forEach((value1) => {
                if (value1.video_type != '2') {
                    if (value1.video != undefined) {
                        value1.video.pauseVideo()
                    }
                } else {
                    if (value1.spotify_preview == '') {
                        $('.spotifyWrapper div[id^="me_spotify_iframe"]').each(function (index) {
                        }).empty();
                        $('.spotifyWrapper').each(function (index) {
                        }).removeClass('hidePlayButton');
                    }
                }
            })
        }
    }

    clickMusic(everyoneData, key) {
        let that = this

        if (everyoneData.spotify_preview != that.oldUrl) {
            that.pauseAllVideo()
            that._music = null
        }

        that.oldUrl = everyoneData.spotify_preview

        if (that._music == null) {
            that._music = that.media.create(everyoneData.spotify_preview, (status) => {
                if (that.posts == 'Everyone') {
                    if (status == 2) {
                        $('#everyone_playbutton' + key).hide();
                        $('#everyone_pausebutton' + key).show();
                    } else {
                        $('#everyone_playbutton' + key).show();
                        $('#everyone_pausebutton' + key).hide();
                    }
                } else if (that.posts == 'Friends') {
                    if (status == 2) {
                        $('#friend_playbutton' + key).hide();
                        $('#friend_pausebutton' + key).show();
                    } else {
                        $('#friend_playbutton' + key).show();
                        $('#friend_pausebutton' + key).hide();
                    }
                } else if (that.posts == 'Me') {
                    if (status == 2) {
                        $('#me_playbutton' + key).hide();
                        $('#me_pausebutton' + key).show();
                    } else {
                        $('#me_playbutton' + key).show();
                        $('#me_pausebutton' + key).hide();
                    }
                }

            }, (onSuccess) => console.log('onSuccess'), (onError) => console.log('onError', onError));
            that.playMusic(everyoneData.activity_id);
        }
        else {
            if (that.isPlaying) {
                that.stopMusic()
            }
            else {
                that.playMusic(everyoneData.activity_id);
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
            data.append('user_id', this.user_id)
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

    createNewSpotifyIframe(id, data) {
        let that = this
        if (that.posts == 'Everyone') {
            if ($('#everyone_spotify_iframe' + id + ' iframe').length == 0) {
                $('#everyone_card' + id).find('.spotifyWrapper').addClass('hidePlayButton')
                let html = '<iframe src="https://open.spotify.com/embed?uri=spotify:track:' + data.spotify_id + '" frameborder="0" allowtransparency="true"></iframe>'
                $('#everyone_spotify_iframe' + id).append(html)
                if (this.activityArray.indexOf(data.activity_id) < 0) {
                    this.activityArray.push(data.activity_id)
                    let spotifyData = new FormData();
                    spotifyData.append('action', 'watched_activity');
                    spotifyData.append('user_id', this.user_id)
                    spotifyData.append('activity_id', data.activity_id);

                    that.videosApi.videoWached(spotifyData).subscribe((Data) => {
                    }, (error) => {
                        console.error(error)
                    })
                }

            } else {
            }

        } else if (that.posts == 'Friends') {
            if ($('#friend_spotify_iframe' + id + ' iframe').length == 0) {
                $('#friend_card' + id).find('.spotifyWrapper').addClass('hidePlayButton')
                let html = '<iframe src="https://open.spotify.com/embed?uri=spotify:track:' + data.spotify_id + '" frameborder="0" allowtransparency="true"></iframe>'
                $('#friend_spotify_iframe' + id).append(html)

                if (this.activityArray.indexOf(data.activity_id) < 0) {
                    this.activityArray.push(data.activity_id)
                    let spotifyData = new FormData();
                    spotifyData.append('action', 'watched_activity');
                    spotifyData.append('user_id', this.user_id)
                    spotifyData.append('activity_id', data.activity_id);

                    that.videosApi.videoWached(spotifyData).subscribe((Data) => {
                    }, (error) => {
                        console.error(error)
                    })
                }
            } else {
            }

        } else if (that.posts == 'Me') {
            if ($('#me_spotify_iframe' + id + ' iframe').length == 0) {
                $('#me_card' + id).find('.spotifyWrapper').addClass('hidePlayButton')
                let html = '<iframe src="https://open.spotify.com/embed?uri=spotify:track:' + data.spotify_id + '" frameborder="0" allowtransparency="true"></iframe>'
                $('#me_spotify_iframe' + id).append(html)

                if (this.activityArray.indexOf(data.activity_id) < 0) {
                    this.activityArray.push(data.activity_id)
                    let spotifyData = new FormData();
                    spotifyData.append('action', 'watched_activity');
                    spotifyData.append('user_id', this.user_id)
                    spotifyData.append('activity_id', data.activity_id);

                    that.videosApi.videoWached(spotifyData).subscribe((Data) => {
                    }, (error) => {
                        console.error(error)
                    })
                }
            } else {
            }

        } else {
        }
    }

    backToTop() {
        $(".scroll-content").scrollTop(0)
    }

    /* block suggestion */
    blockSuggestion(activity, type, index) {
        let alert = this.alertCtrl.create({
            title: 'Confirm Block',
            message: 'Do you want to Block this song?',
            buttons: [
                {
                    text: 'No',
                    role: 'no',
                    handler: () => {
                    }
                },
                {
                    text: 'Yes',
                    handler: () => {
                        if (window.navigator.onLine) {
                            let data = new FormData();
                            data.append('action', 'block_suggestion');
                            data.append('user_id', this.user_id);
                            data.append('activity_id', activity.activity_id);
                            this.videosApi.blockSuggestion(data).subscribe((Data) => {
                                $("#" + type + "_card" + index).remove();
                                this.toastCtrl.create({
                                    message: 'Video Blocked',
                                    duration: FSHelper.toastMessageTime(2)
                                }).present()
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


    /* block user suggestion */
    blockUserSuggestion(activity, type, index) {
        let alert = this.alertCtrl.create({
            title: 'Confirm Block',
            message: 'Do you want to Block this user?',
            buttons: [
                {
                    text: 'No',
                    role: 'no',
                    handler: () => {
                    }
                },
                {
                    text: 'Yes',
                    handler: () => {
                        if (window.navigator.onLine) {
                            let data = new FormData();
                            data.append('action', 'block_user');
                            data.append('user_id', this.user_id);
                            data.append('blocked_user', activity.user);

                            this.videosApi.blockUserSuggestion(data).subscribe((Data) => {
                                if (Data.success && Data.success != false) {
                                    let alert1 = this.alertCtrl.create({
                                        message: 'Suggestions from this user are blocked. Refresh the list now.',
                                        buttons: [
                                            {
                                                text: 'No',
                                                role: 'no',
                                                handler: () => {
                                                }
                                            },
                                            {
                                                text: 'Yes',
                                                handler: () => {
                                                    if (window.navigator.onLine) {
                                                        /* TO DO NEXT */
                                                        let loader = this.loadingCtrl.create({
                                                            content: "Loading..."
                                                        });
                                                        loader.present();
                                                        let that = this
                                                        if (window.navigator.onLine) {
                                                            that.searchText = ''
                                                            setTimeout(() => {
                                                                let data = new FormData();
                                                                if (that.posts == 'Everyone') {
                                                                    data.append('action', 'feed');
                                                                    data.append('mobile', 'true');
                                                                    data.append('group_id', this.groupId);
                                                                    data.append('offset', '0');
                                                                    data.append('user_id', this.user_id)

                                                                    that.feedsApi.everyoneFeeds(data).subscribe((Data) => {
                                                                        loader.dismiss()
                                                                        if (Data != null) {
                                                                            Data = Data.slice(1);
                                                                            let allData = [];
                                                                            let idGroup = [];
                                                                            Data.forEach(function (val) {
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
                                                                                newData.genius_points = FSHelper.numberWithCommas(val.genius_points)
                                                                                newData.activity_id = val.activity_id
                                                                                newData.video_type = val.video_type
                                                                                newData.spotify_id = val.spotify_id
                                                                                newData.spotify_href = val.spotify_href
                                                                                newData.spotify_preview = val.spotify_preview
                                                                                newData.spotify_uri = val.spotify_uri
                                                                                allData.push(newData)
                                                                                idGroup.push(newData.id)
                                                                            })
                                                                            that.everyone_data = []
                                                                            that.everyone_data = allData
                                                                            that.data_id_array = []
                                                                            that.data_id_array = idGroup
                                                                        } else {
                                                                            that.everyone_data = []
                                                                            that.data_id_array = []
                                                                        }
                                                                    }, (error) => {
                                                                        console.error(error)
                                                                    })
                                                                } else if (that.posts == 'Friends') {
                                                                    data.append('action', 'feed');
                                                                    data.append('mobile', 'true');
                                                                    data.append('group_id', this.groupId);
                                                                    data.append('r', 'friends');
                                                                    data.append('user_id', this.user_id)
                                                                    data.append('offset', '0');

                                                                    that.feedsApi.friendFeeds(data).subscribe((Data) => {
                                                                        loader.dismiss()
                                                                        if (Data != null) {
                                                                            Data = Data.slice(1);
                                                                            let allData = [];
                                                                            let idGroup = [];
                                                                            Data.forEach(function (val) {
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
                                                                                newData.genius_points = FSHelper.numberWithCommas(val.genius_points)
                                                                                newData.activity_id = val.activity_id
                                                                                newData.video_type = val.video_type
                                                                                newData.spotify_id = val.spotify_id
                                                                                newData.spotify_href = val.spotify_href
                                                                                newData.spotify_preview = val.spotify_preview
                                                                                newData.spotify_uri = val.spotify_uri
                                                                                allData.push(newData)
                                                                                idGroup.push(newData.id)
                                                                            })
                                                                            that.friend_data = []
                                                                            that.friend_data = allData
                                                                            that.data_id_array = []
                                                                            that.data_id_array = idGroup
                                                                        } else {
                                                                            that.friend_data = []
                                                                            that.data_id_array = []
                                                                        }
                                                                    }, (error) => {
                                                                        console.error(error)
                                                                    })
                                                                } else {
                                                                    data.append('action', 'feed');
                                                                    data.append('mobile', 'true');
                                                                    data.append('group_id', this.groupId);
                                                                    data.append('r', 'me');
                                                                    data.append('user_id', this.user_id)
                                                                    data.append('offset', '0');

                                                                    that.feedsApi.meFeeds(data).subscribe((Data) => {
                                                                        loader.dismiss()
                                                                        if (Data != null) {
                                                                            Data = Data.slice(1);
                                                                            let allData = [];
                                                                            let idGroup = [];
                                                                            Data.forEach(function (val) {
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
                                                                                allData.push(newData)
                                                                                idGroup.push(newData.id)
                                                                            })
                                                                            that.me_data = []
                                                                            that.me_data = allData
                                                                            that.data_id_array = []
                                                                            that.data_id_array = idGroup
                                                                        } else {
                                                                            that.me_data = []
                                                                            that.data_id_array = []
                                                                        }
                                                                    }, (error) => {
                                                                        console.error(error)
                                                                    })
                                                                }
                                                            }, 2000);
                                                        } else {
                                                            this.toastCtrl.create(this.networkErrorObj).present()
                                                        }
                                                    } else {
                                                        this.toastCtrl.create(this.networkErrorObj).present()
                                                    }
                                                }
                                            }
                                        ]
                                    });
                                    alert1.present();
                                } else {
                                    this.toastCtrl.create({
                                        message: 'Something went wrong',
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
        alert.present();
    }

    playall(key, value) {
        let that = this
        if (key != null) {
            this.createNewIframe(key)
        } else {
            localStorage.setItem('shuffle', 'true');
            that.suffleExit = true;
            that.searchText = ''
            that.stopAllVideo()
            that.stopMusic()
            $(".scroll-content").scrollTop(0)
            this.createNewIframe(0)
        }

    }

    /* searchplay list*/
    searchplaylistopup() {
        /*
        this.playpause(this.suffleKey,this.suffleValue);
        */

        localStorage.removeItem('rendom');
        this.removeAllVideoIframe()
        this.stopMusic()
        localStorage.removeItem('shuffle');
        this.suffleExit = false;
        this.destroyAllVideo()
        this.navCtrl.push(SearchPlaylistPage)
    }

    /* follow group functionality */
    followGroup(groupId) {
        let alert = this.alertCtrl.create({
            title: 'Confirm Follow',
            message: 'Do you want to Follow this group?',
            buttons: [
                {
                    text: 'No',
                    role: 'no',
                    handler: () => {
                    }
                },
                {
                    text: 'Yes',
                    handler: () => {
                        if (window.navigator.onLine) {
                            let data = new FormData();
                            data.append('action', 'follow_group');
                            data.append('user_id', this.user_id);
                            data.append('group_id', groupId);
                            this.videosApi.followGroup(data).subscribe((Data) => {
                                if (Data.success == 'true') {
                                    this.followThisGroup = true;
                                    this.toastCtrl.create({
                                        message: 'Group Follow',
                                        duration: FSHelper.toastMessageTime(2)
                                    }).present();
                                } else {
                                    this.toastCtrl.create({
                                        message: 'Something went wrong',
                                        duration: FSHelper.toastMessageTime(2)
                                    }).present()
                                }

                            }, (error) => {
                                this.toastCtrl.create({
                                    message: 'Something went wrong',
                                    duration: FSHelper.toastMessageTime(2)
                                }).present()
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

    /* Unfollow group functionality */
    unFollowGroup(groupId) {
        let alert = this.alertCtrl.create({
            title: 'Confirm Unfollow',
            message: 'Do you want to Unfollow this group?',
            buttons: [
                {
                    text: 'No',
                    role: 'no',
                    handler: () => {
                    }
                },
                {
                    text: 'Yes',
                    handler: () => {
                        if (window.navigator.onLine) {
                            let data = new FormData();
                            data.append('action', 'unfollow_group');
                            data.append('user_id', this.user_id);
                            data.append('group_id', groupId);
                            this.videosApi.followGroup(data).subscribe((Data) => {
                                if (Data.success == 'true') {
                                    this.followThisGroup = false;
                                    this.toastCtrl.create({
                                        message: 'Group Unfollow',
                                        duration: FSHelper.toastMessageTime(2)
                                    }).present();
                                } else {
                                    this.toastCtrl.create({
                                        message: 'Something went wrong',
                                        duration: FSHelper.toastMessageTime(2)
                                    }).present()
                                }

                            }, (error) => {
                                this.toastCtrl.create({
                                    message: 'Something went wrong',
                                    duration: FSHelper.toastMessageTime(2)
                                }).present()
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

    /* skip to next */
    skiptoNext(key) {
        let that = this
        if (localStorage.getItem('rendom') == 'true') {
            let randomnumber = that.data_id_array[Math.floor(Math.random()*that.data_id_array.length)];

            for (var key1 in that.data_id_array) {
                if(that.data_id_array[key1] == randomnumber) {
                    this.keyForRendom  = key1;
                    this.keyForRendom = this.keyForRendom++;
                }
            }
            if (that.posts == 'Everyone') {
                if ($("#everyone_card" + (this.keyForRendom)).offset().top) {
                    $(".scroll-content").animate({scrollTop: $("#everyone_card" + (this.keyForRendom)).offset().top - ($("#everyone_card0").offset().top)}, 1000, () => {
                        that.loadYoutubMoreFrameVideo(this.keyForRendom)
                    });
                }
            } else if (that.posts == 'Friends') {
                if ($("#friend_card" + (this.keyForRendom)).offset().top) {
                    $(".scroll-content").animate({scrollTop: $("#friend_card" + (this.keyForRendom)).offset().top - ($("#friend_card0").offset().top)}, 1000, () => {
                        that.loadYoutubMoreFrameVideo(this.keyForRendom)
                    });
                }
            } else {
                if ($("#me_card" + (this.keyForRendom)).offset().top) {
                    $(".scroll-content").animate({scrollTop: $("#me_card" + (this.keyForRendom)).offset().top - ($("#me_card0").offset().top)}, 1000, () => {
                        that.loadYoutubMoreFrameVideo(this.keyForRendom)
                    });
                }
            }
        } else {
            this.skip = true
            if (that.posts == "Everyone") {
                if (key < (that.everyone_data.length - 1)) {
                    $(".scroll-content").animate({scrollTop: $("#everyone_card" + (key + 1)).offset().top - ($("#everyone_card0").offset().top)}, 1000, () => {
                        that.loadYoutubMoreFrame(key + 1)
                    });
                }
            } else if (that.posts == "Friends") {
                if (key < (that.friend_data.length - 1)) {
                    $(".scroll-content").animate({scrollTop: $("#friend_card" + (key + 1)).offset().top - ($("#friend_card0").offset().top)}, 1000, () => {
                        that.loadYoutubMoreFrame(key + 1)
                    });
                }
            } else if (that.posts == "Me") {
                if (key < (that.me_data.length - 1)) {
                    $(".scroll-content").animate({scrollTop: $("#me_card" + (key + 1)).offset().top - ($("#me_card0").offset().top)}, 1000, () => {
                        that.loadYoutubMoreFrame(key + 1)
                    });
                }
            }
        }


    }

    /* pause the running shuffle */
    playpause(key, value) {

        let that = this
        if (key != null) {
            if (that.posts == 'Everyone') {
                $(".scroll-content").animate({scrollTop: ($("#everyone_card" + (key)).offset().top - ($("#everyone_card0").offset().top) + 2)}, 1000, () => {
                });
                value.video.pauseVideo()
            } else if (that.posts == 'Friends') {
                $(".scroll-content").animate({scrollTop: ($("#friend_card" + (key)).offset().top - ($("#friend_card0").offset().top) + 2)}, 1000, () => {
                });
                value.video.pauseVideo()
            } else {
                $(".scroll-content").animate({scrollTop: ($("#me_card" + (key)).offset().top - ($("#me_card0").offset().top) + 2)}, 1000, () => {
                });
                value.video.pauseVideo()
            }

        } else {
            localStorage.removeItem('shuffle');
            that.suffleExit = false;
            that.searchText = ''
            that.searchText = null
            /* stop the video */
            this.stopAllVideo()
        }
    }


    /* for append skip to next to */
    playallForSkip() {
        let that = this
        localStorage.setItem('shuffle', 'true');
        that.suffleExit = true;
        that.searchText = ''
    }

    playpauseForSkip() {

        let that = this
        localStorage.removeItem('shuffle');
        that.suffleExit = false;
        that.searchText = ''
        that.searchText = null
    }

    /*   sufflePlayRendom  */

    sufflePlayRendom() {
        let that = this
        localStorage.setItem('rendom', 'true')
        localStorage.setItem('shuffle', 'true');
        let randomnumber = that.data_id_array[Math.floor(Math.random()*that.data_id_array.length)];
        for (var key in that.data_id_array) {
            if(that.data_id_array[key] == randomnumber) {
                this.keyForRendom  = key;
                this.keyForRendom = this.keyForRendom++;
            }
        }

        if (that.posts == 'Everyone') {
            if ($("#everyone_card" + this.keyForRendom).offset().top) {
                $(".scroll-content").animate({scrollTop: $("#everyone_card" + (this.keyForRendom)).offset().top - ($("#everyone_card0").offset().top)}, 1000, () => {
                    that.loadYoutubMoreFrameVideo(this.keyForRendom)
                });
            }
        } else if (that.posts == 'Friends') {
            if ($("#friend_card" + (this.keyForRendom)).offset().top) {
                $(".scroll-content").animate({scrollTop: $("#friend_card" + (this.keyForRendom)).offset().top - ($("#friend_card0").offset().top)}, 1000, () => {
                    that.loadYoutubMoreFrameVideo(this.keyForRendom)
                });
            }
        } else {
            if ($("#me_card" + (this.keyForRendom)).offset().top) {
                $(".scroll-content").animate({scrollTop: $("#me_card" + (this.keyForRendom)).offset().top - ($("#me_card0").offset().top)}, 1000, () => {
                    that.loadYoutubMoreFrameVideo(this.keyForRendom)
                });
            }
        }


        that.suffleExit = true;
    }

    loadYoutubMoreFrameVideo(id) {
        let that = this
        that.lastPlaybackId = id
        if (that.posts == 'Everyone') {
            that.YouTubeIframeLoader.load((YT) => {
                that.everyone_data.forEach((value: any, key) => {
                    if (value.video_type != 2) {
                        if (id == key && value.video != undefined) {
                            this.suffleId = id
                            this.suffleValue = value
                            this.suffleKey = key
                            value.video.playVideo()
                        }
                        if (id == key && value.video == undefined) {
                            this.suffleId = id
                            this.suffleValue = value
                            this.suffleKey = key
                            value.isLoading = true
                            value.isPlaying = false
                            value.manuallyPaused = 0
                            value.video = new YT.Player('iframe' + key, {
                                height: '270',
                                videoId: value.youtube_id,
                                playerVars: {
                                    fs: 0,
                                    rel: 0,
                                    showinfo: 0
                                },
                                events: {
                                    'onReady': (event) => {
                                        $(".scroll-content").animate({scrollTop: ($("#everyone_card" + (key)).offset().top - ($("#everyone_card0").offset().top)) + 10}, 1000, () => {
                                        });
                                        $('#everyone_card' + key + ' iframe').contents().find('.ytp-watermark').hide();
                                        $('#everyone_card' + key).find('.videoWrapper').addClass('hidePlayButton');
                                        localStorage.setItem('shuffle', 'true');
                                        that.suffleExit = true;
                                        /**
                                         * @description This code for if any video are playing then pause before current video play
                                         */
                                        that.everyone_data.forEach((value1: any, key1) => {
                                            if (value1.video_type != 2) {
                                                if (!HomePage.isElementInViewport($("#iframe" + key1)) && key != key1 && value1.video != undefined) {
                                                    value1.video.pauseVideo()
                                                }
                                            }

                                        })
                                        event.target.playVideo()
                                        value.isLoading = false
                                        let data = new FormData();
                                        data.append('action', 'watched_activity');
                                        data.append('user_id', this.user_id)
                                        data.append('activity_id', value.activity_id);

                                        that.videosApi.videoWached(data).subscribe((Data) => {
                                        }, (error) => {
                                            console.error(error)
                                        })
                                    },
                                    'onStateChange': (event) => {

                                        if (event.data == 1) {

                                            localStorage.setItem('shuffle', 'true');
                                            that.suffleExit = true;
                                            $('#everyone_card' + key + ' iframe').contents().find('.ytp-watermark').hide();
                                            $('#everyone_card' + key).find('.videoWrapper').addClass('hidePlayButton');
                                        } else if (event.data == 2) {


                                            localStorage.removeItem('shuffle');
                                            that.suffleExit = false;
                                        }
                                        that.everyone_data.forEach((value1: any, key1) => {
                                            if (event.data == 1 && key != key1 && value1.video != undefined) {
                                                value1.video.pauseVideo()
                                            }
                                        })

                                        value.manuallyPaused = event.data == YT.PlayerState.PAUSED
                                        value.isPlaying = event.data == YT.PlayerState.PLAYING
                                        if (event.data == YT.PlayerState.ENDED) {
                                            if (key < (that.everyone_data.length - 1)) {

                                                let randomnumber = that.data_id_array[Math.floor(Math.random()*that.data_id_array.length)];

                                                for (var key1 in that.data_id_array) {
                                                    if(that.data_id_array[key1] == randomnumber) {
                                                        this.keyForRendom  = key1;
                                                        this.keyForRendom = this.keyForRendom++;
                                                    }
                                                }



                                                if ($("#everyone_card" + this.keyForRendom).offset().top) {
                                                    $(".scroll-content").animate({scrollTop: $("#everyone_card" + (this.keyForRendom)).offset().top - ($("#everyone_card0").offset().top)}, 1000, () => {
                                                        that.loadYoutubMoreFrameVideo(this.keyForRendom)
                                                    });
                                                }
                                            }
                                        }
                                    },
                                    'onError': (event) => {
                                        let data = new FormData();
                                        data.append('action', 'disable_mobile');
                                        data.append('id', value.activity_id);
                                        that.videosApi.disablevideo(data).subscribe((Data) => {
                                        }, (error) => {
                                            console.error(error)
                                        })


                                        if (key < (that.everyone_data.length - 1)) {
                                            let randomnumber = that.data_id_array[Math.floor(Math.random()*that.data_id_array.length)];

                                            for (var key1 in that.data_id_array) {
                                                if(that.data_id_array[key1] == randomnumber) {
                                                    this.keyForRendom  = key1;
                                                    this.keyForRendom = this.keyForRendom++;
                                                }
                                            }
                                            if ($("#everyone_card" + (this.keyForRendom)).offset().top) {
                                                $(".scroll-content").animate({scrollTop: $("#everyone_card" + (this.keyForRendom)).offset().top - ($("#everyone_card0").offset().top)}, 1000, () => {
                                                    that.loadYoutubMoreFrameVideo(this.keyForRendom)
                                                });
                                            }
                                        }
                                    }
                                }
                            })
                            return value
                        }
                    } else {

                        if (id == key && value.video == undefined) {
                            if (key < (that.everyone_data.length - 1)) {
                                $(".scroll-content").animate({scrollTop: $("#everyone_card" + (key + 1)).offset().top - ($("#everyone_card0").offset().top)}, 1000, () => {
                                    that.loadYoutubMoreFrameVideo(key + 1)
                                });
                            }
                        }
                    }
                })
            })
        } else if (that.posts == 'Friends') {
            that.YouTubeIframeLoader.load((YT) => {
                that.friend_data.forEach((value: any, key) => {
                    if (value.video_type != 2) {
                        if (id == key && value.video != undefined) {
                            this.suffleId = id
                            this.suffleValue = value
                            this.suffleKey = key
                            value.video.playVideo()
                        }
                        if (id == key && value.video == undefined) {
                            this.suffleId = id
                            this.suffleValue = value
                            this.suffleKey = key
                            value.isLoading = true
                            value.isPlaying = false
                            value.manuallyPaused = 0
                            value.video = new YT.Player('friend_iframe' + key, {
                                height: '270',
                                videoId: value.youtube_id,
                                playerVars: {
                                    fs: 0,
                                    rel: 0,
                                    showinfo: 0,
                                    enablejsapi: 1
                                },
                                events: {
                                    'onReady': (event) => {
                                        $(".scroll-content").animate({scrollTop: ($("#friend_card" + (key)).offset().top - ($("#friend_card0").offset().top)) + 10}, 1000, () => {
                                        });

                                        $('#friend_card' + key + ' iframe').contents().find('.ytp-watermark').hide();
                                        $('#friend_card' + key).find('.videoWrapper').addClass('hidePlayButton');
                                        localStorage.setItem('shuffle', 'true');
                                        that.suffleExit = true;
                                        /**
                                         * @description This code for if any video are playing then pause before current video play
                                         */
                                        that.friend_data.forEach((value1: any, key1) => {
                                            if (value1.video_type != 2) {
                                                if (!HomePage.isElementInViewport($("#friend_iframe" + key1)) && key != key1 && value1.video != undefined && event.data) {
                                                    value1.video.pauseVideo()
                                                }
                                            }
                                        })
                                        event.target.playVideo()
                                        value.isLoading = false
                                        let data = new FormData();
                                        data.append('action', 'watched_activity');
                                        data.append('user_id', this.user_id)
                                        data.append('activity_id', value.activity_id);

                                        that.videosApi.videoWached(data).subscribe((Data) => {
                                        }, (error) => {
                                            console.error(error)
                                        })
                                    },
                                    'onStateChange': (event) => {


                                        if (event.data == 1) {


                                            localStorage.setItem('shuffle', 'true');
                                            that.suffleExit = true;
                                            $('#friend_card' + key + ' iframe').contents().find('.ytp-watermark').hide();
                                            $('#friend_card' + key).find('.videoWrapper').addClass('hidePlayButton');
                                        } else if (event.data == 2) {
                                            localStorage.removeItem('shuffle');
                                            that.suffleExit = false;
                                        }
                                        that.friend_data.forEach((value1: any, key1) => {
                                            if (event.data == 1 && key != key1 && value1.video != undefined) {
                                                value1.video.pauseVideo()
                                            }
                                        })
                                        value.manuallyPaused = event.data == YT.PlayerState.PAUSED
                                        value.isPlaying = event.data == YT.PlayerState.PLAYING
                                        if (event.data == YT.PlayerState.ENDED) {
                                            if (key < (that.friend_data.length - 1)) {
                                                let randomnumber = that.data_id_array[Math.floor(Math.random()*that.data_id_array.length)];

                                                for (var key1 in that.data_id_array) {
                                                    if(that.data_id_array[key1] == randomnumber) {
                                                        this.keyForRendom  = key1;
                                                        this.keyForRendom = this.keyForRendom++;
                                                    }
                                                }

                                                if ($("#friend_card" + (this.keyForRendom)).offset().top) {
                                                    $(".scroll-content").animate({scrollTop: $("#friend_card" + (this.keyForRendom)).offset().top - ($("#friend_card0").offset().top)}, 1000, () => {
                                                        that.loadYoutubMoreFrameVideo(this.keyForRendom)
                                                    });
                                                }
                                            }
                                        }
                                    },
                                    'onError': (event) => {
                                        let data = new FormData();
                                        data.append('action', 'disable_mobile');
                                        data.append('id', value.activity_id);
                                        that.videosApi.disablevideo(data).subscribe((Data) => {
                                        }, (error) => {
                                            console.error(error)
                                        })

                                        if (key < (that.friend_data.length - 1)) {
                                            let randomnumber = that.data_id_array[Math.floor(Math.random()*that.data_id_array.length)];

                                            for (var key1 in that.data_id_array) {
                                                if(that.data_id_array[key1] == randomnumber) {
                                                    this.keyForRendom  = key1;
                                                    this.keyForRendom = this.keyForRendom++;
                                                }
                                            }
                                            if ($("#friend_card" + (this.keyForRendom)).offset().top) {
                                                $(".scroll-content").animate({scrollTop: $("#friend_card" + (this.keyForRendom)).offset().top - ($("#friend_card0").offset().top)}, 1000, () => {
                                                    that.loadYoutubMoreFrameVideo(this.keyForRendom)
                                                });
                                            }
                                        }
                                    }
                                }
                            })
                            return value
                        }
                    } else {
                        if (id == key && value.video == undefined) {
                            if (key < (that.friend_data.length - 1)) {
                                $(".scroll-content").animate({scrollTop: $("#friend_card" + (key + 1)).offset().top - ($("#friend_card0").offset().top)}, 1000, () => {
                                    that.loadYoutubMoreFrameVideo(key + 1)
                                });
                            }
                        }
                    }
                })
            })
        } else if (that.posts == 'Me') {
            that.YouTubeIframeLoader.load((YT) => {
                that.me_data.forEach((value: any, key) => {
                    if (value.video_type != 2) {
                        if (id == key && value.video != undefined) {
                            this.suffleId = id
                            this.suffleValue = value
                            this.suffleKey = key
                            value.video.playVideo()
                        }
                        if (id == key && value.video == undefined) {
                            this.suffleId = id
                            this.suffleValue = value
                            this.suffleKey = key
                            value.isLoading = true
                            value.isPlaying = false
                            value.manuallyPaused = 0
                            value.video = new YT.Player('me_iframe' + key, {
                                height: '270',
                                videoId: value.youtube_id,
                                playerVars: {
                                    fs: 0,
                                    rel: 0,
                                    showinfo: 0
                                },
                                events: {
                                    'onReady': (event) => {

                                        $('#me_card' + key + ' iframe').contents().find('.ytp-watermark').hide();
                                        $('#me_card' + key).find('.videoWrapper').addClass('hidePlayButton');
                                        $(".scroll-content").animate({scrollTop: ($("#me_card" + (key)).offset().top - ($("#me_card0").offset().top)) + 10}, 1000, () => {
                                        });

                                        localStorage.setItem('shuffle', 'true');
                                        that.suffleExit = true;
                                        /**
                                         * @description This code for if any video are playing then pause before current video play
                                         */
                                        that.me_data.forEach((value1: any, key1) => {
                                            if (value1.video_type != 2) {
                                                if (!HomePage.isElementInViewport($("#me_iframe" + key1)) && key != key1 && value1.video != undefined) {
                                                    value1.video.stopVideo()
                                                }
                                            }
                                        })
                                        event.target.playVideo()
                                        value.isLoading = false
                                        let data = new FormData();
                                        data.append('action', 'watched_activity');
                                        data.append('user_id', this.user_id)
                                        data.append('activity_id', value.activity_id);

                                        that.videosApi.videoWached(data).subscribe((Data) => {
                                        }, (error) => {
                                            console.error(error)
                                        })
                                    },
                                    'onStateChange': (event) => {

                                        if (event.data == 1) {

                                            localStorage.setItem('shuffle', 'true');
                                            that.suffleExit = true;
                                            $('#me_card' + key + ' iframe').contents().find('.ytp-watermark').hide();
                                            $('#me_card' + key).find('.videoWrapper').addClass('hidePlayButton');
                                        } else if (event.data == 2) {


                                            localStorage.removeItem('shuffle');
                                            that.suffleExit = false;
                                        }
                                        that.me_data.forEach((value1: any, key1) => {
                                            if (event.data == 1 && key != key1 && value1.video != undefined) {
                                                value1.video.pauseVideo()
                                            }
                                        })
                                        value.manuallyPaused = event.data == YT.PlayerState.PAUSED
                                        value.isPlaying = event.data == YT.PlayerState.PLAYING
                                        if (event.data == YT.PlayerState.ENDED) {
                                            if (key < (that.me_data.length - 1)) {
                                                let randomnumber = that.data_id_array[Math.floor(Math.random()*that.data_id_array.length)];

                                                for (var key1 in that.data_id_array) {
                                                    if(that.data_id_array[key1] == randomnumber) {
                                                        this.keyForRendom  = key1;
                                                        this.keyForRendom = this.keyForRendom++;
                                                    }
                                                }
                                                if ($("#me_card" + (this.keyForRendom)).offset().top) {
                                                    $(".scroll-content").animate({scrollTop: $("#me_card" + (this.keyForRendom)).offset().top - ($("#me_card0").offset().top)}, 1000, () => {
                                                        that.loadYoutubMoreFrameVideo(this.keyForRendom)
                                                    });
                                                }
                                            }
                                        }
                                    },
                                    'onError': (event) => {
                                        let data = new FormData();
                                        data.append('action', 'disable_mobile');
                                        data.append('id', value.activity_id);
                                        that.videosApi.disablevideo(data).subscribe((Data) => {
                                        }, (error) => {
                                            console.error(error)
                                        })
                                        if (key < (that.me_data.length - 1)) {
                                            let randomnumber = that.data_id_array[Math.floor(Math.random()*that.data_id_array.length)];

                                            for (var key1 in that.data_id_array) {
                                                if(that.data_id_array[key1] == randomnumber) {
                                                    this.keyForRendom  = key1;
                                                    this.keyForRendom = this.keyForRendom++;
                                                }
                                            }
                                            if ($("#everyone_card" + (this.keyForRendom)).offset().top) {
                                                $(".scroll-content").animate({scrollTop: $("#me_card" + (this.keyForRendom)).offset().top - ($("#me_card0").offset().top)}, 1000, () => {
                                                    that.loadYoutubMoreFrameVideo(this.keyForRendom)
                                                });
                                            }
                                        }
                                    }
                                }
                            })
                            return value
                        }
                    } else {
                        if (id == key && value.video == undefined) {
                            if (key < (that.me_data.length - 1)) {
                                $(".scroll-content").animate({scrollTop: $("#me_card" + (key + 1)).offset().top - ($("#me_card0").offset().top)}, 1000, () => {
                                    that.loadYoutubMoreFrameVideo(key + 1)
                                });
                            }
                        }
                    }
                })
            })
        }
    }

}
