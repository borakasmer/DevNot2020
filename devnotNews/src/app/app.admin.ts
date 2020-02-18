import { Component, OnInit } from '@angular/core';
import { NewsService } from 'src/Service/newsService';
import { News } from 'src/Models/news';
import { Router, NavigationExtras } from '@angular/router';

@Component({
  selector: 'app-admin',
  templateUrl: './app.admin.html',
  styleUrls: ['./app.admin.scss']
})
export class AppAdminComponent implements OnInit {
  title = 'Devnot News Admin';
  dataNews: News = new News();
  constructor(public service: NewsService,private router: Router) { }
  ngOnInit(): void {
    this.getNews();
  }

  public getNews() {
    return this.service.getNewsById(1).subscribe((data: any) => {
      //this.dataNews = data.length > 0 ? data[0] : this.dataNews;
      this.dataNews = data;
      console.log("Data:" + JSON.stringify(this.dataNews));
    });
  }

  public save() {
    console.log(JSON.stringify(this.dataNews));
    this.service.updateNews(this.dataNews).subscribe((data: any) => {
      //debugger;
      if (data.status == "succesfully update") {
        let navigationExtras: NavigationExtras = {queryParams: this.dataNews
        };
        this.router.navigate([''],navigationExtras //pass updatedData here
        );
      }
     });
  }
}
