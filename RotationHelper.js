
// sets the rotation of the player
// relative to true north


// counts how many compass events have fired
// until compass is calibrated
var compassClbCounter = 0;


// init rotation module
function InitRot() {

  // set compass event listener
  window.addEventListener('compass-event', SetInitRotation);

}


// sets initial rotation
function SetInitRotation(e) {

  if ((e.detail.compass_reading != 0) && !(isNaN(e.detail.compass_reading))) {

    let cmpss360 = e.detail.compass_reading;

    let cmpss180 = (cmpss360 - 180) % 180; // to range [-180, 180]

    let rot_y_ = RotTransform(cmpss180);

    if (isNaN(rot_y_))
      rot_y_ = 0; // error

    let rot_y = rot_y_ * Math.PI / 180;

    // set player rotation
    CameraWrapper.rotation.x = 0;
    CameraWrapper.rotation.y = rot_y; // [-pi, pi]
    CameraWrapper.rotation.z = 0;

    // compass tends return invalid values on initial calibration,
    // so sample it 5 times
    if (compassClbCounter > 5) {
      
      window.removeEventListener('compass-event', SetInitRotation);

      console.log('[RotationHelper] Rotation module is loaded and ready');

      compassClbCounter = 0;

    } else {

      compassClbCounter++;
      
    }
    
  }
}


// converts compass in [-180, 180] to Y rotation
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

