
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

