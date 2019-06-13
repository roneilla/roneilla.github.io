class markerVideo {
    constructor(src, x, y) {
        this.video = document.createElement('video');
        this.video.src = src;
        this.videoImage = document.createElement('canvas');
        this.loadTexture();
    }

    loadTexture() {
        this.videoImageContext = this.videoImage.getContext('2d');
        this.videoTexture = new THREE.Texture(this.videoImage);
        this.videoTexture.minFilter = THREE.LinearFilter;
        this.videoTexture.magFilter = THREE.LinearFilter;
        this.movieMaterial = new THREE.MeshBasicMaterial({
            map: this.videoTexture,
            overdraw: true,
            side: THREE.DoubleSide
        });
    }

    loadGeometry(x, y, sX, sY) {
        this.movieGeometry = new THREE.PlaneGeometry(x, y);
        this.movieScreen = new THREE.Mesh(this.movieGeometry, this.movieMaterial);
        this.movieScreen.rotation.x = -Math.PI / 2;
        this.movieScreen.position.set(0, 0, 0);
        this.movieScreen.scale.y = sX;
        this.movieScreen.scale.x = sY;
    }

    setSize(width, height) {
        this.videoImage.width = width;
        this.videoImage.height = height;
    }

    load() {
        this.video.load();
        this.videoImageContext.fillStyle = '#000000';
        this.videoImageContext.fillRect(0, 0, this.videoImage.width, this.videoImage.height);
    }

    ready() {
        if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
            this.videoImageContext.drawImage(this.video, 0, 0);
            if (this.videoTexture)
                this.videoTexture.needsUpdate = true;
        }

    }


}
