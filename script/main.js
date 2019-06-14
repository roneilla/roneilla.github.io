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
     markerA = new marker(
         scene,
         arToolkitContext,
         'customMarker/kayden/a.patt');

     markerAA = new marker(
         scene,
         arToolkitContext,
         'customMarker/kayden/aa.patt');

     markerB = new marker(
         scene,
         arToolkitContext,
         'customMarker/kayden/b.patt');

     markerD = new marker(
         scene,
         arToolkitContext,
         'customMarker/kayden/d.patt');
 }

 function addAssets() {
     // add assets to marker roots here
     markerA.root.add(aVideo.movieScreen);
     markerB.root.add(bVideo.movieScreen);
     markerD.root.add(dVideo.movieScreen);

 }

 function assetsReady() {
     // call the video assets' ready function in here
     coral.ready();
     crab.ready();
     shark.ready();
 }

 function markerVisibility() {
     if (marker1.root.visible === true || marker3.root.visible === true) {
         playButton.style.visibility = "visible";
     } else {
         playButton.style.visibility = "hidden";

     }

     if (marker1.root.visible === true) {
         console.log("marker 1 visible");
     }

     if (marker3.root.visible === true) {
         console.log("marker 3 visible");
     }


     if (marker2.root.visible === true) {
         console.log("marker 2 visible");
         playButton.style.visibility = "hidden";

     }


 }
