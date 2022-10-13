var CANV_WIDTH = require('./canvas').CANV_WIDTH
var CANV_HEIGHT = require('./canvas').CANV_HEIGHT


// Player Object:
//     id: id of player - same number as io socket number
//     sprite: sprite object of player
//     score: player's score

function Player(id, playerNo){
    var self = {
        no: playerNo,
        id: id,
        sprite: Sprite(id, playerNo),
        score: 0

    }
    return self
}


// Player Sprite Object:
//     x: Current x position of player
//     y: Current y position of player
//     id: playerid
//     vmax: max speed in pixels/tick (tickrate ~30)
//     pressUp: bool to handle up key pressed
//     pressDown: bool to handle down key pressed
//
//     self.updatePos: Calculates current position of object from the previous tick. Does not allow player sprite
//                     out of bounds
//
//     setHitbox: somewhat of a private method callable from inside the sprite object only. Sets the hitbox of the
//                player model from the position of the player.


var Sprite = function(id, playerNo) {
    var self = {
        x: CANV_WIDTH/20,
        y: CANV_HEIGHT/2,
        id: id,
        vmax: CANV_HEIGHT/100,
        pressUp: false,
        pressDown: false
    }
    if (playerNo === 2){
        self.x = CANV_WIDTH - self.x
    }
    self.updatePos = function(){
        if (self.pressUp && self.y-50>=0){
            self.y -= self.vmax
        }
        else if(self.pressDown&& self.y+50<=CANV_HEIGHT){
            self.y += self.vmax
        }
        self.hitbox = setHitbox()
    }

    var setHitbox = function() {
        return {
            up: self.y - 50,
            down: self.y + 50,
            right: self.x + 10,
            left: self.x - 10
        }
    }

    return self
}



module.exports.Player = Player;