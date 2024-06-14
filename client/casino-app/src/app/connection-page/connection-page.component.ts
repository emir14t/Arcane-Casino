import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import * as CryptoJS from 'crypto-js';
import { HttpServiceService } from '../http-service.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-connection-page',
  templateUrl: './connection-page.component.html',
  styleUrls: ['./connection-page.component.scss']
})

export class ConnectionPageComponent {
  // sign-in
  username: string = '';
  password: string = '';
  // sign-up
  email: string = '';
  newPassword: string = '';
  newUsername: string = '';

  constructor(
    private readonly authService: AuthService,
    private readonly communicationService: HttpServiceService,
    private router: Router
  ) {}

  private encryptPassword(password: string): string {
    return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
  }

  async connect() {
    let pw_hash: string = this.encryptPassword(this.password);
    let response: boolean = false;
    try {
      response = await this.authService.login(this.username, pw_hash);
    }
    catch (e) {
      console.log(e);
    }
    const username = this.username;
    this.password = '';
    this.username = '';
    if (response) {
      this.router.navigate(['/game'], {queryParams: {key: username}})
    }
  }

  async signUp() {
    let pw_hash: string = this.encryptPassword(this.newPassword)
    let response: String = ''
      const user = {
        'username': this.newUsername,
        'password_hash': pw_hash,
        'email': this.email
      };
      try {
        response = await new Promise<String>((resolve) => {
          this.communicationService.post('sign-up', user).subscribe({
            next: (res) => {
                let response: String = res.body || '';
                resolve(response);
            },
            error: () => {
                resolve('');
            },
          });
        });
      } catch (e) {
        console.log(e);
      }

    console.log(this.newUsername, this.newPassword, pw_hash, this.email, response);
    this.newPassword = '';
    this.newUsername = '';
    this.email = '';
  }
}
