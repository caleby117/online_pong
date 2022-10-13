var CANV_WIDTH = require('./canvas').CANV_WIDTH
var CANV_HEIGHT = require('./canvas').CANV_HEIGHT

var Player = require('./player').Player

var express = require('express')
var app = express()
var server = require('http').Server(app)

var io = require('socket.io')(server, {})

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html')
})

server.listen(8080)
console.log("server is running")


//TODO:
// - Make an AI player that takes over when there are less than 2 players
// - Ball accelerates over time as the game progresses
// - Change perspective of the players such that the canvas is mirrored for player 2: so that you are always controlling
//   the left block
// - FIX: Countdown covers up the right paddle

// Ball Object:
//     x: Current x position of the ball
//     y: Current Y position of the ball
//     vx: Current velocity in the x direction
//     vy: Current velocity in the y direction
//     r: radius of ball.
//
//     self.updatePos: updates position of the ball, and checks for collisions with walls.


var Ball = function() {
    var self = {
        tick: 0,
        x: CANV_WIDTH/2,
        y: CANV_HEIGHT/2,
        vx: 0,
        vy: 0,
        r: 10
    }


    self.updatePos = function () {
        self.x += self.vx
        self.y += self.vy
        if (self.y < self.r) {            //Ball hits the top of the canvas
            self.vy = -self.vy
        }
        if (self.y > CANV_HEIGHT - self.r) {          //Ball hits the bottom
            self.vy = -self.vy
        }
        if (self.x < self.r) {            //Ball hits the LEFT
            for (var id in PLAYER_LIST){
                if(PLAYER_LIST[id].no == 2){
                    playerScored = PLAYER_LIST[id]
                    break
                }
            }
        }
        if (self.x > CANV_WIDTH - self.r) {          //Ball hits the RIGHT
            for (var id in PLAYER_LIST){
                if(PLAYER_LIST[id].no == 1){
                    playerScored = PLAYER_LIST[id]
                    break
                }
            }
        }

    }
    return self
}

// Starts the ball moving in a random direction between +- 60 degrees of the left and right horizontal
var startMoving = function(ball){
    var randAngle = function() {
        var ang = Math.floor(Math.random() * 360)
        console.log(ang)
        if ((ang <=60 && ang > 15  || ang >=-60 && ang < -15) || (ang >= 120 && ang < 165 ||  ang <= 240 && ang > 195)){
            console.log('Ball started moving at angle of ' + ang)
            return ang
        }
        else{
            return randAngle()
        }
    }
    const angle = randAngle();
    ball.vx = 5*Math.cos((angle*Math.PI)/180)
    ball.vy = 5*Math.sin((angle*Math.PI)/180)

}

var increaseSpeed = function(ball){
    if(ball.tick === 10) {
        ball.vx *= 1.01
        ball.vy *= 1.01
        ball.tick = 0
    }
    else{
        ball.tick += 1
    }

}

// Checks for collisions between player and ball. Returns object {x: bool, y:bool}
function checkCollision(player, ball) {
    var coll = {x:false, y:false}

    var withinPlayerY = player.hitbox.up < ball.y && player.hitbox.down >= ball.y
    var withinPlayerX = player.hitbox.left < ball.x && player.hitbox.right >= ball.x


    if((player.hitbox.left < ball.x - ball.r + ball.vx && ball.x - ball.r + ball.vx <= player.hitbox.right && withinPlayerY) || (player.hitbox.left < ball.x + ball.r + ball.vx && ball.x + ball.r + ball.vx <= player.hitbox.right && withinPlayerY)){
        coll.x = true
    }
    if((player.hitbox.up < ball.y - ball.r + ball.vy && ball.y - ball.r + ball.vy <= player.hitbox.down &&withinPlayerX) || (withinPlayerX && player.hitbox.up < ball.y + ball.r + ball.vy && ball.y + ball.r + ball.vy <= player.hitbox.down)){
        coll.y = true
    }
    return coll
}
//Handles the collisions based on the object from checkCollision
function collisionHandler(ball, coll) {
    if (coll.x === true){
        ball.vx = -ball.vx
    }
    else if(coll.y === true){
        ball.vy = -ball.vy
    }
}

//increments the score of the player that scored
var incScore = function(player){
    player.score += 1
    entities.ball.vx = 0
    entities.ball.vy = 0
    entities.ball.x = CANV_WIDTH/2
    entities.ball.y = CANV_HEIGHT/2

    for (var id in PLAYER_LIST){
        PLAYER_LIST[id].sprite.y = CANV_HEIGHT/2
        var socket = SOCKET_LIST[id]
        if (id>100){
            continue
        }
        socket.emit('updateScore', {no: player.no, score:player.score})
        console.log('Sent score to client ' + id)
    }
    clearInterval(updateEntID)
    startGame()

}

