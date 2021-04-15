const GameInstance = require('gamekitjs').default
const CAHGame = require('./build/Game')
const https = require('https')
const PORT = process.env.PORT || 8000
const MIN_PLAYERS = 3
const MAX_PLAYERS = 16
const MAX_POINTS = 7

const Game = new CAHGame()
GameInstance.game = Game

async function startServer() {
    const server = await Game.initialize(PORT)

    server.on('connection', (socket) => {
        socket.on('create room', (fn) => {
            try {
                const room = Game.createRoom(MIN_PLAYERS, MAX_PLAYERS, MAX_POINTS)
                fn(room)
                console.log(`ROOM ${room.code} has been created`)
            } catch (err) {
                return socket.emit('error', err.message)
            }
        })

        socket.on('join room', (code) => {
            try {
                const room = Game.getRoom(code)
                socket.emit('join room', room)
            } catch (err) {
                return socket.emit('error', err.message)
            }
        })

        socket.on('change room privacy', (code, isPublic) => {
            try {
                const room = Game.getRoom(code)
                room.isPublic = isPublic
            } catch (err) {
                return socket.emit('error', err.message)
            }
        })

        socket.on('get players', (code, fn) => {
            try {
                const room = Game.getRoom(code)
                fn(room.players)
            } catch (err) {
                return socket.emit('error', err.message)
            }
        })

        socket.on('add player', (code, name, fn) => {
            try {
                const room = Game.getRoom(code)
                const player = room.addNewPlayer(name, socket.id)
                player.broadcastToRoom('player added', player, room)
                fn(player, room)
                socket.roomCode = room.code
                console.log(`ROOM ${room.code}: Player ${player.displayName} has joined`)
            } catch (err) {
                return socket.emit('error', err.message)
            }
        })

        socket.on('start game', (code, type, packs) => {
            try {
                const room = Game.getRoom(code)
                room.startGame(type || "Default")
                room.broadcast('game started', room)
                room.broadcast('round started', room)
                console.log(`ROOM ${room.code}: Game started with ${room.players.length} players`)
            } catch (err) {
                return socket.emit('error', err.message)
            }
        })

        socket.on('start new round', (code) => {
            try {
                const room = Game.getRoom(code)
                room.startNewRound()
                room.broadcast('round started', room)
                console.log(`ROOM ${room.code}: New round started with ${room.players.length} players`)
            } catch (err) {
                return socket.emit('error', err.message)
            }
        })

        socket.on('make submission', (code, card, fn) => {
            try {
                const room = Game.getRoom(code)
                const player = room.players.find(el => el.socketID === socket.id)
                const submission = player.makeSubmission(card)
                fn(submission)

                console.log(`ROOM ${room.code}: Player ${player.displayName} made a submission`)

                const playerSubmissions = room.getPlayerSubmissions()
                room.broadcast('player made submission', playerSubmissions)
                if (playerSubmissions.length === room.players.length - 1) {
                    room.beginSelectionStage()
                    room.broadcast('selection stage started', playerSubmissions)
                    console.log(`ROOM ${room.code}: Submission stage has begun`)
                }
            } catch (err) {
                return socket.emit('error', err.message)
            }
        })

        socket.on('pick winning submission', (code, submission) => {
            try {
                const room = Game.getRoom(code)
                room.selectWinningSubmission(submission)
                if (room.gameWinner) {
                    room.broadcast('game ended', room.gameWinner)
                    console.log(`ROOM ${room.code}: Player ${room.gameWinner.displayName} won the game!`)
                } else {
                    room.broadcast('round ended', room.roundWinner)
                    console.log(`ROOM ${room.code}: Player ${room.roundWinner.displayName} won the round! They now have ${room.roundWinner.points} points`)
                }
            } catch (err) {
                return socket.emit('error', err.message)
            }
        })

        socket.on('disconnect', () => {
            try {
                const code = socket.roomCode
                if (!code) return

                const room = Game.getRoom(code)
                const player = room.players.find(el => el.socketID === socket.id)
                room.removePlayer(player)
                player.broadcastToRoom('player left', player, room)
                console.log(`ROOM ${room.code}: Player ${player.displayName || "NO_NAME"} has left`)

                if (room.host.socketID === socket.id) {
                    throw Error("Host left the room.")
                }

                delete player

                if (room.players.length === 0) {
                    Game.closeRoom(room.code)
                    console.log(`ROOM ${room.code} closed`)
                    return
                }

                if (room.isInProgress) {
                    if (player.socketID === room.cardCzar.socketID) {
                        console.log(`ROOM ${room.code}: Card Czar left`)
                        room.startNewRound()
                        room.broadcast('round started', room)
                        console.log(`ROOM ${room.code}: New round started with ${room.players.length} players`)
                        return
                    }

                    const playerSubmissions = room.getPlayerSubmissions()
                    if (playerSubmissions.length === room.players.length - 1) {
                        room.beginSelectionStage()
                        room.broadcast('selection stage started', playerSubmissions)
                        console.log(`ROOM ${room.code}: Submission stage has begun`)
                        return
                    }
                }
            } catch (err) {
                return socket.emit('error', err.message)
            }
        })
    })

    // Pings self every 50 seconds, never idles
    setInterval(function() {
        https.get("https://clo-server.herokuapp.com/")
    }, 50000)
}

startServer()
