/*
  spaceinvaders.js

  the core logic for the space invaders game.

*/

/*  
    Game Class

    The Game class represents a Space Invaders game.
    Create an instance of it, change any of the default values
    in the settings, and call 'start' to run the game.

    Call 'initialise' before 'start' to set the canvas the game
    will draw to.

    Call 'moveShip' or 'shipFire' to control the ship.

    Listen for 'gameWon' or 'gameLost' events to handle the game
    ending.
*/

//  Creates an instance of the Game class.
function Game() {

    //  Set the initial config.
    this.config = {
        bombRate: 0.05,
        bombMinVelocity: 50,
        bombMaxVelocity: 50,
        invaderInitialVelocity: 25,
        invaderAcceleration: 0,
        invaderDropDistance: 30,
        rocketVelocity: 120,
        rocketMaxFireRate: 2,
        bonusVelocity: 200,
        bonusReward: 8,
        gameWidth: 400,
        gameHeight: 300,
        fps: 50,
        debugMode: false,
        invaderRanks: 5,
        invaderFiles: 10,
        shipSpeed: 120,
        levelDifficultyMultiplier: 0.2,
        pointsPerInvader: 5
    };

    //  All state is in the letiables below.
    this.lives = 3;
    this.bonusesCaught = 0;
    this.width = 0;
    this.height = 0;
    this.gameBounds = {left: 0, top: 0, right: 0, bottom: 0};
    this.intervalId = 0;
    this.score = 0;
    this.level = 1;

    //  The state stack.
    this.stateStack = [];

    //  Input/output
    this.pressedKeys = {};
    this.gameCanvas =  null;

    //  All sounds.
    this.sounds = null;
}

//  Initialis the Game with a canvas.
Game.prototype.initialise = function(gameCanvas) {

    //  Set the game canvas.
    this.gameCanvas = gameCanvas;

    //  Set the game width and height.
    this.width = gameCanvas.width;
    this.height = gameCanvas.height;

    if (Math.min(gameCanvas.width / 2 - 25, this.config.gameWidth / 2) == gameCanvas.width / 2 - 25) {
        this.isMobile = true;
    }
    
    //  Set the state game bounds.
    this.gameBounds = {
        left: gameCanvas.width / 2 - Math.min(gameCanvas.width / 2 - 25, this.config.gameWidth / 2),
        right: gameCanvas.width / 2 + Math.min(gameCanvas.width / 2 - 25, this.config.gameWidth / 2),
        top: gameCanvas.height / 2 - Math.min(gameCanvas.height / 2 - 10, this.config.gameHeight / 2),
        bottom: gameCanvas.height / 2 + Math.min(gameCanvas.height / 2 - 10, this.config.gameHeight / 2),
    };
};

Game.prototype.displayLogo = function(ctx) {
    let eventLogo = new Image(200,154);
    eventLogo.src = "images/egg-logo.png";
    ctx.drawImage(eventLogo,this.width-eventLogo.width,0,eventLogo.width,eventLogo.height);
}

Game.prototype.moveToState = function(state) {
 
   //  If we are in a state, leave it.
   if(this.currentState() && this.currentState().leave) {
     this.currentState().leave(game);
     this.stateStack.pop();
   }
   
   //  If there's an enter function for the new state, call it.
   if(state.enter) {
     state.enter(game);
   }
 
   //  Set the current state.
   this.stateStack.pop();
   this.stateStack.push(state);
 };

//  Start the Game.
Game.prototype.start = function() {

    //  Move into the 'welcome' state.
    this.moveToState(new DisplayState());

    //  Set the game letiables.
    this.lives = 3;
    this.bonusesCaught = 0;
    this.config.debugMode = /debug=true/.test(window.location.href);

    //  Start the game loop.
    let game = this;
    this.intervalId = setInterval(function () { GameLoop(game);}, 1000 / this.config.fps);

};

//  Returns the current state.
Game.prototype.currentState = function() {
    return this.stateStack.length > 0 ? this.stateStack[this.stateStack.length - 1] : null;
};

//  Mutes or unmutes the game.
Game.prototype.mute = function(mute) {

    //  If we've been told to mute, mute.
    if(mute === true) {
        this.sounds.mute = true;
    } else if (mute === false) {
        this.sounds.mute = false;
    } else {
        // Toggle mute instead...
        this.sounds.mute = this.sounds.mute ? false : true;
    }
};

