   function playVideo() {
       if (markerA.root.visible === true) {
           aVideo.video.play();
           bVideo.video.pause();
           dVideo.video.pause();
       } else if (markerB.root.visible === true) {
           bVideo.video.play();
           aVideo.video.pause();
           dVideo.video.pause();
       } else if (markerD.root.visible === true) {
           dVideo.video.play();
           aVideo.video.pause();
           bVideo.video.pause();
       }
   }
