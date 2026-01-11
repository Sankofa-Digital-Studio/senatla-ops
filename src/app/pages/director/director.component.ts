import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { StaffDataService } from 'src/app/core/services/staff-data.service';

@Component({
  selector: 'app-director',
  templateUrl: './director.component.html',
  styleUrls: ['./director.component.scss'],
    imports: [CommonModule, DecimalPipe],
})
export class DirectorComponent  implements OnInit {
service = inject(StaffDataService);
  constructor() { }

  ngOnInit() {}

}