//  The main loop.
function GameLoop(game) {
    let currentState = game.currentState();
    if(currentState) {

        //  Delta t is the time to update/draw.
        let dt = 1 / game.config.fps;

        //  Get the drawing context.
        let ctx = this.gameCanvas.getContext("2d");
        
        //  Update if we have an update function. Also draw
        //  if we have a draw function.
        if(currentState.update) {
            currentState.update(game, dt);
        }
        if(currentState.draw) {
            currentState.draw(game, dt, ctx);
        }
    }
}

Game.prototype.pushState = function(state) {

    //  If there's an enter function for the new state, call it.
    if(state.enter) {
        state.enter(game);
    }
    //  Set the current state.
    this.stateStack.push(state);
};

Game.prototype.popState = function() {

    //  Leave and pop the state.
    if(this.currentState()) {
        if(this.currentState().leave) {
            this.currentState().leave(game);
        }

        //  Set the current state.
        this.stateStack.pop();
    }
};

//  The stop function stops the game.
Game.prototype.stop = function Stop() {
    clearInterval(this.intervalId);
};

//  Inform the game a key is down.
Game.prototype.keyDown = function(keyCode) {
    this.pressedKeys[keyCode] = true;
    //  Delegate to the current state too.
    if(this.currentState() && this.currentState().keyDown) {
        this.currentState().keyDown(this, keyCode);
    }
};

//  Inform the game a key is up.
Game.prototype.keyUp = function(keyCode) {
    delete this.pressedKeys[keyCode];
    //  Delegate to the current state too.
    if(this.currentState() && this.currentState().keyUp) {
        this.currentState().keyUp(this, keyCode);
    }
};

Game.prototype.handleStart = function(e) {
    e.preventDefault();
    if(this.currentState() && this.currentState().handleStart) {
        this.currentState().handleStart(this, e);
    }
};

Game.prototype.handleEnd = function(e) {
    e.preventDefault();
    if(this.currentState() && this.currentState().handleEnd) {
        this.currentState().handleEnd(this, e);
    }
};

Game.prototype.handleMove = function(e) {
    e.preventDefault();
    if(this.currentState() && this.currentState().handleMove) {
        this.currentState().handleMove(this, e);
    }
};

function DisplayState() {

};

DisplayState.prototype.enter = function(game) {
    let ctx = game.gameCanvas.getContext("2d");

    this.laser = [];
    this.particles = [];
    this.timeout = false;
    this.lineHeight = game.width/40;
    this.fps = 0;
    this.displayTextIterations = 0;
    //
    this.text = new Text({
        copy: 'Dataiku presents : Egg Invaders',
        x: game.width*0.15,
        y: game.height*0.1,
        size: game.width*0.05
    }, ctx, this.laser, this.particles);
};

DisplayState.prototype.update = function(game, dt) {
    this.done = this.text.update();
    if (this.done == "done" && !this.timeout) {
        window.setTimeout(function(){ game.moveToState(new WelcomeState()); }, 25000);
        this.timeout = true;
    }
    this.laser.forEach((l, i) => l.update(i, this.laser));
    this.particles.forEach(p => p.update());
};

DisplayState.prototype.draw = function(game, dt, ctx) {
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, game.width, game.height);
    //
    this.text.render(ctx);
    this.laser.forEach(l => l.render(ctx));
    this.particles.forEach(p => p.render(ctx));
    if (this.done == "done") {

        let data = ['A long time ago, in a galaxy far far away,',
                    ' Eggs decided to invade Planet Technoslavia.',
                    'No single power has ever emerged victorious',
                    'across all of Technoslavia ...',
                    'Will you let it happen now?',
                    'Fight against the Invaders!',
                    'You have been equipped with a laser cannon ',
                    'that you can move horizontally to fire at descending Eggs.',
                    'Your aim is to defeat the rows of Eggs',
                    'before they advance toward the bottom of the screen.',
                    'But be careful - the more Eggs you defeat,',
                    'the faster and more powerful they become.'];


        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = this.lineHeight+"px Franklin Gothic Medium Condensed";
        ctx.fillStyle = '#feda4a';

        if (Math.trunc(this.fps / game.config.fps) < data.length) {
            for (let i = 0; i < data.length && i <= this.displayTextIterations; i++) {
                ctx.fillText(data[i], game.width/2, game.height/3 + i *(this.lineHeight+5));
            }
        }

        this.fps++;

        if (this.fps == data[this.displayTextIterations].length * 2) {
            this.fps = 0;
            this.displayTextIterations++;
        }
    }
};

