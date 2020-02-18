import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { AppAdminComponent } from './app.admin';



const routes: Routes = [
  { path: 'home', component: AppComponent },
  { path: 'admin', component: AppAdminComponent },
  { path: '',   component: AppComponent},
  {
    path: '',
    redirectTo: '',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
