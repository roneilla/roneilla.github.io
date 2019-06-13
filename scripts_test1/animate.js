function animate(nowMsec) {
    requestAnimationFrame(animate);
    lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
    var deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
    lastTimeMsec = nowMsec;
    pulse = Date.now() * 0.0009;
    onRenderFcts.forEach(function (onRenderFct) {
        onRenderFct(deltaMsec / 1000, nowMsec / 1000);
    });

    assetsReady();

    //visibilityCheck();


    // for pausing video, not necessary
    //    if (pc == 1) {
    //        btext = "PAUSE";
    //        var b = document.getElementById('middlebutton');
    //        b.setAttribute('content', 'PAUSE');
    //        b.setAttribute('class', 'btn');
    //        b.innerHTML = 'PAUSE';
    //    }
    //    if (pc >= 2) {
    //        coral.video.pause();
    //        shark.video.pause();
    //        fish.video.pause();
    //        crab.video.pause();
    //        turtle.video.pause();
    //        fullVideo.video.pause();
    //        pc = 0;
    //    }
    //    if (pc != 1) {
    //        btext = "PLAY";
    //        var b = document.getElementById('middlebutton');
    //        b.setAttribute('content', 'PLAY');
    //        b.setAttribute('class', 'btn');
    //        b.innerHTML = 'PLAY';
    //    }
}
