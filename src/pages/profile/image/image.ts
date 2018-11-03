import {Component} from "@angular/core";
import {NavController, NavParams, ViewController} from "ionic-angular";
import {FeedsService} from "../../../app/api/services/feeds.service";
import {FriendSongs} from "../../../app/app.component";
@Component({
    selector: 'page-image',
    templateUrl: 'image.html',
    providers: [FeedsService]
})
export class ProfileImagePage {
    private profile: any = [];
    public user_data: any = FriendSongs.userData

    constructor(public navCtrl: NavController, public viewCtrl: ViewController, private feedsApi: FeedsService, public navParams: NavParams ) {
        let u_id = this.navParams.get("user_id")
        let data = new FormData();
        this.profile.loading = true
        data.append('action', 'profile');
        data.append('user_id', this.user_data.id);
        data.append('profile_id', u_id);
        this.feedsApi.profileApi(data).subscribe((val) => {
            this.profile.name = val.name
            this.profile.avatar = val.avatar
            this.profile.loading = false

        }, (error) => {
            console.error(error)
        })
    }

    closeCommntsModel() {
        this.viewCtrl.dismiss()
    }
}