import CAHPlayer from "./Player"
import Card from "./Card"

class Submission {

    cards: Card[] | null
    player: CAHPlayer

    constructor(player: CAHPlayer, cards?: Card[]) {
        this.player = player
        this.cards = cards || null
    }
}

export = Submission