//Estimate time to target in minutes: (assuming walking spped is WALK_SPEED km/h)
function estimation(coord,currPos)
{
    //If the globcenter is not initialized:
    if(coord.lat==0 && coord.lon==0) return;
    
    const WALK_SPEED = 3;//km/h
    
    const z = -8;//TBD??

    //Get the relative position to world center:
    let result = GetDirection(currPos, coord);//distance in [km]

    let vrpos = new THREE.Vector3(result.x * Scale, z, result.y * Scale);
    let dist = CameraWrapper.position.distanceTo(vrpos);//[km*Scale]

    let walkingTime = (((dist/Scale)/WALK_SPEED)*60).toFixed(0);//in[minutes]
    
    return walkingTime;
    
}


function testVitals()
{
  //Check GPS data availability:
  
  console.log('GPS location: '+ positionGPS.toString());
  
  //Check Rotation data availability:
  console.log('Rotation data: '+ )
  
}























































































