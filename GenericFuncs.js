//Globals:
var GlobCenter = {lat:0,lon:0};
var GlobMarkers=[];
var GlobDebugFlag=false;


//Calculate compass heading from orientation event data:
//returns true north:
function GetCompassHeading(alpha, beta, gamma) {

    // Convert degrees to radians
    var alphaRad = alpha * (Math.PI / 180);
    var betaRad = beta * (Math.PI / 180);
    var gammaRad = gamma * (Math.PI / 180);

    // Calculate equation components
    var cA = Math.cos(alphaRad);
    var sA = Math.sin(alphaRad);
    var sB = Math.sin(betaRad);
    var cG = Math.cos(gammaRad);
    var sG = Math.sin(gammaRad);

    // Calculate A, B, C rotation components
    var rA = -cA * sG - sA * sB * cG;
    var rB = -sA * sG + cA * sB * cG;

    // Calculate compass heading
    var compassHeading = Math.atan(rA / rB);

    // Convert from half unit circle to whole unit circle
    if (rB < 0) {
        compassHeading += Math.PI;
    } else if (rA < 0) {
        compassHeading += 2 * Math.PI;
    }
    // Convert radians to degrees
    compassHeading *= 180 / Math.PI;

    return compassHeading;
}




//Utility function for navigator.geolocation.getCurrentPosition
function showPosition(position)
{
  if(DEBUG_LEVEL>0)
  {
    document.getElementById("GPSloc").innerHTML = "ERR Getting location last location:" +
    "Latitude: " + position.coords.latitude +
    "<br>Longitude: " + position.coords.longitude;
    console.warn(`LST COORD(${position.coords.latitude}), ${position.coords.longitude}`);
  }
}

