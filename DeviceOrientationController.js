/**
 * -------
 * W3C Device Orientation control (http://www.w3.org/TR/orientation-event/)
 * Author: Rich Tibbett (http://github.com/richtr)
 * License: The MIT License
 **/


var DeviceOrientationController = function ( object, domElement ) {

    this.object = object;
    this.element = domElement || document;

    this.freeze = true;

    this.useQuaternions = true; // use quaternions for orientation calculation by default

    
    this.deviceOrientation = {}; //Holds the updated orientation sensor data from the browser
     
    this.screenOrientation = window.orientation || 0; //depricated


    // Consistent Object Field-Of-View fix components
    var startClientHeight = window.innerHeight,
        startFOVFrustrumHeight = 2000 * Math.tan( THREE.Math.degToRad( ( this.object.fov || 75 ) / 2 ) ),
        relativeFOVFrustrumHeight, 
        relativeVerticalFOV;

    var deviceQuat = new THREE.Quaternion();

    var fireEvent = function () {
        var eventData;

        return function ( name ) {
            eventData = arguments || {};

            eventData.type = name;
            eventData.target = this;

            this.dispatchEvent( eventData );
        }.bind( this );
    }.bind( this )();

    this.constrainObjectFOV = function () {
      
        relativeFOVFrustrumHeight = startFOVFrustrumHeight * ( window.innerHeight / startClientHeight );

        relativeVerticalFOV = THREE.Math.radToDeg( 2 * Math.atan( relativeFOVFrustrumHeight / 2000 ) );

        this.object.fov = relativeVerticalFOV;
        
    }.bind( this );

    
    //Get the sensor data form browser event:
    this.onDeviceOrientationChange = function ( event ) {
      
        this.deviceOrientation = event;

    }.bind( this );



    this.onScreenOrientationChange = function () {
        
        this.screenOrientation = window.orientation || 0;

        //fireEvent( CONTROLLER_EVENT.SCREEN_ORIENTATION );
    }.bind( this );



    this.onCompassNeedsCalibration = function ( event ) {
      
        //event.preventDefault();

        //fireEvent( CONTROLLER_EVENT.CALIBRATE_COMPASS );
    }.bind( this );

    

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

                if ( this.freeze ) 
                  return;

                //this.object.quaternion.slerp( deviceQuat, 0.07 ); // smoothing
                this.object.quaternion.copy( deviceQuat );

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

        window.addEventListener( 'compassneedscalibration', this.onCompassNeedsCalibration, false );

        this.freeze = false;
    };


    this.disconnect = function () {
      
        this.freeze = true;

        window.removeEventListener( 'resize', this.constrainObjectFOV, false );

        window.removeEventListener( 'deviceorientation', this.onDeviceOrientationChange, false );

        window.removeEventListener( 'compassneedscalibration', this.onCompassNeedsCalibration, false );

    };

};

DeviceOrientationController.prototype = Object.create( THREE.EventDispatcher.prototype );





//Call back for Rotation request:

//Get compass reading (for IOS devices):
window.addEventListener("deviceorientation", function (event) {
    {
        
        let compass_ = GetCompassHeading(event.webkitCompassHeading,
            event.beta, event.gamma);
        
       /* Meaning:
        * gamma is pitch.
        * alpha is azimuth [left to right]
        * beta is roll
        */ 
        
        if(!isNaN(compass_) && compass_!=null) {
            window.dispatchEvent(new CustomEvent('rotation-is-set',
                                {detail: {compass_reading: compass_}}));
        }
    }
});


//Get compass reading (For android devices):
window.addEventListener("deviceorientationabsolute", function (event) {

    function handleOrientationEvent(event) {
              
        let compass_heading = GetCompassHeading(event.alpha, event.beta, event.gamma);
        
        if(!isNaN(compass_heading) && compass_heading!=null) {
                      
            //Set the event for compass reading is ready and reliable:
            window.dispatchEvent(new CustomEvent('rotation-is-set',
                                {detail: {compass_reading: compass_heading}}));
          }
        }
    
    handleOrientationEvent(event);
});

