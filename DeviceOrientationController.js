/**
 * -------
 * W3C Device Orientation control (http://www.w3.org/TR/orientation-event/)
 * Author: Rich Tibbett (http://github.com/richtr)
 * License: The MIT License

 * Added: Compass readings for Android and iOS
 **/

var DeviceOrientationController = function ( object, domElement ) {

    
    this.object = object; // object is a camera give as an argument, 
                          //the controller will copy the updated rotation to camera
    
    this.element = domElement || document; //if null points to the document

    this.freeze = true;

    this.useQuaternions = true; // use quaternions for orientation calculation by default

    this.deviceOrientation = {}; //Holds the updated orientation sensor data from the browser
     
    this.screenOrientation = window.orientation || 0; //depricated


    // Consistent Object Field-Of-View fix components (in case of window size change)
    var startClientHeight = window.innerHeight,
        startFOVFrustrumHeight = 2000 * Math.tan( THREE.Math.degToRad( ( this.object.fov || 75 ) / 2 ) ),
        relativeFOVFrustrumHeight, 
        relativeVerticalFOV;

    var deviceQuat = new THREE.Quaternion();
    




    //Function constrains this object field of view:
    this.constrainObjectFOV = function () {
      
        relativeFOVFrustrumHeight = startFOVFrustrumHeight * ( window.innerHeight / startClientHeight );

        relativeVerticalFOV = THREE.Math.radToDeg( 2 * Math.atan( relativeFOVFrustrumHeight / 2000 ) );

        this.object.fov = relativeVerticalFOV;
        
    }.bind( this );

    
    
    //Get the sensor data form browser event:
    this.onDeviceOrientationChange = function ( event ) {
      
        this.deviceOrientation = event;

    }.bind( this );



    //Function which creates a new quanterion based on on rotation readings from device:
    var createQuaternion = function () {

        var finalQuaternion = new THREE.Quaternion();

        var deviceEuler = new THREE.Euler();

        var screenTransform = new THREE.Quaternion();

        var worldTransform = new THREE.Quaternion( - Math.sqrt(0.5), 0, 0, Math.sqrt(0.5) ); // - PI/2 around the x-axis

        var minusHalfAngle = 0;

        return function ( alpha, beta, gamma, screenOrientation ) {

            deviceEuler.set( beta, alpha, - gamma, 'YXZ' );

            finalQuaternion.setFromEuler( deviceEuler );

            minusHalfAngle = - screenOrientation / 2;

            screenTransform.set( 0, Math.sin( minusHalfAngle ), 0, Math.cos( minusHalfAngle ) );

            finalQuaternion.multiply( screenTransform );

            finalQuaternion.multiply( worldTransform );

            return finalQuaternion;

        }

    }();

    //Function creates rotation matrix:
    var createRotationMatrix = function () {

        var finalMatrix = new THREE.Matrix4();

        var deviceEuler = new THREE.Euler();
        
        var screenEuler = new THREE.Euler();
        
        var worldEuler = new THREE.Euler( - Math.PI / 2, 0, 0, 'YXZ' ); // - PI/2 around the x-axis

        var screenTransform = new THREE.Matrix4();

        var worldTransform = new THREE.Matrix4();
        
        worldTransform.makeRotationFromEuler(worldEuler);

        return function (alpha, beta, gamma, screenOrientation) {

            deviceEuler.set( beta, alpha, - gamma, 'YXZ' );

            finalMatrix.identity();

            finalMatrix.makeRotationFromEuler( deviceEuler );

            screenEuler.set( 0, - screenOrientation, 0, 'YXZ' );

            screenTransform.identity();

            screenTransform.makeRotationFromEuler( screenEuler );

            finalMatrix.multiply( screenTransform );

            finalMatrix.multiply( worldTransform );

            return finalMatrix;

        }

    }();


    //Gets rotation sensor data from browser event 
    this.updateDeviceMove = function () {

        var alpha, beta, gamma, orient;

        var deviceMatrix;

        return function () {
            
            //Ignore all but azimuth: (for magic "compass-lazer" requirement)
            alpha  = THREE.Math.degToRad( this.deviceOrientation.alpha || 0 ); // Z
            beta   = 0.1//THREE.Math.degToRad( this.deviceOrientation.beta  || 0 ); // X'
            gamma  = 0.1//THREE.Math.degToRad( this.deviceOrientation.gamma || 0 ); // Y''
            orient = 0.1//THREE.Math.degToRad( this.screenOrientation       || 0 ); // O

            // only process non-zero 3-axis data
            if ( alpha !== 0 && beta !== 0 && gamma !== 0) {

                if ( this.useQuaternions ) {

                    deviceQuat = createQuaternion( alpha, beta, gamma, orient );

                } else {

                    deviceMatrix = createRotationMatrix( alpha, beta, gamma, orient );

                    deviceQuat.setFromRotationMatrix( deviceMatrix );

                }
                
                //If event listeners are removed do nothing:
                if ( this.freeze ) 
                  return;
                  
                //Copy the rotation to the camera (as quanterion):
                this.object.quaternion.copy( deviceQuat );
                //this.object.quaternion.slerp( deviceQuat, 0.07 ); // smoothing
            }

        };

    }();

    //Public function to update rotation values:
    this.update = function () {
        this.updateDeviceMove();
    };


    this.connect = function () {
      
        window.addEventListener( 'resize', this.constrainObjectFOV, false );

        window.addEventListener( 'deviceorientation', this.onDeviceOrientationChange, false );

        this.freeze = false;
    };


    this.disconnect = function () {
      
        this.freeze = true;

        window.removeEventListener( 'resize', this.constrainObjectFOV, false );

        window.removeEventListener( 'deviceorientation', this.onDeviceOrientationChange, false );

    };

};

