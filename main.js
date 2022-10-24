

//Main file for 3D localization engine 




//Create texture loader and scene:
const scene = new THREE.Scene();

//Create the camera wrapper - he will be aligned  to north and moved by GPS:
const CameraWrapper = new THREE.Object3D();
CameraWrapper.position.set(0, 0, 0.01 );

//Define perspective camera:
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100000 );
camera.position.set(0, 0, 0 );

//Set camera as camera wrapper child:
CameraWrapper.add(camera);
scene.add(CameraWrapper);

//Add laser for pointing to objects
let laser = new THREE.Object3D();
camera.add(laser);

//Set up the arrow:
const arrowEl = document.createElement( 'div' );
arrowEl.innerHTML = '<div class="arrow" style="font-size: 90px;rotate: -90deg">➤</div>';

//const arrowEl = document.querySelector('.log');
let arrow = new COOLObject( arrowEl );
arrow.x= CameraWrapper.position.x;
arrow.y= CameraWrapper.position.y;
arrow.z = CameraWrapper.position.z;
laser.add(arrow);



//Create texture plane:
const loader = new THREE.TextureLoader();
const material1 = new THREE.MeshBasicMaterial({
    map: loader.load('./border.png'),
});
const planeGeo = new THREE.PlaneGeometry( 500, 500, 1000 );
const mesh = new THREE.Mesh(planeGeo, material1);
mesh.rotation.x = Math.PI * -.5;
mesh.position.y = -10;
mesh.position.z = -10;
function addPlane() {
  scene.add(mesh);
}



//Create css scene:
const scene2 = new THREE.Scene();
scene2.add(CameraWrapper);

//Create COOL renderer:
var cssRenderer = new COOLRenderer();
cssRenderer.setSize( window.innerWidth, window.innerHeight );
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = 0;
document.body.appendChild( cssRenderer.domElement );






//Create Renderer:
const renderer = new THREE.WebGLRenderer( { alpha: true } );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = 0;
document.body.appendChild( renderer.domElement);


var TargetObjectGlob=null;

//Create device binded controls:
var DevControls = new DeviceOrientationController( camera, renderer.domElement );
DevControls.connect();


//Animate function for rendering:
const animate = function () {
  
  //Update player position to next_pos - is updated from GPS
  UpdateCameraPos(next_pos);

  DevControls.update();
  requestAnimationFrame(animate);

  renderer.render(scene, camera);
  cssRenderer.render(scene2, camera);
  
};

//Call animate recurring function:
animate();


//Start Sequence of initialization:
//Initialize location module
InitMovement();

//Init the rotation module:
InitRot();


