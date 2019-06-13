 function init() {
     initialize();

     createMarkers();

     addAssets();

     onRenderFcts.push(function () {

     });
     onRenderFcts.push(function () {
         renderer.render(scene, camera)
     });
     lastTimeMsec = null;
     animate();
 }

 function createMarkers() {
     marker1 = new Marker(
         scene,
         arToolkitContext,
         'test3/marker.patt');
 }

 function addAssets() {
     // add assets to marker roots here
     marker1.root.add(image1.sprite);
 }

 function assetsReady() {

     // call the assets' ready function in here
     //coral.ready();

 }

 function visibilityCheck() {
     if (marker1.root.visible === true) {
         console.log("marker 1 visible");
     }

 }
