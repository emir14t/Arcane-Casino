import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';


import { AuthService } from './auth.service';
import { HttpServiceService } from './http-service.service';

import { ConnectionPageComponent } from './connection-page/connection-page.component';
import { GamePageComponent } from './game-page/game-page.component';
import { AppComponent } from './app/app.component';

@NgModule({
  declarations: [
    ConnectionPageComponent,
    GamePageComponent,
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [
    AuthService,
    HttpServiceService,
    CookieService,
    AppRoutingModule

  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
