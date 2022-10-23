
//Rotation helper supports rotation of the player and his alignment to true north

//Counter for init reading:
var CmpssEventCounter=0;

//Hold compass heading :
var CompassHeading=0;
Initial_cmpss_val=0; //for debug only



//Function initializes the rotation module
function InitRot()
{
    //Bind the initial rotation event:
    window.addEventListener('rotation-is-set', SetInitRotation);
    
}



//Function sets initial rotation
function SetInitRotation(e)
{
    if( (e.detail.compass_reading!=0) && !(isNaN(e.detail.compass_reading))) {        

        let cmpss360 = e.detail.compass_reading;
        let cmpss180 = (cmpss360-180)%180;//to range [-180,180]

        let rot_y_ = RotTransform(cmpss180);
        if(isNaN(rot_y_))rot_y_=0;//ERROR
        
        console.log('Got actual rotation',rot_y_+'[deg]')

        let rot_y = rot_y_*Math.PI/180;

        //Set player rotation:
        CameraWrapper.rotation.x = 0;
        CameraWrapper.rotation.y = rot_y;//[-pi..pi]
        CameraWrapper.rotation.z = 0;

        if(CmpssEventCounter>5) {
            window.removeEventListener('rotation-is-set', SetInitRotation);
            console.log('Rotation module is loaded and ready');
            Initial_cmpss_val = cmpss180;
            CmpssEventCounter=0;
        }else{
            CmpssEventCounter++;
        }
        CompassHeading = e.detail.compass_reading;
    }
}


//Receives cmpss in [-180,180] and returng rot.y for the platform
function RotTransform(cmpss)
{
    if(cmpss>=-180 && cmpss<-90 ) return cmpss+90;
    if(cmpss >=-90 && cmpss<0) return cmpss+90;
    if(cmpss>=0 && cmpss<90) return cmpss+90;
    if (cmpss>=90 && cmpss<180) return cmpss - 270;

    return NaN;
}

