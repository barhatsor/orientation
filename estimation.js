
// get direction in [deg] and time in [min] to destination
// (assuming WALK_SPEED [km/h])
function estimation(coord, currPos) {
  
  // if world center is not initialized (GPS not initalized)
  if (coord.lat == 0 && coord.lon == 0)
    return;

  const WALK_SPEED = 3; // [km/h]

  const z = -8; // set z pos of player (which is z = 4 in motionHelper module)

  // convert lat, lng to point in 3d space (relative position to world center)
  let result = getDirection(currPos, coord); // in [km]

  let vrpos = new THREE.Vector3(result.x * Scale, z, result.y * Scale);
  
  let dist = CameraWrapper.position.distanceTo(vrpos); // [km*Scale]

  let walkingTime = (((dist / Scale) / WALK_SPEED) * 60).toFixed(1); // in [min]

  return { walkDist: walkingTime, aspect: getAspect(vrpos) };

}



// retrieves angle in deg from camera view 
// to a relative point in 3D space
function getAspect(vrpos) {

  // "camera" is a global variable 
  // which defines the current view of the player
  camera.updateMatrix();
  
  camera.updateMatrixWorld();
  
  // 3D point to check
  let pos = new THREE.Vector3(vrpos.x, vrpos.y, vrpos.z);
  
  
  pos.x = -vrpos.x * Scale;
  
  pos.y = CameraWrapper.position.y; // height of the point relative to plane xz
  
  pos.z = vrpos.y * Scale;
  
  // create a laser to object to measure the delta angle
  laser.lookAt(pos);
  
  let laser_rot = new THREE.Vector3(laser.rotation.x, 
                                    laser.rotation.y, laser.rotation.z);

  let ly = laser_rot.y * 180 / 3.14;
  let lx = laser_rot.x * 180 / 3.14; // pitch: [-90,..,-180,180,..,90]
  let lz = laser_rot.z * 180 / 3.14;

  return {y: ly, x: lx, z: lz}; // in [deg]
  
}



// dev estimation test function
/*
function testEstimation() {
  
  // check if GPS available
  console.log('GPS location: ' + JSON.stringify(positionGPS));

  // check if rotation available
  console.log('Rotation data: ' + CameraWrapper.rotation.y);

  let testCoord1 = {
    "lat": 31.241779897014453,
    "lon": 34.81248870780638
  }; // somewhere in Beer Sheva

  let testCoord2 = {
    "lat": 31.243256162385038,
    "lon": 34.81265196913165
  }; // some other place in Beer Sheva

  const testCoord3 = {
    lat: 31.335425, 
    lon: 34.896735
  }; // a park
  
  const testCoord4 = { 
    "lat": 31.335429199489425,
    "lon": 34.896722581147
  }; // another park
  
  const testCoord5 = {
    "lat": 31.3363433,
    "lon": 34.8966079
  }; // current position
  
  
  // test
  
  const res = estimation(testCoord4, testCoord5);
  
  console.log('[Testing estimation] Walk distance [min]: ' + res.walkDist + ', direction [deg]: ' + JSON.stringify(res.aspect));

}
*/