function WelcomeState() {

};

WelcomeState.prototype.enter = function(game) {

    // Create and load the sounds.
    game.sounds = new Sounds();
    game.sounds.init();
    game.sounds.loadSound('shoot', 'sounds/shoot.wav');
    game.sounds.loadSound('bang', 'sounds/bang.wav');
    game.sounds.loadSound('explosion', 'sounds/explosion.wav');
};

WelcomeState.prototype.update = function (game, dt) {


};

WelcomeState.prototype.draw = function(game, dt, ctx) {

    //  Clear the background.
    ctx.clearRect(0, 0, game.width, game.height);

    game.displayLogo(ctx);

    ctx.font="30px Arial";
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline="center"; 
    ctx.textAlign="center"; 
    ctx.fillText("Egg Invaders", game.width / 2, game.height/2 - 40); 
    ctx.font="16px Arial";

    ctx.fillText("Press 'Space' or touch screen to start.", game.width / 2, game.height/2); 
};

WelcomeState.prototype.keyDown = function(game, keyCode) {
    if(keyCode == 32) /*space*/ {
        this.startGame(game);
    }
};

WelcomeState.prototype.handleStart = function(game, e) {
    this.startGame(game);
};

WelcomeState.prototype.startGame = function(game) {
    game.level = 1;
    game.score = 0;
    game.lives = 3;
    game.bonusesCaught = 0;
    game.moveToState(new LevelIntroState(game.level));
}

function GameOverState() {

}

GameOverState.prototype.update = function(game, dt) {

};

GameOverState.prototype.draw = function(game, dt, ctx) {

    //  Clear the background.
    ctx.clearRect(0, 0, game.width, game.height);

    game.displayLogo(ctx);

    ctx.font="30px Arial";
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline="center"; 
    ctx.textAlign="center"; 
    ctx.fillText("Game Over!", game.width / 2, game.height/2 - 40); 
    ctx.font="16px Arial";
    ctx.fillText("You scored " + game.score + " and got to level " + game.level, game.width / 2, game.height/2);
    ctx.font="16px Arial";
    ctx.fillText("Press 'Space' or touch screen to play again.", game.width / 2, game.height/2 + 40);   
};

GameOverState.prototype.keyDown = function(game, keyCode) {
    if(keyCode == 32) /*space*/ {
        this.restartGame(game);
    }
};

GameOverState.prototype.handleStart = function(game, e) {
    this.restartGame(game);
};

GameOverState.prototype.restartGame = function(game) {
    game.level = 1;
    game.score = 0;
    game.lives = 3;
    game.bonusesCaught = 0;
    game.moveToState(new LevelIntroState(game.level));
}

//  Create a PlayState with the game config and the level you are on.
function PlayState(config, level) {
    this.config = config;
    this.level = level;

    //  Game state.
    this.invaderCurrentVelocity =  10;
    this.invaderCurrentDropDistance =  0;
    this.invadersAreDropping =  false;
    this.lastRocketTime = null;

    //  Game entities.
    this.ship = null;
    this.invaders = [];
    this.rockets = [];
    this.bombs = [];
    this.invadersKilled = [];
    this.bonuses = [];

    this.fpsBird = 10;
    this.touchFired = null;
}

PlayState.prototype.enter = function(game) {

    //  Create the ship.
    this.ship = new Ship(game.width / 2, game.gameBounds.bottom);
    this.birdIndex = 0;

    //  Setup initial state.
    this.invaderCurrentVelocity =  10;
    this.invaderCurrentDropDistance =  0;
    this.invadersAreDropping =  false;

    //  Set the ship speed for this level, as well as invader params.
    let levelMultiplier = this.level * this.config.levelDifficultyMultiplier;
    this.shipSpeed = this.config.shipSpeed;
    this.invaderInitialVelocity = this.config.invaderInitialVelocity + (levelMultiplier * this.config.invaderInitialVelocity);
    this.bombRate = this.config.bombRate + (levelMultiplier * this.config.bombRate);
    this.bombMinVelocity = this.config.bombMinVelocity + (levelMultiplier * this.config.bombMinVelocity);
    this.bombMaxVelocity = this.config.bombMaxVelocity + (levelMultiplier * this.config.bombMaxVelocity);

    //  Create the invaders.
    let ranks = this.config.invaderRanks;
    let files = this.config.invaderFiles;
    let invaders = [];
    for(let rank = 0; rank < ranks; rank++){
        for(let file = 0; file < files; file++) {
            invaders.push(new Invader(
                (game.width / 2) + ((files/2 - file) * 200 / files),
                (game.gameBounds.top + rank * 26),
                rank, file, 'Invader'));
        }
    }
    this.invaders = invaders;
    this.invaderCurrentVelocity = this.invaderInitialVelocity;
    this.invaderVelocity = {x: -this.invaderInitialVelocity, y:0};
    this.invaderNextVelocity = null;
};

