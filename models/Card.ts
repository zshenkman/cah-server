import CardPack from "./CardPack"
const BasePack = new CardPack('Cards Against Humanity')

class Card {
    pack: CardPack
    text: string
    type: string

    constructor(text: string, type?: string) {
        this.pack = BasePack
        this.text = text
        this.type = type || 'white'
    }
}

export = Card