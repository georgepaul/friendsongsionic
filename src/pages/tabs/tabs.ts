import {Component, ViewChild} from "@angular/core";
import {HomePage} from "../home/home";
import {ProfilePage} from "../profile/profile";
import {SearchPage} from "../search/search";
import {NavParams, Tabs, Events, NavController} from "ionic-angular";
import {PeoplePage} from "../people/people";


@Component({
    templateUrl: 'tabs.html'
})
export class TabsPage {

    @ViewChild('myTab') tabRef: Tabs
    static tabValue:any
    // this tells the tabs component which Pages
    // should be each tab's root Page
    tab1Root: any = HomePage;
    tab2Root: any = SearchPage;
    tab3Root: any = '';
    tab4Root: any = PeoplePage;
    tab5Root: any = ProfilePage;
    mySelectedIndex: number;

    constructor(navParams: NavParams, private navCtrl: NavController, private event: Events) {

        console.log("asas");
        this.mySelectedIndex = navParams.data.tabIndex || 0;

    }

    onTabSelected() {
        this.tabRef.select(1)
        this.event.publish('click_via_plus_sign')
    }

    loadTab(id) {
        TabsPage.tabValue = id
        let tab = this.tabRef.getByIndex(id)
        if (tab.length() > 1) {
            tab.popToRoot({
                animate: false
            })
        }
    }
}
