function init() {

    initialize();

    createMarkers();

    marker1.root.add(coral.movieScreen);

    onRenderFcts.push(function () {

    });
    onRenderFcts.push(function () {
        renderer.render(scene, camera)
    });
    lastTimeMsec = null;

    animate();
}


function createMarkers() {

    var marker1 = new Marker(
        scene,
        arToolkitContext,
        'coral.patt');

    var marker2 = new Marker(
        scene,
        arToolkitContext,
        'shark.patt');

    var marker3 = new Marker(
        scene,
        arToolkitContext,
        'fish.patt');

    var marker4 = new Marker(
        scene,
        arToolkitContext,
        'crab.patt');

    var marker5 = new Marker(
        scene,
        arToolkitContext,
        'turtle.patt');


}

function assetsReady() {
    coral.ready();
}