//Get direction from pt. of origin to target :
//distance[km],[x,y]-in [km] and bearing[deg from north]
//from pt of origin to target location:
function GetDirection(Location_source, Location_target) {

    let lat2 = Location_target.lat;
    let lat1 = Location_source.lat;
    let lon2 = Location_target.lon;
    let lon1 = Location_source.lon;


    let R = 6371; // [km]
    let phi1 = THREE.Math.degToRad(lat1);// * THREE.Math.Deg2Rad;
    let phi2 = THREE.Math.degToRad(lat2);// * THREE.Math.Deg2Rad;
    let lambda1 = THREE.Math.degToRad(lon1);// * THREE.Math.Deg2Rad;
    let lambda2 = THREE.Math.degToRad(lon2);// * THREE.Math.Deg2Rad;

    let delta_phi = THREE.Math.degToRad(lat2 - lat1);// * THREE.Math.Deg2Rad;
    let delta_lambda = THREE.Math.degToRad(lon2 - lon1);// * THREE.Math.Deg2Rad;

    let a = Math.sin(delta_phi / 2) * Math.sin(delta_phi / 2) +
        Math.cos(phi1) * Math.cos(phi2) *
        Math.sin(delta_lambda / 2) * Math.sin(delta_lambda / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let d = R * c;
    let distance = d;//distance in km

    //Calculate the bearing:
    //where phi1, lambda1 is the start point, phi2,lambda2 the end point(delta_lambda is the difference in longitude)

    let y = Math.sin(lambda2 - lambda1) * Math.cos(phi2);
    let x = Math.cos(phi1) * Math.sin(phi2) -
        Math.sin(phi1) * Math.cos(phi2) * Math.cos(lambda2 - lambda1);
    let brng = THREE.Math.radToDeg(Math.atan2(y, x));// * THREE.Math.Rad2Deg;

    let bearing = brng;//bearing in [deg]

    //Fix the non-relevant degrees:
    bearing = (bearing + 360) % 360;

    let brng_tmp = (brng + 360) % 360;
    let x_ = distance * Math.cos(THREE.Math.degToRad(brng_tmp));// * THREE.Math.Deg2Rad);//km*Scale
    let y_ = distance * Math.sin(THREE.Math.degToRad(brng_tmp));// * THREE.Math.Deg2Rad);//km*Scale

    let result = {
        distance_: distance,
        bearing_: bearing,
        x: x_,
        y: y_,
    };
    return result;
}

// Error
window.onerror = function(message, source) {
    try {
      console.log('error:',message);
      
    }
    catch {
        console.log('error really bad:',message);
    }
};


//Calculates difference between angle1 to angle2:
function delta_angle(angle1,angle2)
{
    let angle1q = new THREE.Quaternion();
    let angle2q = new THREE.Quaternion();
    //this.cam_ptr.object3D.getWorldQuaternion(cam_rotq);
    angle1q.setFromEuler(new THREE.Euler(0, angle1, 0));
    angle2q.setFromEuler(new THREE.Euler(0, angle2, 0));
    return angle1q.angleTo(angle2q);
}



//Convert degrees [-180, 180) to [0..360]
function Convert180to360(deg)
{
    //var x = Math.random()*360-180;  // Generate random angle in range [-180, 180)
    let deg_r = (deg + 360) % 360;        // Normalize to be in the range [0, 360)
    return deg_r;
}

//Convert degrees [-180, 180) to [0..360]
function Convert360to180(deg)
{
    let deg_r = ((deg - 180) % 180);        // Normalize to be in the range [-180, 180)
    return deg_r;
}



//Check if object in your FOV: and returns if it's on the
//Returns direction of arrow one of the following [right, left, up] and position on screen [0,2] left to right
//left(-1) on the right (+1) or inside POV
function CheckInFOV(camera,object,el) {

    //Check if object exist
    if(object==null) return 0;

    camera.updateMatrix();
    camera.updateMatrixWorld();
    //Create POV frustum:
    var frustum = new THREE.Frustum();
    frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));

    // 3D point to check
    var pos = new THREE.Vector3(object.position.x, object.position.y, object.position.z);

    //Create laser to the object to measure the delta angle:
    laser.lookAt(pos);
    let laser_rot = new THREE.Vector3(laser.rotation.x,laser.rotation.y,laser.rotation.z);

    let dangle_y = laser_rot.y*180/3.14;
    let dangle_x = laser_rot.x*180/3.14;//pitch: [-90,..,-180,180,..,90]
    let dangle_z = laser_rot.z*180/3.14;
    laser.rotation.x=0;
    laser.rotation.y=0;
    laser.rotation.z=0;

    const FOVcamera = 75;//is defined in perspecive camera at index.html
    
    //Check if outside of frustum:
    if (!frustum.containsPoint(pos)) {

      //If screen is loock downwards:
      if(Math.sign(dangle_x) == -1){
        if((dangle_x > (-180 + FOVcamera/2)) && (dangle_x< -95 )){
          let pos_ = dangle_y/(FOVcamera/2)+1;//dangle_y is [-FOVcamera/2,FOVcamera/2]
          
          return {direction: 'up', position:pos_ };//put arrow up, position is [0,2] where 0 is most left and 2 most right
        }
      }
      
      //If the marker is not higher than frustum,check if on his left or right:
      if(Math.sign(dangle_y) == -1) return {direction: 'right',position: 0};//object is on the right put arrow right
      if(Math.sign(dangle_y) == 1) return {direction: 'left',position: 2};//object is on the left, put arrow left

    }else{      
      return {direction: 'inside',position:0};
    }
  }
  
  
  // Error. Params: message (required), source (optional)
function error(message, source) {
    document.querySelector('.title').classList.add('error');
    document.querySelector('.title a').innerHTML = message;
    if (source) {
        document.querySelector('.title a').innerHTML +=
        '<br><span style="opacity:0.5">' +
        source +
        '</span>';

    }
}


//Function returns delta bearing between two bearings in a range of [-pi,pi]
/*function relativeBearing(b1Rad, b2Rad)
{
    let b1y = Math.cos(b1Rad);
    let b1x = Math.sin(b1Rad);
    let b2y = Math.cos(b2Rad);
    let b2x = Math.sin(b2Rad);
    let crossp = b1y * b2x - b2y * b1x;
    let dotp = b1x * b2x + b1y * b2y;
    if(crossp > 0.)
        return Math.acos(dotp);
    return -Math.acos(dotp);
}*/

