   function playVideo() {
       if ((marker1.root.visible === true)) {
           coral.video.play();
           pc++;
           console.log("coral video playing")

       }

       if ((marker2.root.visible === true)) {
           shark.video.play();
           pc++;
           console.log("shark video playing")
       }

       if ((marker3.root.visible === true)) {
           fish.video.play();
           pc++;
           console.log("fish video playing")
       }

       if ((marker4.root.visible === true)) {
           crab.video.play();
           pc++;
           console.log("crab video playing")
       }

       if ((marker5.root.visible === true)) {
           turtle.video.play();
           pc++;
           console.log("turtle video playing")
       }

       if (marker1.root.visible === true && marker2.root.visible === true && marker3.root.visible === true && marker4.root.visible === true && marker5.root.visible === true) {
           fullVideo.video.play();
           console.log("full video playing")

       }
   }
