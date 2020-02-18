import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { News } from 'src/Models/news';
import { Observable, throwError } from 'rxjs';
import { retry, catchError, map } from 'rxjs/operators';
import { Socket } from 'ngx-socket-io';

@Injectable({ providedIn: 'root' })
export class NewsService {
    constructor(private httpClient: HttpClient, private socket: Socket) { }

    //SocketIO
    updatedNews = this.socket.fromEvent<News>('updatedNews');

    baseUrl: string = "http://localhost:1923/news/";
    public getNewsById(newId: number): Observable<News> {
        return this.httpClient.get<News>(this.baseUrl + newId)
            .pipe(
                retry(1),
                catchError(this.errorHandel)
            )
    }

    errorHandel(error) {
        let errorMessage = '';
        if (error.error instanceof ErrorEvent) {
            // Get client-side error
            errorMessage = error.error.message;
        } else {
            // Get server-side error
            errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
        }
        console.log(errorMessage);
        return throwError(errorMessage);
    }

    updateUrl: string = "http://localhost:1923/updateNews";
    public updateNews(data: News): Observable<any> {
        let httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
            }),
            observe: 'response' as 'body',
        }
        return this.httpClient.post<any>(this.updateUrl, JSON.stringify(data), httpOptions)
            .pipe(
                map(response => {
                    return response.body;
                }),
                retry(1),
                catchError(this.errorHandel)
            )
    }

}