PlayState.prototype.update = function(game, dt) {
    
    //  If the left or right arrow keys are pressed, move
    //  the ship. Check this on ticks rather than via a keydown
    //  event for smooth movement, otherwise the ship would move
    //  more like a text editor caret.
    if(game.pressedKeys[37]) {
        this.ship.x -= this.shipSpeed * dt;
    }
    if(game.pressedKeys[39]) {
        this.ship.x += this.shipSpeed * dt;
    }

    if(this.touchFired) {
        if (this.touchFired.screenX > this.ship.x) {
            this.ship.x += this.shipSpeed * dt;
        } else {
            this.ship.x -= this.shipSpeed * dt;
        }
    }

    //  Keep the ship in bounds.
    if(this.ship.x < game.gameBounds.left) {
        this.ship.x = game.gameBounds.left;
    }
    if(this.ship.x > game.gameBounds.right) {
        this.ship.x = game.gameBounds.right;
    }

    //  Move each bomb.
    for(let i=0; i<this.bombs.length; i++) {
        let bomb = this.bombs[i];
        bomb.y += dt * bomb.velocity;

        //  If the rocket has gone off the screen remove it.
        if(bomb.y > this.height) {
            this.bombs.splice(i--, 1);
        }
    }

    //  Move each rocket.
    for(i=0; i<this.rockets.length; i++) {
        let rocket = this.rockets[i];
        rocket.y -= dt * rocket.velocity;

        //  If the rocket has gone off the screen remove it.
        if(rocket.y < 0) {
            this.rockets.splice(i--, 1);
        }
    }

    //  Move each bonus.
    for(let i=0; i<this.bonuses.length; i++) {
        let bonus = this.bonuses[i];
        bonus.y += dt * bonus.velocity;

        //  If the bonus has gone off the screen remove it.
        if(bonus.y > this.height) {
            this.bonuses.splice(i--, 1);
        }
    }

    //  Move the invaders.
    let hitLeft = false, hitRight = false, hitBottom = false;
    for(i=0; i<this.invaders.length; i++) {
        let invader = this.invaders[i];
        let newx = invader.x + this.invaderVelocity.x * dt;
        let newy = invader.y + this.invaderVelocity.y * dt;
        if(hitLeft == false && newx < game.gameBounds.left) {
            hitLeft = true;
        }
        else if(hitRight == false && newx > game.gameBounds.right) {
            hitRight = true;
        }
        else if(hitBottom == false && newy > game.gameBounds.bottom) {
            hitBottom = true;
        }

        if(!hitLeft && !hitRight && !hitBottom) {
            invader.x = newx;
            invader.y = newy;
        }
    }

    //  Update invader velocities.
    if(this.invadersAreDropping) {
        this.invaderCurrentDropDistance += this.invaderVelocity.y * dt;
        if(this.invaderCurrentDropDistance >= this.config.invaderDropDistance) {
            this.invadersAreDropping = false;
            this.invaderVelocity = this.invaderNextVelocity;
            this.invaderCurrentDropDistance = 0;
        }
    }
    //  If we've hit the left, move down then right.
    if(hitLeft) {
        this.invaderCurrentVelocity += this.config.invaderAcceleration;
        this.invaderVelocity = {x: 0, y:this.invaderCurrentVelocity };
        this.invadersAreDropping = true;
        this.invaderNextVelocity = {x: this.invaderCurrentVelocity , y:0};
    }
    //  If we've hit the right, move down then left.
    if(hitRight) {
        this.invaderCurrentVelocity += this.config.invaderAcceleration;
        this.invaderVelocity = {x: 0, y:this.invaderCurrentVelocity };
        this.invadersAreDropping = true;
        this.invaderNextVelocity = {x: -this.invaderCurrentVelocity , y:0};
    }
    //  If we've hit the bottom, it's game over.
    if(hitBottom) {
        this.lives = 0;
    }
    
    //  Check for rocket/invader collisions.
    for(i=0; i<this.invaders.length; i++) {
        let invader = this.invaders[i];
        let bang = false;

        for(let j=0; j<this.rockets.length; j++){
            let rocket = this.rockets[j];

            if(rocket.x + rocket.width/2 >= (invader.x - invader.width/2) && rocket.x - rocket.width/2 <= (invader.x + invader.width/2) &&
                rocket.y + rocket.height/2 >= (invader.y - invader.height/2) && rocket.y - rocket.height/2 <= (invader.y + invader.height/2)) {
                
                //  Remove the rocket, set 'bang' so we don't process
                //  this rocket again.
                this.rockets.splice(j--, 1);
                bang = true;
                game.score += this.config.pointsPerInvader;
                break;
            }
        }
        if(bang) {
            invader.iterations = 5;
            this.invadersKilled.push(invader);
            this.invaders.splice(i--, 1);
            game.sounds.playSound('bang');
        }
    }

    //  Find all of the front rank invaders.
    let frontRankInvaders = {};
    for(let i=0; i<this.invaders.length; i++) {
        let invader = this.invaders[i];
        //  If we have no invader for game file, or the invader
        //  for game file is futher behind, set the front
        //  rank invader to game one.
        if(!frontRankInvaders[invader.file] || frontRankInvaders[invader.file].rank < invader.rank) {
            frontRankInvaders[invader.file] = invader;
        }
    }

    //  Give each front rank invader a chance to drop a bomb.
    for(let i=0; i<this.config.invaderFiles; i++) {
        let invader = frontRankInvaders[i];
        if(!invader) continue;
        let chance = this.bombRate * dt;
        if(chance > Math.random()) {
            //  Fire!
            this.bombs.push(new Bomb(invader.x, invader.y + invader.height / 2, 
                this.bombMinVelocity + Math.random()*(this.bombMaxVelocity - this.bombMinVelocity)));
        }
    }

    if (Math.random() > 0.96) {
        this.dropBonus(game);
    }

    //  Check for bomb/ship collisions.
    for(let i=0; i<this.bombs.length; i++) {
        let bomb = this.bombs[i];
        if(bomb.x >= (this.ship.x - this.ship.width/2) && bomb.x <= (this.ship.x + this.ship.width/2 ) &&
                bomb.y >= (this.ship.y - this.ship.height/2) && bomb.y <= (this.ship.y + this.ship.height/2)) {
            this.bombs.splice(i--, 1);
            game.lives--;
            game.sounds.playSound('explosion');
        }
    }

    //  Check for bonus/ship collisions.
    for(let i=0; i<this.bonuses.length; i++) {
        let bonus = this.bonuses[i];
        if(bonus.x + bonus.width >= (this.ship.x - this.ship.width/2) && bonus.x - bonus.width <= (this.ship.x + this.ship.width/2) &&
                bonus.y + bonus.height/2 >= (this.ship.y - this.ship.height/2) && bonus.y + bonus.height/2 <= (this.ship.y + this.ship.height/2)) {
            this.bonuses.splice(i--, 1);
            game.bonusesCaught++;
        }
    }

    //  Check for invader/ship collisions.
    for(let i=0; i<this.invaders.length; i++) {
        let invader = this.invaders[i];
        if((invader.x + invader.width/2) > (this.ship.x - this.ship.width/2) && 
            (invader.x - invader.width/2) < (this.ship.x + this.ship.width/2) &&
            (invader.y + invader.height/2) > (this.ship.y - this.ship.height/2) &&
            (invader.y - invader.height/2) < (this.ship.y + this.ship.height/2)) {
            //  Dead by collision!
            game.lives = 0;
            game.sounds.playSound('explosion');
        }
    }

    //  Check for failure
    if(game.lives <= 0) {
        game.moveToState(new GameOverState());
    }

    //  Check for victory
    if(this.invaders.length === 0) {
        game.score += this.level * 50;
        game.level += 1;
        game.moveToState(new LevelIntroState(game.level));
    }
};

