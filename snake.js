const snakeScene = new THREE.Scene();
const Renderer = new THREE.WebGL1Renderer();
const RATIO = 3.6;
const Camera = new THREE.OrthographicCamera(innerWidth / -RATIO, innerWidth / RATIO, innerHeight / RATIO, innerHeight / -RATIO, 1, 1000);
// const Camera = new THREE.PerspectiveCamera(150, 1, 0.1, 2000);
const Light = new THREE.DirectionalLight(0xffffff);
const currentScene = snakeScene;

const raycaster = new THREE.Raycaster();

const GAME_WIDTH = 600;
const GAME_HEIGHT = 600;
const TILE_SIZE = 25;
const COLS = GAME_WIDTH / TILE_SIZE;
const ROWS = GAME_HEIGHT / TILE_SIZE;
const GAME_SPEED = 10;

const Tile_Grid = [];
const Walls = [];
class Tile {
    constructor(x=0, y=0, z=0, color=0xffffff) {
        this.geometry = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
        this.material = new THREE.MeshPhongMaterial({color: color, side: THREE.DoubleSide});
        this.mesh = new THREE.Mesh(this.geometry, this.material);

        this.mesh.position.x = x;
        this.mesh.position.y = y;
        this.mesh.position.z = z;
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

        this.directionChange = "right";
        this.direction = "right";
        this.velocity = {
            x: 2.0,
            y: 2.0
        }
        snakeScene.add(this.mesh);
    }
    update() {
        // Get new position and check for collisions (walls, body parts, apples).
        if(this.directionChange !== this.direction) {
            if(centeredOnTile(this.mesh.position)) {
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
            case "up":
                this.up();
                break;
            case "down":
                this.down();
                break;
            case "left":
                this.left();
                break;
            case "right":
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
    // Apply styling to Grid Tiles.
    for (const tile of Tile_Grid) {

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
            currentGame.head.directionChange = "up";
            break;
        case "A":
            currentGame.head.directionChange = "left";
            break;
        case "S":
            currentGame.head.directionChange = "down";
            break;
        case "D":
            currentGame.head.directionChange = "right";
            break;
        default:
            break;
    }
});

startup();