  var renderer, scene, camera;
  var arToolkitContext, onRenderFcts, arToolkitSource, markerRoot, lastTimeMsec;

  var dae;

  var params = {
      opacity: 1
  };

  var pc = 0;

  // button variable

  var playButton = document.getElementById("button");

  // marker variables
  var marker1, marker2, marker3;

  // declare video variables here
  var aVideo = new markerVideo('videos/a-video.mp4', 7.055, 2.54);
  aVideo.setSize(2016, 726);
  aVideo.setRotation(0, 0, 45 * Math.PI / 180);
  aVideo.setPosition(0, 0, 0);
  aVideo.load();

  var bVideo = new markerVideo('videos/b-video.mp4', 3.78, 3.78);
  bVideo.setSize(1080, 1080);
  bVideo.setRotation(0, 0, 45 * Math.PI / 180);
  bVideo.setPosition(0, 0, 0);
  bVideo.load();

  var dVideo = new markerVideo('videos/d-video.mp4', 5.25, 3.395);
  dVideo.setSize(1500, 970);
  dVideo.setRotation(0, 0, 45 * Math.PI / 180);
  dVideo.setPosition(0, 0, 0);
  dVideo.load();