PlayState.prototype.getImage = function(name) {
    let image = new Image();
    switch (name) {
        case 'birdUp':
            image.src = 'images/birdUp.png';
            return image;
        case 'birdMid':
            image.src = 'images/birdMid.png';
            return image;
        case 'birdDown':
            image.src = "images/birdDown.png";
            return image;
        case 'invader':
            image.src = "images/egg.png";
            return image;
        case 'bomb':
            image.src = "images/bomb.png";
            return image;
        case 'rocket':
            image.src = "images/startup.png";
            return image;
        case 'invaderKilled':
            image.src = "images/friedegg.png";
            return image;
        case 'bonus':
            image.src = "images/bonus.png";
            return image;
    }
}

PlayState.prototype.draw = function(game, dt, ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.mozImageSmoothingEnabled = true;
    ctx.webkitImageSmoothingEnabled = true;
    ctx.msImageSmoothingEnabled = true;
    ctx.imageSmoothingEnabled = true;

    //  Clear the background.
    ctx.clearRect(0, 0, game.width, game.height);

    game.displayLogo(ctx);
    
    //  Draw ship.
    ctx.drawImage(this.getImage(this.ship.birdState[this.birdIndex]), this.ship.x - (this.ship.width / 2), this.ship.y - (this.ship.height / 2), this.ship.width, this.ship.height);
    if (this.fpsBird == 0) {
        this.birdIndex == (this.ship.birdState.length - 1) ? this.birdIndex = 0 : this.birdIndex++;
        this.fpsBird = 10;
    } else {
        this.fpsBird--;
    }
    

    //  Draw invaders.
    for(let i=0; i<this.invaders.length; i++) {
        let invader = this.invaders[i];
        ctx.drawImage(this.getImage('invader'), invader.x - invader.width/2, invader.y - invader.height/2, invader.width, invader.height);
    }

    //  Draw bombs.
    for(let i=0; i<this.bombs.length; i++) {
        let bomb = this.bombs[i];
        ctx.drawImage(this.getImage('bomb'), bomb.x - 2, bomb.y - 2, bomb.width, bomb.height);
    }

    //  Draw rockets.
    for(let i=0; i<this.rockets.length; i++) {
        let rocket = this.rockets[i];
        ctx.drawImage(this.getImage('rocket'), rocket.x, rocket.y - 2, rocket.width, rocket.height);
    }

    //  Draw killed invaders.
    for(let i=0; i<this.invadersKilled.length; i++) {
        let invader = this.invadersKilled[i];
        if (invader.iterations == 0) {
            this.invadersKilled.splice(i--, 1)
        } else {
            invader.iterations--;
            ctx.drawImage(this.getImage('invaderKilled'), invader.x - invader.width/2, invader.y - invader.width/2, invader.width, invader.width);
        }
    }

    //  Draw bonuses.
    for(let i=0; i<this.bonuses.length; i++) {
        let bonus = this.bonuses[i];
        ctx.drawImage(this.getImage('bonus'), bonus.x, bonus.y - 2, bonus.width, bonus.height);
    }

    //  Draw info.
    let textYpos = game.gameBounds.bottom + ((game.height - game.gameBounds.bottom) / 2) - 14/2;
    ctx.font="14px Arial";
    ctx.fillStyle = '#ffffff';
    let info = "Lives: " + game.lives + ", Bonus: " + game.bonusesCaught;
    ctx.textAlign = "left";
    ctx.fillText(info, game.gameBounds.left, textYpos);
    info = "Score: " + game.score + ", Level: " + game.level;
    ctx.textAlign = "right";
    ctx.fillText(info, game.gameBounds.right, textYpos);

    if (game.isMobile) {
        this.textYpos =  textYpos + 14;
        ctx.globalAlpha=1.0;
        ctx.fillStyle = '#ecc77e';
        roundRect(ctx, game.gameBounds.left, this.textYpos, game.width*0.3, game.height*0.08, 10, true);
        roundRect(ctx, game.gameBounds.right - game.width*0.3,this.textYpos,game.width*0.3,game.height*0.08, 10, true);
        ctx.fill();
        let shoot = 'Shoot';
        let data = 'Use data';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign="center";
        ctx.textBaseline = "middle";
        ctx.fillText(shoot, game.gameBounds.left+game.width*0.3/2, this.textYpos+game.height*0.08/2);
        ctx.fillText(data, game.gameBounds.right - game.width*0.3/2, this.textYpos+game.height*0.08/2);   
    }

    //  If we're in debug mode, draw bounds.
    if(this.config.debugMode) {
        ctx.strokeStyle = '#ff0000';
        ctx.strokeRect(0,0,game.width, game.height);
        ctx.strokeRect(game.gameBounds.left, game.gameBounds.top,
            game.gameBounds.right - game.gameBounds.left,
            game.gameBounds.bottom - game.gameBounds.top);
    }
};

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke == "undefined" ) {
    stroke = true;
  }
  if (typeof radius === "undefined") {
    radius = 5;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (stroke) {
    ctx.stroke();
  }
  if (fill) {
    ctx.fill();
  }        
}

