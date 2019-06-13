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
         'kaydenMarker/pattern-SharkArMap_1.patt');
     marker2 = new Marker(
         scene,
         arToolkitContext,
         'kaydenMarker/pattern-SharkArMap_2.patt');
     marker3 = new Marker(
         scene,
         arToolkitContext,
         'kaydenMarker/pattern-SharkArMap_3.patt');
     marker4 = new Marker(
         scene,
         arToolkitContext,
         'kaydenMarker/pattern-SharkArMap_4.patt');
     marker5 = new Marker(
         scene,
         arToolkitContext,
         'kaydenMarker/pattern-SharkArMap_5.patt');
     marker6 = new Marker(
         scene,
         arToolkitContext,
         'kaydenMarker/pattern-SharkArMap_6.patt');
     marker7 = new Marker(
         scene,
         arToolkitContext,
         'kaydenMarker/pattern-SharkArMap_7.patt');
     marker8 = new Marker(
         scene,
         arToolkitContext,
         'kaydenMarker/pattern-SharkArMap_8.patt');
     marker9 = new Marker(
         scene,
         arToolkitContext,
         'kaydenMarker/pattern-SharkArMap_9.patt');
 }

 function addAssets() {
     // add assets to marker roots here
     marker1.root.add(image1.sprite);
     marker2.root.add(image2.sprite);
     marker3.root.add(image3.sprite);
     marker4.root.add(image4.sprite);
     marker5.root.add(image5.sprite);
     marker6.root.add(image6.sprite);
     marker7.root.add(image7.sprite);
     marker8.root.add(image8.sprite);
     marker9.root.add(image9.sprite);
 }

 function assetsReady() {

     // call the assets' ready function in here
     //coral.ready();

 }

 function visibilityCheck() {
     if (marker1.root.visible === true) {
         console.log("marker 1 visible");
     }
     if (marker2.root.visible === true) {
         console.log("marker 2 visible");
     }
     if (marker3.root.visible === true) {
         console.log("marker 3 visible");
     }
     if (marker4.root.visible === true) {
         console.log("marker 4 visible");
     }
     if (marker5.root.visible === true) {
         console.log("marker 5 visible");
     }
     if (marker6.root.visible === true) {
         console.log("marker 6 visible");
     }
     if (marker7.root.visible === true) {
         console.log("marker 7 visible");
     }
     if (marker8.root.visible === true) {
         console.log("marker 8 visible");
     }
     if (marker9.root.visible === true) {
         console.log("marker 9 visible");
     }

 }
