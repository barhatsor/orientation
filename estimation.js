//Estimate time to target in minutes: (assuming walking spped is WALK_SPEED km/h)
function estimation(coord,currPos)
{
    //If the globcenter is not initialized:
    if(coord.lat==0 && coord.lon==0) return;
    
    const WALK_SPEED = 3;//km/h
    
    const z = -8;//see the z of the player position (which is set to be z=4 in motionHelper module)

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
  
  console.log('GPS location: '+ JSON.stringify(positionGPS));
  
  //Check Rotation data availability:
  console.log('Rotation data: '+ CameraWrapper.rotation.y);
  
  let testCoord1 = {
    "lat": 31.241779897014453,
    "lon": 34.81248870780638
  }; //Some where in Beer Sheva
  
  let testCoord2 = {
    "lat": 31.243256162385038,
    "lon": 34.81265196913165
  }; //some other place in Beer-Sheva
  
  //Test function
  console.log('Testing estimation:' + estimation(testCoord1, testCoord2)+' minutes');
}























































































