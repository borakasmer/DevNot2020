import { Component, AfterViewInit } from '@angular/core';
import { NewsService } from 'src/Service/newsService';
import { News } from 'src/Models/news';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-component',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  title = 'devnotNews';
  dataNews: News = new News();
  constructor(public service: NewsService, private activatedRoute: ActivatedRoute) { }

  ngAfterViewInit() {
    this.service.updatedNews.subscribe((news: News) => {
      //      debugger;
      this.dataNews = news;
      //alert(news.Title + " - " + news.CreatedDate);
    });

    this.activatedRoute.queryParams.subscribe(params => {
      //Eğer Admin sayfadan gelinmiş ise kayıt Güncellenir!
      if (params._id != null) {
        let data: News = <News>params;
        this.dataNews = data;
      }
      else {
        this.getNews();
      }
    });
  }

  public getNews() {
    return this.service.getNewsById(1).subscribe((data: any) => {  
      //this.dataNews = data.length > 0 ? data[0] : this.dataNews;
      this.dataNews = data;
      console.log("Data:" + JSON.stringify(this.dataNews));
    });
  }
}
