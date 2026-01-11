import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent  implements OnInit {
@Output() selectRole = new EventEmitter<string>();
  constructor() { }

  ngOnInit() {}

}
