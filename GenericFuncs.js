//Globals:

//var GlobMarkers=[];
//var GlobDebugFlag=false;

const DEBUG_LEVEL=0;

//Calculate compass heading from orientation event data:
//returns true north:
function GetCompassHeading(alpha, beta, gamma) {

    // Convert degrees to radians
    var alphaRad = alpha * (Math.PI / 180);
    var betaRad = beta * (Math.PI / 180);
    var gammaRad = gamma * (Math.PI / 180);

    // Calculate equation components
    var cA = Math.cos(alphaRad);
    var sA = Math.sin(alphaRad);
    var sB = Math.sin(betaRad);
    var cG = Math.cos(gammaRad);
    var sG = Math.sin(gammaRad);

    // Calculate A, B, C rotation components
    var rA = -cA * sG - sA * sB * cG;
    var rB = -sA * sG + cA * sB * cG;

    // Calculate compass heading
    var compassHeading = Math.atan(rA / rB);

    // Convert from half unit circle to whole unit circle
    if (rB < 0) {
        compassHeading += Math.PI;
    } else if (rA < 0) {
        compassHeading += 2 * Math.PI;
    }
    // Convert radians to degrees
    compassHeading *= 180 / Math.PI;

    return compassHeading;
}



//Get direction from pt. of origin to target :
//distance[km],[x,y]-in [km] and bearing[deg from north]
//from pt of origin to target location:
function GetDirection(Location_source, Location_target) {

    let lat2 = Location_target.lat;
    let lat1 = Location_source.lat;
    let lon2 = Location_target.lon;
    let lon1 = Location_source.lon;


    let R = 6371; // [km]
    let phi1 = THREE.Math.degToRad(lat1);// * THREE.Math.Deg2Rad;
    let phi2 = THREE.Math.degToRad(lat2);// * THREE.Math.Deg2Rad;
    let lambda1 = THREE.Math.degToRad(lon1);// * THREE.Math.Deg2Rad;
    let lambda2 = THREE.Math.degToRad(lon2);// * THREE.Math.Deg2Rad;

    let delta_phi = THREE.Math.degToRad(lat2 - lat1);// * THREE.Math.Deg2Rad;
    let delta_lambda = THREE.Math.degToRad(lon2 - lon1);// * THREE.Math.Deg2Rad;

    let a = Math.sin(delta_phi / 2) * Math.sin(delta_phi / 2) +
        Math.cos(phi1) * Math.cos(phi2) *
        Math.sin(delta_lambda / 2) * Math.sin(delta_lambda / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let d = R * c;
    let distance = d;//distance in km

    //Calculate the bearing:
    //where phi1, lambda1 is the start point, phi2,lambda2 the end point(delta_lambda is the difference in longitude)

    let y = Math.sin(lambda2 - lambda1) * Math.cos(phi2);
    let x = Math.cos(phi1) * Math.sin(phi2) -
        Math.sin(phi1) * Math.cos(phi2) * Math.cos(lambda2 - lambda1);
    let brng = THREE.Math.radToDeg(Math.atan2(y, x));// * THREE.Math.Rad2Deg;

    let bearing = brng;//bearing in [deg]

    //Fix the non-relevant degrees:
    bearing = (bearing + 360) % 360;

    let brng_tmp = (brng + 360) % 360;
    let x_ = distance * Math.cos(THREE.Math.degToRad(brng_tmp));// * THREE.Math.Deg2Rad);//km*Scale
    let y_ = distance * Math.sin(THREE.Math.degToRad(brng_tmp));// * THREE.Math.Deg2Rad);//km*Scale

    let result = {
        distance_: distance,
        bearing_: bearing,
        x: x_,
        y: y_,
    };
    return result;
}




//Convert degrees [-180, 180) to [0..360]
function Convert180to360(deg)
{
    //var x = Math.random()*360-180;  // Generate random angle in range [-180, 180)
    let deg_r = (deg + 360) % 360;        // Normalize to be in the range [0, 360)
    return deg_r;
}

//Convert degrees [-180, 180) to [0..360]
function Convert360to180(deg)
{
    let deg_r = ((deg - 180) % 180);        // Normalize to be in the range [-180, 180)
    return deg_r;
}