DeviceOrientationController.prototype = Object.create( THREE.EventDispatcher.prototype );



// get compass readings (iOS)
window.addEventListener('deviceorientation', (e) => {

  handleOrientationEvent(e.webkitCompassHeading, e.beta, e.gamma);
  
});

// get compass readings (Android)
window.addEventListener('deviceorientationabsolute', (e) => {
  
  handleOrientationEvent(e.alpha, e.beta, e.gamma);

});


/* 
 * alpha is azimuth [left to right]
 * beta is roll
 * gamma is pitch
 */
function handleOrientationEvent(alpha, beta, gamma) {

  let compassHeading = getCompassHeading(alpha, beta, gamma);

  if (!isNaN(compassHeading) && compassHeading != null) {

    // compass readings are ready and reliable
    window.dispatchEvent(new CustomEvent('compass-event', {
      detail: {
        compass_reading: compassHeading
      }
    }));

  }
  
}


// calculate compass heading from orientation event data
// returns true north
function getCompassHeading(alpha, beta, gamma) {

  // convert degrees to radians
  const alphaRad = alpha * (Math.PI / 180);
  const betaRad = beta * (Math.PI / 180);
  const gammaRad = gamma * (Math.PI / 180);

  // calculate equation components
  const cA = Math.cos(alphaRad);
  const sA = Math.sin(alphaRad);
  const sB = Math.sin(betaRad);
  const cG = Math.cos(gammaRad);
  const sG = Math.sin(gammaRad);

  // calculate A, B, C rotation components
  const rA = -cA * sG - sA * sB * cG;
  const rB = -sA * sG + cA * sB * cG;

  // calculate compass heading
  let compassHeading = Math.atan(rA / rB);

  // convert half unit circle to whole unit circle
  if (rB < 0) {
    compassHeading += Math.PI;
  } else if (rA < 0) {
    compassHeading += 2 * Math.PI;
  }
  
  // convert radians to degrees
  compassHeading *= 180 / Math.PI;

  return compassHeading;
  
}
