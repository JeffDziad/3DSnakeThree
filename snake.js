const snakeScene = new THREE.Scene();
const Renderer = new THREE.WebGL1Renderer();
const RATIO = 3.6;
const Camera = new THREE.OrthographicCamera(innerWidth / -RATIO, innerWidth / RATIO, innerHeight / RATIO, innerHeight / -RATIO, 1, 1000);
// const Camera = new THREE.PerspectiveCamera(150, 1, 0.1, 2000);
const Light = new THREE.DirectionalLight(0xffffff);
const currentScene = snakeScene;
const raycaster = new THREE.Raycaster();

const DIRECTIONS = {
    UP: {
        val: 2
    },
    DOWN: {
        val: 4
    },
    LEFT: {
        val: 1
    },
    RIGHT: {
        val: 3
    }
}

const ITEM = {
    APPLE: {
        color: 0xff0000,
        str: "Apple",
        action: function() {
            currentGame.addPart();
        }
    }
}

const GAME_WIDTH = 600;
const GAME_HEIGHT = 600;
const TILE_SIZE = 25;
const COLS = GAME_WIDTH / TILE_SIZE;
const ROWS = GAME_HEIGHT / TILE_SIZE;
const APPLE_COUNT = 1;

const Tile_Grid = [];
const Walls = [];
const Items = [];

class Item {
    constructor(x, y, z, type) {
        this.type = type;

        this.geometry = new THREE.SphereGeometry(5, 5, 5);
        this.material = new THREE.MeshPhongMaterial({color: this.type.color});
        this.mesh = new THREE.Mesh(this.geometry, this.material);

        this.mesh.position.x = x;
        this.mesh.position.y = y;
        this.mesh.position.z = z;

        this.expended = false;
        currentScene.add(this.mesh);
    }
    update() {
        if(!this.expended) {
            this.type.action();
            this.expended = true;
            // Remove item after its action is performed;
            let i = Items.indexOf(this);
            if(i !== -1) {
                Items.splice(i, 1);
                currentScene.remove(this.mesh);
            }
        }
    }
}

class Tile {
    constructor(x = 0, y = 0, z = 0, color = 0xffffff) {
        this.geometry = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
        this.material = new THREE.MeshPhongMaterial({color: color, side: THREE.DoubleSide});
        this.mesh = new THREE.Mesh(this.geometry, this.material);

        this.mesh.position.x = x;
        this.mesh.position.y = y;
        this.mesh.position.z = z;

        this.headPresent = false;
        this.item = null;
    }

    assignItem(type) {
        let pos = this.mesh.position;
        this.item = new Item(pos.x, pos.y, pos.z, type);
        Items.push(this.item);
    }

    update() {
        this.checkOccupants();
        if(this.item != null) {
            if(this.headPresent) {
                // Do item action
                this.item.update();
                this.item = null;
            }
        }
    }

    checkOccupants() {
        // Check for snake head. Possibly detect snake parts later.
        let head = currentGame.head;
        if (head.mesh.position.x > this.mesh.position.x - TILE_SIZE / 2 && head.mesh.position.x < this.mesh.position.x + TILE_SIZE / 2) {
            // Intersects on x
            if (head.mesh.position.y < this.mesh.position.y + TILE_SIZE / 2 && head.mesh.position.y > this.mesh.position.y - TILE_SIZE / 2) {
                // Intersects on y
                this.headPresent = true;
            } else {
                this.headPresent = false;
            }
        } else {
            this.headPresent = false;
        }
    }
}

class SnakePart {
    constructor(pos, initialDirection) {
        this.geometry = new THREE.SphereGeometry(13, 32, 16);
        this.material = new THREE.MeshPhongMaterial({color: 0x00ff00});
        this.mesh = new THREE.Mesh(this.geometry, this.material);

        this.mesh.position.x = pos.x;
        this.mesh.position.y = pos.y;
        this.mesh.position.z = pos.z;

        this.direction = initialDirection;
        this.velocity = {
            x: 2.5,
            y: 2.5
        }

        this.placed = false;

        this.actions = [];

        currentScene.add(this.mesh);
    }
    moveWhen(pos, direction) {
        this.actions.push({pos: pos, direction: direction});
    }
    update() {
        for (let action of this.actions) {
            if(action.pos.x === this.mesh.position.x && action.pos.y === this.mesh.position.y) {
                let index = this.actions.indexOf(action);
                this.actions.splice(index, 1);
                this.direction = action.direction;
            }
        }
        this.move(this.direction);
    }
    move(direction) {
        switch (direction.val) {
            case 2:
                this.up();
                break;
            case 4:
                this.down();
                break;
            case 1:
                this.left();
                break;
            case 3:
                this.right();
                break;
        }
    }
    up() {
        this.mesh.position.y = this.mesh.position.y + this.velocity.y;
    }
    down() {
        this.mesh.position.y = this.mesh.position.y - this.velocity.y;
    }
    left() {
        this.mesh.position.x = this.mesh.position.x - this.velocity.x;
    }
    right() {
        this.mesh.position.x = this.mesh.position.x + this.velocity.x;
    }
}