PlayState.prototype.keyDown = function(game, keyCode) {
    if(keyCode == 32) {
        //  Fire!
        this.fireRocket();
    }
    if(keyCode == 80) {
        //  Push the pause state.
        game.pushState(new PauseState());
    }
    if(keyCode == 88) {
        this.activateBonus(game);
    }
};

PlayState.prototype.handleStart = function(game, e) {
    if (e.targetTouches.length == 1) {
        let touch = e.targetTouches.item(0);
        this.touchFired = null;

        if (touch.pageX > game.gameBounds.left && touch.pageX < game.gameBounds.left + game.width*0.3
            && touch.pageY > this.textYpos && touch.pageY < this.textYpos + game.height*0.08) {
            this.fireRocket();
        } else if (touch.pageX > game.gameBounds.right - game.width*0.3 && touch.pageX < game.gameBounds.right 
            && touch.pageY > this.textYpos && touch.pageY < this.textYpos + game.height*0.08) {
            this.activateBonus(game);
        } else {
            this.touchFired = e.targetTouches.item(0);
        }
    }
}

PlayState.prototype.handleEnd = function(game, e) {
    if (e.targetTouches.length == 0) {
        this.touchFired = null;
    }
}

PlayState.prototype.handleMove = function(game, e) {
    if (e.targetTouches.length == 1) {
        this.touchFired = e.targetTouches.item(0);
    }
}

