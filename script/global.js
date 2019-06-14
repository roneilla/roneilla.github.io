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
  var aVideo = new markerVideo('videos/a-video.mp4', 4.48, 2.52);
  aVideo.setSize(2016, 726);
  aVideo.setRotation(-90 * Math.PI / 180, 0, 45 * Math.PI / 180);
  aVideo.setPosition(0, 0, 0);
  aVideo.load();

  var bVideo = new markerVideo('videos/b-video.mp4', 2, 2);
  bVideo.setSize(1080, 1080);
  bVideo.setRotation(-90 * Math.PI / 180, 0, 45 * Math.PI / 180);
  bVideo.setPosition(0, 0, 0);
  bVideo.load();

  var dVideo = new markerVideo('videos/d-video.mp4', 4.48, 2.52);
  dVideo.setSize(2016, 726);
  dVideo.setRotation(-90 * Math.PI / 180, 0, 45 * Math.PI / 180);
  dVideo.setPosition(0, 0, 0);
  dVideo.load();
