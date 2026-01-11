import { Component, signal } from '@angular/core';
import { LoginComponent } from './pages/login/login.component';
import { CommonModule } from '@angular/common';
import { TimeControlsComponent } from './components/time-controls.component';
import { DirectorComponent } from './pages/director/director.component';
import { OfficeAdminComponent } from './pages/office-admin/office-admin.component';
import { SiteManagerComponent } from './pages/site-manager/site-manager.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
   imports: [
    CommonModule, 
    LoginComponent, 
    SiteManagerComponent, 
    OfficeAdminComponent, 
    DirectorComponent, 
    TimeControlsComponent
  ]
})
export class AppComponent {
   currentView = signal<string>('login');
  navigate(view: string) { this.currentView.set(view); }
  logout() { this.currentView.set('login'); }
}