class SnakeHead {
    constructor(color=0x0000ff) {
        this.geometry = new THREE.SphereGeometry(15, 32, 16);
        this.material = new THREE.MeshPhongMaterial({color: color});
        this.mesh = new THREE.Mesh(this.geometry, this.material);

        this.mesh.position.z -= 6;

        // Start Head at top right corner.
        this.mesh.position.x = Tile_Grid[0].mesh.position.x;
        this.mesh.position.y = -Tile_Grid[0].mesh.position.y;

        this.directionChange = DIRECTIONS.RIGHT;
        this.direction = DIRECTIONS.RIGHT;
        this.velocity = {
            x: 2.5,
            y: 2.5
        }
        snakeScene.add(this.mesh);
    }
    update() {
        // Get new position and check for collisions (walls, body parts, apples).
        if(this.directionChange !== this.direction) {
            let d1 = this.direction.val;
            let d2 = this.directionChange.val;
            if(isEven(d1) && isEven(d2)) {
                this.direction = this.directionChange;
                this.move(this.direction);
            } else if(isOdd(d1) && isOdd(d2)) {
                this.direction = this.directionChange;
                this.move(this.direction);
            } else if(centeredOnTile(this.mesh.position)) {
                // Change Direction
                this.direction = this.directionChange;

                // Instruct all parts to make same move.
                let pos = this.mesh.position;
                let dir = this.direction;
                currentGame.allPartsMoveWhen(JSON.parse(JSON.stringify(pos)), JSON.parse(JSON.stringify(dir)));

                this.move(this.direction);


            } else {
                this.move(this.direction);
            }
        } else {
            this.move(this.direction);
        }
        this.checkCollisions();
    }
    checkCollisions() {
        let pos = this.mesh.position;
        if(pos.x > Tile_Grid[Tile_Grid.length-1].mesh.position.x || pos.x < Tile_Grid[0].mesh.position.x) {
            // X Wall Collision
            currentGame.stop();
        }
        if(pos.y < Tile_Grid[0].mesh.position.y || pos.y > Tile_Grid[Tile_Grid.length-1].mesh.position.y) {
            // Y Wall Collision
            currentGame.stop();
        }
    }
    move(direction) {
        switch (direction) {
            case DIRECTIONS.UP:
                this.up();
                break;
            case DIRECTIONS.DOWN:
                this.down();
                break;
            case DIRECTIONS.LEFT:
                this.left();
                break;
            case DIRECTIONS.RIGHT:
                this.right();
                break;
        }
    }
    up() {
        this.mesh.position.y = this.mesh.position.y + this.velocity.y;
    }
    down() {
        this.mesh.position.y = this.mesh.position.y - this.velocity.y;
    }
    left() {
        this.mesh.position.x = this.mesh.position.x - this.velocity.x;
    }
    right() {
        this.mesh.position.x = this.mesh.position.x + this.velocity.x;
    }
}

class SnakeGame {
    constructor() {
        this.head = new SnakeHead();
        this.inProgress = false;

        this.queuedParts = 0;
        this.parts = [];
    }
    addPart() {
        this.queuedParts++;
    }
    allPartsMoveWhen(pos, direction) {
        for(let i = 0; i <= this.parts.length-1; i++) {
            let p = this.parts[i];
            p.moveWhen(pos, direction);
        }
    }
    update() {
        if(this.inProgress) {
            for(let i = 0; i <= this.parts.length-1; i++) {
                let p = this.parts[i];
                p.update();
            }
            if(this.queuedParts > 0) {
                // There are parts to add.
                if(centeredOnTile(this.head.mesh.position)) {
                    // Parts can only be added when the head is centered on a tile.
                    if(this.parts.length <= 0) {
                        // There are no parts, use head to determine spawn spot.
                        let opposingDirection = getOpposingDirection(currentGame.head.direction.val);
                        let findHeadTileDetails = findTile(function(tile) {
                            return tile.headPresent;
                        });
                        let newPartTile = Tile_Grid[getTileShiftedIndex(findHeadTileDetails.index, opposingDirection)];
                        this.parts.push(new SnakePart(newPartTile.mesh.position, this.head.direction));
                        this.queuedParts--;
                    } else {
                        // There are parts, use last part added to determine next spot.
                        let lastPart = this.parts[this.parts.length-1];
                        if(centeredOnTile(lastPart.mesh.position)) {
                            let findTileDetails = findTile(function(tile) {
                                if(tile.mesh.position.x === lastPart.mesh.position.x && tile.mesh.position.y === lastPart.mesh.position.y) {
                                    return true;
                                }
                            });
                            let opposingDirection = getOpposingDirection(lastPart.direction.val);
                            let newPartTile = Tile_Grid[getTileShiftedIndex(findTileDetails.index, opposingDirection)];
                            this.parts.push(new SnakePart(newPartTile.mesh.position, lastPart.direction));
                            this.queuedParts--;
                        }
                    }
                }
            }

            this.head.update();
        }
    }
    start() {
        this.inProgress = true;
        // this.clock = setInterval(() => {
        //     this.update();
        // }, GAME_SPEED);
    }
    stop() {
        this.inProgress = false;
        // clearInterval(this.clock);
    }
}

