import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { NewsService } from 'src/Service/newsService';
import { HttpClientModule } from '@angular/common/http';
import { AppRouteComponent } from './app.route';
import { AppAdminComponent } from './app.admin';

import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
 const config: SocketIoConfig = { url: 'http://192.168.1.168:1453', options: {} };

@NgModule({
  declarations: [
    AppComponent,
    AppRouteComponent,
    AppAdminComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SocketIoModule.forRoot(config),
    FormsModule,
    HttpClientModule
  ],
  providers: [NewsService],
  bootstrap: [AppRouteComponent]
})
export class AppModule { }
