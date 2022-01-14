const Snake_Scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
// innerWidth / - 2, innerWidth / 2, innerHeight / 2, innerHeight / - 2, 1, 1000
const renderer = new THREE.WebGL1Renderer();

function startup() {
    renderer.setSize(innerWidth, innerHeight);
    document.body.appendChild(renderer.domElement);
    Snake_Scene.add(camera);
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(Snake_Scene, camera);

}

startup();