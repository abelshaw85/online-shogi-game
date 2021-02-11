
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthenticationService } from 'src/app/auth/auth.service';
import { WebSocketService } from 'src/app/web-socket/web-socket.service';
import { Game } from '../game-models/game.model';
import { AlertService } from '../services/alert.service';
import { GameManagerService } from '../services/game-manager.service';
import { faVolumeUp, faVolumeMute } from '@fortawesome/free-solid-svg-icons';
import { SoundService } from '../services/sound.service';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css']
})
export class BoardComponent implements OnInit, OnDestroy {
  game: Game;
  id: number;
  subscriptions: Subscription[] = [];
  connected: boolean;
  loading: boolean = true;
  loadingMessage: string = "Loading...";
  faAudioOn = faVolumeUp;
  faAudioOff = faVolumeMute;

  constructor(
    private http: HttpClient,
    private webSocketService: WebSocketService,
    private route: ActivatedRoute,
    private gameManager: GameManagerService,
    private authenticationService: AuthenticationService,
    private alertService: AlertService,
    public soundService: SoundService) {
  }

  test() {
    this.webSocketService.test();
  }

  ngOnInit(): void {
    this.game = new Game(this.http);
    this.id = +this.route.snapshot.params["id"];
    this.loadingMessage = "Fetching game...";
    this.subscriptions.push(this.gameManager.gameReadyWithId.subscribe(
      (gameId) => {
        if (gameId == this.id) {
          this.game = this.gameManager.getGame(this.id);
          this.loading = false;
          this.loadingMessage = "Connecting to server...";
          this.connect();
        }
      },
      (error) => {
        this.loading = false;
        this.alertService.openAlert("Load Game Error", "Unable to load the game with id " + this.id + ": " + error.message);
      }
    ));

    //if route changes, change id and request the game with the new id
    this.subscriptions.push(this.route.params.subscribe(routeParams => {
      this.id = routeParams.id;
      this.gameManager.requestGame(this.id);
    },
    (error) => {
      this.loading = false;
      this.alertService.openAlert("Unknown Error", "An error has occured");
    }));
  }

  connect() {
    //Check if WebSocket is already connected, and connect if not
    this.subscriptions.push(this.webSocketService.connectedSubject.subscribe(
      (isConnected) => {
        this.connected = isConnected;
        if (!this.connected) {
          this.webSocketService._connect();
        }
    },
    (error) => {
      this.loading = false;
      this.alertService.openAlert("Connection Error", "Unable to connect to the game server : " + error.message);
    }));
  }

  disconnect() {
    this.webSocketService._disconnect();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }

  gameText(): string {
    if (this.game.status == "Closed") {
      return "Game Over... \nWinner is [" + this.game.winnerName + "]!";
    }
    let activeColour = this.game.activeColour;
    let activePlayerName = this.game.getPlayerByColour(activeColour).name;
    if (activePlayerName == this.authenticationService.getLoggedInUserName()) {
      return "It is your turn";
    } else {
      return "Waiting for " + activePlayerName + " to make their turn";
    }
  }

  // openAlert(heading: string, text: string) {
  //   const dialogRef = this.dialog.open(CustomAlertDialogue, {
  //     width: '35%',
  //     data: {
  //       heading: heading,
  //       text: text
  //     }
  //   });
  // }
}