PlayState.prototype.fireRocket = function() {
    //  If we have no last rocket time, or the last rocket time 
    //  is older than the max rocket rate, we can fire.
    if(this.lastRocketTime === null || ((new Date()).valueOf() - this.lastRocketTime) > (1000 / this.config.rocketMaxFireRate))
    {   
        //  Add a rocket.
        this.rockets.push(new Rocket(this.ship.x - 2, this.ship.y - 24, this.config.rocketVelocity));
        this.lastRocketTime = (new Date()).valueOf();

        //  Play the 'shoot' sound.
        game.sounds.playSound('shoot');
    }
};

PlayState.prototype.dropBonus = function(game) {
    // Y position of front row invaders
    let mostForwardPosY = this.invaders.map(x => x.y).reduce(function(acc, currentVal, index, array) {
        if (currentVal > acc) { 
            return currentVal;
        } else {
            return acc;
        }
    }, 0);
    let randomPosX = Math.floor(Math.random() * (game.gameBounds.right - game.gameBounds.left + 1)) + game.gameBounds.left;

    this.bonuses.push(new Bonus(randomPosX, mostForwardPosY, this.config.bonusVelocity));
};

PlayState.prototype.activateBonus = function(game) {
    if (game.bonusesCaught > 0) {
        let leastForwardPosY = this.invaders.map(x => x.y).reduce(function(acc, currentVal, index, array) {
            if (currentVal < acc) { 
                return currentVal;
            } else {
                return acc;
            }
        }, game.height);

        let bonusReward = game.config.bonusReward;
        if (leastForwardPosY - bonusReward - 24 > 0) {
            for(let i=0; i<this.invaders.length; i++) {
                this.invaders[i].y -= bonusReward;
            }
            game.bonusesCaught--;
        }
    }
};

function PauseState() {

}

PauseState.prototype.keyDown = function(game, keyCode) {
    if(keyCode == 80) {
        //  Pop the pause state.
        game.popState();
    }
};

PauseState.prototype.draw = function(game, dt, ctx) {

    //  Clear the background.
    ctx.clearRect(0, 0, game.width, game.height);

    game.displayLogo(ctx);

    ctx.font="14px Arial";
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline="middle";
    ctx.textAlign="center";
    ctx.fillText("Paused", game.width / 2, game.height/2);
    return;
};

/*  
    Level Intro State

    The Level Intro state shows a 'Level X' message and
    a countdown for the level.
*/
function LevelIntroState(level) {
    this.level = level;
    this.countdownMessage = "3";
}

