   function playVideo() {
       if (markerA.root.visible === true || markerB.root.visible === true || markerD.root.visible === true) {
           aVideo.video.play();
           bVideo.video.play();
           dVideo.video.play();

           pc++;
           console.log("clicked");
       }
   }