//Updates positions of all entities and tells client to draw all of them.
var updateEntities = function() {
    if (playerScored != 0){
        incScore(playerScored)
        playerScored = 0
    }
    for (var e in entities.playerSprites) {
        entities.playerSprites[e].updatePos()
        collisionHandler(entities.ball, checkCollision(entities.playerSprites[e], entities.ball))
    }
    increaseSpeed(entities.ball)
    entities.ball.updatePos()

    for(var ai in AI_LIST){
        aiMove(entities.playerSprites[ai], entities.ball)
    }

    for (var i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i]
        socket.emit('draw', entities)           //The entire entities object containing player sprite and ball info
    }
}

// Creates and returns a player object
var createPlayer = function(id, playerNo){

    var player = Player(id, playerNo)
    entities.playerSprites[player.id] = player.sprite       //adds player sprites to entities
    return player
}


// Starts/restarts play
var startGame = function (){
    for (var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i]
        socket.emit('countdown', {})
    }
    setTimeout(startMoving, 4000, entities.ball)
    setTimeout(startUpdate, 4000)
}

// Simple AI Algorithm, if it's in line with the ball.y, then dont move. If it's not, then move.
// takes in AI sprite object
var aiMove = function(ai, ball) {
    var withinPlayerY = ai.hitbox.up < ball.y && ai.hitbox.down >= ball.y
    if (!withinPlayerY && (ball.x > CANV_WIDTH/2 || (ball.vx > 0 && ball.x > CANV_WIDTH/4))){       //Contition for AI to move
        if (ball.y < ai.hitbox.up){
            ai.pressUp = true
        }
         else{
            ai.pressDown = true
        }
    }
    else{
        ai.pressUp = false
        ai.pressDown = false
    }
}

var startUpdate = function(){
    updateEntID = setInterval(updateEntities, 16)
}

//Checks if id is available: id available will return true
var checkId = function(id){
    for (p of Object.keys(PLAYER_LIST)){
        if(id === p.id){
            return false
            break
        }
    }
    return true
}

var generateId = function(){
    var id = Math.floor(Math.random() * 100)
    if(checkId(id)){
        return id
    }
    else{
        generateId()
    }
}

var isPlayer = function(id){
    return Object.keys(PLAYER_LIST).includes(id.toString())
}

var SOCKET_LIST = {}
var PLAYER_LIST = {}
var AI_LIST = {}
var entities = {playerSprites: {}, ball: Ball()}
var game_state = 0                      // game state 0 for menu, 1 for in game
var playerScored = 0
var updateEntID = 0

//handles the socket connections
io.sockets.on('connection', function(socket){
    socket.id = generateId()
    SOCKET_LIST[socket.id] = socket
    if (Object.keys(PLAYER_LIST).length < 2){
        switch(Object.keys(PLAYER_LIST).length){
            case 0:
                var player = createPlayer(socket.id, 1)
                PLAYER_LIST[socket.id] = player

                var aiID = generateId()+101                         // AI player has ID no of >100
                var ai = createPlayer(aiID, 2)
                PLAYER_LIST[aiID] = ai
                AI_LIST[aiID] = ai
                break

            case 1:
                for(var key in AI_LIST){
                    delete PLAYER_LIST[key]
                    delete AI_LIST[key]
                    break
                }
                var player = createPlayer(socket.id, 2)
                PLAYER_LIST[socket.id] = player
                break
        }

        console.log('Player Connected, id ' + socket.id)
        console.log('Player number is ' + player.no)
        console.log(Object.keys(PLAYER_LIST))
    }


    socket.on('disconnect', function(){
        delete SOCKET_LIST[socket.id]
        if (isPlayer(socket.id)){
            delete PLAYER_LIST[socket.id]
            delete entities.playerSprites[socket.id]
        }
    })

    socket.on('keyDown', function(data){
        if (game_state === 1 && isPlayer(socket.id)) {
            switch(data.code){
                case 'ArrowUp':
                    player.sprite.pressUp = true
                    break

                case 'ArrowDown':
                    player.sprite.pressDown = true

            }
        }
        else if(game_state ===0){
            game_state = 1
            startGame()
        }
    })

    socket.on('keyUp', function(data){
        if (game_state === 1 && isPlayer(socket.id)){
            switch(data.code) {
                case 'ArrowUp':
                    player.sprite.pressUp = false
                    break
                case 'ArrowDown':
                    player.sprite.pressDown = false

            }
        }
    })
})



