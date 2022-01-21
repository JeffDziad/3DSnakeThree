const snakeScene = new THREE.Scene();
const Renderer = new THREE.WebGL1Renderer();
const Camera = new THREE.OrthographicCamera(innerWidth / -8, innerWidth / 8, innerHeight / 8, innerHeight / -8, 1, 1000);
const Light = new THREE.DirectionalLight(0xffffff);
const currentScene = snakeScene;

const GAME_WIDTH = 200;
const GAME_HEIGHT = 200;
const TILE_SIZE = 25;
const COLS = GAME_WIDTH / TILE_SIZE;
const ROWS = GAME_HEIGHT / TILE_SIZE;

const Tile_Grid = [];
class Tile {
    constructor(x=0, y=0, z=0, color=0xffff00) {
        this.geometry = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
        this.material = new THREE.MeshPhongMaterial({color: color, side: THREE.DoubleSide});
        this.mesh = new THREE.Mesh(this.geometry, this.material);

        this.mesh.position.x = x;
        this.mesh.position.y = y;
        this.mesh.position.z = z;
    }
}

function startup() {
    // 1. Setup canvas size and append to index.html
    Renderer.setSize(innerWidth, innerHeight);
    document.body.appendChild(Renderer.domElement);
    // 2. Add camera and its temporary helper
    snakeScene.add(Camera);
    snakeScene.add(new THREE.CameraHelper(Camera));
    Camera.position.set(0, 0, 10);
    // 3. Add Lighting
    Light.position.set(0, 0, 10).normalize();
    snakeScene.add(Light);
    // 4. Start animating the current scene
    animate();

    grid();
}

function animate() {
    requestAnimationFrame(animate);
    Renderer.render(currentScene, Camera);
}

function grid() {
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
}

startup();