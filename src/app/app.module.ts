import {NgModule, ErrorHandler} from "@angular/core";
import {IonicApp, IonicModule, IonicErrorHandler} from "ionic-angular";
import {Storage} from "@ionic/storage";
import {FriendSongs} from "./app.component";
import {ProfilePage} from "../pages/profile/profile";
import {ContactPage} from "../pages/contact/contact";
import {HomePage} from "../pages/home/home";
import {TabsPage} from "../pages/tabs/tabs";
import {IntroPage} from "../pages/intro/intro";
import {CommentsPage} from "../pages/comments/comments";
import {SearchPage} from "../pages/search/search";
import { SearchPlaylistPage } from "../pages/search-playlist/search-playlist";
import {SettingsPage} from "../pages/settings/settings";
import {LoginPage} from "../pages/login/login";
import {VideoDetailPage} from "../pages/video-detail/video-detail";
import {HttpModule} from "@angular/http";
import {SocialSharing} from "@ionic-native/social-sharing";
import {Sql} from "./providers/Sql";
import {KeyboardAttachDirective} from "./directive/keyboard-attach.directive";
import {ProfileImagePage} from "../pages/profile/image/image";
import {Facebook} from "@ionic-native/facebook";
import {PeoplePage} from "../pages/people/people";
import {InAppBrowser} from "@ionic-native/in-app-browser";
import {Network} from "@ionic-native/network";
import {SQLite} from "@ionic-native/sqlite";
import {MediaPlugin} from "@ionic-native/media";
import {EmailComposer} from "@ionic-native/email-composer";
import {LocalNotifications} from "@ionic-native/local-notifications";
import {OneSignal} from "@ionic-native/onesignal";
import {AuthService} from "./api/services/auth.service";

@NgModule({
    declarations: [
        FriendSongs,
        ProfilePage,
        ContactPage,
        HomePage,
        TabsPage,
        IntroPage,
        PeoplePage,
        CommentsPage,
        SearchPage,
        SettingsPage,
        LoginPage,
        ProfileImagePage,
        VideoDetailPage,
        KeyboardAttachDirective,
        SearchPlaylistPage
    ],
    imports: [
        IonicModule.forRoot(FriendSongs),
        HttpModule
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        FriendSongs,
        ProfilePage,
        ContactPage,
        HomePage,
        TabsPage,
        IntroPage,
        PeoplePage,
        CommentsPage,
        SearchPage,
        SettingsPage,
        LoginPage,
        VideoDetailPage,
        ProfileImagePage,
        SearchPlaylistPage
    ],
    providers: [{provide: ErrorHandler, useClass: IonicErrorHandler}, Storage, Sql, SocialSharing,Facebook,InAppBrowser,Network,SQLite,MediaPlugin,EmailComposer,LocalNotifications,OneSignal,AuthService]
})
export class AppModule {
}
