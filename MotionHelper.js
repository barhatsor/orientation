
// GPS motion helper


// globals
const Scale = 1000; // km to pixel scale

let positionGPS = {lat: 0, lon: 0, last_lat: 0, last_lon: 0}; // player GPS position
let positionXYZ; // virtual camera position in Vector3 format (km * Scale)

let CenterPos = {lat: 0, lon: 0}; // center of virtual world
let GPSisReady = false; // GPS is ready



// initialize movement params
function InitMovement() {
   
  // add GPS event listener
  navigator.geolocation.watchPosition(onGPSsuccess, 
                                      onGPSerror, this.options);

  // wait for GPS calibration
  window.addEventListener('gps-coord-set', () => {
    console.log('[MotionHelper] Location initialized and stable');
  });
  
}



// GPS event handler
function onGPSsuccess(pos) {
  
  // if GPS data is valid
  if ((!isNaN(pos.coords.latitude)) && (!isNaN(pos.coords.longitude))) {
    
    // update current position
    positionGPS.lat = pos.coords.latitude;
    positionGPS.lon = pos.coords.longitude;
    
    
    // convert from GPS [lat, lon] to [x, y]
    // to move camera in virtual world
    const cameraPos = GetDirection(CenterPos, positionGPS); // [km]
    
    // move camera
    positionXYZ = new THREE.Vector3(cameraPos.x * Scale, CameraWrapper.position.y, cameraPos.y * Scale);
    
    
    // if reading is the first stable GPS reading
    if (positionGPS.lat != 0 && positionGPS.lat != 0 && !GPSisReady) {
      
      // set world center to reading
      InitWorldCenter(positionGPS, CenterPos);
      GPSisReady = true;
      
    }
    
  }
  
}


// error handler for GPS event
function onGPSerror(err) {
  
  console.log('[MotionHelper] GPS error: ', JSON.stringify(err));
  
}



// set virtual world center
function InitWorldCenter(PosCoord, WorldCenterPos) {

  CenterPos.lon = PosCoord.lon;
  CenterPos.lat = PosCoord.lat;

  const z = 1; // height of the camera relative to XZ plane in virtual world
  
  CameraWrapper.position.x = 0;
  CameraWrapper.position.y = z;
  CameraWrapper.position.z = 0;

  // signal GPS is available
  window.dispatchEvent(new CustomEvent('gps-coord-set',
    { detail: {
      position: CenterPos
    }}
  ));
  
}



// update camera position
function UpdateCameraPos() {
  
  // if GPS is loaded
  if (GPSisReady) {
    
    let newCameraPosition = positionXYZ;
    
    // if previous camera X position exists
    if (!isNaN(CameraWrapper.position.x)) {
      
      const prevPos = new THREE.Vector3(CameraWrapper.position.x, 
                      CameraWrapper.position.y, CameraWrapper.position.z);
      
      // animate the camera from prev pos to new pos
      newCameraPosition = animatePos(prevPos, positionXYZ, 100);
      
    }
    
    // update camera position
    CameraWrapper.position = newCameraPosition;
    
  }
  
}



// interpolate position between THREE.js vector [vecA] to THREE.js vector [vecB] in [numSteps] steps
// function returns the next position - lastMidPos

// function globals
let currStep = 0; // progress of animation (index)
let lastVecB;
let lastMidPos;

function animatePos(vecA, vecB, numSteps) {
  
  // if while animating the end vector (vecB) changed,
  // stop and jump to end of animation
  if (lastVecB) {
    
    if (!lastVecB.equals(vecB)) {
      
      currStep = 0;
      lastVecB = vecB;
      
      return lastMidPos;
      
    }
    
  } else {
    
    lastVecB = vecB;
    
  }
  
  // update alpha (percent / 100 of final value)
  const alpha = currStep / numSteps;

  // if reached end of animation, return end vector (vecB)
  if (alpha > 1) {
    
    currStep = 0;
    lastMidPos = vecB;
    return lastMidPos;
    
  } else { // if still animating, return next step
    
    currStep++;
    lastMidPos = vecA.lerp(vecB, alpha);
    return lastMidPos;
    
  }
  
}



// get direction and distance from origin { lat, lon } to target { lat, lon }
// returns bearing (deg from north), distance in [km] and X, Y in [km]
function GetDirection(origin, target) { // @@ uses this in two places: here, and in estimation.js first function

  const [lat1, lon1] = [origin.lat, origin.lon];
  const [lat2, lon2] = [target.lat, target.lon];

  const R = 6371; // radius of the earth in [km]


  // convert to radians
  const phi1 = THREE.Math.degToRad(lat1);
  const phi2 = THREE.Math.degToRad(lat2);
  const lambda1 = THREE.Math.degToRad(lon1);
  const lambda2 = THREE.Math.degToRad(lon2);


  // calculate distance

  const phiDelta = THREE.Math.degToRad(lat2 - lat1);
  const lambdaDelta = THREE.Math.degToRad(lon2 - lon1);

  const a = Math.sin(phiDelta / 2) * Math.sin(phiDelta / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(lambdaDelta / 2) * Math.sin(lambdaDelta / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  const distance = d; // distance in [km]


  // calculate bearing,
  // where [phi1, lambda1] is the start point and [phi2, lambda2] is the end point

  const y = Math.sin(lambda2 - lambda1) * Math.cos(phi2);

  const x = Math.cos(phi1) * Math.sin(phi2) -
            Math.sin(phi1) * Math.cos(phi2) * Math.cos(lambda2 - lambda1);

  let bearing = THREE.Math.radToDeg(Math.atan2(y, x)); // bearing in [deg]

  // fix non-relevant degrees
  bearing = (bearing + 360) % 360;


  // calculate x, y

  let resX = distance * Math.cos(THREE.Math.degToRad(bearing)); // X in [km]
  let resY = distance * Math.sin(THREE.Math.degToRad(bearing)); // Y in [km]


  const result = {
    distance_: distance, // ?? @@
    bearing_: bearing, // ?? @@
    x: resX,
    y: resY
  };

  return result;

}
