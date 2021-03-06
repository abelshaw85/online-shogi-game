import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit } from '@angular/core';
import { AuthenticationService } from 'src/app/auth/auth.service';
import { Game } from '../../game-models/game.model';
import { Piece } from '../../game-models/piece.model';
import { GameManagerService } from '../../services/game-manager.service';
import { RowColPosition } from '../../game-models/row-col-position.model';
import { Square } from '../../game-models/square.model';

@Component({
  selector: 'app-square',
  templateUrl: './square.component.html',
  styleUrls: ['./square.component.css']
})
export class SquareComponent implements OnInit {
  @Input() square: Square;
  @Input() game: Game;
  @Input() indexValue: number;

  constructor(private gameManager: GameManagerService,
    private authService: AuthenticationService) {
  }

  ngOnInit(): void {
  }

  drop(event: CdkDragDrop<string[]>) {
    let movingPiece: Piece = event["previousContainer"]["data"]["piece"];
    let from: RowColPosition = event.previousContainer.data["position"];
    let to: RowColPosition = event.container.data["position"]; //Could also just retrieve pos from local square variable!
    if (this.game.isPossibleMove(to)) {
      if (movingPiece.taken) {
        this.game.dropPiece(movingPiece, to);
      }
      else if (from != to) {
        this.game.movePiece(from, to);
      } else {
        // invalid move
        this.game.unhighlightPossibleMoves();
      }
    } else {
      // dropped in same pos
      this.game.unhighlightPossibleMoves();
    }
  }

  hasActivePiece(): boolean {
    return this.game.status != "Closed" &&
      this.game.gameLogic.isActivePiece(this.game, this.square.piece, this.square.position) &&
      this.authService.getLoggedInUserName() == this.gameManager.getPlayerByColour(this.game.gameId, this.square.piece.colour).username;
  }

  squareVisible(): boolean {
    return this.square.piece == null || (this.square.piece != null && !this.square.piece.taken);
  }
}
