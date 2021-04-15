import { Game } from 'gamekitjs'
import CAHPlayer from './Player';
import CAHRoom from './Room';

class CAHGame extends Game {

  rooms: Map<string, CAHRoom>

  constructor() {
    super()
    this.rooms = new Map()
  }

  createRoom(minPlayers: number, maxPlayers: number, maxPoints: number) {
    const room = new CAHRoom(minPlayers, maxPlayers, maxPoints);
    this.rooms.set(room.code, room);
    return room;
  }

  getRoom(code: string) {
    const room = super.getRoom(code);
    return room as CAHRoom;
  }
}

export = CAHGame
