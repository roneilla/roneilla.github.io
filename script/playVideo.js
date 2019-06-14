   function playVideo() {
       if (markerA.root.visible === true) {
           event.preventDefault()
           aVideo.video.play();
           bVideo.video.pause();
           dVideo.video.pause();
       } else if (markerB.root.visible === true) {
           event.preventDefault()
           bVideo.video.play();
           aVideo.video.pause();
           dVideo.video.pause();
       } else if (markerD.root.visible === true) {
           event.preventDefault()
           dVideo.video.play();
           aVideo.video.pause();
           bVideo.video.pause();
       }
   }
