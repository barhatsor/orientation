
//Estimate time to target in minutes: (assuming walking spped is WALK_SPEED km/h)
function estimation(coord, currPos) {
  
  currPos = positionGPS; // @@ test
  
  //If the globcenter is not initialized:
  if (coord.lat == 0 && coord.lon == 0) {
    return;
  }

  const WALK_SPEED = 3; //km/h

  const z = -8; //see the z of the player position (which is set to be z=4 in motionHelper module)

  //Get the relative position to world center:
  let result = GetDirection(currPos, coord); //distance in [km]

  let vrpos = new THREE.Vector3(result.x * Scale, z, result.y * Scale);
  
  let dist = CameraWrapper.position.distanceTo(vrpos); //[km*Scale]

  let walkingTime = (((dist / Scale) / WALK_SPEED) * 60).toFixed(0); //in[minutes]

  return { walkDist: walkingTime, aspect: getAspect(vrpos) };

}


//Retrieves relative angle to camera view 
//given relative position in 3D space vrpos:
function getAspect(vrpos) {

  //"camera" is global variable which defines the current point view of the player

  camera.updateMatrix();
  camera.updateMatrixWorld();
  
  // 3D point to check
  var pos = new THREE.Vector3(vrpos.x, vrpos.y, vrpos.z);

  //Create laser to the object to measure the delta angle:
  laser.lookAt(pos);
  let laser_rot = new THREE.Vector3(laser.rotation.x, laser.rotation.y, laser.rotation.z);

  let dangle_y = laser_rot.y * 180 / 3.14;
  let dangle_x = laser_rot.x * 180 / 3.14; //pitch: [-90,..,-180,180,..,90]
  let dangle_z = laser_rot.z * 180 / 3.14;

  return { dy:dangle_y, dx:dangle_x, dz:dangle_z };//in degrees;
  
}




function testVitals() {
  
  //Check GPS data availability:

  console.log('GPS location: ' + JSON.stringify(positionGPS));

  //Check Rotation data availability:
  console.log('Rotation data: ' + CameraWrapper.rotation.y);

  let testCoord1 = {
    "lat": 31.241779897014453,
    "lon": 34.81248870780638
  }; //Some where in Beer Sheva

  let testCoord2 = {
    "lat": 31.243256162385038,
    "lon": 34.81265196913165
  }; //some other place in Beer-Sheva

  //Test function
  let res = estimation(testCoord1, testCoord2);
  console.log('Testing estimation: walk distance in minutes' + res.walkDist + ', aspect[deg]:'+JSON.stringify(res.aspect) );

}