function centeredOnTile(position) {
    for (let tile of Tile_Grid) {
        if(tile.mesh.position.x === position.x && tile.mesh.position.y === position.y) return true;
    }
    return false;
}

function isEven(n) {
    return n % 2 === 0;
}

function isOdd(n) {
    return Math.abs(n % 2) === 1;
}

function findTile(validateFunc) {
    for (let i = 0; i < Tile_Grid.length-1; i++) {
        let t = Tile_Grid[i];
        let valid = validateFunc(t);
        if(valid) {
            return { index: i, tile: t};
        }
    }
}

let currentGame;

function startup() {
    // 1. Setup canvas size and append to index.html
    Renderer.setSize(innerWidth, innerHeight);
    document.body.appendChild(Renderer.domElement);
    // 2. Add camera and its temporary helper
    snakeScene.add(Camera);
    //? snakeScene.add(new THREE.CameraHelper(Camera));
    Camera.position.set(0, 0, 100);
    // 3. Add Lighting
    Light.position.set(0, 0, 10).normalize();
    snakeScene.add(Light);
    // 4. Setup Snake Scene Walls and Tiles
    wallsAndTiles();
    // 5. Create SnakeGame Instance.
    currentGame = new SnakeGame();
    currentGame.start();
    // 6. Start animating the current scene
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    Renderer.render(currentScene, Camera);

    currentGame.update();

    handleAppleItems();

    for (const tile of Tile_Grid) {
        tile.update();
    }
}

function handleAppleItems() {
    let presentApples = 0;
    for (let tile of Tile_Grid) {
        if(tile.item != null && tile.item.type === ITEM.APPLE) {
            presentApples++;
        }
    }
    for(let i = 0; i < APPLE_COUNT - presentApples; i++) {
        let tile = getTileNoItem();
        tile.assignItem(ITEM.APPLE);
    }
}

function getTileNoItem() {
    while(true) {
        let i = Math.floor(randInRange(0, Tile_Grid.length-1));
        if(Tile_Grid[i].item === null) {
            return Tile_Grid[i];
        }
    }
}

function randInRange(min, max) {
    return Math.random() * (max - min) + min;
}

function wallsAndTiles() {
    // * Tiles
    // Shift coordinates to properly center the grid.
    let xOffset = ((COLS - 1) * TILE_SIZE) / 2;
    let yOffset = ((ROWS - 1) * TILE_SIZE) / 2;
    for(let y = 0;  y < ROWS; y++) {
        for(let x = 0; x < COLS; x++) {
            let t = new Tile((x * TILE_SIZE) - xOffset, (y * TILE_SIZE) - yOffset, 0);
            snakeScene.add(t.mesh);
            Tile_Grid.push(t);
        }
    }
    // * Wall Lines
    let lineWidth = 5;
    const wallMaterial = new THREE.LineBasicMaterial({color: 0xff8000, linewidth: lineWidth});
    const points = [];
    points.push(new THREE.Vector3(-xOffset - (TILE_SIZE/2), yOffset + (TILE_SIZE/2), 0));
    points.push(new THREE.Vector3(xOffset + (TILE_SIZE/2), yOffset + (TILE_SIZE/2), 0));
    points.push(new THREE.Vector3(xOffset + (TILE_SIZE/2), -yOffset - (TILE_SIZE/2), 0));
    points.push(new THREE.Vector3(-xOffset - (TILE_SIZE/2), -yOffset - (TILE_SIZE/2), 0));
    points.push(new THREE.Vector3(-xOffset - (TILE_SIZE/2), yOffset + (TILE_SIZE/2), 0));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, wallMaterial);
    Walls.push(line);
    snakeScene.add(line);
}

function getTileShiftedIndex(startIndex, direction) {
    switch(direction) {
        case 1:
            return startIndex-1;
        case 2:
            return startIndex+ROWS;
        case 3:
            return startIndex+1;

        case 4:
            return startIndex-ROWS;

    }
}

function getOpposingDirection(dir) {
    switch (dir) {
        case 1:
            return 3;
        case 2:
            return 4;
        case 3:
            return 1;
        case 4:
            return 2;
    }
}

addEventListener('resize', () => {
    Camera.aspect = window.innerWidth / window.innerHeight;
    Camera.updateProjectionMatrix();
    Renderer.setSize(innerWidth, innerHeight);
});

addEventListener('keydown', (event) => {
    let key = event.key;
    switch(key.toUpperCase()) {
        case "W":
            currentGame.head.directionChange = DIRECTIONS.UP;
            break;
        case "A":
            currentGame.head.directionChange = DIRECTIONS.LEFT;
            break;
        case "S":
            currentGame.head.directionChange = DIRECTIONS.DOWN;
            break;
        case "D":
            currentGame.head.directionChange = DIRECTIONS.RIGHT;
            break;
        default:
            break;
    }
});

startup();