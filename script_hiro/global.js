  var renderer, scene, camera;
  var arToolkitContext, onRenderFcts, arToolkitSource, markerRoot, lastTimeMsec;

  var params = {
      opacity: 1
  };

  var pc = 0;

  // button variable

  var playButton = document.getElementById("button");

  // marker variables
  var marker1, marker2, marker3, marker4, marker5, marker6, marker7, marker8, marker9;


  // declare video variables here

  var coral = new markerVideo('videos/CORAL.mp4');
  coral.setSize(236, 214);
  coral.load();

  var fish = new markerVideo('videos/FISH.mp4');
  fish.setSize(402, 418);
  fish.load();

  var crab = new markerVideo('videos/CRAB.mp4');
  crab.setSize(96, 96);
  crab.load();

  var turtle = new markerVideo('videos/TURTLE.mp4');
  turtle.setSize(278, 278);
  turtle.load();

  var shark = new markerVideo('videos/SHARK.mp4');
  shark.setSize(134, 136);
  shark.load();

  var fullVideo = new markerVideo('videos/FULL.mp4');
  fullVideo.setSize(1080, 1080);
  fullVideo.load();


  // image variables

  var image1 = new markerImage('images/SharkArMap_1.png');
  image1.setSize(1, 1, 1);
  image1.setPosition(0, 0, 0);

  var image2 = new markerImage('images/SharkArMap_2.png');
  image2.setSize(1, 1, 1);
  image2.setPosition(0, 0, 0);

  var image3 = new markerImage('images/SharkArMap_3.png');
  image3.setSize(1, 1, 1);
  image3.setPosition(0, 0, 0);

  var image4 = new markerImage('images/SharkArMap_4.png');
  image4.setSize(1, 1, 1);
  image4.setPosition(0, 0, 0);

  var image5 = new markerImage('images/SharkArMap_5.png');
  image5.setSize(1, 1, 1);
  image5.setPosition(0, 0, 0);

  var image6 = new markerImage('images/SharkArMap_6.png');
  image6.setSize(1, 1, 1);
  image6.setPosition(0, 0, 0);

  var image7 = new markerImage('images/SharkArMap_7.png');
  image7.setSize(1, 1, 1);
  image7.setPosition(0, 0, 0);

  var image8 = new markerImage('images/SharkArMap_8.png');
  image8.setSize(1, 1, 1);
  image8.setPosition(0, 0, 0);

  var image9 = new markerImage('images/SharkArMap_9.png');
  image9.setSize(1, 1, 1);
  image9.setPosition(0, 0, 0);
