import { Component } from '@angular/core';
import {NavController, Slides} from 'ionic-angular';
import {LoginPage} from "../login/login";

@Component({
  selector: 'page-intro',
  templateUrl: 'intro.html'
})
export class IntroPage {
	showSkip = true;
	sliderOptions: any;

  constructor(public navCtrl: NavController) {

    this.sliderOptions = {
      pager: true
    };

  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad IntroPage');
  }

	onSlideChangeStart(slider: Slides) {
		this.showSkip = !slider.isEnd();
	}

  goToHome(){
    this.navCtrl.setRoot(LoginPage);
  }

}
