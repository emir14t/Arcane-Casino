import { Injectable } from '@angular/core';
import { HttpServiceService } from './http-service.service';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private readonly authToken: string = 'arcane';

  constructor(
      private readonly communicationService: HttpServiceService ,
      private readonly cookieManager: CookieService,
  ) {}

  async isLoggedIn(username: string): Promise<boolean> {
      const path = 'ping';
      return this.getServerMSG(path, {'username': username});
  }

  async login(username: string, password: string): Promise<boolean> {
      const message = {
        'username': username,
        'password_hash': password
      }
      const path = 'connect';
      const promise = await this.postServerAndGetResponse(message, path);
      if (JSON.parse(promise.toString()).id) {
        this.cookieManager.set(this.authToken, JSON.parse(promise.toString()).id);
        return new Promise<boolean>((resolve) => {
          resolve(true);
        });
      }
      return new Promise<boolean>((resolve) => {
        resolve(false);
      });
  }

  private async postServerAndGetResponse(message: Object, path: string): Promise<String> {
    return new Promise<String>((resolve) => {
        this.communicationService.post(path, message).subscribe({
            next: (res) => {
                let response: String = res.body || ''
                resolve(response);
            },
            error: () => {
                resolve('');
            },
        });
    });
  }

  private async getServerMSG(path: string, body: Object): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
        this.communicationService.postWithAuth(path, body).subscribe({
            next: (res) => {
                resolve(!!res);
            },
            error: () => {
                resolve(false);
            },
        });
    });
  }
}