LevelIntroState.prototype.update = function(game, dt) {

    //  Update the countdown.
    if(this.countdown === undefined) {
        this.countdown = 3; // countdown from 3 secs
    }
    this.countdown -= dt;

    if(this.countdown < 2) { 
        this.countdownMessage = "2"; 
    }
    if(this.countdown < 1) { 
        this.countdownMessage = "1"; 
    } 
    if(this.countdown <= 0) {
        //  Move to the next level, popping this state.
        game.moveToState(new PlayState(game.config, this.level));
    }

};

LevelIntroState.prototype.draw = function(game, dt, ctx) {

    //  Clear the background.
    ctx.clearRect(0, 0, game.width, game.height);

    game.displayLogo(ctx);

    ctx.font="36px Arial";
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline="middle"; 
    ctx.textAlign="center"; 
    ctx.fillText("Level " + this.level, game.width / 2, game.height/2);
    ctx.font="24px Arial";
    ctx.fillText("Ready in " + this.countdownMessage, game.width / 2, game.height/2 + 36);      
    return;
};


/*
 
  Ship

  The ship has a position and that's about it.

*/
function Ship(x, y) {
    this.x = x;
    this.y = y;
    this.birdState = ['birdUp', 'birdMid', 'birdDown'];
    this.width = 50;
    this.height = 50;
}

/*
    Rocket

    Fired by the ship, they've got a position, velocity and state.

    */
function Rocket(x, y, velocity) {
    this.x = x;
    this.y = y;
    this.velocity = velocity;
    this.width = 4;
    this.height = 16;
}

/*
    Bomb

    Dropped by invaders, they've got position, velocity.

*/
function Bomb(x, y, velocity) {
    this.x = x;
    this.y = y;
    this.velocity = velocity;
    this.width = 16;
    this.height = 16;
}
 
/*
    Invader 

    Invader's have position, type, rank/file and that's about it. 
*/

function Invader(x, y, rank, file, type) {
    this.x = x;
    this.y = y;
    this.rank = rank;
    this.file = file;
    this.type = type;
    this.width = 18;
    this.height = 24;
}

/*
    Bonus

    Bonus have position and can be collected by ships.
*/

function Bonus(x, y, velocity) {
    this.x = x;
    this.y = y;
    this.velocity = velocity;
    this.width = 20;
    this.height = 20;
}

/*
    Game State

    A Game State is simply an update and draw proc.
    When a game is in the state, the update and draw procs are
    called, with a dt value (dt is delta time, i.e. the number)
    of seconds to update or draw).

*/
function GameState(updateProc, drawProc, keyDown, keyUp, enter, leave) {
    this.updateProc = updateProc;
    this.drawProc = drawProc;
    this.keyDown = keyDown;
    this.keyUp = keyUp;
    this.enter = enter;
    this.leave = leave;
}

/*

    Sounds

    The sounds class is used to asynchronously load sounds and allow
    them to be played.

*/
function Sounds() {

    //  The audio context.
    this.audioContext = null;

    //  The actual set of loaded sounds.
    this.sounds = {};
}

Sounds.prototype.init = function() {

    //  Create the audio context, paying attention to webkit browsers.
    context = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new context();
    this.mute = false;
};

Sounds.prototype.loadSound = function(name, url) {

    //  Reference to ourselves for closures.
    let self = this;

    //  Create an entry in the sounds object.
    this.sounds[name] = null;

    //  Create an asynchronous request for the sound.
    let req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.responseType = 'arraybuffer';
    req.onload = function() {
        self.audioContext.decodeAudioData(req.response, function(buffer) {
            self.sounds[name] = {buffer: buffer};
        });
    };
    try {
      req.send();
    } catch(e) {
      console.log("An exception occured getting sound the sound " + name + " this might be " +
         "because the page is running from the file system, not a webserver.");
      console.log(e);
    }
};

Sounds.prototype.playSound = function(name) {

    //  If we've not got the sound, don't bother playing it.
    if(this.sounds[name] === undefined || this.sounds[name] === null || this.mute === true) {
        return;
    }

    //  Create a sound source, set the buffer, connect to the speakers and
    //  play the sound.
    let source = this.audioContext.createBufferSource();
    source.buffer = this.sounds[name].buffer;
    source.connect(this.audioContext.destination);
    source.start(0);
};
