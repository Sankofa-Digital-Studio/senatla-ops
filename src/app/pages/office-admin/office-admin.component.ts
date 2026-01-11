import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Employee } from 'src/app/core/models/app.models';
import { StaffDataService } from 'src/app/core/services/staff-data.service';

@Component({
  selector: 'app-office-admin',
  templateUrl: './office-admin.component.html',
  styleUrls: ['./office-admin.component.scss'],
   imports: [CommonModule, DatePipe],
})
export class OfficeAdminComponent  implements OnInit {
 service = inject(StaffDataService);
  today = new Date();
  getTodayLog(emp: Employee) { return emp.logs[this.today.toISOString().split('T')[0]] || {}; } 
 constructor() { }

  ngOnInit() {}

}
