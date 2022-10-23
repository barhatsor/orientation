//Globals:
const Scale = 1000;//scale km to pixel
var velocity = {curr: 0, prev: 0, prev_prev: 0};
var position = {x: 0, y: 0, z: 0};
var bearing = {curr: 0, prev: 0};
var acceleration = 0;
var delta_dist = 0;
var d_err = 0;
var invalid_motion_type_time = 0;

var positionGPS = {lat: 0, lon: 0, last_lat: 0, last_lon: 0};
var next_pos=null;//ist Vector3 represents next position we got from gps in [km*Scale] metrics

var data = {crd_lat: 0, crd_lon: 0, crd_accuracy: 0}; //TBD refactoring
var crd = {latitude: 0, longitude: 0, accuracy: 0};//return from callback
var LastDeviceGPS = {lat: 0, lon: 0, accuracy: 0};

var CenterPos = {lat: 0, lon: 0}; //new Location(31.3365254f, 34.8968868f)
var time_since_last_update = 0;
var scene_time = 0;//in seconds since start of scene
var State = -1;
//comp_ptr: null,
var dbg = {Pos: null, STATS: null, camera_wrapper: null};//dbg ptrs
var dbg_delta_time_frame = 0;


var init_bearing = null; //array used for initial gps test
var init_vel = null;//array used for initial gps test
var init_iteration = 0;//number of iterations for init location
var init_time_interval = 0; //time in seconds between gps location signals
var id_watch = null;

var last_time = 0; //last time in [seconds] from 1970

//GPS simulation:
var GPS_sim = {
  sign_x: [0, -1, 0, 1],
  sign_y: [1, 0, -1, 0],
  LWdlt_time: 0, //[sec]hold last time since last request from linear walk
  leg_cnt: 1,
  s_ind: 0,
  IsOn: true,
  SIM_D_SEC: 1
};


//Function initializes movement params
function InitMovement() {
  LastDeviceGPS.lat = 0;
  LastDeviceGPS.lon = 0;

  //Update the world center position and setup params:
  CenterPos.lat = 32.159106367661465;
  CenterPos.lon = 34.80578701716976;
  GPS_sim.IsOn = false;
  
  id_watch = navigator.geolocation.watchPosition(nav_geo_success, nav_geo_error, this.options);

  window.addEventListener('gps-coord-set', () => {
    console.log('Location initialized and stable')
  });
}



//If success in getCurrent position:
function nav_geo_success(pos) {
  var crd_ = pos.coords;
  if(DEBUG_LEVEL>0)
  {
  /*document.getElementById("GPSloc").innerHTML = 'GPS:' +
    `{LAT:${crd_.latitude.toFixed(8)},` + `LON:${crd_.longitude.toFixed(8)}} `
    + `Accuracy:${crd_.accuracy.toFixed(1)} meters`;
  }*/
  // Check accuracy:
  if (crd_.accuracy > 65) { // If accuracy is less than 30 meters
    //toggleAlert(true);
  } else {
    //toggleAlert(false);
    //document.querySelector('.alert').classList.remove('gps');
  }

  if ((!isNaN(crd_.latitude)) && (!isNaN(crd_.longitude))) {
    data.crd_lat = pos.coords.latitude;
    data.crd_lon = pos.coords.longitude;
    data.crd_accuracy = pos.accuracy;
    //Get current time in [sec]
    //let dtime = new Date();
    //let time_vel_delta = dtime - last_time;
    UpdatePos();
  }
}


//Alert for low GPS signal
function toggleAlert(boolean) {
  if (boolean) {
    document.querySelector('.alert').classList.add('visible');
  } else {
    document.querySelector('.alert').classList.remove('visible');
  }
}

//If fail in get current position:
function nav_geo_error(err) {

  toggleAlert(true);
  document.querySelector('.alert').classList.add('gps');
}




//Get GPS position location:
function GetGPSLoc() {
  
  //If real GPS signal is available:
  LastDeviceGPS.lat = data.crd_lat;
  LastDeviceGPS.lon = data.crd_lon;
  LastDeviceGPS.accuracy = (data.crd_accuracy < 3) ? 3 : data.crd_accuracy;
  positionGPS.lat = LastDeviceGPS.lat;
  positionGPS.lon = LastDeviceGPS.lon;

  if (data.crd_lat != 0 && data.crd_lon != 0 && State != 1) {
    SetInitPosPlayer(positionGPS, CenterPos);
    //Dispatch event that the GPS position is confirmed:
    State = 1;
    //LastDeviceGPS.accuracy = 3;//[m]
  }
}


//Set initial position for the player in VR space:
function SetInitPosPlayer(PosCoord, WorldCenterPos) {

  //this.data.world_center_lon = PosCoord.lon;
  //this.data.world_center_lat = PosCoord.lat;
  CenterPos.lon = PosCoord.lon;
  CenterPos.lat = PosCoord.lat;

  //Update the global center position:
  GlobCenter.lat = PosCoord.lat; //TBD refactoring - make it the same one
  GlobCenter.lon = PosCoord.lon;

  const z = 1;
  //CameraWrapper.position = new THREE.Vector3(0,z,0);
  CameraWrapper.position.x = 0;
  CameraWrapper.position.y = z;
  CameraWrapper.position.z = 0;

  //Signal that there is gps:
  window.dispatchEvent(new CustomEvent('gps-coord-set',
    {detail: {position: this.CenterPos}}));
}


//Update player position and bearing:
function UpdatePos() {

  //Get GPS position:
  GetGPSLoc();

  //If it's in init state, don't update the position and bearing
  if (State == -1) return;

  //Get current position of camera wrapper:
  let currentPosition = CameraWrapper.position;
  //Get distance to new position:
  let res4 = GetDirection(CenterPos, positionGPS); //[km]
  //Update next position of camera (global variable)
  next_pos = new THREE.Vector3(res4.x * Scale, CameraWrapper.position.y, res4.y * Scale);
  let d_err2 = next_pos.distanceTo(currentPosition);

  let d_err_m = d_err2 * 1000 / Scale;//[meter]
  let LMT = 1;//[meter]

  //If gps moves more than LMT [meters] move the player
  if (d_err_m > LMT) {
    //UpdateCameraPos(next_pos);
    //Signal that there is gps update:
    //if (this.delta_dist > 20)//bigger than 20 meters
    window.dispatchEvent(new CustomEvent('gps-position-update', {}));
  }
}

/*
//Updates current position of player:
function UpdateCameraPos(newPos)
{
  let v_res=null;
  if(newPos!=null) {
    if(!isNaN(CameraWrapper.position.x)) {
      let origin = new THREE.Vector3(CameraWrapper.position.x,CameraWrapper.position.y,CameraWrapper.position.z);
      v_res = SmoothMotion(origin, newPos,100);
    }else{
      v_res = newPos;
    }
    CameraWrapper.position.x = v_res.x;
    CameraWrapper.position.y = v_res.y;
    CameraWrapper.position.z = v_res.z;
  }
}*/