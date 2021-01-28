import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// https://www.javaguides.net/2019/04/spring-boot-spring-security-angular-example-tutorial.html

// https://bezkoder.com/angular-10-jwt-auth/

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  LOCALLY_STORED_USER_DATA = 'user';
  username = null;

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(private http: HttpClient) {
  }

  login(username: String, password: String) {
    // let token = this.createBasicAuthToken(username, password);
    return this.http.post(environment.serverUrl + "/auth/authenticate",
      {
        "username": username,
        "password": password
      }
      ).pipe(
        map((response) => {
          let user = {username: username, token: response['jwt']};
          this.username = username;
          // Store user in local storage until they log out
          localStorage.setItem(this.LOCALLY_STORED_USER_DATA, JSON.stringify(user));
        })
      );
  }

  register(userName: String, password: String, matchingPassword: String): Observable<any> {
    return this.http.post(environment.serverUrl + "/auth/registerUser", {
      userName: userName,
      password: password,
      matchingPassword: matchingPassword
    }, this.httpOptions);
  }

  logout() {
    localStorage.removeItem(this.LOCALLY_STORED_USER_DATA);
    this.username = null;
  }

  isUserLoggedIn() {
    return this.username !== null || localStorage.getItem(this.LOCALLY_STORED_USER_DATA) !== null;
  }

  getLoggedInUserName() {
    if (this.username !== null) {
      return this.username;
    }
    let user = JSON.parse(localStorage.getItem(this.LOCALLY_STORED_USER_DATA));
    if (user === null) {
      return '';
    }
    return user.username;
  }

  getLoggedInUserToken() {
    let user = JSON.parse(localStorage.getItem(this.LOCALLY_STORED_USER_DATA));
    return user === null ? null : user.token;
  }
}