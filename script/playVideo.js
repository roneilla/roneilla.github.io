   function playVideo() {
       if (markerA.root.visible === true) {
           aVideo.video.play();
       } else if (markerB.root.visible === true) {
           bVideo.video.play();
       } else if (markerD.root.visible === true) {
           dVideo.video.play();
       }
   }
