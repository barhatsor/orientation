
function estimation(coord,currPos)
{
    //If the globcenter is not initialized:
    if(coord.lat==0 && coord.lon==0) return;
    
    const z = -8;

    //Get the relative position to world center:
    let result = GetDirection(currPos, coord);//distance in [km]

    let vrpos = new THREE.Vector3(result.x * Scale, z, result.y * Scale);
    let dist = CameraWrapper.position.distanceTo(vrpos);//[km*Scale]

    //In [meters]
    //If far than 5 [km] don't display
    if(Math.floor(dist/Scale*1000) > 5000 && (InvokeAppOrigin=='PLAIN') )
    {
      if(DEBUG_LEVEL>0)
      {
        document.getElementById("ERRMSG").innerHTML = `${name} out of range ${Math.floor(dist/Scale*1000)}[m]`;
      }
      return;
    }
}























































































