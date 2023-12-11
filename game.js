const game = new Phaser.Game(600, 800, Phaser.CANVAS, '', {
    preload: preload,
    create: create,
    update: update,
});

function preload () {
    game.load.image("bg", "assets/starfield.png");
    game.load.image("ship", "assets/player.png");
    game.load.image("bullet", "assets/bullet.png");
    game.load.image("alienBullet", "assets/enemy-bullet.png");
    game.load.image("alien", "assets/invader.png");
    game.load.spritesheet("explosion", "assets/explode.png", 2048/16, 128);
}

var bulletDelayTime = 0;
var alienBulletDelayTime = 0;
var livingAliens = [];
var scoreString = "";
var score = 0;
var difficultyMultiplier = 1;

function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // Add Infinitely repeating Background
    bg = game.add.tileSprite(0,0, game.width, game.height, "bg");

    // Add control inputs
    cursors = game.input.keyboard.createCursorKeys();
    fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    //Add Player
    player = game.add.sprite(game.width/2, game.height-100, "ship");
    player.anchor.setTo(0.5, 0.5);
    game.physics.enable(player, Phaser.Physics.ARCADE);
    player.body.collideWorldBounds = true;

    //Add Player Bullets
    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;
    bullets.createMultiple(30, "bullet");
    bullets.setAll("anchor.x", 0.5);
    bullets.setAll("anchor.y", 1);
    bullets.setAll("outOfBoundsKill", true);
    bullets.setAll("checkWorldBounds", true);

    // Add enemies
    aliens = game.add.group();
    aliens.enableBody = true;
    aliens.physicsBodyType = Phaser.Physics.ARCADE;
    aliens.setAll("outOfBoundsKill", true);
    aliens.setAll("checkWorldBounds", true);

    addAliens();

    // Add enemy bullets
    alienBullets = game.add.group();
    alienBullets.enableBody = true;
    alienBullets.physicsBodyType = Phaser.Physics.ARCADE;
    alienBullets.createMultiple(30, "alienBullet");
    alienBullets.setAll("anchor.x", 0.5);
    alienBullets.setAll("anchor.y", 1);
    alienBullets.setAll("outOfBoundsKill", true);
    alienBullets.setAll("checkWorldBounds", true);

    // Add explosions
    explosions = game.add.group();
    explosions.createMultiple(30, "explosion");
    explosions.forEach(addExplosionToEntity, this);

    // Add Score Text
    scoreString = "SCORE : ";
    scoreText = game.add.text(10,10, scoreString + score, {
        font: "24px Arial",
        fill: "#FFF"
    });

    // Add Lives
    lives = game.add.group();
    game.add.text(10,40, "LIVES : ", {
        font: "24px Arial",
        fill: "#FFF"
    });

    for (var i = 0; i < 3; i++) {
        var life = lives.create(25 + i*35, 80, "ship");
        life.anchor.setTo(0.5, 0.5);
    }

    // Add Pause button
    pause_button = game.add.text(game.width-100, 20, "Pause", {
        font: "24px Arial",
        fill: "#FFF"
    });
    pause_button.inputEnabled = true;
    pause_button.events.onInputUp.add(function () {
        game.paused = true;
        pause_button.text = "Resume";
    });
    game.input.onDown.add(unpauseGame, self);

    // Add Main Text
    mainText = game.add.text(game.world.centerX,game.world.centerY, 
        `Space Invader\nInstructions:\n1.Arrow keys to move\n2.Space bar to shoot\n\nClick anywhere to start`, {
            font: "24px Arial",
            fill: "#FFF"
        });
    mainText.anchor.setTo(0.5, 0.5);
    mainText.visible = true;

    game.paused = true;


}

function unpauseGame(event) {
    if (game.paused) {
        game.paused = false;
        pause_button.text = "Pause";
        mainText.visible = false;
    }
}

