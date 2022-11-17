

// Main file for engine

// check the @@


// create scene
const scene = new THREE.Scene();

// create camera wrapper (which will be aligned to north and moved by GPS)
const CameraWrapper = new THREE.Object3D();
CameraWrapper.position.set(0, 0, 0.01);

// create perspective camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
camera.position.set(0, 0, 0);

// append camera to camera wrapper
CameraWrapper.add(camera);
scene.add(CameraWrapper);

// create laser (for pointing to objects)
let laser = new THREE.Object3D();
camera.add(laser);

// create device binded controls
var DevControls = new DeviceOrientationController( camera, null );
DevControls.connect();



// render function - runs every frame
function render() {
  
  // update player position to next_pos from GPS
  UpdateCameraPos();

  // get updated rotation sensor readings
  DevControls.update();
  
  requestAnimationFrame(gameLoop);
  
}

// call render function
render();


// init location module
InitMovement();

// init rotation module
InitRot();

