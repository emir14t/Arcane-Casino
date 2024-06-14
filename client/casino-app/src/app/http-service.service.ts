import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { CookieService } from 'ngx-cookie-service'
import { catchError } from 'rxjs/operators';



@Injectable({
  providedIn: 'root'
})

export class HttpServiceService {
  private readonly baseUrl: string = 'http://127.0.0.1:5000';
  private readonly authToken: string = 'arcane';

  constructor(
    private readonly http: HttpClient,
    private readonly cookieService: CookieService
  ) {}

  get(path: string, message: Object): Observable<String> {
    return this.http.get<String>(`${this.baseUrl}/${path}`, message).pipe(catchError(this.handleError<string>('get')));
  }

  post(path: string, message: Object): Observable<HttpResponse<String>> {
    return this.http.post(`${this.baseUrl}/${path}`, message, { observe: 'response', responseType: 'text'});
  }

  getWithAuth(path: string, query?: string): Observable<String> {
    const auth = this.cookieService.get(this.authToken)
    if (!auth) {
      return new Observable<String>()
    }
    let url: string = `${this.baseUrl}/${path}`
    if (query) {
      url = `${this.baseUrl}/${path}?${query}`
    }
    return this.http.get<String>(url, { headers: new HttpHeaders( {'X-Auth-Token': auth} ) });
  }

  postWithAuth(path: string, message: Object): Observable<HttpResponse<String>> {
    const auth = this.cookieService.get(this.authToken)
    if (!auth) {
      return new Observable<HttpResponse<String>>()
    }
    return this.http.post(`${this.baseUrl}/${path}`, message, { observe: 'response', responseType: 'text', headers: new HttpHeaders( {'X-Auth-Token': auth} ) });
  }

  private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
    return () => of(result as T);
}

}
