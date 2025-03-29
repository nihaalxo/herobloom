// main.js (example)
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";


import { GUI } from "../../node_modules/lil-gui/dist/lil-gui.esm.min.js";

// Parameters for bloom and tone mapping
const params = { exposure: 0.5, bloomThreshold: 0.373, bloomStrength: 0.75, bloomRadius: 1.0 };

// Create renderer, scene, and camera
const container = document.getElementById("container");
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = params.exposure;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(38.6, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.setFocalLength(50);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.minPolarAngle = Math.PI / 2;
controls.maxPolarAngle = Math.PI / 2;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(0, 5, 5);
scene.add(directionalLight);

// ------------------------------
// Selective Bloom Setup using Layers
// ------------------------------
const bloomLayer = new THREE.Layers();
bloomLayer.set(1);

// ------------------------------
// Set up DRACOLoader and GLTFLoader for Draco compressed models
// ------------------------------
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("./node_modules/draco3d/"); // Ensure this path is correct
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

// ------------------------------
// Load Model and assign bloom layer selectively based on userData.bloom
// ------------------------------
loader.load("models/superherov7.glb", (gltf) => {
  const model = gltf.scene;
  
  // Center model at its feet
  const box = new THREE.Box3().setFromObject(model);
  const feet = new THREE.Vector3(
    (box.min.x + box.max.x) / 2, 
    box.min.y, 
    (box.min.z + box.max.z) / 2
  );
  model.position.sub(feet);
  model.scale.set(0.5, 0.5, 0.5);
  
  // Calculate approximate hips position to use as orbit target
  const scaledBox = new THREE.Box3().setFromObject(model);
  const modelHeight = scaledBox.max.y - scaledBox.min.y;
  const hips = scaledBox.min.y + modelHeight * 0.5;
  controls.target.set(0, hips, 0);
  camera.position.set(0, hips, 4);
  controls.update();

  // Traverse the model and assign bloom layer only if userData.bloom === "true"
  model.traverse((child) => {
    if (child.isMesh) {
      console.log(`Mesh: ${child.name}, userData:`, child.userData);
      if (child.userData.bloom === "true") {
        child.layers.enable(1); // assign to bloom layer
        if (child.material && "emissive" in child.material) {
          child.material.emissive.setHex(0x00fcff);
          child.material.emissiveIntensity = 100;
        }
      } else {
        child.layers.disable(1);
      }
    }
  });
  scene.add(model);
}, undefined, (error) => { 
  console.error("Error loading model:", error); 
});

// ------------------------------
// Postprocessing Setup
// ------------------------------
const renderPass = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  params.bloomStrength,
  params.bloomRadius,
  params.bloomThreshold
);
const composer = new EffectComposer(renderer);
composer.addPass(renderPass);
composer.addPass(bloomPass);
const finalPass = new ShaderPass(new THREE.ShaderMaterial({
  uniforms: {
    baseTexture: { value: null },
    bloomTexture: { value: composer.renderTarget2.texture }
  },
  vertexShader: document.getElementById("vertexshader").textContent,
  fragmentShader: document.getElementById("fragmentshader").textContent,
  defines: {}
}), "baseTexture");
finalPass.needsSwap = true;
composer.addPass(finalPass);

// ------------------------------
// Animation Loop – single composer render pass
// ------------------------------
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  composer.render();
}
animate();

// ------------------------------
// Handle window resize
// ------------------------------
window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  composer.setSize(width, height);
});
