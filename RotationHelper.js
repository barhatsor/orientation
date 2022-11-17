//Rotation helper supports rotation of the player and his alignment to true north


//Counter for init reading:
var CmpssEventCounter = 0;

//Hold compass heading :
var CompassHeading = 0;

Initial_cmpss_val=0; //for debug only



//Function initializes the rotation module
function InitRot() {

  //Set listener to compass-event: 
  window.addEventListener('compass-event', SetInitRotation);

}


//Function sets initial rotation
function SetInitRotation(e) {

  if ((e.detail.compass_reading != 0) && !(isNaN(e.detail.compass_reading))) {

    let cmpss360 = e.detail.compass_reading;

    let cmpss180 = (cmpss360 - 180) % 180; //to range [-180,180]

    let rot_y_ = RotTransform(cmpss180);

    if (isNaN(rot_y_))
      rot_y_ = 0; //ERROR

    let rot_y = rot_y_ * Math.PI / 180;

    //Set player rotation:
    CameraWrapper.rotation.x = 0;
    CameraWrapper.rotation.y = rot_y; //[-pi..pi]
    CameraWrapper.rotation.z = 0;

    //Compass tends to be icorrect in the beginning, so we take 5 takes of it:
    if (CmpssEventCounter > 5) {
      window.removeEventListener('compass-event', SetInitRotation);

      console.log('Rotation module is loaded and ready');

      Initial_cmpss_val = cmpss180;

      CmpssEventCounter = 0;

    } else {

      CmpssEventCounter++;
    }

    CompassHeading = e.detail.compass_reading;
  }
}


// input compass in [-180, 180] and returns rot.y for platform
function RotTransform(compass) {
  
  if (compass >= -180 && compass < -90)
    return compass + 90;

  if (compass >= -90 && compass < 0)
    return compass + 90;

  if (compass >= 0 && compass < 90)
    return compass + 90;

  if (compass >= 90 && compass < 180)
    return compass - 270;

  return NaN;
  
}


// convert degrees [-180, 180] to [0, 360]
function Convert180to360(deg) {
  return (deg + 360) % 360;
}

// convert degrees [0, 360] to [-180, 180]
function Convert360to180(deg) {
  return (deg - 180) % 180;
}

