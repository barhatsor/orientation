//Create texture loader and scene:
//const loader = new THREE.TextureLoader();
const scene = new THREE.Scene();

//Create the camera wrapper - he will be aligned  to north and moved by GPS:
const CameraWrapper = new THREE.Object3D();
CameraWrapper.position.set(0, 0, 0.01 );

//Define perspective camera:
//const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100000 );
camera.position.set(0, 0, 0 );

//Set camera as camera wrapper child:
CameraWrapper.add(camera);
scene.add(CameraWrapper);

//Add laser for pointing to objects
let laser = new THREE.Object3D();
camera.add(laser);


//Create Renderer:
const renderer = new THREE.WebGLRenderer( { alpha: true } );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = 0;
document.body.appendChild( renderer.domElement);


//Create texture plane:
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

//DEBUG:
var dir = 0;


//Create css scene:
const scene2 = new THREE.Scene();
scene2.add(CameraWrapper);

//The current target object, arrows points it's direction
var TargetObjectGlob=null;

//Create COOL renderer:
var cssRenderer = new COOLRenderer();
cssRenderer.setSize( window.innerWidth, window.innerHeight );
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = 0;
document.body.appendChild( cssRenderer.domElement );

//Create device binded controls:
var DevControls = new DeviceOrientationController( camera, renderer.domElement );
DevControls.connect();


//Animate function for rendering:
const animate = function () {
  //Check if marker in FOV of camera
  dir = CheckInFOV(camera, TargetObjectGlob, el);
  changeArrow(dir);
  //Hide direction arrows if no markers:
  if(GlobMarkersList.length==0) changeArrow(0);

  //Update player position to next_pos - is updated from GPS
  UpdateCameraPos(next_pos);

  DevControls.update();
  requestAnimationFrame(animate);

  renderer.render(scene, camera);
  cssRenderer.render(scene2, camera);
};

//Call animate recurring function:
animate();


// Create Stream video
navigator.mediaDevices.getUserMedia({
    video: {
        width: {
            min: 1280,
            ideal: 1920,
            max: 2560,
        },
        height: {
            min: 720,
            ideal: 1080,
            max: 1440,
        },
        facingMode: "environment"
    },
}).then(stream => {
    let $video = document.querySelector('video');
    $video.srcObject = stream;
    $video.onloadedmetadata = () => {
        $video.play();
    }
}).catch((err) => {
  console.log("Couldn't get video");
});

//Determine the invocation method:
InvokeAppOrigin = GetInvocationMethod();

//Start Sequence of initialization:
//Initialize location module
InitMovement();

//Init the rotation module:
InitRot();


//Init virtual environment:
InitVR();

//Mapbox init:
MapboxInit();

//Initialize Firebase connection:
//InitFirebase();

//Set listeners for Local Storage:
InitStorage();

//Dedetects if page was suspended:
var lastFired = new Date().getTime();
var now=0;
setInterval(function() {
    now = new Date().getTime();
    if((now - lastFired) > 1000) {//if it's been more than 1 second
        //alert("onfocus");
        //Awaken from  suspension:
        //Set z axis to north
        InitRot();
        if(DEBUG_LEVEL>0)
        {
          document.getElementById("ERRMSG").innerHTML = `Awake from suspention ${(new Date()).toLocaleTimeString()}`;
        }
    }
    lastFired = now;
}, 100); //interval of 100 ml sec
