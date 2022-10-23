
function estimation(coord,currPos)
{
    //If the globcenter is not initialized:
    if(coord.lat==0 && coord.lon==0) return;
    
    const z = -8;//TBD??

    //Get the relative position to world center:
    let result = GetDirection(currPos, coord);//distance in [km]

    let vrpos = new THREE.Vector3(result.x * Scale, z, result.y * Scale);
    let dist = CameraWrapper.position.distanceTo(vrpos);//[km*Scale]


    let walkingTime = (((dist/Scale)/3)*60).toFixed(0);//in[minutes]
    
}























































































