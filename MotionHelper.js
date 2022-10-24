//GPS motion helper module:


//Globals:
const Scale = 1000;//scale km to pixel
var positionGPS = {lat: 0, lon: 0, last_lat: 0, last_lon: 0};
var CenterPos = {lat: 0, lon: 0}; //new Location(31.3365254f, 34.8968868f)
//var LastDeviceGPS = {lat: 0, lon: 0, accuracy: 0};
var next_pos = null;//ist Vector3 represents next position we got from gps in [km*Scale] metrics
var data = {crd_lat: 0, crd_lon: 0, crd_accuracy: 0}; //TBD refactoring
var State = -1;





//Function initializes movement params
function InitMovement() {
  
  //LastDeviceGPS.lat = 0;
  //LastDeviceGPS.lon = 0;

  //Update the world center position and setup params (default):
  CenterPos.lat = 32.159106367661465;
  CenterPos.lon = 34.80578701716976;
    
  id_watch = navigator.geolocation.watchPosition(nav_geo_success, 
                                    nav_geo_error, this.options);

  window.addEventListener('gps-coord-set', () => {
    console.log('Location initialized and stable')
  });
  
}



//If success in getCurrent position:
function nav_geo_success(pos) {
  
  //var crd_ = pos.coords;

  if ((!isNaN(pos.coords.latitude)) && (!isNaN(pos.coords.longitude))) {
    
    /*
    data.crd_lat = pos.coords.latitude;
    data.crd_lon = pos.coords.longitude;
    data.crd_accuracy = pos.accuracy;
    */
    
    positionGPS.lat = pos.coords.latitude;; //LastDeviceGPS.lat;
    positionGPS.lon = pos.coords.longitude; //LastDeviceGPS.lon;
  
    let crd_accuracy = pos.accuracy; //@@ GPS accuracy for debug only
    
    //if (data.crd_lat != 0 && data.crd_lon != 0 && State != 1) {
    if (positionGPS.lat != 0 && positionGPS.lat != 0 && State != 1) {
      
      SetInitPosPlayer(positionGPS, CenterPos);
      
      //Dispatch event that the GPS position is confirmed:
      State = 1;
    }
    
    //UpdatePos();
    
  }
}


//Function estimates next position of camera
function estimateNextCameraPos()
{
  
  //Get current position of camera wrapper:
  let currentPosition = CameraWrapper.position;
  
  //Get distance to new position:
  let res4 = GetDirection(CenterPos, positionGPS); //[km]
  
  //Update next position of camera (global variable)
  next_pos = new THREE.Vector3(res4.x * Scale, CameraWrapper.position.y, res4.y * Scale);
  
  //for debug only:
  //let d_err2 = next_pos.distanceTo(currentPosition);
  //let d_err_m = d_err2 * 1000 / Scale;//[meter]
}



//If fail in get current position:
function nav_geo_error(err) {
  
  console.log('gps error: ',JSON.stringify(err));
  
}

//Update player position and bearing:
function UpdatePos() {

  //Get GPS position:
  GetGPSLoc();

  //If it's in init state, don't update the position and bearing
  if (State == -1) 
      return;




  //Get current position of camera wrapper:
  let currentPosition = CameraWrapper.position;
  
  //Get distance to new position:
  let res4 = GetDirection(CenterPos, positionGPS); //[km]
  
  //Update next position of camera (global variable)
  next_pos = new THREE.Vector3(res4.x * Scale, CameraWrapper.position.y, res4.y * Scale);
  
  let d_err2 = next_pos.distanceTo(currentPosition);

  let d_err_m = d_err2 * 1000 / Scale;//[meter]
  
  //let LMT = 1;//[meter]

}


//Get GPS position location:
function GetGPSLoc() {
  
  //If real GPS signal is available:
  //LastDeviceGPS.lat = data.crd_lat;
  //LastDeviceGPS.lon = data.crd_lon;
  //LastDeviceGPS.accuracy = (data.crd_accuracy < 3) ? 3 : data.crd_accuracy;
  
  positionGPS.lat = data.crd_lat; //LastDeviceGPS.lat;
  positionGPS.lon = data.crd_lon; //LastDeviceGPS.lon;

  //if (data.crd_lat != 0 && data.crd_lon != 0 && State != 1) {
  if (positionGPS.lat != 0 && positionGPS.lat != 0 && State != 1) {
    
    SetInitPosPlayer(positionGPS, CenterPos);
    
    //Dispatch event that the GPS position is confirmed:
    State = 1;
  }
}


//Set initial position for the player in VR space:
function SetInitPosPlayer(PosCoord, WorldCenterPos) {

  CenterPos.lon = PosCoord.lon;
  CenterPos.lat = PosCoord.lat;

  //Update the global center position:
  //GlobCenter.lat = PosCoord.lat; //TBD refactoring - make it the same one
  //GlobCenter.lon = PosCoord.lon;

  const z = 1;
  
  CameraWrapper.position.x = 0;
  CameraWrapper.position.y = z;
  CameraWrapper.position.z = 0;

  //Signal that there is gps:
  window.dispatchEvent(new CustomEvent('gps-coord-set',
    {detail: {position: this.CenterPos}}));
}





//Updates current position of player:
function UpdateCameraPos(newPos)
{
  let v_res=null;
  
  if(newPos!=null) {
    
    if(!isNaN(CameraWrapper.position.x)) {
      
      let origin = new THREE.Vector3(CameraWrapper.position.x, CameraWrapper.position.y, CameraWrapper.position.z);
      
      v_res = SmoothMotion(origin, newPos, 100);
      
    }else{
      
      v_res = newPos;
      
    }
    
    CameraWrapper.position.x = v_res.x;
    CameraWrapper.position.y = v_res.y;
    CameraWrapper.position.z = v_res.z;
  }
}


//Function interpulates position between vector v1 to vector v2 in n_step steps
//Returns the next position - mid_position:
//Usage:
//In function animate:
//Current position
//let v1 = new THREE.Vector3(obj.position.x,obj.position.y,obj.position.z);
//Target position
//let v2 = new THREE.Vector3(res.x,res.y,res.z);
//Number of steps to transition  - configuration
//let num_steps = 100;//1% in frame render
//SmoothMotion(v1, v2, 20)
//Globals:
var curr_step = 0; //is midposition between to points
var last_vb = null;
var last_mid_pos = null;

function SmoothMotion(va,vb,num_steps) {
  //If in the middle of interpulation the destination moved,
  //We will start from the finish and update the new destination position with same step
  if (last_vb != null) {
    if (!last_vb.equals(vb)) {
      curr_step = 0;
      last_vb = vb;
      return last_mid_pos;
    }
  }else{
    last_vb = vb;
  }
  //Update the alpha (percent/100 of final value)
  let alpha = curr_step / num_steps;

  //If we've reached the target:
  if (alpha > 1) {
    curr_step = 0;
    last_mid_pos =vb;
    return last_mid_pos;
  } else { //not yet reached the target
    curr_step++;
    last_mid_pos =va.lerp(vb, alpha);
    return last_mid_pos;
  }
}
