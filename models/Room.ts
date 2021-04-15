import GameInstance, { Player, Room } from "gamekitjs"
import BlackCard from "./BlackCard"
import CAHGame from "./Game"
import CAHPlayer from "./Player"
import CAHSubmission from "./Submission"
import Card from "./Card"
const cards = require('./../cards')
const DECK_SIZE = 8

class CAHRoom extends Room {

    blackCards: BlackCard[]
    cardCzar: CAHPlayer | null
    currentBlackCard: BlackCard | null
    discardPile: Card[]
    gameWinner: CAHPlayer | null
    host: CAHPlayer
    isSelectionStageActive: boolean
    players: CAHPlayer[]
    roundWinner: CAHPlayer | null
    submissions: CAHSubmission[]
    whiteCards: Card[]

    constructor(minPlayers: number, maxPlayers: number, maxPoints: number) {
        super(minPlayers, maxPlayers, maxPoints)
        this.blackCards = []
        this.cardCzar = null
        this.currentBlackCard = null
        this.discardPile = []
        this.gameWinner = null
        this.isSelectionStageActive = false
        this.players = []
        this.roundWinner = null
        this.submissions = []
        this.whiteCards = []
    }

    addNewPlayer(displayName: string, socketID: string) {
        if (this.players.length === this.maxPlayers) throw Error("Room has reached max players.");
        const existingPlayer = this.players.find(player => player.displayName === displayName)
        if (existingPlayer) throw Error("Player already exists with that display name.")
        
        const player = new CAHPlayer(displayName, this.code, socketID);
        if (this.isInProgress) {
            player.drawNewCards(DECK_SIZE);
        }
        this.players.push(player);
        if (!this.host) {
            this.host = player;
        }
        return player;
    }

    removePlayer(player: CAHPlayer) {
        super.removePlayer(player)

        const submissionIndex = this.submissions.findIndex(el => el.player.socketID === player.socketID)
        if (submissionIndex > -1) {
            this.submissions.splice(submissionIndex, 1) 
        }

        if (this.submissions.length < this.players.length - 1) {
            this.beginSelectionStage()
        }
    }

    startGame(type?: string) {
        this.blackCards = cards.BLACK_CARDS.map((text: string) => new BlackCard(text))
        this.whiteCards = cards.WHITE_CARDS.map((text: string) => new Card(text))

        for (let player of this.players) {
            player.drawNewCards(DECK_SIZE)
        }

        super.startGame(type)
    }

    startNewRound() {
        if (!this.isInProgress) throw Error('Game is not in progress.')

        for (const submission of this.submissions) {
            const player = submission.player
            player.removeFromDeck(submission.cards)
        }

        this.submissions = []
        this.roundsCounter++;
        this.roundWinner = null
        this.isSelectionStageActive = false

        const oldCardCzar = this.cardCzar
        const blackCard = this.drawNewBlackCard()

        if (this.roundsCounter > 1) {
            for (const player of this.players) {
                if (player.socketID !== oldCardCzar.socketID) {
                    player.drawNewCards(blackCard.draw)
                }
            }
        }

        this.selectNewCardCzar()
    }

    selectNewCardCzar() {
        if (!this.isInProgress) throw Error('Game is not in progress.')

        if (this.cardCzar === null) {
            this.cardCzar = this.host
        } else {
            const cardCzarIndex = this.players.findIndex(el => el.displayName === this.cardCzar.displayName)
            let newCardCzarIndex = cardCzarIndex + 1
            if (newCardCzarIndex >= this.players.length) {
                newCardCzarIndex = 0
            }
            this.cardCzar = this.players[newCardCzarIndex]
        }
    }

    drawNewBlackCard() {
        if (!this.isInProgress) throw Error('Game is not in progress.')

        const randomIndex = Math.floor(Math.random() * this.blackCards.length)
        const blackCard = this.blackCards[randomIndex]
        this.blackCards.splice(randomIndex, 1)
        this.currentBlackCard = blackCard
        return blackCard
    }

    beginSelectionStage() {
        if (this.isSelectionStageActive) throw Error('Selection stage already active.')

        const playerSubmissions = this.getPlayerSubmissions()
        if (playerSubmissions.length < this.players.length - 1) {
            throw Error("Not all players have made a submission.")
        }
        this.isSelectionStageActive = true
    }

    getPlayerSubmissions() {
        if (!this.isInProgress) throw Error('Game is not in progress.')

        const shuffledSubmissions = shuffle(this.submissions)
        return shuffledSubmissions
    }

    selectWinningSubmission(submission: CAHSubmission) {
        if (this.roundWinner) throw Error('Round winner has already been selected.')
        const winningPlayerObject = submission.player
        const winningPlayer = this.players.find(el => el.socketID === winningPlayerObject.socketID)
        if (!winningPlayer) throw Error('No player with that submission found.')
        winningPlayer.addPoints(1)
        this.roundWinner = winningPlayer
    }

    endGame() {
        super.endGame()
        this.isSelectionStageActive = false
        if (this.gameWinner) {
            console.log(`${this.gameWinner.displayName} has won the game with ${this.gameWinner.points} points`)
        }
    }
}

function shuffle(array: Array<any>) {
    var shuffledArray = array;;
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
}
  

export = CAHRoom