function update() {

    // move background unconditionally
    bg.tilePosition.y += 3;

    if (player.alive) {
        player.body.velocity.setTo(0,0);
        aliens.y += 0.2 * difficultyMultiplier;

        if (cursors.left.isDown) {
            player.body.velocity.x = -200;
        } else if (cursors.right.isDown) {
            player.body.velocity.x = 200;
        }

        if (fireButton.isDown) {
            fireBullet();
        }

        if (game.time.now > alienBulletDelayTime/difficultyMultiplier) {
            fireEnemyBullet();
        }

        if (aliens.y > 800) {
            aliens.callAll("kill");
            difficultyMultiplier += 0.2;
            addAliens();
        }

        game.physics.arcade.overlap(bullets, aliens, bulletHitsAlien, null, this);
        game.physics.arcade.overlap(player, alienBullets, alienBulletHitsPlayer, null, this);
        game.physics.arcade.overlap(player, aliens, alienHitsPlayer, null, this);
    }
}

function addAliens() {
    for (var i = 0; i < 20; i++) {
        for (var j = 0; j < 10; j++) {
            var alien = aliens.create(i*20,j*20, "alien");
            alien.anchor.setTo(0.5, 0.5);
            alien.body.moves = false;
        }
    }

    aliens.x = 10;
    aliens.y = 10;

    game.add.tween(aliens).to({x: 200} , 2000/difficultyMultiplier , Phaser.Easing.Linear.None , true , 0 , 1000 , true)
}

function fireBullet() {
    if (game.time.now > bulletDelayTime) {
        bullet = bullets.getFirstExists(false);
        if (bullet) {
            bullet.reset(player.x, player.y);
            bullet.body.velocity.y = -500;
            bulletDelayTime = game.time.now + 100;
        }
    }
}

function fireEnemyBullet() {
    alienBullet = alienBullets.getFirstExists(false);
    livingAliens.length = 0;

    aliens.forEachAlive(function(alien) {
        livingAliens.push(alien);
    });

    if (alienBullet && livingAliens.length > 0) {
        var random = game.rnd.integerInRange(0, livingAliens.length-1);
        var alienShooter = livingAliens[random];
        alienBullet.reset(alienShooter.body.x, alienShooter.body.y);
        game.physics.arcade.moveToObject(alienBullet, player, 100);
        alienBulletDelayTime = game.time.now + 2000;
    }
}

function bulletHitsAlien(bullet, alien) {
    bullet.kill();
    alien.kill();

    var explosion = explosions.getFirstExists(false);
    explosion.reset(alien.body.x, alien.body.y);
    explosion.play("explosion", 30, false, true);

    score += 20 * difficultyMultiplier;
    scoreText.text = scoreString + score;
    
    if (aliens.countLiving() == 0) {
        score += 1000 * difficultyMultiplier;
        scoreText.text = scoreString + score;

        difficultyMultiplier += 0.2;

        alienBullets.callAll("kill");
        addAliens();
    }
}

function alienBulletHitsPlayer(player, bullet) {
    bullet.kill();

    playerGotHit();
}

function alienHitsPlayer(player, alien) {
    alien.kill();

    playerGotHit();
}

function playerGotHit() {
    life = lives.getFirstAlive();
    if (life) {
        life.kill();
    }

    if (lives.countLiving() < 1) {
        player.kill();
        alienBullets.callAll("kill");
        bullets.callAll("kill");
        gameOver();
    }

    var explosion = explosions.getFirstExists(false);
    explosion.reset(player.body.x, player.body.y);
    explosion.play("explosion", 30, false, true);
}

function addExplosionToEntity(entity) {
    entity.anchor.x = 0.5;
    entity.anchor.y = 0.5;
    entity.animations.add("explosion");
}

function gameOver() {
    mainText.text = `Game Over!\nYour score: ${score}\n\nClick anywhere to restart`;
    mainText.visible = true;
    game.paused = true;
    resetGame();
}

function resetGame() {
    lives.callAll("revive");
    aliens.removeAll();
    bullets.callAll("kill");
    alienBullets.callAll("kill");
    addAliens();
    player.revive();
}