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
         'illustrationMarker/a.patt');

     marker2 = new Marker(
         scene,
         arToolkitContext,
         'illustrationMarker/aa.patt');

     marker3 = new Marker(
         scene,
         arToolkitContext,
         'illustrationMarker/b.patt');
 }

 function addAssets() {
     // add assets to marker roots here
     marker1.root.add(coral.movieScreen);
     marker2.root.add(crab.movieScreen);
     marker3.root.add(shark.movieScreen);
 }

 function assetsReady() {
     // call the video assets' ready function in here
     coral.ready();
     crab.ready();
     shark.ready();
 }

 function visibility() {
     if (marker1.root.visible === true) {
         // playButton.style.visibility = "visible";
         console.log("marker 1 visible");
     } else {
         // playButton.style.visibility = "hidden";
     }

     if (marker2.root.visible === true) {
         // playButton.style.visibility = "visible";
         console.log("marker 2 visible");
     }
     if (marker3.root.visible === true) {
         // playButton.style.visibility = "visible";
         console.log("marker 3 visible");
     }

 }
