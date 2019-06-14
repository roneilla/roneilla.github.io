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
  coral.load();

  var fish = new markerVideo('videos/FISH.mp4', 1, 1);
  fish.setSize(402, 418);
  fish.load();

  var crab = new markerVideo('videos/CRAB.mp4', 1, 1);
  crab.setSize(96, 96);
  crab.load();

  var turtle = new markerVideo('videos/TURTLE.mp4', 1, 1);
  turtle.setSize(278, 278);
  turtle.load();

  var shark = new markerVideo('videos/SHARK.mp4', 1, 1);
  shark.setSize(134, 136);
  shark.load();

  var fullVideo = new markerVideo('videos/FULL.mp4', 1, 1);
  fullVideo.setSize(1080, 1080);
  fullVideo.load();


  // image variables

  var image1 = new markerImage('images/SharkArMap_1.png');
  image1.setSize(1, 1, 1);
  image1.setPosition(0, 0, 0);
