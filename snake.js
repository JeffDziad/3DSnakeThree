const snakeScene = new THREE.Scene();
const Renderer = new THREE.WebGL1Renderer();
const Camera = new THREE.OrthographicCamera(innerWidth / -4, innerWidth / 4, innerHeight / 4, innerHeight / -4, 1, 1000);
//! const Camera = new THREE.PerspectiveCamera(75, 1, 0.1, 2000);
const Light = new THREE.DirectionalLight(0xffffff);
const currentScene = snakeScene;

const GAME_WIDTH = 400;
const GAME_HEIGHT = 400;
const TILE_SIZE = 25;
const COLS = GAME_WIDTH / TILE_SIZE;
const ROWS = GAME_HEIGHT / TILE_SIZE;
const GAME_SPEED = 300;

const Tile_Grid = [];
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

        this.mesh.position.x = Tile_Grid[0].mesh.position.x;
        this.mesh.position.y = -Tile_Grid[0].mesh.position.y;
        snakeScene.add(this.mesh);
    }
    update() {

    }
}

class SnakeGame {
    constructor() {
        this.head = new SnakeHead();
    }
    update() {
        this.head.update();
    }
    updateClock() {
        clearInterval(this.clock);
        this.clock = setInterval(() => {
            this.update();
        }, GAME_SPEED);
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
    Camera.position.set(0, 0, 10);
    // 3. Add Lighting
    Light.position.set(0, 0, 10).normalize();
    snakeScene.add(Light);
    // 4. Setup Snake Scene Walls and Tiles
    wallsAndTiles();
    // 5. Create SnakeGame Instance.
    currentGame = new SnakeGame();
    currentGame.updateClock();
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
    let walls = [];
    const wallMaterial = new THREE.LineBasicMaterial({color: 0xff0000, linewidth: lineWidth});
    const points = [];
    points.push(new THREE.Vector3(-xOffset - (TILE_SIZE/2), yOffset + (TILE_SIZE/2), 0));
    points.push(new THREE.Vector3(xOffset + (TILE_SIZE/2), yOffset + (TILE_SIZE/2), 0));
    points.push(new THREE.Vector3(xOffset + (TILE_SIZE/2), -yOffset - (TILE_SIZE/2), 0));
    points.push(new THREE.Vector3(-xOffset - (TILE_SIZE/2), -yOffset - (TILE_SIZE/2), 0));
    points.push(new THREE.Vector3(-xOffset - (TILE_SIZE/2), yOffset + (TILE_SIZE/2), 0));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, wallMaterial);
    walls.push(line);
    snakeScene.add(line);
}

startup();