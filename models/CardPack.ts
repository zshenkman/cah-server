import Card from "./Card"

class CardPack {
    author: null
    cards: Card[]
    dateCreated: Date
    description: string
    featured: boolean
    gamesCounter: number
    name: string
    price: number
    published: boolean

    constructor(name: string) {
        this.author = null
        this.cards = []
        this.dateCreated = new Date()
        this.description = ""
        this.featured = false
        this.gamesCounter = 0
        this.name = name
        this.price = 0
        this.published = false
    }
}

export = CardPack