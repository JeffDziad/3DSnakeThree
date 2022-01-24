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
const GAME_WIDTH = 600;
const GAME_HEIGHT = 600;
const TILE_SIZE = 25;
const COLS = GAME_WIDTH / TILE_SIZE;
const ROWS = GAME_HEIGHT / TILE_SIZE;
const GAME_SPEED = 5;
const APPLE_COUNT = 2;

const Tile_Grid = [];
const Walls = [];
const Apples = [];
class Tile {
    constructor(x = 0, y = 0, z = 0, color = 0xffffff) {
        this.geometry = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
        this.material = new THREE.MeshPhongMaterial({color: color, side: THREE.DoubleSide});
        this.mesh = new THREE.Mesh(this.geometry, this.material);

        this.mesh.position.x = x;
        this.mesh.position.y = y;
        this.mesh.position.z = z;

        this.headPresent = false;
    }

    update() {

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
class Apple {
    constructor() {
    }
}

class SnakePart {

}

class SnakeHead {
    constructor(color=0x0000ff) {
        this.geometry = new THREE.SphereGeometry(13, 32, 16);
        this.material = new THREE.MeshPhongMaterial({color: color});
        this.mesh = new THREE.Mesh(this.geometry, this.material);

        this.mesh.position.z -= 6;

        // Start Head at top right corner.
        this.mesh.position.x = Tile_Grid[0].mesh.position.x;
        this.mesh.position.y = -Tile_Grid[0].mesh.position.y;

        this.directionChange = DIRECTIONS.RIGHT;
        this.direction = DIRECTIONS.RIGHT;
        this.velocity = {
            x: 1.0,
            y: 1.0
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
    }
    update() {
        if(this.inProgress) {
            this.head.update();
        }
    }
    start() {
        this.inProgress = true;
        this.clock = setInterval(() => {
            this.update();
        }, GAME_SPEED);
    }
    stop() {
        this.inProgress = false;
        clearInterval(this.clock);
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

    for (const tileGridElement of Tile_Grid) {
        tileGridElement.update();
        tileGridElement.checkOccupants();
    }
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
    const wallMaterial = new THREE.LineBasicMaterial({color: 0xff0000, linewidth: lineWidth});
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