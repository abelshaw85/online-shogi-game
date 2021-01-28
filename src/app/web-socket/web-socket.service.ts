import * as Stomp from 'stompjs';
import * as SockJS from 'sockjs-client';
import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { AuthenticationService } from '../auth/auth.service';
import { environment } from 'src/environments/environment';

@Injectable()
export class WebSocketService {

  webSocketEndPoint: string = environment.serverUrl + "/ws";
  topic: string = "/topic/greetings";
  topicTest: string = "/topic/test";
  stompClient: any;
  dataReceived = new Subject<string>();
  turnReceived = new Subject<any>();
  connectedSubject = new Subject<boolean>();
  connected: boolean = false;

  constructor(private authenticationService: AuthenticationService) {}

  _connect() {
    console.log("Initialize WebSocket Connection");
    if (this.authenticationService.isUserLoggedIn()) {
      let ws = new SockJS(this.webSocketEndPoint);
      this.stompClient = Stomp.over(ws);
      const _this = this;
      _this.stompClient.connect({
        'Authorization': "Bearer " + this.authenticationService.getLoggedInUserToken(),
        'username': this.authenticationService.getLoggedInUserName()
      }, function (frame) {
          _this.stompClient.subscribe(_this.topicTest, function (data) {
              _this.onDataReceived(data);
          });
      }, this.errorCallBack);
    } else {
      console.log("Unable to connect: must be logged in.");
    }
  }

  test() {
    this.stompClient.send("/app/test", {}, JSON.stringify("Hello"));
  }

  _disconnect() {
    if (this.stompClient !== null) {
      this.stompClient.disconnect();
      this.stompClient = null;
    }
    this.connected = false;
    this.emitConnected();
  }

  isConnected() {
    return !(this.stompClient == null);
  }

  emitConnected() {
    this.connectedSubject.next(this.connected);
  }

  // on error, schedule a reconnection attempt
  errorCallBack(error) {
    console.log("errorCallBack -> " + error);
    var self = this;
    setTimeout(() => {
        this._connect();
    }, 5000);
  }

  _sendMove() {
    //using single character aliases to reduce JSON size
    let data = {
      gameId: 0,
      actions: [
        {
          type: "Move",
          from: {
            row: 1,
            col: 1
          },
          to: {
            row: 1,
            col: 4
          }
        },
        {
          type: "Take",
          takenPiece: "Pawn",
          takingColour: "White"
        }
      ]
    };
    this.stompClient.send("/app/move", {}, JSON.stringify(data));
  }

  onDataReceived(data) {
    let body = JSON.parse(data.body);

    if (body['type'] == "TurnEmit") {
      let turnData = body['data'];
      this.turnReceived.next(turnData);
    }
    // other websocket data types go here
  }
}