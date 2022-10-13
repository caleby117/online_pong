var ctx = document.getElementbyId('ctx').getContext("2d")

var Player = function(id) {
    var self = {
        type: 'player',
        x: 50,
        y: 500,
        id: id,
        vmax: 10,
        pressUp: false,
        pressDown: false
    }

    self.updatePos = function(){
        if (self.pressUp){
            self.y -= self.vmax
        }
        else if(self.pressDown){
            self.y += self.vmax
        }
    }

    return self
}

var Ball = function() {
    var self = {
        type: 'ball',
        x: 500,
        y: 500,
        vx: 0,
        vy: 0,
        r: 20
    }

    self.checkReflect = function(){
        if (self.y < 0){            //Ball hits the top of the canvas
            self.vy = -self.vy
        }
        if(self.y > 1000){          //Ball hits the bottom
            self.vy = -self.vy
        }
        if (self.x < 0){            //Ball hits the top of the canvas
            self.vx = -self.vx
        }
        if(self.x > 1000){          //Ball hits the bottom
            self.vx = -self.vx
        }


    }

    self.updatePos = function() {
        self.x += self.vx
        self.y += self.vy
    }

    return self
}

var drawEntity = function(e){
    switch(e.type){
        case 'player':
            drawPlayer(e.x, e.y)

        case 'ball':
            drawBall(e.x, e.y, e.r)
    }
}

var drawPlayer = function(x, y){
    ctx.fillRect(x, y, 20, 100)
}

var drawBall = function(x, y, r){
    ctx.fillStyle = '#FF0000'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, 2*Math.PI)
    ctx.stroke()
}

var startMoving = function(ball){
    var angle = Math.floor(Math.random() * 360)
    ball.vx = Math.cos(angle/(2*Math.PI))
    ball.vy = Math.sin(angle/(2*Math.PI))
}

var countdown = function(){
    ctx.font = '50px Arial'
    setTimeout(ctx.fillText('3', 500, 500), 1000)
    setTimeout(ctx.fillText('2', 500, 500), 1000)
    setTimeout(ctx.fillText('1', 500, 500), 1000)
}

var updateAll = function(){
    for (var e of entities) {
        drawEntity(e)
    }
}


var entities = []
var p1 = Player(1)
entities.push(p1)
var ball = Ball()
entities.push(ball)
countdown()
startMoving()
setInterval(updateAll, 33)
