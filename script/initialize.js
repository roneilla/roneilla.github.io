function initialize() {
    renderer = new THREE.WebGLRenderer({
        alpha: true
    });
    renderer.setClearColor(new THREE.Color('lightgrey'), 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    onRenderFcts = [];
    scene = new THREE.Scene();
    var ambient = new THREE.AmbientLight(0x666666);
    scene.add(ambient);
    var directionalLight = new THREE.DirectionalLight(0x4e5ba0);
    directionalLight.position.set(-1, 1, 1).normalize();
    scene.add(directionalLight);
    camera = new THREE.Camera();
    scene.add(camera);
    arToolkitSource = new THREEx.ArToolkitSource({
        sourceType: 'webcam',
    });
    arToolkitSource.init(function onReady() {
        arToolkitSource.onResize(renderer.domElement)
    });
    window.addEventListener('resize', function () {
        arToolkitSource.onResize(renderer.domElement)
    });
    arToolkitContext = new THREEx.ArToolkitContext({
        cameraParametersUrl: 'data/camera_para.dat',
        detectionMode: 'mono',
        maxDetectionRate: 30,
        canvasWidth: 80 * 3,
        canvasHeight: 60 * 3,
    });
    arToolkitContext.init(function onCompleted() {
        camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
    });
    onRenderFcts.push(function () {
        if (arToolkitSource.ready === false) return
        arToolkitContext.update(arToolkitSource.domElement)
    });

    var biomeLoader = new THREE.ColladaLoader();
    biomeLoader.options.convertUpAxis = true;
    biomeLoader.load('models/biome.dae', function (collada) {
        dae = collada.scene;
        dae.scale.x = dae.scale.y = dae.scale.z = 0.25;
        dae.rotation.x = 90 * Math.PI / 180;
        dae.position.y = 2;
        dae.updateMatrix();
        markerAA.root.add(dae);
    });

}
