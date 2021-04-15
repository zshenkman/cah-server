import GameInstance, { Player } from "gamekitjs"
import { Socket } from "socket.io"
import CAHRoom from "./Room"
import Submission from "./Submission"
import Card from "./Card"

class CAHPlayer extends Player {

    cards: Card[]

    constructor(displayName?: string, roomCode?: string, socketID?: string) {
        super(displayName, roomCode, socketID)
        this.cards = []
    }

    makeSubmission(card: Card) {
        if (!this.roomCode) return
        const room = GameInstance.game.getRoom(this.roomCode) as CAHRoom
        const blackCard = room.currentBlackCard

        const isCardCzar = this.displayName === room.cardCzar.displayName
        if (isCardCzar) throw Error('Cannot make a submission as the Card Czar.')

        let currentSubmission = room.submissions.find(el => el.player.socketID === this.socketID)
        if (currentSubmission) {
            if (currentSubmission.cards.length !== blackCard.pick) {
                currentSubmission.cards.push(card)
            } else {
                currentSubmission.cards = [card]
            }
        } else {
            currentSubmission = new Submission(this, [card])
            room.submissions.push(currentSubmission)
        }

        return currentSubmission
    }

    drawNewCards(number: number) {
        if (!this.roomCode) return
        const room = GameInstance.game.getRoom(this.roomCode) as CAHRoom

        for (let i = 0; i < number; i++) {
            const randomIndex = Math.floor(Math.random() * room.whiteCards.length)
            const whiteCard = room.whiteCards[randomIndex]
            this.cards.push(whiteCard)
            room.whiteCards.splice(randomIndex, 1)
        }
    }

    removeFromDeck(cards: Card[]) {
        if (!this.roomCode) return
        const room = GameInstance.game.getRoom(this.roomCode) as CAHRoom
        
        for (let card of cards) {
            const index = this.cards.findIndex(el => el.text === card.text)
            if (index === -1) break
            this.cards.splice(index, 1)
            room.discardPile.push(card)
        }
    }
}

export = CAHPlayer