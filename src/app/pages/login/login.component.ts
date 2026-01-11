import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule, FormsModule],
})
export class LoginComponent {
  @Output() loginSuccess = new EventEmitter<string>();
  username = '';
  password = '';
  errorMsg = '';
  handleLogin() {
    const user = this.username.toLowerCase().trim();
    if (user.includes('site')) this.loginSuccess.emit('site');
    else if (user.includes('admin') || user.includes('office'))
      this.loginSuccess.emit('office');
    else if (user.includes('director')) this.loginSuccess.emit('director');
    else this.errorMsg = 'Invalid credentials.';
  }
}
