import Card from "./Card"

class BlackCard extends Card {
    draw: number
    pick: number

    constructor(text: string) {
        super(text, 'black')
        this.draw = 1
        this.pick = 1
    }
}

export = BlackCard