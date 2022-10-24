//GPS motion helper module:


//Globals:
const Scale = 1000;//scale km to pixel
var positionGPS = {lat: 0, lon: 0, last_lat: 0, last_lon: 0};
var positionXYZ = null;//is Vector3 represents position we got from gps in [km*Scale] metrics

var CenterPos = {lat: 0, lon: 0}; //Center of the world new Location(31.3365254f, 34.8968868f)
//var LastDeviceGPS = {lat: 0, lon: 0, accuracy: 0};
//var next_pos = null;//ist Vector3 represents next position we got from gps in [km*Scale] metrics
//var data = {crd_lat: 0, crd_lon: 0, crd_accuracy: 0}; //TBD refactoring
var worldIsSet = false;





//Function initializes movement params
function InitMovement() {
  
  //Set the world center position to default value:
  CenterPos.lat = 32.159106367661465;
  CenterPos.lon = 34.80578701716976;
   
  //Set event handler on GPS event: 
  id_watch = navigator.geolocation.watchPosition(nav_geo_success, 
                                    nav_geo_error, this.options);

  //Listen to listener to completion event
  window.addEventListener('gps-coord-set', () => {
    console.log('Location initialized and stable')
  });
  
}



//Event handler for GPS event:
function nav_geo_success(pos) {
  
  //If GPS data from browser is valid:
  if ((!isNaN(pos.coords.latitude)) && (!isNaN(pos.coords.longitude))) {
    
    //Update current position:
    positionGPS.lat = pos.coords.latitude;; //LastDeviceGPS.lat;
    positionGPS.lon = pos.coords.longitude; //LastDeviceGPS.lon;
    
    
    //Calculate the position in XYZ world of the camera:
    //Get current position of camera wrapper:
    let currentPosition = CameraWrapper.position;
  
    //Convert from lat,lon -> x,y to next position of the camera:
    let res4 = GetDirection(CenterPos, positionGPS); //[km]
  
    //Store the next camera position int vector form (global):
    let positionXYZ = new THREE.Vector3(res4.x * Scale, CameraWrapper.position.y, res4.y * Scale);
  
    let crd_accuracy = pos.accuracy; //@@ GPS accuracy for debug only
    
    //Take the first good GPS reaqing and set the world center to be it:
    if ( positionGPS.lat != 0 && positionGPS.lat != 0 && !worldIsSet ) {
      
      InitWorldCenter(positionGPS, CenterPos);
      worldIsSet = true;
      
    }    
  }
}



//Set initial position for the player in VR space:
function InitWorldCenter(PosCoord, WorldCenterPos) {

  CenterPos.lon = PosCoord.lon;
  CenterPos.lat = PosCoord.lat;

  const z = 1; //TBD@@
  
  CameraWrapper.position.x = 0;
  CameraWrapper.position.y = z;
  CameraWrapper.position.z = 0;

  //Signal that there is gps:
  window.dispatchEvent(new CustomEvent('gps-coord-set',
    {detail: {position: this.CenterPos}}));
}



//Error handler for GPS event:
function nav_geo_error(err) {
  
  console.log('gps error: ',JSON.stringify(err));
  
}


//Updates current position of player:
function UpdateCameraPos()
{
  
  let v_res=null;
  
  if(positionXYZ!=null) {
    
    if(!isNaN(CameraWrapper.position.x)) {
      
      let origin = new THREE.Vector3(CameraWrapper.position.x, 
                    CameraWrapper.position.y, CameraWrapper.position.z);
      
      //Interpulate the motion from origin to positionXYZ
      v_res = SmoothMotion(origin, positionXYZ, 100);
      
    }else{
      
      v_res = positionXYZ;
      
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
  } else { 
    //not yet reached the target
    curr_step++;
    last_mid_pos =va.lerp(vb, alpha);
    return last_mid_pos;
  }
}



