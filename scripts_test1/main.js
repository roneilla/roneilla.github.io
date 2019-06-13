 function init() {
     initialize();

     createMarkers();

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
         'coral.patt');

     marker2 = new Marker(
         scene,
         arToolkitContext,
         'shark.patt');

     marker3 = new Marker(
         scene,
         arToolkitContext,
         'fish.patt');

     marker4 = new Marker(
         scene,
         arToolkitContext,
         'crab.patt');

     marker5 = new Marker(
         scene,
         arToolkitContext,
         'turtle.patt');

 }

 function assetsReady() {
     coral.ready();
     shark.ready();
     fish.ready();
     crab.ready();
     turtle.ready();
     fullVideo.ready();
 }

 function visibilityCheck() {
     if (marker1.root.visible === true) {
         marker1.root.add(coral.movieScreen);

         //         console.log("coral");
     }

     if (marker2.root.visible === true) {
         marker2.root.add(shark.movieScreen);

         //         console.log("shark");

     }
     if (marker3.root.visible === true) {
         marker3.root.add(fish.movieScreen);

         //         console.log("fish");

     }
     if (marker4.root.visible === true) {
         marker4.root.add(crab.movieScreen);

         //         console.log("crab");
     }

     if (marker5.root.visible === true) {
         marker5.root.add(turtle.movieScreen);

         //         console.log("turtle");
     }

     if (marker1.root.visible === true && marker2.root.visible === true && marker3.root.visible === true && marker4.root.visible === true && marker5.root.visible === true) {

         marker1.root.remove(coral.movieScreen);
         marker2.root.remove(shark.movieScreen);
         marker3.root.remove(fish.movieScreen);
         marker4.root.remove(crab.movieScreen);
         marker5.root.remove(turtle.movieScreen);
         console.log("EVERYTHING");
         marker5.root.add(fullVideo.movieScreen);

     } else {
         marker5.root.remove(fullVideo.movieScreen);

     }

 }
