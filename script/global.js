  var renderer, scene, camera;
  var arToolkitContext, onRenderFcts, arToolkitSource, markerRoot, lastTimeMsec;

  var params = {
      opacity: 1
  };

  var pc = 0;

  // button variable

  var playButton = document.getElementById("button");

  // marker variables
  var marker1, marker2, marker3;

  // declare video variables here
  var coral = new markerVideo('videos/CORAL.mp4', 1, 1);
  coral.setSize(236, 214);
  coral.setRotation(-Math.PI / 2, 0, 0);
  coral.setPosition(0, 0, 0);
  coral.load();

  var shark = new markerVideo('videos/SHARK.mp4', 1, 1);
  shark.setSize(134, 136);
  shark.setRotation(-Math.PI / 2, 0, 0);
  shark.setPosition(0, 0, 0);
  shark.load();

  // image variables

  var image1 = new markerImage('images/SharkArMap_1.png');
  image1.setSize(1, 1, 1);
  image1.setPosition(0, 0, 0);
