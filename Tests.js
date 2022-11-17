
// dev test coordinates

const testCrds = {
  
  beerSheeva1: {
    lat: 31.241779897014453,
    lon: 34.81248870780638
  }, // somewhere in Beer Sheva

  beerSheeva2: {
    lat: 31.243256162385038,
    lon: 34.81265196913165
  }, // some other place in Beer Sheva

  park1: {
    lat: 31.335425, 
    lon: 34.896735
  },
  
  park2: {
    lat: 31.335429199489425,
    lon: 34.896722581147
  },
  
  cafe: {
    lat: 31.25424181454119,
    lon: 34.79839706684197
  },
  
  gvtJunction: {
    lat: 31.336824695045394,
    lon: 34.89647001347589
  },
  
  hagar: {
    lat: 31.335863941913445,
    lon: 34.89715622159005
  },
  
  forestExit: {
    lat: 31.337429518562743,
    lon: 34.895844301680484
  },
  
  meitar: {
    lat: 31.327718516938347,
    lon: 34.9379609847652
  },
  
  currPos: {
    lat: 31.3363433,
    lon: 34.8966079
  } // current position
  
};


// dev estimation test function

/*

function testEstimation() {
  
  // check if GPS available
  console.log('GPS location: ' + JSON.stringify(positionGPS));

  // check if rotation available
  console.log('Rotation data: ' + CameraWrapper.rotation.y);
  
  
  // test estimation
  
  const res = estimation(testCoord4, testCoord5);
  
  console.log('[Testing estimation] Walk distance [min]: ' + res.walkDist + ', direction [deg]: ' + JSON.stringify(res.aspect));

}

*/

