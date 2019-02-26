((function () {
    "use strict";
    var ARController = (function (width, height, camera) {
        var id;
        var w = width,
            h = height;
        this.orientation = "landscape";
        this.listeners = {};
        if (typeof width !== "number") {
            var image = width;
            camera = height;
            w = image.videoWidth || image.width;
            h = image.videoHeight || image.height;
            this.image = image
        }
        this.defaultMarkerWidth = 1;
        this.patternMarkers = {};
        this.barcodeMarkers = {};
        this.transform_mat = new Float32Array(16);
        this.canvas = document.createElement("canvas");
        this.canvas.width = w;
        this.canvas.height = h;
        this.ctx = this.canvas.getContext("2d");
        this.videoWidth = w;
        this.videoHeight = h;
        if (typeof camera === "string") {
            var self = this;
            this.cameraParam = new ARCameraParam(camera, (function () {
                self._initialize()
            }), (function (err) {
                console.error("ARController: Failed to load ARCameraParam", err)
            }))
        } else {
            this.cameraParam = camera;
            this._initialize()
        }
    });
    ARController.prototype.dispose = (function () {
        artoolkit.teardown(this.id);
        for (var t in this) {
            this[t] = null
        }
    });
    ARController.prototype.process = (function (image) {
        this.detectMarker(image);
        var markerNum = this.getMarkerNum();
        var k, o;
        for (k in this.patternMarkers) {
            o = this.patternMarkers[k];
            o.inPrevious = o.inCurrent;
            o.inCurrent = false
        }
        for (k in this.barcodeMarkers) {
            o = this.barcodeMarkers[k];
            o.inPrevious = o.inCurrent;
            o.inCurrent = false
        }
        for (var i = 0; i < markerNum; i++) {
            var markerInfo = this.getMarker(i);
            var markerType = artoolkit.UNKNOWN_MARKER;
            var visible = this.trackPatternMarkerId(-1);
            if (markerInfo.idPatt > -1 && (markerInfo.id === markerInfo.idPatt || markerInfo.idMatrix === -1)) {
                visible = this.trackPatternMarkerId(markerInfo.idPatt);
                markerType = artoolkit.PATTERN_MARKER;
                if (markerInfo.dir !== markerInfo.dirPatt) {
                    this.setMarkerInfoDir(i, markerInfo.dirPatt)
                }
            } else if (markerInfo.idMatrix > -1) {
                visible = this.trackBarcodeMarkerId(markerInfo.idMatrix);
                markerType = artoolkit.BARCODE_MARKER;
                if (markerInfo.dir !== markerInfo.dirMatrix) {
                    this.setMarkerInfoDir(i, markerInfo.dirMatrix)
                }
            }
            if (markerType !== artoolkit.UNKNOWN_MARKER && visible.inPrevious) {
                this.getTransMatSquareCont(i, visible.markerWidth, visible.matrix, visible.matrix)
            } else {
                this.getTransMatSquare(i, visible.markerWidth, visible.matrix)
            }
            visible.inCurrent = true;
            this.transMatToGLMat(visible.matrix, this.transform_mat);
            this.dispatchEvent({
                name: "getMarker",
                target: this,
                data: {
                    index: i,
                    type: markerType,
                    marker: markerInfo,
                    matrix: this.transform_mat
                }
            })
        }
        var multiMarkerCount = this.getMultiMarkerCount();
        for (var i = 0; i < multiMarkerCount; i++) {
            var subMarkerCount = this.getMultiMarkerPatternCount(i);
            varvisible = false;
            artoolkit.getTransMatMultiSquareRobust(this.id, i);
            this.transMatToGLMat(this.marker_transform_mat, this.transform_mat);
            for (var j = 0; j < subMarkerCount; j++) {
                var multiEachMarkerInfo = this.getMultiEachMarker(i, j);
                if (multiEachMarkerInfo.visible >= 0) {
                    visible = true;
                    this.dispatchEvent({
                        name: "getMultiMarker",
                        target: this,
                        data: {
                            multiMarkerId: i,
                            matrix: this.transform_mat
                        }
                    });
                    break
                }
            }
            if (visible) {
                for (var j = 0; j < subMarkerCount; j++) {
                    var multiEachMarkerInfo = this.getMultiEachMarker(i, j);
                    this.transMatToGLMat(this.marker_transform_mat, this.transform_mat);
                    this.dispatchEvent({
                        name: "getMultiMarkerSub",
                        target: this,
                        data: {
                            multiMarkerId: i,
                            markerIndex: j,
                            marker: multiEachMarkerInfo,
                            matrix: this.transform_mat
                        }
                    })
                }
            }
        }
        if (this._bwpointer) {
            this.debugDraw()
        }
    });
    ARController.prototype.trackPatternMarkerId = (function (id, markerWidth) {
        var obj = this.patternMarkers[id];
        if (!obj) {
            this.patternMarkers[id] = obj = {
                inPrevious: false,
                inCurrent: false,
                matrix: new Float32Array(12),
                markerWidth: markerWidth || this.defaultMarkerWidth
            }
        }
        if (markerWidth) {
            obj.markerWidth = markerWidth
        }
        return obj
    });
    ARController.prototype.trackBarcodeMarkerId = (function (id, markerWidth) {
        var obj = this.barcodeMarkers[id];
        if (!obj) {
            this.barcodeMarkers[id] = obj = {
                inPrevious: false,
                inCurrent: false,
                matrix: new Float32Array(12),
                markerWidth: markerWidth || this.defaultMarkerWidth
            }
        }
        if (markerWidth) {
            obj.markerWidth = markerWidth
        }
        return obj
    });
    ARController.prototype.getMultiMarkerCount = (function () {
        return artoolkit.getMultiMarkerCount(this.id)
    });
    ARController.prototype.getMultiMarkerPatternCount = (function (multiMarkerId) {
        return artoolkit.getMultiMarkerNum(this.id, multiMarkerId)
    });
    ARController.prototype.addEventListener = (function (name, callback) {
        if (!this.listeners[name]) {
            this.listeners[name] = []
        }
        this.listeners[name].push(callback)
    });
    ARController.prototype.removeEventListener = (function (name, callback) {
        if (this.listeners[name]) {
            var index = this.listeners[name].indexOf(callback);
            if (index > -1) {
                this.listeners[name].splice(index, 1)
            }
        }
    });
    ARController.prototype.dispatchEvent = (function (event) {
        var listeners = this.listeners[event.name];
        if (listeners) {
            for (var i = 0; i < listeners.length; i++) {
                listeners[i].call(this, event)
            }
        }
    });
    ARController.prototype.debugSetup = (function () {
        document.body.appendChild(this.canvas);
        this.setDebugMode(1);
        this._bwpointer = this.getProcessingImage()
    });
    ARController.prototype.loadMarker = (function (markerURL, onSuccess, onError) {
        return artoolkit.addMarker(this.id, markerURL, onSuccess, onError)
    });
    ARController.prototype.loadMultiMarker = (function (markerURL, onSuccess, onError) {
        return artoolkit.addMultiMarker(this.id, markerURL, onSuccess, onError)
    });
    ARController.prototype.getTransMatSquare = (function (markerIndex, markerWidth, dst) {
        artoolkit.getTransMatSquare(this.id, markerIndex, markerWidth);
        dst.set(this.marker_transform_mat);
        return dst
    });
    ARController.prototype.getTransMatSquareCont = (function (markerIndex, markerWidth, previousMarkerTransform, dst) {
        this.marker_transform_mat.set(previousMarkerTransform);
        artoolkit.getTransMatSquareCont(this.id, markerIndex, markerWidth);
        dst.set(this.marker_transform_mat);
        return dst
    });
    ARController.prototype.getTransMatMultiSquare = (function (multiMarkerId, dst) {
        artoolkit.getTransMatMultiSquare(this.id, multiMarkerId);
        dst.set(this.marker_transform_mat);
        return dst
    });
    ARController.prototype.getTransMatMultiSquareRobust = (function (multiMarkerId, dst) {
        artoolkit.getTransMatMultiSquare(this.id, multiMarkerId);
        dst.set(this.marker_transform_mat);
        return dst
    });
    ARController.prototype.transMatToGLMat = (function (transMat, glMat, scale) {
        glMat[0 + 0 * 4] = transMat[0];
        glMat[0 + 1 * 4] = transMat[1];
        glMat[0 + 2 * 4] = transMat[2];
        glMat[0 + 3 * 4] = transMat[3];
        glMat[1 + 0 * 4] = transMat[4];
        glMat[1 + 1 * 4] = transMat[5];
        glMat[1 + 2 * 4] = transMat[6];
        glMat[1 + 3 * 4] = transMat[7];
        glMat[2 + 0 * 4] = transMat[8];
        glMat[2 + 1 * 4] = transMat[9];
        glMat[2 + 2 * 4] = transMat[10];
        glMat[2 + 3 * 4] = transMat[11];
        glMat[3 + 0 * 4] = 0;
        glMat[3 + 1 * 4] = 0;
        glMat[3 + 2 * 4] = 0;
        glMat[3 + 3 * 4] = 1;
        if (scale != undefined && scale !== 0) {
            glMat[12] *= scale;
            glMat[13] *= scale;
            glMat[14] *= scale
        }
        return glMat
    });
    ARController.prototype.detectMarker = (function (image) {
        if (this._copyImageToHeap(image)) {
            return artoolkit.detectMarker(this.id)
        }
        return -99
    });
    ARController.prototype.getMarkerNum = (function () {
        return artoolkit.getMarkerNum(this.id)
    });
    ARController.prototype.getMarker = (function (markerIndex) {
        if (0 === artoolkit.getMarker(this.id, markerIndex)) {
            return artoolkit.markerInfo
        }
    });
    ARController.prototype.setMarkerInfoVertex = (function (markerIndex, vertexData) {
        for (var i = 0; i < vertexData.length; i++) {
            this.marker_transform_mat[i * 2 + 0] = vertexData[i][0];
            this.marker_transform_mat[i * 2 + 1] = vertexData[i][1]
        }
        return artoolkit.setMarkerInfoVertex(this.id, markerIndex)
    });
    ARController.prototype.cloneMarkerInfo = (function (markerInfo) {
        return JSON.parse(JSON.stringify(markerInfo))
    });
    ARController.prototype.getMultiEachMarker = (function (multiMarkerId, markerIndex) {
        if (0 === artoolkit.getMultiEachMarker(this.id, multiMarkerId, markerIndex)) {
            return artoolkit.multiEachMarkerInfo
        }
    });
    ARController.prototype.getTransformationMatrix = (function () {
        return this.transform_mat
    });
    ARController.prototype.getCameraMatrix = (function () {
        return this.camera_mat
    });
    ARController.prototype.getMarkerTransformationMatrix = (function () {
        return this.marker_transform_mat
    });
    ARController.prototype.setDebugMode = (function (mode) {
        return artoolkit.setDebugMode(this.id, mode)
    });
    ARController.prototype.getDebugMode = (function () {
        return artoolkit.getDebugMode(this.id)
    });
    ARController.prototype.getProcessingImage = (function () {
        return artoolkit.getProcessingImage(this.id)
    });
    ARController.prototype.setLogLevel = (function (mode) {
        return artoolkit.setLogLevel(mode)
    });
    ARController.prototype.getLogLevel = (function () {
        return artoolkit.getLogLevel()
    });
    ARController.prototype.setMarkerInfoDir = (function (markerIndex, dir) {
        return artoolkit.setMarkerInfoDir(this.id, markerIndex, dir)
    });
    ARController.prototype.setProjectionNearPlane = (function (value) {
        return artoolkit.setProjectionNearPlane(this.id, value)
    });
    ARController.prototype.getProjectionNearPlane = (function () {
        return artoolkit.getProjectionNearPlane(this.id)
    });
    ARController.prototype.setProjectionFarPlane = (function (value) {
        return artoolkit.setProjectionFarPlane(this.id, value)
    });
    ARController.prototype.getProjectionFarPlane = (function () {
        return artoolkit.getProjectionFarPlane(this.id)
    });
    ARController.prototype.setThresholdMode = (function (mode) {
        return artoolkit.setThresholdMode(this.id, mode)
    });
    ARController.prototype.getThresholdMode = (function () {
        return artoolkit.getThresholdMode(this.id)
    });
    ARController.prototype.setThreshold = (function (threshold) {
        return artoolkit.setThreshold(this.id, threshold)
    });
    ARController.prototype.getThreshold = (function () {
        return artoolkit.getThreshold(this.id)
    });
    ARController.prototype.setPatternDetectionMode = (function (value) {
        return artoolkit.setPatternDetectionMode(this.id, value)
    });
    ARController.prototype.getPatternDetectionMode = (function () {
        return artoolkit.getPatternDetectionMode(this.id)
    });
    ARController.prototype.setMatrixCodeType = (function (value) {
        return artoolkit.setMatrixCodeType(this.id, value)
    });
    ARController.prototype.getMatrixCodeType = (function () {
        return artoolkit.getMatrixCodeType(this.id)
    });
    ARController.prototype.setLabelingMode = (function (value) {
        return artoolkit.setLabelingMode(this.id, value)
    });
    ARController.prototype.getLabelingMode = (function () {
        return artoolkit.getLabelingMode(this.id)
    });
    ARController.prototype.setPattRatio = (function (value) {
        return artoolkit.setPattRatio(this.id, value)
    });
    ARController.prototype.getPattRatio = (function () {
        return artoolkit.getPattRatio(this.id)
    });
    ARController.prototype.setImageProcMode = (function (value) {
        return artoolkit.setImageProcMode(this.id, value)
    });
    ARController.prototype.getImageProcMode = (function () {
        return artoolkit.getImageProcMode(this.id)
    });
    ARController.prototype.debugDraw = (function () {
        var debugBuffer = new Uint8ClampedArray(Module.HEAPU8.buffer, this._bwpointer, this.framesize);
        var id = new ImageData(debugBuffer, this.canvas.width, this.canvas.height);
        this.ctx.putImageData(id, 0, 0);
        var marker_num = this.getMarkerNum();
        for (var i = 0; i < marker_num; i++) {
            this._debugMarker(this.getMarker(i))
        }
    });
    ARController.prototype._initialize = (function () {
        this.id = artoolkit.setup(this.canvas.width, this.canvas.height, this.cameraParam.id);
        var params = artoolkit.frameMalloc;
        this.framepointer = params.framepointer;
        this.framesize = params.framesize;
        this.dataHeap = new Uint8Array(Module.HEAPU8.buffer, this.framepointer, this.framesize);
        this.camera_mat = new Float64Array(Module.HEAPU8.buffer, params.camera, 16);
        this.marker_transform_mat = new Float64Array(Module.HEAPU8.buffer, params.transform, 12);
        this.setProjectionNearPlane(.1);
        this.setProjectionFarPlane(1e3);
        var self = this;
        setTimeout((function () {
            if (self.onload) {
                self.onload()
            }
            self.dispatchEvent({
                name: "load",
                target: self
            })
        }), 1)
    });
    ARController.prototype._copyImageToHeap = (function (image) {
        if (!image) {
            image = this.image
        }
        this.ctx.save();
        if (this.orientation === "portrait") {
            this.ctx.translate(this.canvas.width, 0);
            this.ctx.rotate(Math.PI / 2);
            this.ctx.drawImage(image, 0, 0, this.canvas.height, this.canvas.width)
        } else {
            this.ctx.drawImage(image, 0, 0, this.canvas.width, this.canvas.height)
        }
        this.ctx.restore();
        var imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        var data = imageData.data;
        if (this.dataHeap) {
            this.dataHeap.set(data);
            return true
        }
        return false
    });
    ARController.prototype._debugMarker = (function (marker) {
        var vertex, pos;
        vertex = marker.vertex;
        var ctx = this.ctx;
        ctx.strokeStyle = "red";
        ctx.beginPath();
        ctx.moveTo(vertex[0][0], vertex[0][1]);
        ctx.lineTo(vertex[1][0], vertex[1][1]);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(vertex[2][0], vertex[2][1]);
        ctx.lineTo(vertex[3][0], vertex[3][1]);
        ctx.stroke();
        ctx.strokeStyle = "green";
        ctx.beginPath();
        ctx.lineTo(vertex[1][0], vertex[1][1]);
        ctx.lineTo(vertex[2][0], vertex[2][1]);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(vertex[3][0], vertex[3][1]);
        ctx.lineTo(vertex[0][0], vertex[0][1]);
        ctx.stroke();
        pos = marker.pos;
        ctx.beginPath();
        ctx.arc(pos[0], pos[1], 8, 0, Math.PI * 2);
        ctx.fillStyle = "red";
        ctx.fill()
    });
    ARController.getUserMedia = (function (configuration) {
        var facing = configuration.facingMode || "environment";
        var onSuccess = configuration.onSuccess;
        var onError = configuration.onError || (function (err) {
            console.error("ARController.getUserMedia", err)
        });
        var video = document.createElement("video");
        var initProgress = (function () {
            if (this.videoWidth !== 0) {
                onSuccess(video)
            }
        });
        var readyToPlay = false;
        var eventNames = ["touchstart", "touchend", "touchmove", "touchcancel", "click", "mousedown", "mouseup", "mousemove", "keydown", "keyup", "keypress", "scroll"];
        var play = (function (ev) {
            if (readyToPlay) {
                video.play();
                if (!video.paused) {
                    eventNames.forEach((function (eventName) {
                        window.removeEventListener(eventName, play, true)
                    }))
                }
            }
        });
        eventNames.forEach((function (eventName) {
            window.addEventListener(eventName, play, true)
        }));
        var success = (function (stream) {
            video.addEventListener("loadedmetadata", initProgress, false);
            video.src = window.URL.createObjectURL(stream);
            readyToPlay = true;
            play()
        });
        var constraints = {};
        var mediaDevicesConstraints = {};
        if (configuration.width) {
            mediaDevicesConstraints.width = configuration.width;
            if (typeof configuration.width === "object") {
                if (configuration.width.max) {
                    constraints.maxWidth = configuration.width.max
                }
                if (configuration.width.min) {
                    constraints.minWidth = configuration.width.max
                }
            } else {
                constraints.maxWidth = configuration.width
            }
        }
        if (configuration.height) {
            mediaDevicesConstraints.height = configuration.height;
            if (typeof configuration.height === "object") {
                if (configuration.height.max) {
                    constraints.maxHeight = configuration.height.max
                }
                if (configuration.height.min) {
                    constraints.minHeight = configuration.height.max
                }
            } else {
                constraints.maxHeight = configuration.height
            }
        }
        mediaDevicesConstraints.facingMode = facing;
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
        var hdConstraints = {
            audio: false,
            video: {
                mandatory: constraints
            }
        };
        if (false) {
            if (navigator.mediaDevices) {
                navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: mediaDevicesConstraints
                }).then(success, onError)
            } else {
                MediaStreamTrack.getSources((function (sources) {
                    var facingDir = mediaDevicesConstraints.facingMode;
                    if (facing && facing.exact) {
                        facingDir = facing.exact
                    }
                    for (var i = 0; i < sources.length; i++) {
                        if (sources[i].kind === "video" && sources[i].facing === facingDir) {
                            hdConstraints.video.mandatory.sourceId = sources[i].id;
                            break
                        }
                    }
                    if (facing && facing.exact && !hdConstraints.video.mandatory.sourceId) {
                        onError("Failed to get camera facing the wanted direction")
                    } else {
                        if (navigator.getUserMedia) {
                            navigator.getUserMedia(hdConstraints, success, onError)
                        } else {
                            onError("navigator.getUserMedia is not supported on your browser")
                        }
                    }
                }))
            }
        } else {
            if (navigator.getUserMedia) {
                navigator.getUserMedia(hdConstraints, success, onError)
            } else {
                onError("navigator.getUserMedia is not supported on your browser")
            }
        }
        return video
    });
    ARController.getUserMediaARController = (function (configuration) {
        var obj = {};
        for (var i in configuration) {
            obj[i] = configuration[i]
        }
        var onSuccess = configuration.onSuccess;
        var cameraParamURL = configuration.cameraParam;
        obj.onSuccess = (function () {
            new ARCameraParam(cameraParamURL, (function () {
                var arCameraParam = this;
                var maxSize = configuration.maxARVideoSize || Math.max(video.videoWidth, video.videoHeight);
                var f = maxSize / Math.max(video.videoWidth, video.videoHeight);
                var w = f * video.videoWidth;
                var h = f * video.videoHeight;
                if (video.videoWidth < video.videoHeight) {
                    var tmp = w;
                    w = h;
                    h = tmp
                }
                var arController = new ARController(w, h, arCameraParam);
                arController.image = video;
                if (video.videoWidth < video.videoHeight) {
                    arController.orientation = "portrait";
                    arController.videoWidth = video.videoHeight;
                    arController.videoHeight = video.videoWidth
                } else {
                    arController.orientation = "landscape";
                    arController.videoWidth = video.videoWidth;
                    arController.videoHeight = video.videoHeight
                }
                onSuccess(arController, arCameraParam)
            }), (function (err) {
                console.error("ARController: Failed to load ARCameraParam", err)
            }))
        });
        var video = this.getUserMedia(obj);
        return video
    });
    var ARCameraParam = (function (src, onload, onerror) {
        this.id = -1;
        this._src = "";
        this.complete = false;
        this.onload = onload;
        this.onerror = onerror;
        if (src) {
            this.load(src)
        }
    });
    ARCameraParam.prototype.load = (function (src) {
        if (this._src !== "") {
            throw "ARCameraParam: Trying to load camera parameters twice."
        }
        this._src = src;
        if (src) {
            var self = this;
            artoolkit.loadCamera(src, (function (id) {
                self.id = id;
                self.complete = true;
                self.onload()
            }), (function (err) {
                self.onerror(err)
            }))
        }
    });
    Object.defineProperty(ARCameraParam.prototype, "src", {
        set: (function (src) {
            this.load(src)
        }),
        get: (function () {
            return this._src
        })
    });
    ARCameraParam.prototype.dispose = (function () {
        if (this.id !== -1) {
            artoolkit.deleteCamera(this.id)
        }
        this.id = -1;
        this._src = "";
        this.complete = false
    });
    var artoolkit = {
        UNKNOWN_MARKER: -1,
        PATTERN_MARKER: 0,
        BARCODE_MARKER: 1,
        loadCamera: loadCamera,
        addMarker: addMarker,
        addMultiMarker: addMultiMarker
    };
    var FUNCTIONS = ["setup", "teardown", "setLogLevel", "getLogLevel", "setDebugMode", "getDebugMode", "getProcessingImage", "setMarkerInfoDir", "setMarkerInfoVertex", "getTransMatSquare", "getTransMatSquareCont", "getTransMatMultiSquare", "getTransMatMultiSquareRobust", "getMultiMarkerNum", "getMultiMarkerCount", "detectMarker", "getMarkerNum", "getMarker", "getMultiEachMarker", "setProjectionNearPlane", "getProjectionNearPlane", "setProjectionFarPlane", "getProjectionFarPlane", "setThresholdMode", "getThresholdMode", "setThreshold", "getThreshold", "setPatternDetectionMode", "getPatternDetectionMode", "setMatrixCodeType", "getMatrixCodeType", "setLabelingMode", "getLabelingMode", "setPattRatio", "getPattRatio", "setImageProcMode", "getImageProcMode"];

    function runWhenLoaded() {
        FUNCTIONS.forEach((function (n) {
            artoolkit[n] = Module[n]
        }));
        for (var m in Module) {
            if (m.match(/^AR/)) artoolkit[m] = Module[m]
        }
    }
    var marker_count = 0;

    function addMarker(arId, url, callback) {
        var filename = "/marker_" + marker_count++;
        ajax(url, filename, (function () {
            var id = Module._addMarker(arId, filename);
            if (callback) callback(id)
        }))
    }

    function bytesToString(array) {
        return String.fromCharCode.apply(String, array)
    }

    function parseMultiFile(bytes) {
        var str = bytesToString(bytes);
        var lines = str.split("\n");
        var files = [];
        var state = 0;
        var markers = 0;
        lines.forEach((function (line) {
            line = line.trim();
            if (!line || line.startsWith("#")) return;
            switch (state) {
                case 0:
                    markers = +line;
                    state = 1;
                    return;
                case 1:
                    if (!line.match(/^\d+$/)) {
                        files.push(line)
                    };
                case 2:
                case 3:
                case 4:
                    state++;
                    return;
                case 5:
                    state = 1;
                    return
            }
        }));
        return files
    }
    var multi_marker_count = 0;

    function addMultiMarker(arId, url, callback) {
        var filename = "/multi_marker_" + multi_marker_count++;
        ajax(url, filename, (function (bytes) {
            var files = parseMultiFile(bytes);

            function ok() {
                var markerID = Module._addMultiMarker(arId, filename);
                var markerNum = Module.getMultiMarkerNum(arId, markerID);
                if (callback) callback(markerID, markerNum)
            }
            if (!files.length) return ok();
            var path = url.split("/").slice(0, -1).join("/");
            files = files.map((function (file) {
                return [path + "/" + file, file]
            }));
            ajaxDependencies(files, ok)
        }))
    }
    var camera_count = 0;

    function loadCamera(url, callback) {
        var filename = "/camera_param_" + camera_count++;
        var writeCallback = (function () {
            var id = Module._loadCamera(filename);
            if (callback) callback(id)
        });
        if (typeof url === "object") {
            writeByteArrayToFS(filename, url, writeCallback)
        } else if (url.indexOf("\n") > -1) {
            writeStringToFS(filename, url, writeCallback)
        } else {
            ajax(url, filename, writeCallback)
        }
    }

    function writeStringToFS(target, string, callback) {
        var byteArray = new Uint8Array(string.length);
        for (var i = 0; i < byteArray.length; i++) {
            byteArray[i] = string.charCodeAt(i) & 255
        }
        writeByteArrayToFS(target, byteArray, callback)
    }

    function writeByteArrayToFS(target, byteArray, callback) {
        FS.writeFile(target, byteArray, {
            encoding: "binary"
        });
        callback(byteArray)
    }

    function ajax(url, target, callback) {
        var oReq = new XMLHttpRequest;
        oReq.open("GET", url, true);
        oReq.responseType = "arraybuffer";
        oReq.onload = (function (oEvent) {
            var arrayBuffer = oReq.response;
            var byteArray = new Uint8Array(arrayBuffer);
            writeByteArrayToFS(target, byteArray, callback)
        });
        oReq.send()
    }

    function ajaxDependencies(files, callback) {
        var next = files.pop();
        if (next) {
            ajax(next[0], next[1], (function () {
                ajaxDependencies(files, callback)
            }))
        } else {
            callback()
        }
    }
    window.artoolkit = artoolkit;
    window.ARController = ARController;
    window.ARCameraParam = ARCameraParam;
    if (window.Module) {
        runWhenLoaded()
    } else {
        window.Module = {
            onRuntimeInitialized: (function () {
                runWhenLoaded()
            })
        }
    }
}))();
var Module;
if (!Module) Module = (typeof Module !== "undefined" ? Module : null) || {};
var moduleOverrides = {};
for (var key in Module) {
    if (Module.hasOwnProperty(key)) {
        moduleOverrides[key] = Module[key]
    }
}
var ENVIRONMENT_IS_WEB = typeof window === "object";
var ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
var ENVIRONMENT_IS_NODE = typeof process === "object" && typeof require === "function" && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
    if (!Module["print"]) Module["print"] = function print(x) {
        process["stdout"].write(x + "\n")
    };
    if (!Module["printErr"]) Module["printErr"] = function printErr(x) {
        process["stderr"].write(x + "\n")
    };
    var nodeFS = require("fs");
    var nodePath = require("path");
    Module["read"] = function read(filename, binary) {
        filename = nodePath["normalize"](filename);
        var ret = nodeFS["readFileSync"](filename);
        if (!ret && filename != nodePath["resolve"](filename)) {
            filename = path.join(__dirname, "..", "src", filename);
            ret = nodeFS["readFileSync"](filename)
        }
        if (ret && !binary) ret = ret.toString();
        return ret
    };
    Module["readBinary"] = function readBinary(filename) {
        var ret = Module["read"](filename, true);
        if (!ret.buffer) {
            ret = new Uint8Array(ret)
        }
        assert(ret.buffer);
        return ret
    };
    Module["load"] = function load(f) {
        globalEval(read(f))
    };
    if (!Module["thisProgram"]) {
        if (process["argv"].length > 1) {
            Module["thisProgram"] = process["argv"][1].replace(/\\/g, "/")
        } else {
            Module["thisProgram"] = "unknown-program"
        }
    }
    Module["arguments"] = process["argv"].slice(2);
    if (typeof module !== "undefined") {
        module["exports"] = Module
    }
    process["on"]("uncaughtException", (function (ex) {
        if (!(ex instanceof ExitStatus)) {
            throw ex
        }
    }));
    Module["inspect"] = (function () {
        return "[Emscripten Module object]"
    })
} else if (ENVIRONMENT_IS_SHELL) {
    if (!Module["print"]) Module["print"] = print;
    if (typeof printErr != "undefined") Module["printErr"] = printErr;
    if (typeof read != "undefined") {
        Module["read"] = read
    } else {
        Module["read"] = function read() {
            throw "no read() available (jsc?)"
        }
    }
    Module["readBinary"] = function readBinary(f) {
        if (typeof readbuffer === "function") {
            return new Uint8Array(readbuffer(f))
        }
        var data = read(f, "binary");
        assert(typeof data === "object");
        return data
    };
    if (typeof scriptArgs != "undefined") {
        Module["arguments"] = scriptArgs
    } else if (typeof arguments != "undefined") {
        Module["arguments"] = arguments
    }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    Module["read"] = function read(url) {
        var xhr = new XMLHttpRequest;
        xhr.open("GET", url, false);
        xhr.send(null);
        return xhr.responseText
    };
    if (typeof arguments != "undefined") {
        Module["arguments"] = arguments
    }
    if (typeof console !== "undefined") {
        if (!Module["print"]) Module["print"] = function print(x) {
            console.log(x)
        };
        if (!Module["printErr"]) Module["printErr"] = function printErr(x) {
            console.log(x)
        }
    } else {
        var TRY_USE_DUMP = false;
        if (!Module["print"]) Module["print"] = TRY_USE_DUMP && typeof dump !== "undefined" ? (function (x) {
            dump(x)
        }) : (function (x) {})
    }
    if (ENVIRONMENT_IS_WORKER) {
        Module["load"] = importScripts
    }
    if (typeof Module["setWindowTitle"] === "undefined") {
        Module["setWindowTitle"] = (function (title) {
            document.title = title
        })
    }
} else {
    throw "Unknown runtime environment. Where are we?"
}

function globalEval(x) {
    eval.call(null, x)
}
if (!Module["load"] && Module["read"]) {
    Module["load"] = function load(f) {
        globalEval(Module["read"](f))
    }
}
if (!Module["print"]) {
    Module["print"] = (function () {})
}
if (!Module["printErr"]) {
    Module["printErr"] = Module["print"]
}
if (!Module["arguments"]) {
    Module["arguments"] = []
}
if (!Module["thisProgram"]) {
    Module["thisProgram"] = "./this.program"
}
Module.print = Module["print"];
Module.printErr = Module["printErr"];
Module["preRun"] = [];
Module["postRun"] = [];
for (var key in moduleOverrides) {
    if (moduleOverrides.hasOwnProperty(key)) {
        Module[key] = moduleOverrides[key]
    }
}
var Runtime = {
    setTempRet0: (function (value) {
        tempRet0 = value
    }),
    getTempRet0: (function () {
        return tempRet0
    }),
    stackSave: (function () {
        return STACKTOP
    }),
    stackRestore: (function (stackTop) {
        STACKTOP = stackTop
    }),
    getNativeTypeSize: (function (type) {
        switch (type) {
            case "i1":
            case "i8":
                return 1;
            case "i16":
                return 2;
            case "i32":
                return 4;
            case "i64":
                return 8;
            case "float":
                return 4;
            case "double":
                return 8;
            default:
                {
                    if (type[type.length - 1] === "*") {
                        return Runtime.QUANTUM_SIZE
                    } else if (type[0] === "i") {
                        var bits = parseInt(type.substr(1));
                        assert(bits % 8 === 0);
                        return bits / 8
                    } else {
                        return 0
                    }
                }
        }
    }),
    getNativeFieldSize: (function (type) {
        return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE)
    }),
    STACK_ALIGN: 16,
    prepVararg: (function (ptr, type) {
        if (type === "double" || type === "i64") {
            if (ptr & 7) {
                assert((ptr & 7) === 4);
                ptr += 4
            }
        } else {
            assert((ptr & 3) === 0)
        }
        return ptr
    }),
    getAlignSize: (function (type, size, vararg) {
        if (!vararg && (type == "i64" || type == "double")) return 8;
        if (!type) return Math.min(size, 8);
        return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE)
    }),
    dynCall: (function (sig, ptr, args) {
        if (args && args.length) {
            if (!args.splice) args = Array.prototype.slice.call(args);
            args.splice(0, 0, ptr);
            return Module["dynCall_" + sig].apply(null, args)
        } else {
            return Module["dynCall_" + sig].call(null, ptr)
        }
    }),
    functionPointers: [],
    addFunction: (function (func) {
        for (var i = 0; i < Runtime.functionPointers.length; i++) {
            if (!Runtime.functionPointers[i]) {
                Runtime.functionPointers[i] = func;
                return 2 * (1 + i)
            }
        }
        throw "Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS."
    }),
    removeFunction: (function (index) {
        Runtime.functionPointers[(index - 2) / 2] = null
    }),
    warnOnce: (function (text) {
        if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
        if (!Runtime.warnOnce.shown[text]) {
            Runtime.warnOnce.shown[text] = 1;
            Module.printErr(text)
        }
    }),
    funcWrappers: {},
    getFuncWrapper: (function (func, sig) {
        assert(sig);
        if (!Runtime.funcWrappers[sig]) {
            Runtime.funcWrappers[sig] = {}
        }
        var sigCache = Runtime.funcWrappers[sig];
        if (!sigCache[func]) {
            sigCache[func] = function dynCall_wrapper() {
                return Runtime.dynCall(sig, func, arguments)
            }
        }
        return sigCache[func]
    }),
    getCompilerSetting: (function (name) {
        throw "You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work"
    }),
    stackAlloc: (function (size) {
        var ret = STACKTOP;
        STACKTOP = STACKTOP + size | 0;
        STACKTOP = STACKTOP + 15 & -16;
        return ret
    }),
    staticAlloc: (function (size) {
        var ret = STATICTOP;
        STATICTOP = STATICTOP + size | 0;
        STATICTOP = STATICTOP + 15 & -16;
        return ret
    }),
    dynamicAlloc: (function (size) {
        var ret = DYNAMICTOP;
        DYNAMICTOP = DYNAMICTOP + size | 0;
        DYNAMICTOP = DYNAMICTOP + 15 & -16;
        if (DYNAMICTOP >= TOTAL_MEMORY) {
            var success = enlargeMemory();
            if (!success) {
                DYNAMICTOP = ret;
                return 0
            }
        }
        return ret
    }),
    alignMemory: (function (size, quantum) {
        var ret = size = Math.ceil(size / (quantum ? quantum : 16)) * (quantum ? quantum : 16);
        return ret
    }),
    makeBigInt: (function (low, high, unsigned) {
        var ret = unsigned ? +(low >>> 0) + +(high >>> 0) * +4294967296 : +(low >>> 0) + +(high | 0) * +4294967296;
        return ret
    }),
    GLOBAL_BASE: 8,
    QUANTUM_SIZE: 4,
    __dummy__: 0
};
Module["Runtime"] = Runtime;
var __THREW__ = 0;
var ABORT = false;
var EXITSTATUS = 0;
var undef = 0;
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function assert(condition, text) {
    if (!condition) {
        abort("Assertion failed: " + text)
    }
}
var globalScope = this;

function getCFunc(ident) {
    var func = Module["_" + ident];
    if (!func) {
        try {
            func = eval("_" + ident)
        } catch (e) {}
    }
    assert(func, "Cannot call unknown function " + ident + " (perhaps LLVM optimizations or closure removed it?)");
    return func
}
var cwrap, ccall;
((function () {
    var JSfuncs = {
        "stackSave": (function () {
            Runtime.stackSave()
        }),
        "stackRestore": (function () {
            Runtime.stackRestore()
        }),
        "arrayToC": (function (arr) {
            var ret = Runtime.stackAlloc(arr.length);
            writeArrayToMemory(arr, ret);
            return ret
        }),
        "stringToC": (function (str) {
            var ret = 0;
            if (str !== null && str !== undefined && str !== 0) {
                ret = Runtime.stackAlloc((str.length << 2) + 1);
                writeStringToMemory(str, ret)
            }
            return ret
        })
    };
    var toC = {
        "string": JSfuncs["stringToC"],
        "array": JSfuncs["arrayToC"]
    };
    ccall = function ccallFunc(ident, returnType, argTypes, args, opts) {
        var func = getCFunc(ident);
        var cArgs = [];
        var stack = 0;
        if (args) {
            for (var i = 0; i < args.length; i++) {
                var converter = toC[argTypes[i]];
                if (converter) {
                    if (stack === 0) stack = Runtime.stackSave();
                    cArgs[i] = converter(args[i])
                } else {
                    cArgs[i] = args[i]
                }
            }
        }
        var ret = func.apply(null, cArgs);
        if (returnType === "string") ret = Pointer_stringify(ret);
        if (stack !== 0) {
            if (opts && opts.async) {
                EmterpreterAsync.asyncFinalizers.push((function () {
                    Runtime.stackRestore(stack)
                }));
                return
            }
            Runtime.stackRestore(stack)
        }
        return ret
    };
    var sourceRegex = /^function\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;

    function parseJSFunc(jsfunc) {
        var parsed = jsfunc.toString().match(sourceRegex).slice(1);
        return {
            arguments: parsed[0],
            body: parsed[1],
            returnValue: parsed[2]
        }
    }
    var JSsource = {};
    for (var fun in JSfuncs) {
        if (JSfuncs.hasOwnProperty(fun)) {
            JSsource[fun] = parseJSFunc(JSfuncs[fun])
        }
    }
    cwrap = function cwrap(ident, returnType, argTypes) {
        argTypes = argTypes || [];
        var cfunc = getCFunc(ident);
        var numericArgs = argTypes.every((function (type) {
            return type === "number"
        }));
        var numericRet = returnType !== "string";
        if (numericRet && numericArgs) {
            return cfunc
        }
        var argNames = argTypes.map((function (x, i) {
            return "$" + i
        }));
        var funcstr = "(function(" + argNames.join(",") + ") {";
        var nargs = argTypes.length;
        if (!numericArgs) {
            funcstr += "var stack = " + JSsource["stackSave"].body + ";";
            for (var i = 0; i < nargs; i++) {
                var arg = argNames[i],
                    type = argTypes[i];
                if (type === "number") continue;
                var convertCode = JSsource[type + "ToC"];
                funcstr += "var " + convertCode.arguments + " = " + arg + ";";
                funcstr += convertCode.body + ";";
                funcstr += arg + "=" + convertCode.returnValue + ";"
            }
        }
        var cfuncname = parseJSFunc((function () {
            return cfunc
        })).returnValue;
        funcstr += "var ret = " + cfuncname + "(" + argNames.join(",") + ");";
        if (!numericRet) {
            var strgfy = parseJSFunc((function () {
                return Pointer_stringify
            })).returnValue;
            funcstr += "ret = " + strgfy + "(ret);"
        }
        if (!numericArgs) {
            funcstr += JSsource["stackRestore"].body.replace("()", "(stack)") + ";"
        }
        funcstr += "return ret})";
        return eval(funcstr)
    }
}))();
Module["ccall"] = ccall;
Module["cwrap"] = cwrap;

function setValue(ptr, value, type, noSafe) {
    type = type || "i8";
    if (type.charAt(type.length - 1) === "*") type = "i32";
    switch (type) {
        case "i1":
            HEAP8[ptr >> 0] = value;
            break;
        case "i8":
            HEAP8[ptr >> 0] = value;
            break;
        case "i16":
            HEAP16[ptr >> 1] = value;
            break;
        case "i32":
            HEAP32[ptr >> 2] = value;
            break;
        case "i64":
            tempI64 = [value >>> 0, (tempDouble = value, +Math_abs(tempDouble) >= +1 ? tempDouble > +0 ? (Math_min(+Math_floor(tempDouble / +4294967296), +4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / +4294967296) >>> 0 : 0)], HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
            break;
        case "float":
            HEAPF32[ptr >> 2] = value;
            break;
        case "double":
            HEAPF64[ptr >> 3] = value;
            break;
        default:
            abort("invalid type for setValue: " + type)
    }
}
Module["setValue"] = setValue;

function getValue(ptr, type, noSafe) {
    type = type || "i8";
    if (type.charAt(type.length - 1) === "*") type = "i32";
    switch (type) {
        case "i1":
            return HEAP8[ptr >> 0];
        case "i8":
            return HEAP8[ptr >> 0];
        case "i16":
            return HEAP16[ptr >> 1];
        case "i32":
            return HEAP32[ptr >> 2];
        case "i64":
            return HEAP32[ptr >> 2];
        case "float":
            return HEAPF32[ptr >> 2];
        case "double":
            return HEAPF64[ptr >> 3];
        default:
            abort("invalid type for setValue: " + type)
    }
    return null
}
Module["getValue"] = getValue;
var ALLOC_NORMAL = 0;
var ALLOC_STACK = 1;
var ALLOC_STATIC = 2;
var ALLOC_DYNAMIC = 3;
var ALLOC_NONE = 4;
Module["ALLOC_NORMAL"] = ALLOC_NORMAL;
Module["ALLOC_STACK"] = ALLOC_STACK;
Module["ALLOC_STATIC"] = ALLOC_STATIC;
Module["ALLOC_DYNAMIC"] = ALLOC_DYNAMIC;
Module["ALLOC_NONE"] = ALLOC_NONE;

function allocate(slab, types, allocator, ptr) {
    var zeroinit, size;
    if (typeof slab === "number") {
        zeroinit = true;
        size = slab
    } else {
        zeroinit = false;
        size = slab.length
    }
    var singleType = typeof types === "string" ? types : null;
    var ret;
    if (allocator == ALLOC_NONE) {
        ret = ptr
    } else {
        ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length))
    }
    if (zeroinit) {
        var ptr = ret,
            stop;
        assert((ret & 3) == 0);
        stop = ret + (size & ~3);
        for (; ptr < stop; ptr += 4) {
            HEAP32[ptr >> 2] = 0
        }
        stop = ret + size;
        while (ptr < stop) {
            HEAP8[ptr++ >> 0] = 0
        }
        return ret
    }
    if (singleType === "i8") {
        if (slab.subarray || slab.slice) {
            HEAPU8.set(slab, ret)
        } else {
            HEAPU8.set(new Uint8Array(slab), ret)
        }
        return ret
    }
    var i = 0,
        type, typeSize, previousType;
    while (i < size) {
        var curr = slab[i];
        if (typeof curr === "function") {
            curr = Runtime.getFunctionIndex(curr)
        }
        type = singleType || types[i];
        if (type === 0) {
            i++;
            continue
        }
        if (type == "i64") type = "i32";
        setValue(ret + i, curr, type);
        if (previousType !== type) {
            typeSize = Runtime.getNativeTypeSize(type);
            previousType = type
        }
        i += typeSize
    }
    return ret
}
Module["allocate"] = allocate;

function getMemory(size) {
    if (!staticSealed) return Runtime.staticAlloc(size);
    if (typeof _sbrk !== "undefined" && !_sbrk.called || !runtimeInitialized) return Runtime.dynamicAlloc(size);
    return _malloc(size)
}
Module["getMemory"] = getMemory;

function Pointer_stringify(ptr, length) {
    if (length === 0 || !ptr) return "";
    var hasUtf = 0;
    var t;
    var i = 0;
    while (1) {
        t = HEAPU8[ptr + i >> 0];
        hasUtf |= t;
        if (t == 0 && !length) break;
        i++;
        if (length && i == length) break
    }
    if (!length) length = i;
    var ret = "";
    if (hasUtf < 128) {
        var MAX_CHUNK = 1024;
        var curr;
        while (length > 0) {
            curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
            ret = ret ? ret + curr : curr;
            ptr += MAX_CHUNK;
            length -= MAX_CHUNK
        }
        return ret
    }
    return Module["UTF8ToString"](ptr)
}
Module["Pointer_stringify"] = Pointer_stringify;

function AsciiToString(ptr) {
    var str = "";
    while (1) {
        var ch = HEAP8[ptr++ >> 0];
        if (!ch) return str;
        str += String.fromCharCode(ch)
    }
}
Module["AsciiToString"] = AsciiToString;

function stringToAscii(str, outPtr) {
    return writeAsciiToMemory(str, outPtr, false)
}
Module["stringToAscii"] = stringToAscii;

function UTF8ArrayToString(u8Array, idx) {
    var u0, u1, u2, u3, u4, u5;
    var str = "";
    while (1) {
        u0 = u8Array[idx++];
        if (!u0) return str;
        if (!(u0 & 128)) {
            str += String.fromCharCode(u0);
            continue
        }
        u1 = u8Array[idx++] & 63;
        if ((u0 & 224) == 192) {
            str += String.fromCharCode((u0 & 31) << 6 | u1);
            continue
        }
        u2 = u8Array[idx++] & 63;
        if ((u0 & 240) == 224) {
            u0 = (u0 & 15) << 12 | u1 << 6 | u2
        } else {
            u3 = u8Array[idx++] & 63;
            if ((u0 & 248) == 240) {
                u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | u3
            } else {
                u4 = u8Array[idx++] & 63;
                if ((u0 & 252) == 248) {
                    u0 = (u0 & 3) << 24 | u1 << 18 | u2 << 12 | u3 << 6 | u4
                } else {
                    u5 = u8Array[idx++] & 63;
                    u0 = (u0 & 1) << 30 | u1 << 24 | u2 << 18 | u3 << 12 | u4 << 6 | u5
                }
            }
        }
        if (u0 < 65536) {
            str += String.fromCharCode(u0)
        } else {
            var ch = u0 - 65536;
            str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
        }
    }
}
Module["UTF8ArrayToString"] = UTF8ArrayToString;

function UTF8ToString(ptr) {
    return UTF8ArrayToString(HEAPU8, ptr)
}
Module["UTF8ToString"] = UTF8ToString;

function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
    if (!(maxBytesToWrite > 0)) return 0;
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
        if (u <= 127) {
            if (outIdx >= endIdx) break;
            outU8Array[outIdx++] = u
        } else if (u <= 2047) {
            if (outIdx + 1 >= endIdx) break;
            outU8Array[outIdx++] = 192 | u >> 6;
            outU8Array[outIdx++] = 128 | u & 63
        } else if (u <= 65535) {
            if (outIdx + 2 >= endIdx) break;
            outU8Array[outIdx++] = 224 | u >> 12;
            outU8Array[outIdx++] = 128 | u >> 6 & 63;
            outU8Array[outIdx++] = 128 | u & 63
        } else if (u <= 2097151) {
            if (outIdx + 3 >= endIdx) break;
            outU8Array[outIdx++] = 240 | u >> 18;
            outU8Array[outIdx++] = 128 | u >> 12 & 63;
            outU8Array[outIdx++] = 128 | u >> 6 & 63;
            outU8Array[outIdx++] = 128 | u & 63
        } else if (u <= 67108863) {
            if (outIdx + 4 >= endIdx) break;
            outU8Array[outIdx++] = 248 | u >> 24;
            outU8Array[outIdx++] = 128 | u >> 18 & 63;
            outU8Array[outIdx++] = 128 | u >> 12 & 63;
            outU8Array[outIdx++] = 128 | u >> 6 & 63;
            outU8Array[outIdx++] = 128 | u & 63
        } else {
            if (outIdx + 5 >= endIdx) break;
            outU8Array[outIdx++] = 252 | u >> 30;
            outU8Array[outIdx++] = 128 | u >> 24 & 63;
            outU8Array[outIdx++] = 128 | u >> 18 & 63;
            outU8Array[outIdx++] = 128 | u >> 12 & 63;
            outU8Array[outIdx++] = 128 | u >> 6 & 63;
            outU8Array[outIdx++] = 128 | u & 63
        }
    }
    outU8Array[outIdx] = 0;
    return outIdx - startIdx
}
Module["stringToUTF8Array"] = stringToUTF8Array;

function stringToUTF8(str, outPtr, maxBytesToWrite) {
    return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite)
}
Module["stringToUTF8"] = stringToUTF8;

function lengthBytesUTF8(str) {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
        if (u <= 127) {
            ++len
        } else if (u <= 2047) {
            len += 2
        } else if (u <= 65535) {
            len += 3
        } else if (u <= 2097151) {
            len += 4
        } else if (u <= 67108863) {
            len += 5
        } else {
            len += 6
        }
    }
    return len
}
Module["lengthBytesUTF8"] = lengthBytesUTF8;

function UTF16ToString(ptr) {
    var i = 0;
    var str = "";
    while (1) {
        var codeUnit = HEAP16[ptr + i * 2 >> 1];
        if (codeUnit == 0) return str;
        ++i;
        str += String.fromCharCode(codeUnit)
    }
}
Module["UTF16ToString"] = UTF16ToString;

function stringToUTF16(str, outPtr, maxBytesToWrite) {
    if (maxBytesToWrite === undefined) {
        maxBytesToWrite = 2147483647
    }
    if (maxBytesToWrite < 2) return 0;
    maxBytesToWrite -= 2;
    var startPtr = outPtr;
    var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
    for (var i = 0; i < numCharsToWrite; ++i) {
        var codeUnit = str.charCodeAt(i);
        HEAP16[outPtr >> 1] = codeUnit;
        outPtr += 2
    }
    HEAP16[outPtr >> 1] = 0;
    return outPtr - startPtr
}
Module["stringToUTF16"] = stringToUTF16;

function lengthBytesUTF16(str) {
    return str.length * 2
}
Module["lengthBytesUTF16"] = lengthBytesUTF16;

function UTF32ToString(ptr) {
    var i = 0;
    var str = "";
    while (1) {
        var utf32 = HEAP32[ptr + i * 4 >> 2];
        if (utf32 == 0) return str;
        ++i;
        if (utf32 >= 65536) {
            var ch = utf32 - 65536;
            str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
        } else {
            str += String.fromCharCode(utf32)
        }
    }
}
Module["UTF32ToString"] = UTF32ToString;

function stringToUTF32(str, outPtr, maxBytesToWrite) {
    if (maxBytesToWrite === undefined) {
        maxBytesToWrite = 2147483647
    }
    if (maxBytesToWrite < 4) return 0;
    var startPtr = outPtr;
    var endPtr = startPtr + maxBytesToWrite - 4;
    for (var i = 0; i < str.length; ++i) {
        var codeUnit = str.charCodeAt(i);
        if (codeUnit >= 55296 && codeUnit <= 57343) {
            var trailSurrogate = str.charCodeAt(++i);
            codeUnit = 65536 + ((codeUnit & 1023) << 10) | trailSurrogate & 1023
        }
        HEAP32[outPtr >> 2] = codeUnit;
        outPtr += 4;
        if (outPtr + 4 > endPtr) break
    }
    HEAP32[outPtr >> 2] = 0;
    return outPtr - startPtr
}
Module["stringToUTF32"] = stringToUTF32;

function lengthBytesUTF32(str) {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
        var codeUnit = str.charCodeAt(i);
        if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
        len += 4
    }
    return len
}
Module["lengthBytesUTF32"] = lengthBytesUTF32;

function demangle(func) {
    var hasLibcxxabi = !!Module["___cxa_demangle"];
    if (hasLibcxxabi) {
        try {
            var buf = _malloc(func.length);
            writeStringToMemory(func.substr(1), buf);
            var status = _malloc(4);
            var ret = Module["___cxa_demangle"](buf, 0, 0, status);
            if (getValue(status, "i32") === 0 && ret) {
                return Pointer_stringify(ret)
            }
        } catch (e) {} finally {
            if (buf) _free(buf);
            if (status) _free(status);
            if (ret) _free(ret)
        }
    }
    var i = 3;
    var basicTypes = {
        "v": "void",
        "b": "bool",
        "c": "char",
        "s": "short",
        "i": "int",
        "l": "long",
        "f": "float",
        "d": "double",
        "w": "wchar_t",
        "a": "signed char",
        "h": "unsigned char",
        "t": "unsigned short",
        "j": "unsigned int",
        "m": "unsigned long",
        "x": "long long",
        "y": "unsigned long long",
        "z": "..."
    };
    var subs = [];
    var first = true;

    function dump(x) {
        if (x) Module.print(x);
        Module.print(func);
        var pre = "";
        for (var a = 0; a < i; a++) pre += " ";
        Module.print(pre + "^")
    }

    function parseNested() {
        i++;
        if (func[i] === "K") i++;
        var parts = [];
        while (func[i] !== "E") {
            if (func[i] === "S") {
                i++;
                var next = func.indexOf("_", i);
                var num = func.substring(i, next) || 0;
                parts.push(subs[num] || "?");
                i = next + 1;
                continue
            }
            if (func[i] === "C") {
                parts.push(parts[parts.length - 1]);
                i += 2;
                continue
            }
            var size = parseInt(func.substr(i));
            var pre = size.toString().length;
            if (!size || !pre) {
                i--;
                break
            }
            var curr = func.substr(i + pre, size);
            parts.push(curr);
            subs.push(curr);
            i += pre + size
        }
        i++;
        return parts
    }

    function parse(rawList, limit, allowVoid) {
        limit = limit || Infinity;
        var ret = "",
            list = [];

        function flushList() {
            return "(" + list.join(", ") + ")"
        }
        var name;
        if (func[i] === "N") {
            name = parseNested().join("::");
            limit--;
            if (limit === 0) return rawList ? [name] : name
        } else {
            if (func[i] === "K" || first && func[i] === "L") i++;
            var size = parseInt(func.substr(i));
            if (size) {
                var pre = size.toString().length;
                name = func.substr(i + pre, size);
                i += pre + size
            }
        }
        first = false;
        if (func[i] === "I") {
            i++;
            var iList = parse(true);
            var iRet = parse(true, 1, true);
            ret += iRet[0] + " " + name + "<" + iList.join(", ") + ">"
        } else {
            ret = name
        }
        paramLoop: while (i < func.length && limit-- > 0) {
            var c = func[i++];
            if (c in basicTypes) {
                list.push(basicTypes[c])
            } else {
                switch (c) {
                    case "P":
                        list.push(parse(true, 1, true)[0] + "*");
                        break;
                    case "R":
                        list.push(parse(true, 1, true)[0] + "&");
                        break;
                    case "L":
                        {
                            i++;
                            var end = func.indexOf("E", i);
                            var size = end - i;list.push(func.substr(i, size));i += size + 2;
                            break
                        };
                    case "A":
                        {
                            var size = parseInt(func.substr(i));i += size.toString().length;
                            if (func[i] !== "_") throw "?";i++;list.push(parse(true, 1, true)[0] + " [" + size + "]");
                            break
                        };
                    case "E":
                        break paramLoop;
                    default:
                        ret += "?" + c;
                        break paramLoop
                }
            }
        }
        if (!allowVoid && list.length === 1 && list[0] === "void") list = [];
        if (rawList) {
            if (ret) {
                list.push(ret + "?")
            }
            return list
        } else {
            return ret + flushList()
        }
    }
    var parsed = func;
    try {
        if (func == "Object._main" || func == "_main") {
            return "main()"
        }
        if (typeof func === "number") func = Pointer_stringify(func);
        if (func[0] !== "_") return func;
        if (func[1] !== "_") return func;
        if (func[2] !== "Z") return func;
        switch (func[3]) {
            case "n":
                return "operator new()";
            case "d":
                return "operator delete()"
        }
        parsed = parse()
    } catch (e) {
        parsed += "?"
    }
    if (parsed.indexOf("?") >= 0 && !hasLibcxxabi) {
        Runtime.warnOnce("warning: a problem occurred in builtin C++ name demangling; build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling")
    }
    return parsed
}

function demangleAll(text) {
    return text.replace(/__Z[\w\d_]+/g, (function (x) {
        var y = demangle(x);
        return x === y ? x : x + " [" + y + "]"
    }))
}

function jsStackTrace() {
    var err = new Error;
    if (!err.stack) {
        try {
            throw new Error(0)
        } catch (e) {
            err = e
        }
        if (!err.stack) {
            return "(no stack trace available)"
        }
    }
    return err.stack.toString()
}

function stackTrace() {
    return demangleAll(jsStackTrace())
}
Module["stackTrace"] = stackTrace;
var PAGE_SIZE = 4096;

function alignMemoryPage(x) {
    if (x % 4096 > 0) {
        x += 4096 - x % 4096
    }
    return x
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0,
    STATICTOP = 0,
    staticSealed = false;
var STACK_BASE = 0,
    STACKTOP = 0,
    STACK_MAX = 0;
var DYNAMIC_BASE = 0,
    DYNAMICTOP = 0;

function abortOnCannotGrowMemory() {
    abort("Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value " + TOTAL_MEMORY + ", (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which adjusts the size at runtime but prevents some optimizations, (3) set Module.TOTAL_MEMORY to a higher value before the program runs, or if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ")
}

function enlargeMemory() {
    abortOnCannotGrowMemory()
}
var TOTAL_STACK = Module["TOTAL_STACK"] || 5242880;
var TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 268435456;
var totalMemory = 64 * 1024;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2 * TOTAL_STACK) {
    if (totalMemory < 16 * 1024 * 1024) {
        totalMemory *= 2
    } else {
        totalMemory += 16 * 1024 * 1024
    }
}
if (totalMemory !== TOTAL_MEMORY) {
    TOTAL_MEMORY = totalMemory
}
assert(typeof Int32Array !== "undefined" && typeof Float64Array !== "undefined" && !!(new Int32Array(1))["subarray"] && !!(new Int32Array(1))["set"], "JS engine does not provide full typed array support");
var buffer;
buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, "Typed arrays 2 must be run on a little-endian system");
Module["HEAP"] = HEAP;
Module["buffer"] = buffer;
Module["HEAP8"] = HEAP8;
Module["HEAP16"] = HEAP16;
Module["HEAP32"] = HEAP32;
Module["HEAPU8"] = HEAPU8;
Module["HEAPU16"] = HEAPU16;
Module["HEAPU32"] = HEAPU32;
Module["HEAPF32"] = HEAPF32;
Module["HEAPF64"] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
    while (callbacks.length > 0) {
        var callback = callbacks.shift();
        if (typeof callback == "function") {
            callback();
            continue
        }
        var func = callback.func;
        if (typeof func === "number") {
            if (callback.arg === undefined) {
                Runtime.dynCall("v", func)
            } else {
                Runtime.dynCall("vi", func, [callback.arg])
            }
        } else {
            func(callback.arg === undefined ? null : callback.arg)
        }
    }
}
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATEXIT__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
var runtimeExited = false;

function preRun() {
    if (Module["preRun"]) {
        if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
        while (Module["preRun"].length) {
            addOnPreRun(Module["preRun"].shift())
        }
    }
    callRuntimeCallbacks(__ATPRERUN__)
}

function ensureInitRuntime() {
    if (runtimeInitialized) return;
    runtimeInitialized = true;
    callRuntimeCallbacks(__ATINIT__)
}

function preMain() {
    callRuntimeCallbacks(__ATMAIN__)
}

function exitRuntime() {
    callRuntimeCallbacks(__ATEXIT__);
    runtimeExited = true
}

function postRun() {
    if (Module["postRun"]) {
        if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
        while (Module["postRun"].length) {
            addOnPostRun(Module["postRun"].shift())
        }
    }
    callRuntimeCallbacks(__ATPOSTRUN__)
}

function addOnPreRun(cb) {
    __ATPRERUN__.unshift(cb)
}
Module["addOnPreRun"] = addOnPreRun;

function addOnInit(cb) {
    __ATINIT__.unshift(cb)
}
Module["addOnInit"] = addOnInit;

function addOnPreMain(cb) {
    __ATMAIN__.unshift(cb)
}
Module["addOnPreMain"] = addOnPreMain;

function addOnExit(cb) {
    __ATEXIT__.unshift(cb)
}
Module["addOnExit"] = addOnExit;

function addOnPostRun(cb) {
    __ATPOSTRUN__.unshift(cb)
}
Module["addOnPostRun"] = addOnPostRun;

function intArrayFromString(stringy, dontAddNull, length) {
    var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
    var u8array = new Array(len);
    var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull) u8array.length = numBytesWritten;
    return u8array
}
Module["intArrayFromString"] = intArrayFromString;

function intArrayToString(array) {
    var ret = [];
    for (var i = 0; i < array.length; i++) {
        var chr = array[i];
        if (chr > 255) {
            chr &= 255
        }
        ret.push(String.fromCharCode(chr))
    }
    return ret.join("")
}
Module["intArrayToString"] = intArrayToString;

function writeStringToMemory(string, buffer, dontAddNull) {
    var array = intArrayFromString(string, dontAddNull);
    var i = 0;
    while (i < array.length) {
        var chr = array[i];
        HEAP8[buffer + i >> 0] = chr;
        i = i + 1
    }
}
Module["writeStringToMemory"] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
    for (var i = 0; i < array.length; i++) {
        HEAP8[buffer++ >> 0] = array[i]
    }
}
Module["writeArrayToMemory"] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
    for (var i = 0; i < str.length; ++i) {
        HEAP8[buffer++ >> 0] = str.charCodeAt(i)
    }
    if (!dontAddNull) HEAP8[buffer >> 0] = 0
}
Module["writeAsciiToMemory"] = writeAsciiToMemory;

function unSign(value, bits, ignore) {
    if (value >= 0) {
        return value
    }
    return bits <= 32 ? 2 * Math.abs(1 << bits - 1) + value : Math.pow(2, bits) + value
}

function reSign(value, bits, ignore) {
    if (value <= 0) {
        return value
    }
    var half = bits <= 32 ? Math.abs(1 << bits - 1) : Math.pow(2, bits - 1);
    if (value >= half && (bits <= 32 || value > half)) {
        value = -2 * half + value
    }
    return value
}
if (!Math["imul"] || Math["imul"](4294967295, 5) !== -5) Math["imul"] = function imul(a, b) {
    var ah = a >>> 16;
    var al = a & 65535;
    var bh = b >>> 16;
    var bl = b & 65535;
    return al * bl + (ah * bl + al * bh << 16) | 0
};
Math.imul = Math["imul"];
if (!Math["clz32"]) Math["clz32"] = (function (x) {
    x = x >>> 0;
    for (var i = 0; i < 32; i++) {
        if (x & 1 << 31 - i) return i
    }
    return 32
});
Math.clz32 = Math["clz32"];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;
var Math_clz32 = Math.clz32;
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;

function getUniqueRunDependency(id) {
    return id
}

function addRunDependency(id) {
    runDependencies++;
    if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies)
    }
}
Module["addRunDependency"] = addRunDependency;

function removeRunDependency(id) {
    runDependencies--;
    if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies)
    }
    if (runDependencies == 0) {
        if (runDependencyWatcher !== null) {
            clearInterval(runDependencyWatcher);
            runDependencyWatcher = null
        }
        if (dependenciesFulfilled) {
            var callback = dependenciesFulfilled;
            dependenciesFulfilled = null;
            callback()
        }
    }
}
Module["removeRunDependency"] = removeRunDependency;
Module["preloadedImages"] = {};
Module["preloadedAudios"] = {};
var memoryInitializer = null;
var ASM_CONSTS = [(function ($0, $1, $2, $3) {
    {
        if (!artoolkit["multiEachMarkerInfo"]) {
            artoolkit["multiEachMarkerInfo"] = {}
        }
        var multiEachMarker = artoolkit["multiEachMarkerInfo"];
        multiEachMarker["visible"] = $0;
        multiEachMarker["pattId"] = $1;
        multiEachMarker["pattType"] = $2;
        multiEachMarker["width"] = $3
    }
}), (function ($0, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32) {
    {
        var $a = arguments;
        var i = 12;
        if (!artoolkit["markerInfo"]) {
            artoolkit["markerInfo"] = {
                pos: [0, 0],
                line: [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
                vertex: [[0, 0], [0, 0], [0, 0], [0, 0]]
            }
        }
        var markerInfo = artoolkit["markerInfo"];
        markerInfo["area"] = $0;
        markerInfo["id"] = $1;
        markerInfo["idPatt"] = $2;
        markerInfo["idMatrix"] = $3;
        markerInfo["dir"] = $4;
        markerInfo["dirPatt"] = $5;
        markerInfo["dirMatrix"] = $6;
        markerInfo["cf"] = $7;
        markerInfo["cfPatt"] = $8;
        markerInfo["cfMatrix"] = $9;
        markerInfo["pos"][0] = $10;
        markerInfo["pos"][1] = $11;
        markerInfo["line"][0][0] = $a[i++];
        markerInfo["line"][0][1] = $a[i++];
        markerInfo["line"][0][2] = $a[i++];
        markerInfo["line"][1][0] = $a[i++];
        markerInfo["line"][1][1] = $a[i++];
        markerInfo["line"][1][2] = $a[i++];
        markerInfo["line"][2][0] = $a[i++];
        markerInfo["line"][2][1] = $a[i++];
        markerInfo["line"][2][2] = $a[i++];
        markerInfo["line"][3][0] = $a[i++];
        markerInfo["line"][3][1] = $a[i++];
        markerInfo["line"][3][2] = $a[i++];
        markerInfo["vertex"][0][0] = $a[i++];
        markerInfo["vertex"][0][1] = $a[i++];
        markerInfo["vertex"][1][0] = $a[i++];
        markerInfo["vertex"][1][1] = $a[i++];
        markerInfo["vertex"][2][0] = $a[i++];
        markerInfo["vertex"][2][1] = $a[i++];
        markerInfo["vertex"][3][0] = $a[i++];
        markerInfo["vertex"][3][1] = $a[i++];
        markerInfo["errorCorrected"] = $a[i++]
    }
}), (function ($0, $1, $2, $3, $4) {
    {
        if (!artoolkit["frameMalloc"]) {
            artoolkit["frameMalloc"] = {}
        }
        var frameMalloc = artoolkit["frameMalloc"];
        frameMalloc["framepointer"] = $1;
        frameMalloc["framesize"] = $2;
        frameMalloc["camera"] = $3;
        frameMalloc["transform"] = $4
    }
})];

function _emscripten_asm_const_33(code, a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19, a20, a21, a22, a23, a24, a25, a26, a27, a28, a29, a30, a31, a32) {
    return ASM_CONSTS[code](a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19, a20, a21, a22, a23, a24, a25, a26, a27, a28, a29, a30, a31, a32)
}

function _emscripten_asm_const_4(code, a0, a1, a2, a3) {
    return ASM_CONSTS[code](a0, a1, a2, a3)
}

function _emscripten_asm_const_5(code, a0, a1, a2, a3, a4) {
    return ASM_CONSTS[code](a0, a1, a2, a3, a4)
}
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 16496;
__ATINIT__.push({
    func: (function () {
        __GLOBAL__sub_I_ARToolKitJS_cpp()
    })
}, {
    func: (function () {
        __GLOBAL__sub_I_bind_cpp()
    })
});
allocate([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 52, 9, 0, 0, 53, 42, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 128, 1, 0, 0, 0, 0, 0, 0, 228, 8, 0, 0, 116, 42, 0, 0, 52, 9, 0, 0, 136, 47, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 128, 1, 0, 0, 0, 0, 0, 0, 52, 9, 0, 0, 73, 47, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 128, 1, 0, 0, 0, 0, 0, 0, 228, 8, 0, 0, 54, 47, 0, 0, 228, 8, 0, 0, 23, 47, 0, 0, 228, 8, 0, 0, 62, 46, 0, 0, 228, 8, 0, 0, 31, 46, 0, 0, 228, 8, 0, 0, 0, 46, 0, 0, 228, 8, 0, 0, 225, 45, 0, 0, 228, 8, 0, 0, 194, 45, 0, 0, 228, 8, 0, 0, 93, 46, 0, 0, 228, 8, 0, 0, 124, 46, 0, 0, 228, 8, 0, 0, 155, 46, 0, 0, 228, 8, 0, 0, 186, 46, 0, 0, 228, 8, 0, 0, 217, 46, 0, 0, 228, 8, 0, 0, 248, 46, 0, 0, 12, 9, 0, 0, 199, 47, 0, 0, 48, 2, 0, 0, 0, 0, 0, 0, 228, 8, 0, 0, 212, 47, 0, 0, 228, 8, 0, 0, 225, 47, 0, 0, 12, 9, 0, 0, 238, 47, 0, 0, 56, 2, 0, 0, 0, 0, 0, 0, 12, 9, 0, 0, 15, 48, 0, 0, 64, 2, 0, 0, 0, 0, 0, 0, 12, 9, 0, 0, 49, 48, 0, 0, 64, 2, 0, 0, 0, 0, 0, 0, 200, 8, 0, 0, 89, 48, 0, 0, 200, 8, 0, 0, 91, 48, 0, 0, 200, 8, 0, 0, 93, 48, 0, 0, 200, 8, 0, 0, 95, 48, 0, 0, 200, 8, 0, 0, 97, 48, 0, 0, 200, 8, 0, 0, 99, 48, 0, 0, 200, 8, 0, 0, 101, 48, 0, 0, 200, 8, 0, 0, 103, 48, 0, 0, 200, 8, 0, 0, 105, 48, 0, 0, 200, 8, 0, 0, 107, 48, 0, 0, 200, 8, 0, 0, 109, 48, 0, 0, 200, 8, 0, 0, 111, 48, 0, 0, 200, 8, 0, 0, 113, 48, 0, 0, 12, 9, 0, 0, 115, 48, 0, 0, 80, 2, 0, 0, 0, 0, 0, 0, 12, 9, 0, 0, 152, 48, 0, 0, 80, 2, 0, 0, 0, 0, 0, 0, 255, 15, 0, 0, 6, 16, 0, 0, 18, 16, 0, 0, 28, 16, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 255, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 1, 0, 0, 0, 2, 0, 0, 0, 4, 0, 0, 0, 8, 0, 0, 0, 3, 0, 0, 0, 6, 0, 0, 0, 12, 0, 0, 0, 11, 0, 0, 0, 5, 0, 0, 0, 10, 0, 0, 0, 7, 0, 0, 0, 14, 0, 0, 0, 15, 0, 0, 0, 13, 0, 0, 0, 9, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 4, 0, 0, 0, 8, 0, 0, 0, 16, 0, 0, 0, 32, 0, 0, 0, 64, 0, 0, 0, 3, 0, 0, 0, 6, 0, 0, 0, 12, 0, 0, 0, 24, 0, 0, 0, 48, 0, 0, 0, 96, 0, 0, 0, 67, 0, 0, 0, 5, 0, 0, 0, 10, 0, 0, 0, 20, 0, 0, 0, 40, 0, 0, 0, 80, 0, 0, 0, 35, 0, 0, 0, 70, 0, 0, 0, 15, 0, 0, 0, 30, 0, 0, 0, 60, 0, 0, 0, 120, 0, 0, 0, 115, 0, 0, 0, 101, 0, 0, 0, 73, 0, 0, 0, 17, 0, 0, 0, 34, 0, 0, 0, 68, 0, 0, 0, 11, 0, 0, 0, 22, 0, 0, 0, 44, 0, 0, 0, 88, 0, 0, 0, 51, 0, 0, 0, 102, 0, 0, 0, 79, 0, 0, 0, 29, 0, 0, 0, 58, 0, 0, 0, 116, 0, 0, 0, 107, 0, 0, 0, 85, 0, 0, 0, 41, 0, 0, 0, 82, 0, 0, 0, 39, 0, 0, 0, 78, 0, 0, 0, 31, 0, 0, 0, 62, 0, 0, 0, 124, 0, 0, 0, 123, 0, 0, 0, 117, 0, 0, 0, 105, 0, 0, 0, 81, 0, 0, 0, 33, 0, 0, 0, 66, 0, 0, 0, 7, 0, 0, 0, 14, 0, 0, 0, 28, 0, 0, 0, 56, 0, 0, 0, 112, 0, 0, 0, 99, 0, 0, 0, 69, 0, 0, 0, 9, 0, 0, 0, 18, 0, 0, 0, 36, 0, 0, 0, 72, 0, 0, 0, 19, 0, 0, 0, 38, 0, 0, 0, 76, 0, 0, 0, 27, 0, 0, 0, 54, 0, 0, 0, 108, 0, 0, 0, 91, 0, 0, 0, 53, 0, 0, 0, 106, 0, 0, 0, 87, 0, 0, 0, 45, 0, 0, 0, 90, 0, 0, 0, 55, 0, 0, 0, 110, 0, 0, 0, 95, 0, 0, 0, 61, 0, 0, 0, 122, 0, 0, 0, 119, 0, 0, 0, 109, 0, 0, 0, 89, 0, 0, 0, 49, 0, 0, 0, 98, 0, 0, 0, 71, 0, 0, 0, 13, 0, 0, 0, 26, 0, 0, 0, 52, 0, 0, 0, 104, 0, 0, 0, 83, 0, 0, 0, 37, 0, 0, 0, 74, 0, 0, 0, 23, 0, 0, 0, 46, 0, 0, 0, 92, 0, 0, 0, 59, 0, 0, 0, 118, 0, 0, 0, 111, 0, 0, 0, 93, 0, 0, 0, 57, 0, 0, 0, 114, 0, 0, 0, 103, 0, 0, 0, 77, 0, 0, 0, 25, 0, 0, 0, 50, 0, 0, 0, 100, 0, 0, 0, 75, 0, 0, 0, 21, 0, 0, 0, 42, 0, 0, 0, 84, 0, 0, 0, 43, 0, 0, 0, 86, 0, 0, 0, 47, 0, 0, 0, 94, 0, 0, 0, 63, 0, 0, 0, 126, 0, 0, 0, 127, 0, 0, 0, 125, 0, 0, 0, 121, 0, 0, 0, 113, 0, 0, 0, 97, 0, 0, 0, 65, 0, 0, 0, 255, 255, 255, 255, 0, 0, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, 2, 0, 0, 0, 8, 0, 0, 0, 5, 0, 0, 0, 10, 0, 0, 0, 3, 0, 0, 0, 14, 0, 0, 0, 9, 0, 0, 0, 7, 0, 0, 0, 6, 0, 0, 0, 13, 0, 0, 0, 11, 0, 0, 0, 12, 0, 0, 0, 255, 255, 255, 255, 0, 0, 0, 0, 1, 0, 0, 0, 7, 0, 0, 0, 2, 0, 0, 0, 14, 0, 0, 0, 8, 0, 0, 0, 56, 0, 0, 0, 3, 0, 0, 0, 63, 0, 0, 0, 15, 0, 0, 0, 31, 0, 0, 0, 9, 0, 0, 0, 90, 0, 0, 0, 57, 0, 0, 0, 21, 0, 0, 0, 4, 0, 0, 0, 28, 0, 0, 0, 64, 0, 0, 0, 67, 0, 0, 0, 16, 0, 0, 0, 112, 0, 0, 0, 32, 0, 0, 0, 97, 0, 0, 0, 10, 0, 0, 0, 108, 0, 0, 0, 91, 0, 0, 0, 70, 0, 0, 0, 58, 0, 0, 0, 38, 0, 0, 0, 22, 0, 0, 0, 47, 0, 0, 0, 5, 0, 0, 0, 54, 0, 0, 0, 29, 0, 0, 0, 19, 0, 0, 0, 65, 0, 0, 0, 95, 0, 0, 0, 68, 0, 0, 0, 45, 0, 0, 0, 17, 0, 0, 0, 43, 0, 0, 0, 113, 0, 0, 0, 115, 0, 0, 0, 33, 0, 0, 0, 77, 0, 0, 0, 98, 0, 0, 0, 117, 0, 0, 0, 11, 0, 0, 0, 87, 0, 0, 0, 109, 0, 0, 0, 35, 0, 0, 0, 92, 0, 0, 0, 74, 0, 0, 0, 71, 0, 0, 0, 79, 0, 0, 0, 59, 0, 0, 0, 104, 0, 0, 0, 39, 0, 0, 0, 100, 0, 0, 0, 23, 0, 0, 0, 82, 0, 0, 0, 48, 0, 0, 0, 119, 0, 0, 0, 6, 0, 0, 0, 126, 0, 0, 0, 55, 0, 0, 0, 13, 0, 0, 0, 30, 0, 0, 0, 62, 0, 0, 0, 20, 0, 0, 0, 89, 0, 0, 0, 66, 0, 0, 0, 27, 0, 0, 0, 96, 0, 0, 0, 111, 0, 0, 0, 69, 0, 0, 0, 107, 0, 0, 0, 46, 0, 0, 0, 37, 0, 0, 0, 18, 0, 0, 0, 53, 0, 0, 0, 44, 0, 0, 0, 94, 0, 0, 0, 114, 0, 0, 0, 42, 0, 0, 0, 116, 0, 0, 0, 76, 0, 0, 0, 34, 0, 0, 0, 86, 0, 0, 0, 78, 0, 0, 0, 73, 0, 0, 0, 99, 0, 0, 0, 103, 0, 0, 0, 118, 0, 0, 0, 81, 0, 0, 0, 12, 0, 0, 0, 125, 0, 0, 0, 88, 0, 0, 0, 61, 0, 0, 0, 110, 0, 0, 0, 26, 0, 0, 0, 36, 0, 0, 0, 106, 0, 0, 0, 93, 0, 0, 0, 52, 0, 0, 0, 75, 0, 0, 0, 41, 0, 0, 0, 72, 0, 0, 0, 85, 0, 0, 0, 80, 0, 0, 0, 102, 0, 0, 0, 60, 0, 0, 0, 124, 0, 0, 0, 105, 0, 0, 0, 25, 0, 0, 0, 40, 0, 0, 0, 51, 0, 0, 0, 101, 0, 0, 0, 84, 0, 0, 0, 24, 0, 0, 0, 123, 0, 0, 0, 83, 0, 0, 0, 50, 0, 0, 0, 49, 0, 0, 0, 122, 0, 0, 0, 120, 0, 0, 0, 121, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 136, 0, 0, 0, 5, 0, 0, 0, 144, 0, 0, 0, 6, 0, 0, 0, 152, 0, 0, 0, 9, 0, 0, 0, 176, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 255, 253, 255, 255, 255, 254, 255, 255, 255, 0, 0, 0, 0, 112, 2, 0, 0, 168, 2, 0, 0, 200, 2, 0, 0, 112, 2, 0, 0, 168, 2, 0, 0, 168, 2, 0, 0, 208, 2, 0, 0, 168, 2, 0, 0, 112, 2, 0, 0, 168, 2, 0, 0, 208, 2, 0, 0, 168, 2, 0, 0, 112, 2, 0, 0, 168, 2, 0, 0, 168, 2, 0, 0, 104, 1, 0, 0, 168, 2, 0, 0, 168, 2, 0, 0, 168, 2, 0, 0, 168, 2, 0, 0, 168, 2, 0, 0, 104, 1, 0, 0, 168, 2, 0, 0, 168, 2, 0, 0, 168, 2, 0, 0, 168, 2, 0, 0, 168, 2, 0, 0, 168, 2, 0, 0, 0, 0, 0, 0, 32, 2, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 2, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 80, 2, 0, 0, 3, 0, 0, 0, 7, 0, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 216, 2, 0, 0, 3, 0, 0, 0, 8, 0, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 232, 2, 0, 0, 3, 0, 0, 0, 9, 0, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 192, 3, 0, 0, 192, 4, 0, 0, 192, 5, 0, 0, 192, 6, 0, 0, 192, 7, 0, 0, 192, 8, 0, 0, 192, 9, 0, 0, 192, 10, 0, 0, 192, 11, 0, 0, 192, 12, 0, 0, 192, 13, 0, 0, 192, 14, 0, 0, 192, 15, 0, 0, 192, 16, 0, 0, 192, 17, 0, 0, 192, 18, 0, 0, 192, 19, 0, 0, 192, 20, 0, 0, 192, 21, 0, 0, 192, 22, 0, 0, 192, 23, 0, 0, 192, 24, 0, 0, 192, 25, 0, 0, 192, 26, 0, 0, 192, 27, 0, 0, 192, 28, 0, 0, 192, 29, 0, 0, 192, 30, 0, 0, 192, 31, 0, 0, 192, 0, 0, 0, 179, 1, 0, 0, 195, 2, 0, 0, 195, 3, 0, 0, 195, 4, 0, 0, 195, 5, 0, 0, 195, 6, 0, 0, 195, 7, 0, 0, 195, 8, 0, 0, 195, 9, 0, 0, 195, 10, 0, 0, 195, 11, 0, 0, 195, 12, 0, 0, 195, 13, 0, 0, 211, 14, 0, 0, 195, 15, 0, 0, 195, 0, 0, 12, 187, 1, 0, 12, 195, 2, 0, 12, 195, 3, 0, 12, 195, 4, 0, 12, 211, 240, 10, 0, 0, 96, 11, 0, 0, 0, 0, 0, 0, 10, 0, 0, 0, 100, 0, 0, 0, 232, 3, 0, 0, 16, 39, 0, 0, 160, 134, 1, 0, 64, 66, 15, 0, 128, 150, 152, 0, 0, 225, 245, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 81, 62, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 5, 0, 0, 0, 73, 58, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 255, 255, 255, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 5, 0, 0, 0, 7, 0, 0, 0, 11, 0, 0, 0, 13, 0, 0, 0, 17, 0, 0, 0, 19, 0, 0, 0, 23, 0, 0, 0, 29, 0, 0, 0, 31, 0, 0, 0, 37, 0, 0, 0, 41, 0, 0, 0, 43, 0, 0, 0, 47, 0, 0, 0, 53, 0, 0, 0, 59, 0, 0, 0, 61, 0, 0, 0, 67, 0, 0, 0, 71, 0, 0, 0, 73, 0, 0, 0, 79, 0, 0, 0, 83, 0, 0, 0, 89, 0, 0, 0, 97, 0, 0, 0, 101, 0, 0, 0, 103, 0, 0, 0, 107, 0, 0, 0, 109, 0, 0, 0, 113, 0, 0, 0, 127, 0, 0, 0, 131, 0, 0, 0, 137, 0, 0, 0, 139, 0, 0, 0, 149, 0, 0, 0, 151, 0, 0, 0, 157, 0, 0, 0, 163, 0, 0, 0, 167, 0, 0, 0, 173, 0, 0, 0, 179, 0, 0, 0, 181, 0, 0, 0, 191, 0, 0, 0, 193, 0, 0, 0, 197, 0, 0, 0, 199, 0, 0, 0, 211, 0, 0, 0, 1, 0, 0, 0, 11, 0, 0, 0, 13, 0, 0, 0, 17, 0, 0, 0, 19, 0, 0, 0, 23, 0, 0, 0, 29, 0, 0, 0, 31, 0, 0, 0, 37, 0, 0, 0, 41, 0, 0, 0, 43, 0, 0, 0, 47, 0, 0, 0, 53, 0, 0, 0, 59, 0, 0, 0, 61, 0, 0, 0, 67, 0, 0, 0, 71, 0, 0, 0, 73, 0, 0, 0, 79, 0, 0, 0, 83, 0, 0, 0, 89, 0, 0, 0, 97, 0, 0, 0, 101, 0, 0, 0, 103, 0, 0, 0, 107, 0, 0, 0, 109, 0, 0, 0, 113, 0, 0, 0, 121, 0, 0, 0, 127, 0, 0, 0, 131, 0, 0, 0, 137, 0, 0, 0, 139, 0, 0, 0, 143, 0, 0, 0, 149, 0, 0, 0, 151, 0, 0, 0, 157, 0, 0, 0, 163, 0, 0, 0, 167, 0, 0, 0, 169, 0, 0, 0, 173, 0, 0, 0, 179, 0, 0, 0, 181, 0, 0, 0, 187, 0, 0, 0, 191, 0, 0, 0, 193, 0, 0, 0, 197, 0, 0, 0, 199, 0, 0, 0, 209, 0, 0, 0, 69, 114, 114, 111, 114, 58, 32, 108, 97, 98, 101, 108, 105, 110, 103, 32, 119, 111, 114, 107, 32, 111, 118, 101, 114, 102, 108, 111, 119, 46, 10, 0, 69, 114, 114, 111, 114, 58, 32, 85, 110, 115, 117, 112, 112, 111, 114, 116, 101, 100, 32, 112, 105, 120, 101, 108, 32, 102, 111, 114, 109, 97, 116, 32, 40, 37, 100, 41, 32, 114, 101, 113, 117, 101, 115, 116, 101, 100, 46, 10, 0, 85, 110, 107, 110, 111, 119, 110, 32, 111, 114, 32, 117, 110, 115, 117, 112, 112, 111, 114, 116, 101, 100, 32, 108, 97, 98, 101, 108, 105, 110, 103, 32, 116, 104, 114, 101, 115, 104, 111, 108, 100, 32, 109, 111, 100, 101, 32, 114, 101, 113, 117, 101, 115, 116, 101, 100, 46, 32, 83, 101, 116, 32, 116, 111, 32, 109, 97, 110, 117, 97, 108, 46, 10, 0, 76, 97, 98, 101, 108, 105, 110, 103, 32, 116, 104, 114, 101, 115, 104, 111, 108, 100, 32, 109, 111, 100, 101, 32, 115, 101, 116, 32, 116, 111, 32, 37, 115, 46, 10, 0, 77, 65, 78, 85, 65, 76, 0, 65, 85, 84, 79, 95, 77, 69, 68, 73, 65, 78, 0, 65, 85, 84, 79, 95, 79, 84, 83, 85, 0, 65, 85, 84, 79, 95, 65, 68, 65, 80, 84, 73, 86, 69, 65, 85, 84, 79, 95, 66, 82, 65, 67, 75, 69, 84, 73, 78, 71, 0, 65, 117, 116, 111, 32, 116, 104, 114, 101, 115, 104, 111, 108, 100, 32, 40, 98, 114, 97, 99, 107, 101, 116, 41, 32, 109, 97, 114, 107, 101, 114, 32, 99, 111, 117, 110, 116, 115, 32, 45, 91, 37, 51, 100, 58, 32, 37, 51, 100, 93, 32, 91, 37, 51, 100, 58, 32, 37, 51, 100, 93, 32, 91, 37, 51, 100, 58, 32, 37, 51, 100, 93, 43, 46, 10, 0, 65, 117, 116, 111, 32, 116, 104, 114, 101, 115, 104, 111, 108, 100, 32, 40, 98, 114, 97, 99, 107, 101, 116, 41, 32, 97, 100, 106, 117, 115, 116, 101, 100, 32, 116, 104, 114, 101, 115, 104, 111, 108, 100, 32, 116, 111, 32, 37, 100, 46, 10, 0, 109, 101, 100, 105, 97, 110, 0, 79, 116, 115, 117, 0, 65, 117, 116, 111, 32, 116, 104, 114, 101, 115, 104, 111, 108, 100, 32, 40, 37, 115, 41, 32, 97, 100, 106, 117, 115, 116, 101, 100, 32, 116, 104, 114, 101, 115, 104, 111, 108, 100, 32, 116, 111, 32, 37, 100, 46, 10, 0, 63, 63, 63, 32, 49, 10, 0, 63, 63, 63, 32, 50, 10, 0, 63, 63, 63, 32, 51, 10, 0, 69, 114, 114, 111, 114, 58, 32, 85, 110, 115, 117, 112, 112, 111, 114, 116, 101, 100, 32, 112, 105, 120, 101, 108, 32, 102, 111, 114, 109, 97, 116, 32, 112, 97, 115, 115, 101, 100, 32, 116, 111, 32, 97, 114, 73, 109, 97, 103, 101, 80, 114, 111, 99, 72, 105, 115, 116, 40, 41, 46, 10, 0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 2, 4, 255, 255, 5, 3, 1, 0, 2, 255, 6, 7, 255, 3, 1, 2, 2, 3, 2, 3, 2, 3, 3, 0, 255, 4, 6, 7, 5, 255, 1, 4, 5, 4, 4, 5, 5, 4, 5, 7, 6, 6, 6, 7, 7, 7, 6, 255, 2, 4, 6, 7, 5, 3, 255, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 255, 255, 3, 255, 5, 6, 255, 255, 9, 10, 255, 12, 255, 255, 15, 255, 17, 18, 255, 20, 255, 255, 23, 24, 255, 255, 27, 255, 29, 30, 255, 255, 1, 2, 255, 4, 255, 255, 7, 8, 255, 255, 11, 255, 13, 14, 255, 16, 255, 255, 19, 255, 21, 22, 255, 255, 25, 26, 255, 28, 255, 255, 31, 69, 114, 114, 111, 114, 58, 32, 117, 110, 115, 117, 112, 112, 111, 114, 116, 101, 100, 32, 112, 105, 120, 101, 108, 32, 102, 111, 114, 109, 97, 116, 46, 10, 0, 69, 114, 114, 111, 114, 58, 32, 78, 85, 76, 76, 32, 112, 97, 116, 116, 72, 97, 110, 100, 108, 101, 46, 10, 0, 69, 114, 114, 111, 114, 58, 32, 99, 97, 110, 39, 116, 32, 108, 111, 97, 100, 32, 112, 97, 116, 116, 101, 114, 110, 32, 102, 114, 111, 109, 32, 78, 85, 76, 76, 32, 98, 117, 102, 102, 101, 114, 46, 10, 0, 69, 114, 114, 111, 114, 58, 32, 111, 117, 116, 32, 111, 102, 32, 109, 101, 109, 111, 114, 121, 46, 10, 0, 32, 9, 10, 13, 0, 80, 97, 116, 116, 101, 114, 110, 32, 68, 97, 116, 97, 32, 114, 101, 97, 100, 32, 101, 114, 114, 111, 114, 33, 33, 10, 0, 69, 114, 114, 111, 114, 32, 111, 112, 101, 110, 105, 110, 103, 32, 112, 97, 116, 116, 101, 114, 110, 32, 102, 105, 108, 101, 32, 39, 37, 115, 39, 32, 102, 111, 114, 32, 114, 101, 97, 100, 105, 110, 103, 46, 10, 0, 69, 114, 114, 111, 114, 32, 114, 101, 97, 100, 105, 110, 103, 32, 112, 97, 116, 116, 101, 114, 110, 32, 102, 105, 108, 101, 32, 39, 37, 115, 39, 46, 10, 0, 114, 98, 0, 69, 114, 114, 111, 114, 32, 40, 37, 100, 41, 58, 32, 117, 110, 97, 98, 108, 101, 32, 116, 111, 32, 111, 112, 101, 110, 32, 99, 97, 109, 101, 114, 97, 32, 112, 97, 114, 97, 109, 101, 116, 101, 114, 115, 32, 102, 105, 108, 101, 32, 34, 37, 115, 34, 32, 102, 111, 114, 32, 114, 101, 97, 100, 105, 110, 103, 46, 10, 0, 69, 114, 114, 111, 114, 32, 40, 37, 100, 41, 58, 32, 117, 110, 97, 98, 108, 101, 32, 116, 111, 32, 100, 101, 116, 101, 114, 109, 105, 110, 101, 32, 102, 105, 108, 101, 32, 108, 101, 110, 103, 116, 104, 46, 0, 69, 114, 114, 111, 114, 58, 32, 115, 117, 112, 112, 108, 105, 101, 100, 32, 102, 105, 108, 101, 32, 100, 111, 101, 115, 32, 110, 111, 116, 32, 97, 112, 112, 101, 97, 114, 32, 116, 111, 32, 98, 101, 32, 97, 110, 32, 65, 82, 84, 111, 111, 108, 75, 105, 116, 32, 99, 97, 109, 101, 114, 97, 32, 112, 97, 114, 97, 109, 101, 116, 101, 114, 32, 102, 105, 108, 101, 46, 10, 0, 69, 114, 114, 111, 114, 32, 40, 37, 100, 41, 58, 32, 117, 110, 97, 98, 108, 101, 32, 116, 111, 32, 114, 101, 97, 100, 32, 102, 114, 111, 109, 32, 102, 105, 108, 101, 46, 0, 69, 114, 114, 111, 114, 58, 32, 105, 99, 112, 71, 101, 116, 74, 95, 85, 95, 88, 99, 0, 69, 114, 114, 111, 114, 58, 32, 109, 97, 108, 108, 111, 99, 10, 0, 69, 114, 114, 111, 114, 32, 49, 58, 32, 105, 99, 112, 71, 101, 116, 73, 110, 105, 116, 88, 119, 50, 88, 99, 10, 0, 69, 114, 114, 111, 114, 32, 50, 58, 32, 105, 99, 112, 71, 101, 116, 73, 110, 105, 116, 88, 119, 50, 88, 99, 10, 0, 69, 114, 114, 111, 114, 32, 51, 58, 32, 105, 99, 112, 71, 101, 116, 73, 110, 105, 116, 88, 119, 50, 88, 99, 10, 0, 69, 114, 114, 111, 114, 32, 52, 58, 32, 105, 99, 112, 71, 101, 116, 73, 110, 105, 116, 88, 119, 50, 88, 99, 10, 0, 69, 114, 114, 111, 114, 32, 53, 58, 32, 105, 99, 112, 71, 101, 116, 73, 110, 105, 116, 88, 119, 50, 88, 99, 10, 0, 69, 114, 114, 111, 114, 32, 54, 58, 32, 105, 99, 112, 71, 101, 116, 73, 110, 105, 116, 88, 119, 50, 88, 99, 10, 0, 69, 114, 114, 111, 114, 32, 55, 58, 32, 105, 99, 112, 71, 101, 116, 73, 110, 105, 116, 88, 119, 50, 88, 99, 10, 0, 114, 0, 69, 114, 114, 111, 114, 58, 32, 117, 110, 97, 98, 108, 101, 32, 116, 111, 32, 111, 112, 101, 110, 32, 109, 117, 108, 116, 105, 109, 97, 114, 107, 101, 114, 32, 99, 111, 110, 102, 105, 103, 32, 102, 105, 108, 101, 32, 39, 37, 115, 39, 46, 10, 0, 37, 115, 37, 115, 10, 0, 0, 37, 100, 0, 69, 114, 114, 111, 114, 32, 112, 114, 111, 99, 101, 115, 115, 105, 110, 103, 32, 109, 117, 108, 116, 105, 109, 97, 114, 107, 101, 114, 32, 99, 111, 110, 102, 105, 103, 32, 102, 105, 108, 101, 32, 39, 37, 115, 39, 58, 32, 70, 105, 114, 115, 116, 32, 108, 105, 110, 101, 32, 109, 117, 115, 116, 32, 98, 101, 32, 110, 117, 109, 98, 101, 114, 32, 111, 102, 32, 109, 97, 114, 107, 101, 114, 32, 99, 111, 110, 102, 105, 103, 115, 32, 116, 111, 32, 114, 101, 97, 100, 46, 10, 0, 79, 117, 116, 32, 111, 102, 32, 109, 101, 109, 111, 114, 121, 33, 33, 10, 0, 37, 108, 108, 117, 37, 99, 0, 69, 114, 114, 111, 114, 32, 112, 114, 111, 99, 101, 115, 115, 105, 110, 103, 32, 109, 117, 108, 116, 105, 109, 97, 114, 107, 101, 114, 32, 99, 111, 110, 102, 105, 103, 32, 102, 105, 108, 101, 32, 39, 37, 115, 39, 58, 32, 112, 97, 116, 116, 101, 114, 110, 32, 39, 37, 115, 39, 32, 115, 112, 101, 99, 105, 102, 105, 101, 100, 32, 105, 110, 32, 109, 117, 108, 116, 105, 109, 97, 114, 107, 101, 114, 32, 99, 111, 110, 102, 105, 103, 117, 114, 97, 116, 105, 111, 110, 32, 119, 104, 105, 108, 101, 32, 105, 110, 32, 98, 97, 114, 99, 111, 100, 101, 45, 111, 110, 108, 121, 32, 109, 111, 100, 101, 46, 10, 0, 69, 114, 114, 111, 114, 32, 112, 114, 111, 99, 101, 115, 115, 105, 110, 103, 32, 109, 117, 108, 116, 105, 109, 97, 114, 107, 101, 114, 32, 99, 111, 110, 102, 105, 103, 32, 102, 105, 108, 101, 32, 39, 37, 115, 39, 58, 32, 85, 110, 97, 98, 108, 101, 32, 116, 111, 32, 100, 101, 116, 101, 114, 109, 105, 110, 101, 32, 100, 105, 114, 101, 99, 116, 111, 114, 121, 32, 110, 97, 109, 101, 46, 10, 0, 69, 114, 114, 111, 114, 32, 112, 114, 111, 99, 101, 115, 115, 105, 110, 103, 32, 109, 117, 108, 116, 105, 109, 97, 114, 107, 101, 114, 32, 99, 111, 110, 102, 105, 103, 32, 102, 105, 108, 101, 32, 39, 37, 115, 39, 58, 32, 85, 110, 97, 98, 108, 101, 32, 116, 111, 32, 108, 111, 97, 100, 32, 112, 97, 116, 116, 101, 114, 110, 32, 39, 37, 115, 39, 46, 10, 0, 37, 108, 102, 0, 69, 114, 114, 111, 114, 32, 112, 114, 111, 99, 101, 115, 115, 105, 110, 103, 32, 109, 117, 108, 116, 105, 109, 97, 114, 107, 101, 114, 32, 99, 111, 110, 102, 105, 103, 32, 102, 105, 108, 101, 32, 39, 37, 115, 39, 44, 32, 109, 97, 114, 107, 101, 114, 32, 100, 101, 102, 105, 110, 105, 116, 105, 111, 110, 32, 37, 51, 100, 58, 32, 70, 105, 114, 115, 116, 32, 108, 105, 110, 101, 32, 109, 117, 115, 116, 32, 98, 101, 32, 112, 97, 116, 116, 101, 114, 110, 32, 119, 105, 100, 116, 104, 46, 10, 0, 37, 108, 102, 32, 37, 108, 102, 32, 37, 108, 102, 32, 37, 108, 102, 0, 37, 102, 32, 37, 102, 0, 69, 114, 114, 111, 114, 32, 112, 114, 111, 99, 101, 115, 115, 105, 110, 103, 32, 109, 117, 108, 116, 105, 109, 97, 114, 107, 101, 114, 32, 99, 111, 110, 102, 105, 103, 32, 102, 105, 108, 101, 32, 39, 37, 115, 39, 44, 32, 109, 97, 114, 107, 101, 114, 32, 100, 101, 102, 105, 110, 105, 116, 105, 111, 110, 32, 37, 51, 100, 58, 32, 76, 105, 110, 101, 115, 32, 50, 32, 45, 32, 52, 32, 109, 117, 115, 116, 32, 98, 101, 32, 109, 97, 114, 107, 101, 114, 32, 116, 114, 97, 110, 115, 102, 111, 114, 109, 46, 10, 0, 97, 114, 103, 108, 67, 97, 109, 101, 114, 97, 70, 114, 117, 115, 116, 117, 109, 40, 41, 58, 32, 97, 114, 80, 97, 114, 97, 109, 68, 101, 99, 111, 109, 112, 77, 97, 116, 40, 41, 32, 105, 110, 100, 105, 99, 97, 116, 101, 100, 32, 112, 97, 114, 97, 109, 101, 116, 101, 114, 32, 101, 114, 114, 111, 114, 46, 10, 0, 108, 111, 97, 100, 67, 97, 109, 101, 114, 97, 40, 41, 58, 32, 69, 114, 114, 111, 114, 32, 108, 111, 97, 100, 105, 110, 103, 32, 112, 97, 114, 97, 109, 101, 116, 101, 114, 32, 102, 105, 108, 101, 32, 37, 115, 32, 102, 111, 114, 32, 99, 97, 109, 101, 114, 97, 46, 10, 0, 42, 42, 42, 32, 67, 97, 109, 101, 114, 97, 32, 80, 97, 114, 97, 109, 101, 116, 101, 114, 32, 114, 101, 115, 105, 122, 101, 100, 32, 102, 114, 111, 109, 32, 37, 100, 44, 32, 37, 100, 46, 32, 42, 42, 42, 10, 0, 115, 101, 116, 67, 97, 109, 101, 114, 97, 40, 41, 58, 32, 69, 114, 114, 111, 114, 58, 32, 97, 114, 80, 97, 114, 97, 109, 76, 84, 67, 114, 101, 97, 116, 101, 46, 10, 0, 115, 101, 116, 67, 97, 109, 101, 114, 97, 40, 41, 58, 32, 69, 114, 114, 111, 114, 58, 32, 97, 114, 67, 114, 101, 97, 116, 101, 72, 97, 110, 100, 108, 101, 46, 10, 0, 115, 101, 116, 67, 97, 109, 101, 114, 97, 40, 41, 58, 32, 69, 114, 114, 111, 114, 32, 99, 114, 101, 97, 116, 105, 110, 103, 32, 51, 68, 32, 104, 97, 110, 100, 108, 101, 0, 108, 111, 97, 100, 77, 97, 114, 107, 101, 114, 40, 41, 58, 32, 69, 114, 114, 111, 114, 32, 108, 111, 97, 100, 105, 110, 103, 32, 112, 97, 116, 116, 101, 114, 110, 32, 102, 105, 108, 101, 32, 37, 115, 46, 10, 0, 65, 82, 84, 111, 111, 108, 75, 105, 116, 74, 83, 40, 41, 58, 32, 85, 110, 97, 98, 108, 101, 32, 116, 111, 32, 115, 101, 116, 32, 117, 112, 32, 65, 82, 32, 109, 97, 114, 107, 101, 114, 46, 10, 0, 99, 111, 110, 102, 105, 103, 32, 100, 97, 116, 97, 32, 108, 111, 97, 100, 32, 101, 114, 114, 111, 114, 32, 33, 33, 10, 0, 65, 82, 84, 111, 111, 108, 75, 105, 116, 74, 83, 40, 41, 58, 32, 85, 110, 97, 98, 108, 101, 32, 116, 111, 32, 115, 101, 116, 32, 117, 112, 32, 65, 82, 32, 109, 117, 108, 116, 105, 109, 97, 114, 107, 101, 114, 46, 10, 0, 80, 97, 116, 116, 101, 114, 110, 32, 100, 101, 116, 101, 99, 116, 105, 111, 110, 32, 109, 111, 100, 101, 32, 115, 101, 116, 32, 116, 111, 32, 37, 100, 46, 10, 0, 80, 97, 116, 116, 101, 114, 110, 32, 114, 97, 116, 105, 111, 32, 115, 105, 122, 101, 32, 115, 101, 116, 32, 116, 111, 32, 37, 102, 46, 10, 0, 76, 97, 98, 101, 108, 105, 110, 103, 32, 109, 111, 100, 101, 32, 115, 101, 116, 32, 116, 111, 32, 37, 100, 10, 0, 84, 104, 114, 101, 115, 104, 111, 108, 100, 32, 115, 101, 116, 32, 116, 111, 32, 37, 100, 10, 0, 84, 104, 114, 101, 115, 104, 111, 108, 100, 32, 109, 111, 100, 101, 32, 115, 101, 116, 32, 116, 111, 32, 37, 100, 10, 0, 111, 110, 46, 0, 111, 102, 102, 46, 0, 68, 101, 98, 117, 103, 32, 109, 111, 100, 101, 32, 115, 101, 116, 32, 116, 111, 32, 37, 115, 10, 0, 73, 109, 97, 103, 101, 32, 112, 114, 111, 99, 46, 32, 109, 111, 100, 101, 32, 115, 101, 116, 32, 116, 111, 32, 37, 100, 46, 10, 0, 123, 32, 105, 102, 32, 40, 33, 97, 114, 116, 111, 111, 108, 107, 105, 116, 91, 34, 109, 117, 108, 116, 105, 69, 97, 99, 104, 77, 97, 114, 107, 101, 114, 73, 110, 102, 111, 34, 93, 41, 32, 123, 32, 97, 114, 116, 111, 111, 108, 107, 105, 116, 91, 34, 109, 117, 108, 116, 105, 69, 97, 99, 104, 77, 97, 114, 107, 101, 114, 73, 110, 102, 111, 34, 93, 32, 61, 32, 40, 123, 125, 41, 59, 32, 125, 32, 118, 97, 114, 32, 109, 117, 108, 116, 105, 69, 97, 99, 104, 77, 97, 114, 107, 101, 114, 32, 61, 32, 97, 114, 116, 111, 111, 108, 107, 105, 116, 91, 34, 109, 117, 108, 116, 105, 69, 97, 99, 104, 77, 97, 114, 107, 101, 114, 73, 110, 102, 111, 34, 93, 59, 32, 109, 117, 108, 116, 105, 69, 97, 99, 104, 77, 97, 114, 107, 101, 114, 91, 39, 118, 105, 115, 105, 98, 108, 101, 39, 93, 32, 61, 32, 36, 48, 59, 32, 109, 117, 108, 116, 105, 69, 97, 99, 104, 77, 97, 114, 107, 101, 114, 91, 39, 112, 97, 116, 116, 73, 100, 39, 93, 32, 61, 32, 36, 49, 59, 32, 109, 117, 108, 116, 105, 69, 97, 99, 104, 77, 97, 114, 107, 101, 114, 91, 39, 112, 97, 116, 116, 84, 121, 112, 101, 39, 93, 32, 61, 32, 36, 50, 59, 32, 109, 117, 108, 116, 105, 69, 97, 99, 104, 77, 97, 114, 107, 101, 114, 91, 39, 119, 105, 100, 116, 104, 39, 93, 32, 61, 32, 36, 51, 59, 32, 125, 0, 123, 32, 118, 97, 114, 32, 36, 97, 32, 61, 32, 97, 114, 103, 117, 109, 101, 110, 116, 115, 59, 32, 118, 97, 114, 32, 105, 32, 61, 32, 49, 50, 59, 32, 105, 102, 32, 40, 33, 97, 114, 116, 111, 111, 108, 107, 105, 116, 91, 34, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 34, 93, 41, 32, 123, 32, 97, 114, 116, 111, 111, 108, 107, 105, 116, 91, 34, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 34, 93, 32, 61, 32, 40, 123, 32, 112, 111, 115, 58, 32, 91, 48, 44, 48, 93, 44, 32, 108, 105, 110, 101, 58, 32, 91, 91, 48, 44, 48, 44, 48, 93, 44, 32, 91, 48, 44, 48, 44, 48, 93, 44, 32, 91, 48, 44, 48, 44, 48, 93, 44, 32, 91, 48, 44, 48, 44, 48, 93, 93, 44, 32, 118, 101, 114, 116, 101, 120, 58, 32, 91, 91, 48, 44, 48, 93, 44, 32, 91, 48, 44, 48, 93, 44, 32, 91, 48, 44, 48, 93, 44, 32, 91, 48, 44, 48, 93, 93, 32, 125, 41, 59, 32, 125, 32, 118, 97, 114, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 32, 61, 32, 97, 114, 116, 111, 111, 108, 107, 105, 116, 91, 34, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 34, 93, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 97, 114, 101, 97, 34, 93, 32, 61, 32, 36, 48, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 105, 100, 34, 93, 32, 61, 32, 36, 49, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 105, 100, 80, 97, 116, 116, 34, 93, 32, 61, 32, 36, 50, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 105, 100, 77, 97, 116, 114, 105, 120, 34, 93, 32, 61, 32, 36, 51, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 100, 105, 114, 34, 93, 32, 61, 32, 36, 52, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 100, 105, 114, 80, 97, 116, 116, 34, 93, 32, 61, 32, 36, 53, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 100, 105, 114, 77, 97, 116, 114, 105, 120, 34, 93, 32, 61, 32, 36, 54, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 99, 102, 34, 93, 32, 61, 32, 36, 55, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 99, 102, 80, 97, 116, 116, 34, 93, 32, 61, 32, 36, 56, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 99, 102, 77, 97, 116, 114, 105, 120, 34, 93, 32, 61, 32, 36, 57, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 112, 111, 115, 34, 93, 91, 48, 93, 32, 61, 32, 36, 49, 48, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 112, 111, 115, 34, 93, 91, 49, 93, 32, 61, 32, 36, 49, 49, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 108, 105, 110, 101, 34, 93, 91, 48, 93, 91, 48, 93, 32, 61, 32, 36, 97, 91, 105, 43, 43, 93, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 108, 105, 110, 101, 34, 93, 91, 48, 93, 91, 49, 93, 32, 61, 32, 36, 97, 91, 105, 43, 43, 93, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 108, 105, 110, 101, 34, 93, 91, 48, 93, 91, 50, 93, 32, 61, 32, 36, 97, 91, 105, 43, 43, 93, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 108, 105, 110, 101, 34, 93, 91, 49, 93, 91, 48, 93, 32, 61, 32, 36, 97, 91, 105, 43, 43, 93, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 108, 105, 110, 101, 34, 93, 91, 49, 93, 91, 49, 93, 32, 61, 32, 36, 97, 91, 105, 43, 43, 93, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 108, 105, 110, 101, 34, 93, 91, 49, 93, 91, 50, 93, 32, 61, 32, 36, 97, 91, 105, 43, 43, 93, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 108, 105, 110, 101, 34, 93, 91, 50, 93, 91, 48, 93, 32, 61, 32, 36, 97, 91, 105, 43, 43, 93, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 108, 105, 110, 101, 34, 93, 91, 50, 93, 91, 49, 93, 32, 61, 32, 36, 97, 91, 105, 43, 43, 93, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 108, 105, 110, 101, 34, 93, 91, 50, 93, 91, 50, 93, 32, 61, 32, 36, 97, 91, 105, 43, 43, 93, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 108, 105, 110, 101, 34, 93, 91, 51, 93, 91, 48, 93, 32, 61, 32, 36, 97, 91, 105, 43, 43, 93, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 108, 105, 110, 101, 34, 93, 91, 51, 93, 91, 49, 93, 32, 61, 32, 36, 97, 91, 105, 43, 43, 93, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 108, 105, 110, 101, 34, 93, 91, 51, 93, 91, 50, 93, 32, 61, 32, 36, 97, 91, 105, 43, 43, 93, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 118, 101, 114, 116, 101, 120, 34, 93, 91, 48, 93, 91, 48, 93, 32, 61, 32, 36, 97, 91, 105, 43, 43, 93, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 118, 101, 114, 116, 101, 120, 34, 93, 91, 48, 93, 91, 49, 93, 32, 61, 32, 36, 97, 91, 105, 43, 43, 93, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 118, 101, 114, 116, 101, 120, 34, 93, 91, 49, 93, 91, 48, 93, 32, 61, 32, 36, 97, 91, 105, 43, 43, 93, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 118, 101, 114, 116, 101, 120, 34, 93, 91, 49, 93, 91, 49, 93, 32, 61, 32, 36, 97, 91, 105, 43, 43, 93, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 118, 101, 114, 116, 101, 120, 34, 93, 91, 50, 93, 91, 48, 93, 32, 61, 32, 36, 97, 91, 105, 43, 43, 93, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 118, 101, 114, 116, 101, 120, 34, 93, 91, 50, 93, 91, 49, 93, 32, 61, 32, 36, 97, 91, 105, 43, 43, 93, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 118, 101, 114, 116, 101, 120, 34, 93, 91, 51, 93, 91, 48, 93, 32, 61, 32, 36, 97, 91, 105, 43, 43, 93, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 118, 101, 114, 116, 101, 120, 34, 93, 91, 51, 93, 91, 49, 93, 32, 61, 32, 36, 97, 91, 105, 43, 43, 93, 59, 32, 109, 97, 114, 107, 101, 114, 73, 110, 102, 111, 91, 34, 101, 114, 114, 111, 114, 67, 111, 114, 114, 101, 99, 116, 101, 100, 34, 93, 32, 61, 32, 36, 97, 91, 105, 43, 43, 93, 59, 32, 125, 0, 115, 101, 116, 117, 112, 40, 41, 58, 32, 69, 114, 114, 111, 114, 58, 32, 97, 114, 80, 97, 116, 116, 67, 114, 101, 97, 116, 101, 72, 97, 110, 100, 108, 101, 46, 10, 0, 65, 108, 108, 111, 99, 97, 116, 101, 100, 32, 118, 105, 100, 101, 111, 70, 114, 97, 109, 101, 83, 105, 122, 101, 32, 37, 100, 10, 0, 123, 32, 105, 102, 32, 40, 33, 97, 114, 116, 111, 111, 108, 107, 105, 116, 91, 34, 102, 114, 97, 109, 101, 77, 97, 108, 108, 111, 99, 34, 93, 41, 32, 123, 32, 97, 114, 116, 111, 111, 108, 107, 105, 116, 91, 34, 102, 114, 97, 109, 101, 77, 97, 108, 108, 111, 99, 34, 93, 32, 61, 32, 40, 123, 125, 41, 59, 32, 125, 32, 118, 97, 114, 32, 102, 114, 97, 109, 101, 77, 97, 108, 108, 111, 99, 32, 61, 32, 97, 114, 116, 111, 111, 108, 107, 105, 116, 91, 34, 102, 114, 97, 109, 101, 77, 97, 108, 108, 111, 99, 34, 93, 59, 32, 102, 114, 97, 109, 101, 77, 97, 108, 108, 111, 99, 91, 34, 102, 114, 97, 109, 101, 112, 111, 105, 110, 116, 101, 114, 34, 93, 32, 61, 32, 36, 49, 59, 32, 102, 114, 97, 109, 101, 77, 97, 108, 108, 111, 99, 91, 34, 102, 114, 97, 109, 101, 115, 105, 122, 101, 34, 93, 32, 61, 32, 36, 50, 59, 32, 102, 114, 97, 109, 101, 77, 97, 108, 108, 111, 99, 91, 34, 99, 97, 109, 101, 114, 97, 34, 93, 32, 61, 32, 36, 51, 59, 32, 102, 114, 97, 109, 101, 77, 97, 108, 108, 111, 99, 91, 34, 116, 114, 97, 110, 115, 102, 111, 114, 109, 34, 93, 32, 61, 32, 36, 52, 59, 32, 125, 0, 115, 101, 116, 117, 112, 0, 116, 101, 97, 114, 100, 111, 119, 110, 0, 95, 97, 100, 100, 77, 97, 114, 107, 101, 114, 0, 95, 97, 100, 100, 77, 117, 108, 116, 105, 77, 97, 114, 107, 101, 114, 0, 103, 101, 116, 77, 117, 108, 116, 105, 77, 97, 114, 107, 101, 114, 78, 117, 109, 0, 103, 101, 116, 77, 117, 108, 116, 105, 77, 97, 114, 107, 101, 114, 67, 111, 117, 110, 116, 0, 95, 108, 111, 97, 100, 67, 97, 109, 101, 114, 97, 0, 115, 101, 116, 77, 97, 114, 107, 101, 114, 73, 110, 102, 111, 68, 105, 114, 0, 115, 101, 116, 77, 97, 114, 107, 101, 114, 73, 110, 102, 111, 86, 101, 114, 116, 101, 120, 0, 103, 101, 116, 84, 114, 97, 110, 115, 77, 97, 116, 83, 113, 117, 97, 114, 101, 0, 103, 101, 116, 84, 114, 97, 110, 115, 77, 97, 116, 83, 113, 117, 97, 114, 101, 67, 111, 110, 116, 0, 103, 101, 116, 84, 114, 97, 110, 115, 77, 97, 116, 77, 117, 108, 116, 105, 83, 113, 117, 97, 114, 101, 0, 103, 101, 116, 84, 114, 97, 110, 115, 77, 97, 116, 77, 117, 108, 116, 105, 83, 113, 117, 97, 114, 101, 82, 111, 98, 117, 115, 116, 0, 100, 101, 116, 101, 99, 116, 77, 97, 114, 107, 101, 114, 0, 103, 101, 116, 77, 97, 114, 107, 101, 114, 78, 117, 109, 0, 103, 101, 116, 77, 117, 108, 116, 105, 69, 97, 99, 104, 77, 97, 114, 107, 101, 114, 0, 103, 101, 116, 77, 97, 114, 107, 101, 114, 0, 115, 101, 116, 68, 101, 98, 117, 103, 77, 111, 100, 101, 0, 103, 101, 116, 68, 101, 98, 117, 103, 77, 111, 100, 101, 0, 103, 101, 116, 80, 114, 111, 99, 101, 115, 115, 105, 110, 103, 73, 109, 97, 103, 101, 0, 115, 101, 116, 76, 111, 103, 76, 101, 118, 101, 108, 0, 103, 101, 116, 76, 111, 103, 76, 101, 118, 101, 108, 0, 115, 101, 116, 80, 114, 111, 106, 101, 99, 116, 105, 111, 110, 78, 101, 97, 114, 80, 108, 97, 110, 101, 0, 103, 101, 116, 80, 114, 111, 106, 101, 99, 116, 105, 111, 110, 78, 101, 97, 114, 80, 108, 97, 110, 101, 0, 115, 101, 116, 80, 114, 111, 106, 101, 99, 116, 105, 111, 110, 70, 97, 114, 80, 108, 97, 110, 101, 0, 103, 101, 116, 80, 114, 111, 106, 101, 99, 116, 105, 111, 110, 70, 97, 114, 80, 108, 97, 110, 101, 0, 115, 101, 116, 84, 104, 114, 101, 115, 104, 111, 108, 100, 77, 111, 100, 101, 0, 103, 101, 116, 84, 104, 114, 101, 115, 104, 111, 108, 100, 77, 111, 100, 101, 0, 115, 101, 116, 84, 104, 114, 101, 115, 104, 111, 108, 100, 0, 103, 101, 116, 84, 104, 114, 101, 115, 104, 111, 108, 100, 0, 115, 101, 116, 80, 97, 116, 116, 101, 114, 110, 68, 101, 116, 101, 99, 116, 105, 111, 110, 77, 111, 100, 101, 0, 103, 101, 116, 80, 97, 116, 116, 101, 114, 110, 68, 101, 116, 101, 99, 116, 105, 111, 110, 77, 111, 100, 101, 0, 115, 101, 116, 80, 97, 116, 116, 82, 97, 116, 105, 111, 0, 103, 101, 116, 80, 97, 116, 116, 82, 97, 116, 105, 111, 0, 115, 101, 116, 77, 97, 116, 114, 105, 120, 67, 111, 100, 101, 84, 121, 112, 101, 0, 103, 101, 116, 77, 97, 116, 114, 105, 120, 67, 111, 100, 101, 84, 121, 112, 101, 0, 115, 101, 116, 76, 97, 98, 101, 108, 105, 110, 103, 77, 111, 100, 101, 0, 103, 101, 116, 76, 97, 98, 101, 108, 105, 110, 103, 77, 111, 100, 101, 0, 115, 101, 116, 73, 109, 97, 103, 101, 80, 114, 111, 99, 77, 111, 100, 101, 0, 103, 101, 116, 73, 109, 97, 103, 101, 80, 114, 111, 99, 77, 111, 100, 101, 0, 69, 82, 82, 79, 82, 95, 65, 82, 67, 79, 78, 84, 82, 79, 76, 76, 69, 82, 95, 78, 79, 84, 95, 70, 79, 85, 78, 68, 0, 69, 82, 82, 79, 82, 95, 77, 85, 76, 84, 73, 77, 65, 82, 75, 69, 82, 95, 78, 79, 84, 95, 70, 79, 85, 78, 68, 0, 69, 82, 82, 79, 82, 95, 77, 65, 82, 75, 69, 82, 95, 73, 78, 68, 69, 88, 95, 79, 85, 84, 95, 79, 70, 95, 66, 79, 85, 78, 68, 83, 0, 65, 82, 95, 68, 69, 66, 85, 71, 95, 68, 73, 83, 65, 66, 76, 69, 0, 65, 82, 95, 68, 69, 66, 85, 71, 95, 69, 78, 65, 66, 76, 69, 0, 65, 82, 95, 68, 69, 70, 65, 85, 76, 84, 95, 68, 69, 66, 85, 71, 95, 77, 79, 68, 69, 0, 65, 82, 95, 76, 65, 66, 69, 76, 73, 78, 71, 95, 87, 72, 73, 84, 69, 95, 82, 69, 71, 73, 79, 78, 0, 65, 82, 95, 76, 65, 66, 69, 76, 73, 78, 71, 95, 66, 76, 65, 67, 75, 95, 82, 69, 71, 73, 79, 78, 0, 65, 82, 95, 68, 69, 70, 65, 85, 76, 84, 95, 76, 65, 66, 69, 76, 73, 78, 71, 95, 77, 79, 68, 69, 0, 65, 82, 95, 68, 69, 70, 65, 85, 76, 84, 95, 76, 65, 66, 69, 76, 73, 78, 71, 95, 84, 72, 82, 69, 83, 72, 0, 65, 82, 95, 73, 77, 65, 71, 69, 95, 80, 82, 79, 67, 95, 70, 82, 65, 77, 69, 95, 73, 77, 65, 71, 69, 0, 65, 82, 95, 73, 77, 65, 71, 69, 95, 80, 82, 79, 67, 95, 70, 73, 69, 76, 68, 95, 73, 77, 65, 71, 69, 0, 65, 82, 95, 68, 69, 70, 65, 85, 76, 84, 95, 73, 77, 65, 71, 69, 95, 80, 82, 79, 67, 95, 77, 79, 68, 69, 0, 65, 82, 95, 84, 69, 77, 80, 76, 65, 84, 69, 95, 77, 65, 84, 67, 72, 73, 78, 71, 95, 67, 79, 76, 79, 82, 0, 65, 82, 95, 84, 69, 77, 80, 76, 65, 84, 69, 95, 77, 65, 84, 67, 72, 73, 78, 71, 95, 77, 79, 78, 79, 0, 65, 82, 95, 77, 65, 84, 82, 73, 88, 95, 67, 79, 68, 69, 95, 68, 69, 84, 69, 67, 84, 73, 79, 78, 0, 65, 82, 95, 84, 69, 77, 80, 76, 65, 84, 69, 95, 77, 65, 84, 67, 72, 73, 78, 71, 95, 67, 79, 76, 79, 82, 95, 65, 78, 68, 95, 77, 65, 84, 82, 73, 88, 0, 65, 82, 95, 84, 69, 77, 80, 76, 65, 84, 69, 95, 77, 65, 84, 67, 72, 73, 78, 71, 95, 77, 79, 78, 79, 95, 65, 78, 68, 95, 77, 65, 84, 82, 73, 88, 0, 65, 82, 95, 68, 69, 70, 65, 85, 76, 84, 95, 80, 65, 84, 84, 69, 82, 78, 95, 68, 69, 84, 69, 67, 84, 73, 79, 78, 95, 77, 79, 68, 69, 0, 65, 82, 95, 85, 83, 69, 95, 84, 82, 65, 67, 75, 73, 78, 71, 95, 72, 73, 83, 84, 79, 82, 89, 0, 65, 82, 95, 78, 79, 85, 83, 69, 95, 84, 82, 65, 67, 75, 73, 78, 71, 95, 72, 73, 83, 84, 79, 82, 89, 0, 65, 82, 95, 85, 83, 69, 95, 84, 82, 65, 67, 75, 73, 78, 71, 95, 72, 73, 83, 84, 79, 82, 89, 95, 86, 50, 0, 65, 82, 95, 68, 69, 70, 65, 85, 76, 84, 95, 77, 65, 82, 75, 69, 82, 95, 69, 88, 84, 82, 65, 67, 84, 73, 79, 78, 95, 77, 79, 68, 69, 0, 65, 82, 95, 77, 65, 88, 95, 76, 79, 79, 80, 95, 67, 79, 85, 78, 84, 0, 65, 82, 95, 76, 79, 79, 80, 95, 66, 82, 69, 65, 75, 95, 84, 72, 82, 69, 83, 72, 0, 65, 82, 95, 76, 79, 71, 95, 76, 69, 86, 69, 76, 95, 68, 69, 66, 85, 71, 0, 65, 82, 95, 76, 79, 71, 95, 76, 69, 86, 69, 76, 95, 73, 78, 70, 79, 0, 65, 82, 95, 76, 79, 71, 95, 76, 69, 86, 69, 76, 95, 87, 65, 82, 78, 0, 65, 82, 95, 76, 79, 71, 95, 76, 69, 86, 69, 76, 95, 69, 82, 82, 79, 82, 0, 65, 82, 95, 76, 79, 71, 95, 76, 69, 86, 69, 76, 95, 82, 69, 76, 95, 73, 78, 70, 79, 0, 65, 82, 95, 77, 65, 84, 82, 73, 88, 95, 67, 79, 68, 69, 95, 51, 120, 51, 0, 65, 82, 95, 77, 65, 84, 82, 73, 88, 95, 67, 79, 68, 69, 95, 51, 120, 51, 95, 72, 65, 77, 77, 73, 78, 71, 54, 51, 0, 65, 82, 95, 77, 65, 84, 82, 73, 88, 95, 67, 79, 68, 69, 95, 51, 120, 51, 95, 80, 65, 82, 73, 84, 89, 54, 53, 0, 65, 82, 95, 77, 65, 84, 82, 73, 88, 95, 67, 79, 68, 69, 95, 52, 120, 52, 0, 65, 82, 95, 77, 65, 84, 82, 73, 88, 95, 67, 79, 68, 69, 95, 52, 120, 52, 95, 66, 67, 72, 95, 49, 51, 95, 57, 95, 51, 0, 65, 82, 95, 77, 65, 84, 82, 73, 88, 95, 67, 79, 68, 69, 95, 52, 120, 52, 95, 66, 67, 72, 95, 49, 51, 95, 53, 95, 53, 0, 65, 82, 95, 76, 65, 66, 69, 76, 73, 78, 71, 95, 84, 72, 82, 69, 83, 72, 95, 77, 79, 68, 69, 95, 77, 65, 78, 85, 65, 76, 0, 65, 82, 95, 76, 65, 66, 69, 76, 73, 78, 71, 95, 84, 72, 82, 69, 83, 72, 95, 77, 79, 68, 69, 95, 65, 85, 84, 79, 95, 77, 69, 68, 73, 65, 78, 0, 65, 82, 95, 76, 65], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);
allocate([66, 69, 76, 73, 78, 71, 95, 84, 72, 82, 69, 83, 72, 95, 77, 79, 68, 69, 95, 65, 85, 84, 79, 95, 79, 84, 83, 85, 0, 65, 82, 95, 76, 65, 66, 69, 76, 73, 78, 71, 95, 84, 72, 82, 69, 83, 72, 95, 77, 79, 68, 69, 95, 65, 85, 84, 79, 95, 65, 68, 65, 80, 84, 73, 86, 69, 0, 65, 82, 95, 77, 65, 82, 75, 69, 82, 95, 73, 78, 70, 79, 95, 67, 85, 84, 79, 70, 70, 95, 80, 72, 65, 83, 69, 95, 78, 79, 78, 69, 0, 65, 82, 95, 77, 65, 82, 75, 69, 82, 95, 73, 78, 70, 79, 95, 67, 85, 84, 79, 70, 70, 95, 80, 72, 65, 83, 69, 95, 80, 65, 84, 84, 69, 82, 78, 95, 69, 88, 84, 82, 65, 67, 84, 73, 79, 78, 0, 65, 82, 95, 77, 65, 82, 75, 69, 82, 95, 73, 78, 70, 79, 95, 67, 85, 84, 79, 70, 70, 95, 80, 72, 65, 83, 69, 95, 77, 65, 84, 67, 72, 95, 71, 69, 78, 69, 82, 73, 67, 0, 65, 82, 95, 77, 65, 82, 75, 69, 82, 95, 73, 78, 70, 79, 95, 67, 85, 84, 79, 70, 70, 95, 80, 72, 65, 83, 69, 95, 77, 65, 84, 67, 72, 95, 67, 79, 78, 84, 82, 65, 83, 84, 0, 65, 82, 95, 77, 65, 82, 75, 69, 82, 95, 73, 78, 70, 79, 95, 67, 85, 84, 79, 70, 70, 95, 80, 72, 65, 83, 69, 95, 77, 65, 84, 67, 72, 95, 66, 65, 82, 67, 79, 68, 69, 95, 78, 79, 84, 95, 70, 79, 85, 78, 68, 0, 65, 82, 95, 77, 65, 82, 75, 69, 82, 95, 73, 78, 70, 79, 95, 67, 85, 84, 79, 70, 70, 95, 80, 72, 65, 83, 69, 95, 77, 65, 84, 67, 72, 95, 66, 65, 82, 67, 79, 68, 69, 95, 69, 68, 67, 95, 70, 65, 73, 76, 0, 65, 82, 95, 77, 65, 82, 75, 69, 82, 95, 73, 78, 70, 79, 95, 67, 85, 84, 79, 70, 70, 95, 80, 72, 65, 83, 69, 95, 77, 65, 84, 67, 72, 95, 67, 79, 78, 70, 73, 68, 69, 78, 67, 69, 0, 65, 82, 95, 77, 65, 82, 75, 69, 82, 95, 73, 78, 70, 79, 95, 67, 85, 84, 79, 70, 70, 95, 80, 72, 65, 83, 69, 95, 80, 79, 83, 69, 95, 69, 82, 82, 79, 82, 0, 65, 82, 95, 77, 65, 82, 75, 69, 82, 95, 73, 78, 70, 79, 95, 67, 85, 84, 79, 70, 70, 95, 80, 72, 65, 83, 69, 95, 80, 79, 83, 69, 95, 69, 82, 82, 79, 82, 95, 77, 85, 76, 84, 73, 0, 65, 82, 95, 77, 65, 82, 75, 69, 82, 95, 73, 78, 70, 79, 95, 67, 85, 84, 79, 70, 70, 95, 80, 72, 65, 83, 69, 95, 72, 69, 85, 82, 73, 83, 84, 73, 67, 95, 84, 82, 79, 85, 66, 76, 69, 83, 79, 77, 69, 95, 77, 65, 84, 82, 73, 88, 95, 67, 79, 68, 69, 83, 0, 118, 105, 105, 102, 0, 118, 105, 105, 105, 0, 100, 105, 105, 0, 118, 105, 105, 100, 0, 105, 105, 0, 118, 105, 105, 0, 105, 105, 105, 0, 78, 83, 116, 51, 95, 95, 49, 49, 50, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 73, 99, 78, 83, 95, 49, 49, 99, 104, 97, 114, 95, 116, 114, 97, 105, 116, 115, 73, 99, 69, 69, 78, 83, 95, 57, 97, 108, 108, 111, 99, 97, 116, 111, 114, 73, 99, 69, 69, 69, 69, 0, 78, 83, 116, 51, 95, 95, 49, 50, 49, 95, 95, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 95, 99, 111, 109, 109, 111, 110, 73, 76, 98, 49, 69, 69, 69, 0, 105, 105, 105, 105, 0, 105, 105, 105, 105, 105, 0, 118, 111, 105, 100, 0, 98, 111, 111, 108, 0, 99, 104, 97, 114, 0, 115, 105, 103, 110, 101, 100, 32, 99, 104, 97, 114, 0, 117, 110, 115, 105, 103, 110, 101, 100, 32, 99, 104, 97, 114, 0, 115, 104, 111, 114, 116, 0, 117, 110, 115, 105, 103, 110, 101, 100, 32, 115, 104, 111, 114, 116, 0, 105, 110, 116, 0, 117, 110, 115, 105, 103, 110, 101, 100, 32, 105, 110, 116, 0, 108, 111, 110, 103, 0, 117, 110, 115, 105, 103, 110, 101, 100, 32, 108, 111, 110, 103, 0, 102, 108, 111, 97, 116, 0, 100, 111, 117, 98, 108, 101, 0, 115, 116, 100, 58, 58, 115, 116, 114, 105, 110, 103, 0, 115, 116, 100, 58, 58, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 60, 117, 110, 115, 105, 103, 110, 101, 100, 32, 99, 104, 97, 114, 62, 0, 115, 116, 100, 58, 58, 119, 115, 116, 114, 105, 110, 103, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 118, 97, 108, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 99, 104, 97, 114, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 115, 105, 103, 110, 101, 100, 32, 99, 104, 97, 114, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 110, 115, 105, 103, 110, 101, 100, 32, 99, 104, 97, 114, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 115, 104, 111, 114, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 110, 115, 105, 103, 110, 101, 100, 32, 115, 104, 111, 114, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 105, 110, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 110, 115, 105, 103, 110, 101, 100, 32, 105, 110, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 108, 111, 110, 103, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 110, 115, 105, 103, 110, 101, 100, 32, 108, 111, 110, 103, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 105, 110, 116, 56, 95, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 105, 110, 116, 56, 95, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 105, 110, 116, 49, 54, 95, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 105, 110, 116, 49, 54, 95, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 105, 110, 116, 51, 50, 95, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 105, 110, 116, 51, 50, 95, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 102, 108, 111, 97, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 100, 111, 117, 98, 108, 101, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 108, 111, 110, 103, 32, 100, 111, 117, 98, 108, 101, 62, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 101, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 100, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 102, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 109, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 108, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 106, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 105, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 116, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 115, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 104, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 97, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 99, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 51, 118, 97, 108, 69, 0, 78, 83, 116, 51, 95, 95, 49, 49, 50, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 73, 119, 78, 83, 95, 49, 49, 99, 104, 97, 114, 95, 116, 114, 97, 105, 116, 115, 73, 119, 69, 69, 78, 83, 95, 57, 97, 108, 108, 111, 99, 97, 116, 111, 114, 73, 119, 69, 69, 69, 69, 0, 78, 83, 116, 51, 95, 95, 49, 49, 50, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 73, 104, 78, 83, 95, 49, 49, 99, 104, 97, 114, 95, 116, 114, 97, 105, 116, 115, 73, 104, 69, 69, 78, 83, 95, 57, 97, 108, 108, 111, 99, 97, 116, 111, 114, 73, 104, 69, 69, 69, 69, 0, 83, 116, 57, 98, 97, 100, 95, 97, 108, 108, 111, 99, 0, 83, 116, 57, 101, 120, 99, 101, 112, 116, 105, 111, 110, 0, 83, 116, 57, 116, 121, 112, 101, 95, 105, 110, 102, 111, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 49, 54, 95, 95, 115, 104, 105, 109, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 49, 55, 95, 95, 99, 108, 97, 115, 115, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 50, 51, 95, 95, 102, 117, 110, 100, 97, 109, 101, 110, 116, 97, 108, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 118, 0, 98, 0, 99, 0, 104, 0, 97, 0, 115, 0, 116, 0, 105, 0, 106, 0, 108, 0, 109, 0, 102, 0, 100, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 50, 48, 95, 95, 115, 105, 95, 99, 108, 97, 115, 115, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 50, 49, 95, 95, 118, 109, 105, 95, 99, 108, 97, 115, 115, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 33, 34, 118, 101, 99, 116, 111, 114, 32, 108, 101, 110, 103, 116, 104, 95, 101, 114, 114, 111, 114, 34, 0, 47, 85, 115, 101, 114, 115, 47, 106, 101, 114, 111, 109, 101, 101, 116, 105, 101, 110, 110, 101, 47, 119, 111, 114, 107, 47, 101, 109, 115, 100, 107, 95, 112, 111, 114, 116, 97, 98, 108, 101, 47, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 47, 49, 46, 51, 53, 46, 48, 47, 115, 121, 115, 116, 101, 109, 47, 105, 110, 99, 108, 117, 100, 101, 47, 108, 105, 98, 99, 120, 120, 47, 118, 101, 99, 116, 111, 114, 0, 95, 95, 116, 104, 114, 111, 119, 95, 108, 101, 110, 103, 116, 104, 95, 101, 114, 114, 111, 114, 0, 115, 116, 100, 58, 58, 98, 97, 100, 95, 97, 108, 108, 111, 99, 0, 33, 34, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 32, 108, 101, 110, 103, 116, 104, 95, 101, 114, 114, 111, 114, 34, 0, 47, 85, 115, 101, 114, 115, 47, 106, 101, 114, 111, 109, 101, 101, 116, 105, 101, 110, 110, 101, 47, 119, 111, 114, 107, 47, 101, 109, 115, 100, 107, 95, 112, 111, 114, 116, 97, 98, 108, 101, 47, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 47, 49, 46, 51, 53, 46, 48, 47, 115, 121, 115, 116, 101, 109, 47, 105, 110, 99, 108, 117, 100, 101, 47, 108, 105, 98, 99, 120, 120, 47, 115, 116, 114, 105, 110, 103, 0, 84, 33, 34, 25, 13, 1, 2, 3, 17, 75, 28, 12, 16, 4, 11, 29, 18, 30, 39, 104, 110, 111, 112, 113, 98, 32, 5, 6, 15, 19, 20, 21, 26, 8, 22, 7, 40, 36, 23, 24, 9, 10, 14, 27, 31, 37, 35, 131, 130, 125, 38, 42, 43, 60, 61, 62, 63, 67, 71, 74, 77, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 99, 100, 101, 102, 103, 105, 106, 107, 108, 114, 115, 116, 121, 122, 123, 124, 0, 73, 108, 108, 101, 103, 97, 108, 32, 98, 121, 116, 101, 32, 115, 101, 113, 117, 101, 110, 99, 101, 0, 68, 111, 109, 97, 105, 110, 32, 101, 114, 114, 111, 114, 0, 82, 101, 115, 117, 108, 116, 32, 110, 111, 116, 32, 114, 101, 112, 114, 101, 115, 101, 110, 116, 97, 98, 108, 101, 0, 78, 111, 116, 32, 97, 32, 116, 116, 121, 0, 80, 101, 114, 109, 105, 115, 115, 105, 111, 110, 32, 100, 101, 110, 105, 101, 100, 0, 79, 112, 101, 114, 97, 116, 105, 111, 110, 32, 110, 111, 116, 32, 112, 101, 114, 109, 105, 116, 116, 101, 100, 0, 78, 111, 32, 115, 117, 99, 104, 32, 102, 105, 108, 101, 32, 111, 114, 32, 100, 105, 114, 101, 99, 116, 111, 114, 121, 0, 78, 111, 32, 115, 117, 99, 104, 32, 112, 114, 111, 99, 101, 115, 115, 0, 70, 105, 108, 101, 32, 101, 120, 105, 115, 116, 115, 0, 86, 97, 108, 117, 101, 32, 116, 111, 111, 32, 108, 97, 114, 103, 101, 32, 102, 111, 114, 32, 100, 97, 116, 97, 32, 116, 121, 112, 101, 0, 78, 111, 32, 115, 112, 97, 99, 101, 32, 108, 101, 102, 116, 32, 111, 110, 32, 100, 101, 118, 105, 99, 101, 0, 79, 117, 116, 32, 111, 102, 32, 109, 101, 109, 111, 114, 121, 0, 82, 101, 115, 111, 117, 114, 99, 101, 32, 98, 117, 115, 121, 0, 73, 110, 116, 101, 114, 114, 117, 112, 116, 101, 100, 32, 115, 121, 115, 116, 101, 109, 32, 99, 97, 108, 108, 0, 82, 101, 115, 111, 117, 114, 99, 101, 32, 116, 101, 109, 112, 111, 114, 97, 114, 105, 108, 121, 32, 117, 110, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 73, 110, 118, 97, 108, 105, 100, 32, 115, 101, 101, 107, 0, 67, 114, 111, 115, 115, 45, 100, 101, 118, 105, 99, 101, 32, 108, 105, 110, 107, 0, 82, 101, 97, 100, 45, 111, 110, 108, 121, 32, 102, 105, 108, 101, 32, 115, 121, 115, 116, 101, 109, 0, 68, 105, 114, 101, 99, 116, 111, 114, 121, 32, 110, 111, 116, 32, 101, 109, 112, 116, 121, 0, 67, 111, 110, 110, 101, 99, 116, 105, 111, 110, 32, 114, 101, 115, 101, 116, 32, 98, 121, 32, 112, 101, 101, 114, 0, 79, 112, 101, 114, 97, 116, 105, 111, 110, 32, 116, 105, 109, 101, 100, 32, 111, 117, 116, 0, 67, 111, 110, 110, 101, 99, 116, 105, 111, 110, 32, 114, 101, 102, 117, 115, 101, 100, 0, 72, 111, 115, 116, 32, 105, 115, 32, 100, 111, 119, 110, 0, 72, 111, 115, 116, 32, 105, 115, 32, 117, 110, 114, 101, 97, 99, 104, 97, 98, 108, 101, 0, 65, 100, 100, 114, 101, 115, 115, 32, 105, 110, 32, 117, 115, 101, 0, 66, 114, 111, 107, 101, 110, 32, 112, 105, 112, 101, 0, 73, 47, 79, 32, 101, 114, 114, 111, 114, 0, 78, 111, 32, 115, 117, 99, 104, 32, 100, 101, 118, 105, 99, 101, 32, 111, 114, 32, 97, 100, 100, 114, 101, 115, 115, 0, 66, 108, 111, 99, 107, 32, 100, 101, 118, 105, 99, 101, 32, 114, 101, 113, 117, 105, 114, 101, 100, 0, 78, 111, 32, 115, 117, 99, 104, 32, 100, 101, 118, 105, 99, 101, 0, 78, 111, 116, 32, 97, 32, 100, 105, 114, 101, 99, 116, 111, 114, 121, 0, 73, 115, 32, 97, 32, 100, 105, 114, 101, 99, 116, 111, 114, 121, 0, 84, 101, 120, 116, 32, 102, 105, 108, 101, 32, 98, 117, 115, 121, 0, 69, 120, 101, 99, 32, 102, 111, 114, 109, 97, 116, 32, 101, 114, 114, 111, 114, 0, 73, 110, 118, 97, 108, 105, 100, 32, 97, 114, 103, 117, 109, 101, 110, 116, 0, 65, 114, 103, 117, 109, 101, 110, 116, 32, 108, 105, 115, 116, 32, 116, 111, 111, 32, 108, 111, 110, 103, 0, 83, 121, 109, 98, 111, 108, 105, 99, 32, 108, 105, 110, 107, 32, 108, 111, 111, 112, 0, 70, 105, 108, 101, 110, 97, 109, 101, 32, 116, 111, 111, 32, 108, 111, 110, 103, 0, 84, 111, 111, 32, 109, 97, 110, 121, 32, 111, 112, 101, 110, 32, 102, 105, 108, 101, 115, 32, 105, 110, 32, 115, 121, 115, 116, 101, 109, 0, 78, 111, 32, 102, 105, 108, 101, 32, 100, 101, 115, 99, 114, 105, 112, 116, 111, 114, 115, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 66, 97, 100, 32, 102, 105, 108, 101, 32, 100, 101, 115, 99, 114, 105, 112, 116, 111, 114, 0, 78, 111, 32, 99, 104, 105, 108, 100, 32, 112, 114, 111, 99, 101, 115, 115, 0, 66, 97, 100, 32, 97, 100, 100, 114, 101, 115, 115, 0, 70, 105, 108, 101, 32, 116, 111, 111, 32, 108, 97, 114, 103, 101, 0, 84, 111, 111, 32, 109, 97, 110, 121, 32, 108, 105, 110, 107, 115, 0, 78, 111, 32, 108, 111, 99, 107, 115, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 82, 101, 115, 111, 117, 114, 99, 101, 32, 100, 101, 97, 100, 108, 111, 99, 107, 32, 119, 111, 117, 108, 100, 32, 111, 99, 99, 117, 114, 0, 83, 116, 97, 116, 101, 32, 110, 111, 116, 32, 114, 101, 99, 111, 118, 101, 114, 97, 98, 108, 101, 0, 80, 114, 101, 118, 105, 111, 117, 115, 32, 111, 119, 110, 101, 114, 32, 100, 105, 101, 100, 0, 79, 112, 101, 114, 97, 116, 105, 111, 110, 32, 99, 97, 110, 99, 101, 108, 101, 100, 0, 70, 117, 110, 99, 116, 105, 111, 110, 32, 110, 111, 116, 32, 105, 109, 112, 108, 101, 109, 101, 110, 116, 101, 100, 0, 78, 111, 32, 109, 101, 115, 115, 97, 103, 101, 32, 111, 102, 32, 100, 101, 115, 105, 114, 101, 100, 32, 116, 121, 112, 101, 0, 73, 100, 101, 110, 116, 105, 102, 105, 101, 114, 32, 114, 101, 109, 111, 118, 101, 100, 0, 68, 101, 118, 105, 99, 101, 32, 110, 111, 116, 32, 97, 32, 115, 116, 114, 101, 97, 109, 0, 78, 111, 32, 100, 97, 116, 97, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 68, 101, 118, 105, 99, 101, 32, 116, 105, 109, 101, 111, 117, 116, 0, 79, 117, 116, 32, 111, 102, 32, 115, 116, 114, 101, 97, 109, 115, 32, 114, 101, 115, 111, 117, 114, 99, 101, 115, 0, 76, 105, 110, 107, 32, 104, 97, 115, 32, 98, 101, 101, 110, 32, 115, 101, 118, 101, 114, 101, 100, 0, 80, 114, 111, 116, 111, 99, 111, 108, 32, 101, 114, 114, 111, 114, 0, 66, 97, 100, 32, 109, 101, 115, 115, 97, 103, 101, 0, 70, 105, 108, 101, 32, 100, 101, 115, 99, 114, 105, 112, 116, 111, 114, 32, 105, 110, 32, 98, 97, 100, 32, 115, 116, 97, 116, 101, 0, 78, 111, 116, 32, 97, 32, 115, 111, 99, 107, 101, 116, 0, 68, 101, 115, 116, 105, 110, 97, 116, 105, 111, 110, 32, 97, 100, 100, 114, 101, 115, 115, 32, 114, 101, 113, 117, 105, 114, 101, 100, 0, 77, 101, 115, 115, 97, 103, 101, 32, 116, 111, 111, 32, 108, 97, 114, 103, 101, 0, 80, 114, 111, 116, 111, 99, 111, 108, 32, 119, 114, 111, 110, 103, 32, 116, 121, 112, 101, 32, 102, 111, 114, 32, 115, 111, 99, 107, 101, 116, 0, 80, 114, 111, 116, 111, 99, 111, 108, 32, 110, 111, 116, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 80, 114, 111, 116, 111, 99, 111, 108, 32, 110, 111, 116, 32, 115, 117, 112, 112, 111, 114, 116, 101, 100, 0, 83, 111, 99, 107, 101, 116, 32, 116, 121, 112, 101, 32, 110, 111, 116, 32, 115, 117, 112, 112, 111, 114, 116, 101, 100, 0, 78, 111, 116, 32, 115, 117, 112, 112, 111, 114, 116, 101, 100, 0, 80, 114, 111, 116, 111, 99, 111, 108, 32, 102, 97, 109, 105, 108, 121, 32, 110, 111, 116, 32, 115, 117, 112, 112, 111, 114, 116, 101, 100, 0, 65, 100, 100, 114, 101, 115, 115, 32, 102, 97, 109, 105, 108, 121, 32, 110, 111, 116, 32, 115, 117, 112, 112, 111, 114, 116, 101, 100, 32, 98, 121, 32, 112, 114, 111, 116, 111, 99, 111, 108, 0, 65, 100, 100, 114, 101, 115, 115, 32, 110, 111, 116, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 78, 101, 116, 119, 111, 114, 107, 32, 105, 115, 32, 100, 111, 119, 110, 0, 78, 101, 116, 119, 111, 114, 107, 32, 117, 110, 114, 101, 97, 99, 104, 97, 98, 108, 101, 0, 67, 111, 110, 110, 101, 99, 116, 105, 111, 110, 32, 114, 101, 115, 101, 116, 32, 98, 121, 32, 110, 101, 116, 119, 111, 114, 107, 0, 67, 111, 110, 110, 101, 99, 116, 105, 111, 110, 32, 97, 98, 111, 114, 116, 101, 100, 0, 78, 111, 32, 98, 117, 102, 102, 101, 114, 32, 115, 112, 97, 99, 101, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 83, 111, 99, 107, 101, 116, 32, 105, 115, 32, 99, 111, 110, 110, 101, 99, 116, 101, 100, 0, 83, 111, 99, 107, 101, 116, 32, 110, 111, 116, 32, 99, 111, 110, 110, 101, 99, 116, 101, 100, 0, 67, 97, 110, 110, 111, 116, 32, 115, 101, 110, 100, 32, 97, 102, 116, 101, 114, 32, 115, 111, 99, 107, 101, 116, 32, 115, 104, 117, 116, 100, 111, 119, 110, 0, 79, 112, 101, 114, 97, 116, 105, 111, 110, 32, 97, 108, 114, 101, 97, 100, 121, 32, 105, 110, 32, 112, 114, 111, 103, 114, 101, 115, 115, 0, 79, 112, 101, 114, 97, 116, 105, 111, 110, 32, 105, 110, 32, 112, 114, 111, 103, 114, 101, 115, 115, 0, 83, 116, 97, 108, 101, 32, 102, 105, 108, 101, 32, 104, 97, 110, 100, 108, 101, 0, 82, 101, 109, 111, 116, 101, 32, 73, 47, 79, 32, 101, 114, 114, 111, 114, 0, 81, 117, 111, 116, 97, 32, 101, 120, 99, 101, 101, 100, 101, 100, 0, 78, 111, 32, 109, 101, 100, 105, 117, 109, 32, 102, 111, 117, 110, 100, 0, 87, 114, 111, 110, 103, 32, 109, 101, 100, 105, 117, 109, 32, 116, 121, 112, 101, 0, 78, 111, 32, 101, 114, 114, 111, 114, 32, 105, 110, 102, 111, 114, 109, 97, 116, 105, 111, 110, 0, 0, 105, 110, 102, 105, 110, 105, 116, 121, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 255, 255, 255, 255, 255, 255, 255, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 255, 255, 255, 255, 255, 255, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 0, 1, 2, 4, 7, 3, 6, 5, 0, 114, 119, 97], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE + 10240);
allocate([17, 0, 10, 0, 17, 17, 17, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 15, 10, 17, 17, 17, 3, 10, 7, 0, 1, 19, 9, 11, 11, 0, 0, 9, 6, 11, 0, 0, 11, 0, 6, 17, 0, 0, 0, 17, 17, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 10, 10, 17, 17, 17, 0, 10, 0, 0, 2, 0, 9, 11, 0, 0, 0, 9, 0, 11, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 12, 0, 0, 0, 0, 9, 12, 0, 0, 0, 0, 0, 12, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 0, 0, 0, 4, 13, 0, 0, 0, 0, 9, 14, 0, 0, 0, 0, 0, 14, 0, 0, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 9, 16, 0, 0, 0, 0, 0, 16, 0, 0, 16, 0, 0, 18, 0, 0, 0, 18, 18, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 18, 18, 18, 0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 0, 0, 0, 0, 10, 0, 0, 0, 0, 9, 11, 0, 0, 0, 0, 0, 11, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 12, 0, 0, 0, 0, 9, 12, 0, 0, 0, 0, 0, 12, 0, 0, 12, 0, 0, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 65, 66, 67, 68, 69, 70, 45, 43, 32, 32, 32, 48, 88, 48, 120, 0, 40, 110, 117, 108, 108, 41, 0, 45, 48, 88, 43, 48, 88, 32, 48, 88, 45, 48, 120, 43, 48, 120, 32, 48, 120, 0, 105, 110, 102, 0, 73, 78, 70, 0, 110, 97, 110, 0, 78, 65, 78, 0, 46, 0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE + 15945);
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) {
    HEAP8[tempDoublePtr] = HEAP8[ptr];
    HEAP8[tempDoublePtr + 1] = HEAP8[ptr + 1];
    HEAP8[tempDoublePtr + 2] = HEAP8[ptr + 2];
    HEAP8[tempDoublePtr + 3] = HEAP8[ptr + 3]
}

function copyTempDouble(ptr) {
    HEAP8[tempDoublePtr] = HEAP8[ptr];
    HEAP8[tempDoublePtr + 1] = HEAP8[ptr + 1];
    HEAP8[tempDoublePtr + 2] = HEAP8[ptr + 2];
    HEAP8[tempDoublePtr + 3] = HEAP8[ptr + 3];
    HEAP8[tempDoublePtr + 4] = HEAP8[ptr + 4];
    HEAP8[tempDoublePtr + 5] = HEAP8[ptr + 5];
    HEAP8[tempDoublePtr + 6] = HEAP8[ptr + 6];
    HEAP8[tempDoublePtr + 7] = HEAP8[ptr + 7]
}

function _atexit(func, arg) {
    __ATEXIT__.unshift({
        func: func,
        arg: arg
    })
}

function ___cxa_atexit() {
    return _atexit.apply(null, arguments)
}
Module["_i64Subtract"] = _i64Subtract;

function ___assert_fail(condition, filename, line, func) {
    ABORT = true;
    throw "Assertion failed: " + Pointer_stringify(condition) + ", at: " + [filename ? Pointer_stringify(filename) : "unknown filename", line, func ? Pointer_stringify(func) : "unknown function"] + " at " + stackTrace()
}

function embind_init_charCodes() {
    var codes = new Array(256);
    for (var i = 0; i < 256; ++i) {
        codes[i] = String.fromCharCode(i)
    }
    embind_charCodes = codes
}
var embind_charCodes = undefined;

function readLatin1String(ptr) {
    var ret = "";
    var c = ptr;
    while (HEAPU8[c]) {
        ret += embind_charCodes[HEAPU8[c++]]
    }
    return ret
}
var awaitingDependencies = {};
var registeredTypes = {};
var typeDependencies = {};
var char_0 = 48;
var char_9 = 57;

function makeLegalFunctionName(name) {
    if (undefined === name) {
        return "_unknown"
    }
    name = name.replace(/[^a-zA-Z0-9_]/g, "$");
    var f = name.charCodeAt(0);
    if (f >= char_0 && f <= char_9) {
        return "_" + name
    } else {
        return name
    }
}

function createNamedFunction(name, body) {
    name = makeLegalFunctionName(name);
    return (new Function("body", "return function " + name + "() {\n" + '    "use strict";' + "    return body.apply(this, arguments);\n" + "};\n"))(body)
}

function extendError(baseErrorType, errorName) {
    var errorClass = createNamedFunction(errorName, (function (message) {
        this.name = errorName;
        this.message = message;
        var stack = (new Error(message)).stack;
        if (stack !== undefined) {
            this.stack = this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "")
        }
    }));
    errorClass.prototype = Object.create(baseErrorType.prototype);
    errorClass.prototype.constructor = errorClass;
    errorClass.prototype.toString = (function () {
        if (this.message === undefined) {
            return this.name
        } else {
            return this.name + ": " + this.message
        }
    });
    return errorClass
}
var BindingError = undefined;

function throwBindingError(message) {
    throw new BindingError(message)
}
var InternalError = undefined;

function throwInternalError(message) {
    throw new InternalError(message)
}

function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
    myTypes.forEach((function (type) {
        typeDependencies[type] = dependentTypes
    }));

    function onComplete(typeConverters) {
        var myTypeConverters = getTypeConverters(typeConverters);
        if (myTypeConverters.length !== myTypes.length) {
            throwInternalError("Mismatched type converter count")
        }
        for (var i = 0; i < myTypes.length; ++i) {
            registerType(myTypes[i], myTypeConverters[i])
        }
    }
    var typeConverters = new Array(dependentTypes.length);
    var unregisteredTypes = [];
    var registered = 0;
    dependentTypes.forEach((function (dt, i) {
        if (registeredTypes.hasOwnProperty(dt)) {
            typeConverters[i] = registeredTypes[dt]
        } else {
            unregisteredTypes.push(dt);
            if (!awaitingDependencies.hasOwnProperty(dt)) {
                awaitingDependencies[dt] = []
            }
            awaitingDependencies[dt].push((function () {
                typeConverters[i] = registeredTypes[dt];
                ++registered;
                if (registered === unregisteredTypes.length) {
                    onComplete(typeConverters)
                }
            }))
        }
    }));
    if (0 === unregisteredTypes.length) {
        onComplete(typeConverters)
    }
}

function registerType(rawType, registeredInstance, options) {
    options = options || {};
    if (!("argPackAdvance" in registeredInstance)) {
        throw new TypeError("registerType registeredInstance requires argPackAdvance")
    }
    var name = registeredInstance.name;
    if (!rawType) {
        throwBindingError('type "' + name + '" must have a positive integer typeid pointer')
    }
    if (registeredTypes.hasOwnProperty(rawType)) {
        if (options.ignoreDuplicateRegistrations) {
            return
        } else {
            throwBindingError("Cannot register type '" + name + "' twice")
        }
    }
    registeredTypes[rawType] = registeredInstance;
    delete typeDependencies[rawType];
    if (awaitingDependencies.hasOwnProperty(rawType)) {
        var callbacks = awaitingDependencies[rawType];
        delete awaitingDependencies[rawType];
        callbacks.forEach((function (cb) {
            cb()
        }))
    }
}

function __embind_register_void(rawType, name) {
    name = readLatin1String(name);
    registerType(rawType, {
        isVoid: true,
        name: name,
        "argPackAdvance": 0,
        "fromWireType": (function () {
            return undefined
        }),
        "toWireType": (function (destructors, o) {
            return undefined
        })
    })
}

function __ZSt18uncaught_exceptionv() {
    return !!__ZSt18uncaught_exceptionv.uncaught_exception
}
var EXCEPTIONS = {
    last: 0,
    caught: [],
    infos: {},
    deAdjust: (function (adjusted) {
        if (!adjusted || EXCEPTIONS.infos[adjusted]) return adjusted;
        for (var ptr in EXCEPTIONS.infos) {
            var info = EXCEPTIONS.infos[ptr];
            if (info.adjusted === adjusted) {
                return ptr
            }
        }
        return adjusted
    }),
    addRef: (function (ptr) {
        if (!ptr) return;
        var info = EXCEPTIONS.infos[ptr];
        info.refcount++
    }),
    decRef: (function (ptr) {
        if (!ptr) return;
        var info = EXCEPTIONS.infos[ptr];
        assert(info.refcount > 0);
        info.refcount--;
        if (info.refcount === 0) {
            if (info.destructor) {
                Runtime.dynCall("vi", info.destructor, [ptr])
            }
            delete EXCEPTIONS.infos[ptr];
            ___cxa_free_exception(ptr)
        }
    }),
    clearRef: (function (ptr) {
        if (!ptr) return;
        var info = EXCEPTIONS.infos[ptr];
        info.refcount = 0
    })
};

function ___resumeException(ptr) {
    if (!EXCEPTIONS.last) {
        EXCEPTIONS.last = ptr
    }
    EXCEPTIONS.clearRef(EXCEPTIONS.deAdjust(ptr));
    throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch."
}

function ___cxa_find_matching_catch() {
    var thrown = EXCEPTIONS.last;
    if (!thrown) {
        return (asm["setTempRet0"](0), 0) | 0
    }
    var info = EXCEPTIONS.infos[thrown];
    var throwntype = info.type;
    if (!throwntype) {
        return (asm["setTempRet0"](0), thrown) | 0
    }
    var typeArray = Array.prototype.slice.call(arguments);
    var pointer = Module["___cxa_is_pointer_type"](throwntype);
    if (!___cxa_find_matching_catch.buffer) ___cxa_find_matching_catch.buffer = _malloc(4);
    HEAP32[___cxa_find_matching_catch.buffer >> 2] = thrown;
    thrown = ___cxa_find_matching_catch.buffer;
    for (var i = 0; i < typeArray.length; i++) {
        if (typeArray[i] && Module["___cxa_can_catch"](typeArray[i], throwntype, thrown)) {
            thrown = HEAP32[thrown >> 2];
            info.adjusted = thrown;
            return (asm["setTempRet0"](typeArray[i]), thrown) | 0
        }
    }
    thrown = HEAP32[thrown >> 2];
    return (asm["setTempRet0"](throwntype), thrown) | 0
}

function ___cxa_throw(ptr, type, destructor) {
    EXCEPTIONS.infos[ptr] = {
        ptr: ptr,
        adjusted: ptr,
        type: type,
        destructor: destructor,
        refcount: 0
    };
    EXCEPTIONS.last = ptr;
    if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1
    } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++
    }
    throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch."
}
Module["_memset"] = _memset;
var _BDtoILow = true;

function getShiftFromSize(size) {
    switch (size) {
        case 1:
            return 0;
        case 2:
            return 1;
        case 4:
            return 2;
        case 8:
            return 3;
        default:
            throw new TypeError("Unknown type size: " + size)
    }
}

function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
    var shift = getShiftFromSize(size);
    name = readLatin1String(name);
    registerType(rawType, {
        name: name,
        "fromWireType": (function (wt) {
            return !!wt
        }),
        "toWireType": (function (destructors, o) {
            return o ? trueValue : falseValue
        }),
        "argPackAdvance": 8,
        "readValueFromPointer": (function (pointer) {
            var heap;
            if (size === 1) {
                heap = HEAP8
            } else if (size === 2) {
                heap = HEAP16
            } else if (size === 4) {
                heap = HEAP32
            } else {
                throw new TypeError("Unknown boolean type size: " + name)
            }
            return this["fromWireType"](heap[pointer >> shift])
        }),
        destructorFunction: null
    })
}
Module["_bitshift64Shl"] = _bitshift64Shl;

function _abort() {
    Module["abort"]()
}

function _free() {}
Module["_free"] = _free;

function _malloc(bytes) {
    var ptr = Runtime.dynamicAlloc(bytes + 8);
    return ptr + 8 & 4294967288
}
Module["_malloc"] = _malloc;

function simpleReadValueFromPointer(pointer) {
    return this["fromWireType"](HEAPU32[pointer >> 2])
}

function __embind_register_std_string(rawType, name) {
    name = readLatin1String(name);
    registerType(rawType, {
        name: name,
        "fromWireType": (function (value) {
            var length = HEAPU32[value >> 2];
            var a = new Array(length);
            for (var i = 0; i < length; ++i) {
                a[i] = String.fromCharCode(HEAPU8[value + 4 + i])
            }
            _free(value);
            return a.join("")
        }),
        "toWireType": (function (destructors, value) {
            if (value instanceof ArrayBuffer) {
                value = new Uint8Array(value)
            }

            function getTAElement(ta, index) {
                return ta[index]
            }

            function getStringElement(string, index) {
                return string.charCodeAt(index)
            }
            var getElement;
            if (value instanceof Uint8Array) {
                getElement = getTAElement
            } else if (value instanceof Int8Array) {
                getElement = getTAElement
            } else if (typeof value === "string") {
                getElement = getStringElement
            } else {
                throwBindingError("Cannot pass non-string to std::string")
            }
            var length = value.length;
            var ptr = _malloc(4 + length);
            HEAPU32[ptr >> 2] = length;
            for (var i = 0; i < length; ++i) {
                var charCode = getElement(value, i);
                if (charCode > 255) {
                    _free(ptr);
                    throwBindingError("String has UTF-16 code units that do not fit in 8 bits")
                }
                HEAPU8[ptr + 4 + i] = charCode
            }
            if (destructors !== null) {
                destructors.push(_free, ptr)
            }
            return ptr
        }),
        "argPackAdvance": 8,
        "readValueFromPointer": simpleReadValueFromPointer,
        destructorFunction: (function (ptr) {
            _free(ptr)
        })
    })
}

function __embind_register_std_wstring(rawType, charSize, name) {
    name = readLatin1String(name);
    var getHeap, shift;
    if (charSize === 2) {
        getHeap = (function () {
            return HEAPU16
        });
        shift = 1
    } else if (charSize === 4) {
        getHeap = (function () {
            return HEAPU32
        });
        shift = 2
    }
    registerType(rawType, {
        name: name,
        "fromWireType": (function (value) {
            var HEAP = getHeap();
            var length = HEAPU32[value >> 2];
            var a = new Array(length);
            var start = value + 4 >> shift;
            for (var i = 0; i < length; ++i) {
                a[i] = String.fromCharCode(HEAP[start + i])
            }
            _free(value);
            return a.join("")
        }),
        "toWireType": (function (destructors, value) {
            var HEAP = getHeap();
            var length = value.length;
            var ptr = _malloc(4 + length * charSize);
            HEAPU32[ptr >> 2] = length;
            var start = ptr + 4 >> shift;
            for (var i = 0; i < length; ++i) {
                HEAP[start + i] = value.charCodeAt(i)
            }
            if (destructors !== null) {
                destructors.push(_free, ptr)
            }
            return ptr
        }),
        "argPackAdvance": 8,
        "readValueFromPointer": simpleReadValueFromPointer,
        destructorFunction: (function (ptr) {
            _free(ptr)
        })
    })
}

function ___lock() {}

function ___unlock() {}
var _emscripten_asm_const_int = true;
Module["_i64Add"] = _i64Add;
var _fabs = Math_abs;
var _sqrt = Math_sqrt;

function _embind_repr(v) {
    if (v === null) {
        return "null"
    }
    var t = typeof v;
    if (t === "object" || t === "array" || t === "function") {
        return v.toString()
    } else {
        return "" + v
    }
}

function integerReadValueFromPointer(name, shift, signed) {
    switch (shift) {
        case 0:
            return signed ? function readS8FromPointer(pointer) {
                return HEAP8[pointer]
            } : function readU8FromPointer(pointer) {
                return HEAPU8[pointer]
            };
        case 1:
            return signed ? function readS16FromPointer(pointer) {
                return HEAP16[pointer >> 1]
            } : function readU16FromPointer(pointer) {
                return HEAPU16[pointer >> 1]
            };
        case 2:
            return signed ? function readS32FromPointer(pointer) {
                return HEAP32[pointer >> 2]
            } : function readU32FromPointer(pointer) {
                return HEAPU32[pointer >> 2]
            };
        default:
            throw new TypeError("Unknown integer type: " + name)
    }
}

function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
    name = readLatin1String(name);
    if (maxRange === -1) {
        maxRange = 4294967295
    }
    var shift = getShiftFromSize(size);
    var fromWireType = (function (value) {
        return value
    });
    if (minRange === 0) {
        var bitshift = 32 - 8 * size;
        fromWireType = (function (value) {
            return value << bitshift >>> bitshift
        })
    }
    registerType(primitiveType, {
        name: name,
        "fromWireType": fromWireType,
        "toWireType": (function (destructors, value) {
            if (typeof value !== "number" && typeof value !== "boolean") {
                throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name)
            }
            if (value < minRange || value > maxRange) {
                throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ", " + maxRange + "]!")
            }
            return value | 0
        }),
        "argPackAdvance": 8,
        "readValueFromPointer": integerReadValueFromPointer(name, shift, minRange !== 0),
        destructorFunction: null
    })
}
var emval_free_list = [];
var emval_handle_array = [{}, {
    value: undefined
}, {
    value: null
}, {
    value: true
}, {
    value: false
}];

function __emval_decref(handle) {
    if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
        emval_handle_array[handle] = undefined;
        emval_free_list.push(handle)
    }
}

function count_emval_handles() {
    var count = 0;
    for (var i = 5; i < emval_handle_array.length; ++i) {
        if (emval_handle_array[i] !== undefined) {
            ++count
        }
    }
    return count
}

function get_first_emval() {
    for (var i = 5; i < emval_handle_array.length; ++i) {
        if (emval_handle_array[i] !== undefined) {
            return emval_handle_array[i]
        }
    }
    return null
}

function init_emval() {
    Module["count_emval_handles"] = count_emval_handles;
    Module["get_first_emval"] = get_first_emval
}

function __emval_register(value) {
    switch (value) {
        case undefined:
            {
                return 1
            };
        case null:
            {
                return 2
            };
        case true:
            {
                return 3
            };
        case false:
            {
                return 4
            };
        default:
            {
                var handle = emval_free_list.length ? emval_free_list.pop() : emval_handle_array.length;emval_handle_array[handle] = {
                    refcount: 1,
                    value: value
                };
                return handle
            }
    }
}

function __embind_register_emval(rawType, name) {
    name = readLatin1String(name);
    registerType(rawType, {
        name: name,
        "fromWireType": (function (handle) {
            var rv = emval_handle_array[handle].value;
            __emval_decref(handle);
            return rv
        }),
        "toWireType": (function (destructors, value) {
            return __emval_register(value)
        }),
        "argPackAdvance": 8,
        "readValueFromPointer": simpleReadValueFromPointer,
        destructorFunction: null
    })
}

function ___cxa_allocate_exception(size) {
    return _malloc(size)
}
var _sin = Math_sin;

function ___setErrNo(value) {
    if (Module["___errno_location"]) HEAP32[Module["___errno_location"]() >> 2] = value;
    return value
}
var ERRNO_CODES = {
    EPERM: 1,
    ENOENT: 2,
    ESRCH: 3,
    EINTR: 4,
    EIO: 5,
    ENXIO: 6,
    E2BIG: 7,
    ENOEXEC: 8,
    EBADF: 9,
    ECHILD: 10,
    EAGAIN: 11,
    EWOULDBLOCK: 11,
    ENOMEM: 12,
    EACCES: 13,
    EFAULT: 14,
    ENOTBLK: 15,
    EBUSY: 16,
    EEXIST: 17,
    EXDEV: 18,
    ENODEV: 19,
    ENOTDIR: 20,
    EISDIR: 21,
    EINVAL: 22,
    ENFILE: 23,
    EMFILE: 24,
    ENOTTY: 25,
    ETXTBSY: 26,
    EFBIG: 27,
    ENOSPC: 28,
    ESPIPE: 29,
    EROFS: 30,
    EMLINK: 31,
    EPIPE: 32,
    EDOM: 33,
    ERANGE: 34,
    ENOMSG: 42,
    EIDRM: 43,
    ECHRNG: 44,
    EL2NSYNC: 45,
    EL3HLT: 46,
    EL3RST: 47,
    ELNRNG: 48,
    EUNATCH: 49,
    ENOCSI: 50,
    EL2HLT: 51,
    EDEADLK: 35,
    ENOLCK: 37,
    EBADE: 52,
    EBADR: 53,
    EXFULL: 54,
    ENOANO: 55,
    EBADRQC: 56,
    EBADSLT: 57,
    EDEADLOCK: 35,
    EBFONT: 59,
    ENOSTR: 60,
    ENODATA: 61,
    ETIME: 62,
    ENOSR: 63,
    ENONET: 64,
    ENOPKG: 65,
    EREMOTE: 66,
    ENOLINK: 67,
    EADV: 68,
    ESRMNT: 69,
    ECOMM: 70,
    EPROTO: 71,
    EMULTIHOP: 72,
    EDOTDOT: 73,
    EBADMSG: 74,
    ENOTUNIQ: 76,
    EBADFD: 77,
    EREMCHG: 78,
    ELIBACC: 79,
    ELIBBAD: 80,
    ELIBSCN: 81,
    ELIBMAX: 82,
    ELIBEXEC: 83,
    ENOSYS: 38,
    ENOTEMPTY: 39,
    ENAMETOOLONG: 36,
    ELOOP: 40,
    EOPNOTSUPP: 95,
    EPFNOSUPPORT: 96,
    ECONNRESET: 104,
    ENOBUFS: 105,
    EAFNOSUPPORT: 97,
    EPROTOTYPE: 91,
    ENOTSOCK: 88,
    ENOPROTOOPT: 92,
    ESHUTDOWN: 108,
    ECONNREFUSED: 111,
    EADDRINUSE: 98,
    ECONNABORTED: 103,
    ENETUNREACH: 101,
    ENETDOWN: 100,
    ETIMEDOUT: 110,
    EHOSTDOWN: 112,
    EHOSTUNREACH: 113,
    EINPROGRESS: 115,
    EALREADY: 114,
    EDESTADDRREQ: 89,
    EMSGSIZE: 90,
    EPROTONOSUPPORT: 93,
    ESOCKTNOSUPPORT: 94,
    EADDRNOTAVAIL: 99,
    ENETRESET: 102,
    EISCONN: 106,
    ENOTCONN: 107,
    ETOOMANYREFS: 109,
    EUSERS: 87,
    EDQUOT: 122,
    ESTALE: 116,
    ENOTSUP: 95,
    ENOMEDIUM: 123,
    EILSEQ: 84,
    EOVERFLOW: 75,
    ECANCELED: 125,
    ENOTRECOVERABLE: 131,
    EOWNERDEAD: 130,
    ESTRPIPE: 86
};

function _sysconf(name) {
    switch (name) {
        case 30:
            return PAGE_SIZE;
        case 85:
            return totalMemory / PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
            return 200809;
        case 79:
            return 0;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
            return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
            return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
            return 1024;
        case 31:
        case 42:
        case 72:
            return 32;
        case 87:
        case 26:
        case 33:
            return 2147483647;
        case 34:
        case 1:
            return 47839;
        case 38:
        case 36:
            return 99;
        case 43:
        case 37:
            return 2048;
        case 0:
            return 2097152;
        case 3:
            return 65536;
        case 28:
            return 32768;
        case 44:
            return 32767;
        case 75:
            return 16384;
        case 39:
            return 1e3;
        case 89:
            return 700;
        case 71:
            return 256;
        case 40:
            return 255;
        case 2:
            return 100;
        case 180:
            return 64;
        case 25:
            return 20;
        case 5:
            return 16;
        case 6:
            return 6;
        case 73:
            return 4;
        case 84:
            {
                if (typeof navigator === "object") return navigator["hardwareConcurrency"] || 1;
                return 1
            }
    }
    ___setErrNo(ERRNO_CODES.EINVAL);
    return -1
}
Module["_bitshift64Lshr"] = _bitshift64Lshr;

function __exit(status) {
    Module["exit"](status)
}

function _exit(status) {
    __exit(status)
}
var _llvm_ctlz_i32 = true;

function floatReadValueFromPointer(name, shift) {
    switch (shift) {
        case 2:
            return (function (pointer) {
                return this["fromWireType"](HEAPF32[pointer >> 2])
            });
        case 3:
            return (function (pointer) {
                return this["fromWireType"](HEAPF64[pointer >> 3])
            });
        default:
            throw new TypeError("Unknown float type: " + name)
    }
}

function __embind_register_float(rawType, name, size) {
    var shift = getShiftFromSize(size);
    name = readLatin1String(name);
    registerType(rawType, {
        name: name,
        "fromWireType": (function (value) {
            return value
        }),
        "toWireType": (function (destructors, value) {
            if (typeof value !== "number" && typeof value !== "boolean") {
                throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name)
            }
            return value
        }),
        "argPackAdvance": 8,
        "readValueFromPointer": floatReadValueFromPointer(name, shift),
        destructorFunction: null
    })
}
var _BDtoIHigh = true;

function _pthread_cleanup_push(routine, arg) {
    __ATEXIT__.push((function () {
        Runtime.dynCall("vi", routine, [arg])
    }));
    _pthread_cleanup_push.level = __ATEXIT__.length
}

function new_(constructor, argumentList) {
    if (!(constructor instanceof Function)) {
        throw new TypeError("new_ called with constructor type " + typeof constructor + " which is not a function")
    }
    var dummy = createNamedFunction(constructor.name || "unknownFunctionName", (function () {}));
    dummy.prototype = constructor.prototype;
    var obj = new dummy;
    var r = constructor.apply(obj, argumentList);
    return r instanceof Object ? r : obj
}

function runDestructors(destructors) {
    while (destructors.length) {
        var ptr = destructors.pop();
        var del = destructors.pop();
        del(ptr)
    }
}

function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
    var argCount = argTypes.length;
    if (argCount < 2) {
        throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!")
    }
    var isClassMethodFunc = argTypes[1] !== null && classType !== null;
    var argsList = "";
    var argsListWired = "";
    for (var i = 0; i < argCount - 2; ++i) {
        argsList += (i !== 0 ? ", " : "") + "arg" + i;
        argsListWired += (i !== 0 ? ", " : "") + "arg" + i + "Wired"
    }
    var invokerFnBody = "return function " + makeLegalFunctionName(humanName) + "(" + argsList + ") {\n" + "if (arguments.length !== " + (argCount - 2) + ") {\n" + "throwBindingError('function " + humanName + " called with ' + arguments.length + ' arguments, expected " + (argCount - 2) + " args!');\n" + "}\n";
    var needsDestructorStack = false;
    for (var i = 1; i < argTypes.length; ++i) {
        if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) {
            needsDestructorStack = true;
            break
        }
    }
    if (needsDestructorStack) {
        invokerFnBody += "var destructors = [];\n"
    }
    var dtorStack = needsDestructorStack ? "destructors" : "null";
    var args1 = ["throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam"];
    var args2 = [throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1]];
    if (isClassMethodFunc) {
        invokerFnBody += "var thisWired = classParam.toWireType(" + dtorStack + ", this);\n"
    }
    for (var i = 0; i < argCount - 2; ++i) {
        invokerFnBody += "var arg" + i + "Wired = argType" + i + ".toWireType(" + dtorStack + ", arg" + i + "); // " + argTypes[i + 2].name + "\n";
        args1.push("argType" + i);
        args2.push(argTypes[i + 2])
    }
    if (isClassMethodFunc) {
        argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired
    }
    var returns = argTypes[0].name !== "void";
    invokerFnBody += (returns ? "var rv = " : "") + "invoker(fn" + (argsListWired.length > 0 ? ", " : "") + argsListWired + ");\n";
    if (needsDestructorStack) {
        invokerFnBody += "runDestructors(destructors);\n"
    } else {
        for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
            var paramName = i === 1 ? "thisWired" : "arg" + (i - 2) + "Wired";
            if (argTypes[i].destructorFunction !== null) {
                invokerFnBody += paramName + "_dtor(" + paramName + "); // " + argTypes[i].name + "\n";
                args1.push(paramName + "_dtor");
                args2.push(argTypes[i].destructorFunction)
            }
        }
    }
    if (returns) {
        invokerFnBody += "var ret = retType.fromWireType(rv);\n" + "return ret;\n"
    } else {}
    invokerFnBody += "}\n";
    args1.push(invokerFnBody);
    var invokerFunction = new_(Function, args1).apply(null, args2);
    return invokerFunction
}

function ensureOverloadTable(proto, methodName, humanName) {
    if (undefined === proto[methodName].overloadTable) {
        var prevFunc = proto[methodName];
        proto[methodName] = (function () {
            if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
                throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!")
            }
            return proto[methodName].overloadTable[arguments.length].apply(this, arguments)
        });
        proto[methodName].overloadTable = [];
        proto[methodName].overloadTable[prevFunc.argCount] = prevFunc
    }
}

function exposePublicSymbol(name, value, numArguments) {
    if (Module.hasOwnProperty(name)) {
        if (undefined === numArguments || undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments]) {
            throwBindingError("Cannot register public name '" + name + "' twice")
        }
        ensureOverloadTable(Module, name, name);
        if (Module.hasOwnProperty(numArguments)) {
            throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!")
        }
        Module[name].overloadTable[numArguments] = value
    } else {
        Module[name] = value;
        if (undefined !== numArguments) {
            Module[name].numArguments = numArguments
        }
    }
}

function heap32VectorToArray(count, firstElement) {
    var array = [];
    for (var i = 0; i < count; i++) {
        array.push(HEAP32[(firstElement >> 2) + i])
    }
    return array
}

function replacePublicSymbol(name, value, numArguments) {
    if (!Module.hasOwnProperty(name)) {
        throwInternalError("Replacing nonexistant public symbol")
    }
    if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
        Module[name].overloadTable[numArguments] = value
    } else {
        Module[name] = value
    }
}

function requireFunction(signature, rawFunction) {
    signature = readLatin1String(signature);

    function makeDynCaller(dynCall) {
        var args = [];
        for (var i = 1; i < signature.length; ++i) {
            args.push("a" + i)
        }
        var name = "dynCall_" + signature + "_" + rawFunction;
        var body = "return function " + name + "(" + args.join(", ") + ") {\n";
        body += "    return dynCall(rawFunction" + (args.length ? ", " : "") + args.join(", ") + ");\n";
        body += "};\n";
        return (new Function("dynCall", "rawFunction", body))(dynCall, rawFunction)
    }
    var fp;
    if (Module["FUNCTION_TABLE_" + signature] !== undefined) {
        fp = Module["FUNCTION_TABLE_" + signature][rawFunction]
    } else if (typeof FUNCTION_TABLE !== "undefined") {
        fp = FUNCTION_TABLE[rawFunction]
    } else {
        var dc = asm["dynCall_" + signature];
        if (dc === undefined) {
            dc = asm["dynCall_" + signature.replace(/f/g, "d")];
            if (dc === undefined) {
                throwBindingError("No dynCall invoker for signature: " + signature)
            }
        }
        fp = makeDynCaller(dc)
    }
    if (typeof fp !== "function") {
        throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction)
    }
    return fp
}
var UnboundTypeError = undefined;

function getTypeName(type) {
    var ptr = ___getTypeName(type);
    var rv = readLatin1String(ptr);
    _free(ptr);
    return rv
}

function throwUnboundTypeError(message, types) {
    var unboundTypes = [];
    var seen = {};

    function visit(type) {
        if (seen[type]) {
            return
        }
        if (registeredTypes[type]) {
            return
        }
        if (typeDependencies[type]) {
            typeDependencies[type].forEach(visit);
            return
        }
        unboundTypes.push(type);
        seen[type] = true
    }
    types.forEach(visit);
    throw new UnboundTypeError(message + ": " + unboundTypes.map(getTypeName).join([", "]))
}

function __embind_register_function(name, argCount, rawArgTypesAddr, signature, rawInvoker, fn) {
    var argTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
    name = readLatin1String(name);
    rawInvoker = requireFunction(signature, rawInvoker);
    exposePublicSymbol(name, (function () {
        throwUnboundTypeError("Cannot call " + name + " due to unbound types", argTypes)
    }), argCount - 1);
    whenDependentTypesAreResolved([], argTypes, (function (argTypes) {
        var invokerArgsArray = [argTypes[0], null].concat(argTypes.slice(1));
        replacePublicSymbol(name, craftInvokerFunction(name, invokerArgsArray, null, rawInvoker, fn), argCount - 1);
        return []
    }))
}

function __embind_register_constant(name, type, value) {
    name = readLatin1String(name);
    whenDependentTypesAreResolved([], [type], (function (type) {
        type = type[0];
        Module[name] = type["fromWireType"](value);
        return []
    }))
}

function _pthread_cleanup_pop() {
    assert(_pthread_cleanup_push.level == __ATEXIT__.length, "cannot pop if something else added meanwhile!");
    __ATEXIT__.pop();
    _pthread_cleanup_push.level = __ATEXIT__.length
}
var ERRNO_MESSAGES = {
    0: "Success",
    1: "Not super-user",
    2: "No such file or directory",
    3: "No such process",
    4: "Interrupted system call",
    5: "I/O error",
    6: "No such device or address",
    7: "Arg list too long",
    8: "Exec format error",
    9: "Bad file number",
    10: "No children",
    11: "No more processes",
    12: "Not enough core",
    13: "Permission denied",
    14: "Bad address",
    15: "Block device required",
    16: "Mount device busy",
    17: "File exists",
    18: "Cross-device link",
    19: "No such device",
    20: "Not a directory",
    21: "Is a directory",
    22: "Invalid argument",
    23: "Too many open files in system",
    24: "Too many open files",
    25: "Not a typewriter",
    26: "Text file busy",
    27: "File too large",
    28: "No space left on device",
    29: "Illegal seek",
    30: "Read only file system",
    31: "Too many links",
    32: "Broken pipe",
    33: "Math arg out of domain of func",
    34: "Math result not representable",
    35: "File locking deadlock error",
    36: "File or path name too long",
    37: "No record locks available",
    38: "Function not implemented",
    39: "Directory not empty",
    40: "Too many symbolic links",
    42: "No message of desired type",
    43: "Identifier removed",
    44: "Channel number out of range",
    45: "Level 2 not synchronized",
    46: "Level 3 halted",
    47: "Level 3 reset",
    48: "Link number out of range",
    49: "Protocol driver not attached",
    50: "No CSI structure available",
    51: "Level 2 halted",
    52: "Invalid exchange",
    53: "Invalid request descriptor",
    54: "Exchange full",
    55: "No anode",
    56: "Invalid request code",
    57: "Invalid slot",
    59: "Bad font file fmt",
    60: "Device not a stream",
    61: "No data (for no delay io)",
    62: "Timer expired",
    63: "Out of streams resources",
    64: "Machine is not on the network",
    65: "Package not installed",
    66: "The object is remote",
    67: "The link has been severed",
    68: "Advertise error",
    69: "Srmount error",
    70: "Communication error on send",
    71: "Protocol error",
    72: "Multihop attempted",
    73: "Cross mount point (not really error)",
    74: "Trying to read unreadable message",
    75: "Value too large for defined data type",
    76: "Given log. name not unique",
    77: "f.d. invalid for this operation",
    78: "Remote address changed",
    79: "Can   access a needed shared lib",
    80: "Accessing a corrupted shared lib",
    81: ".lib section in a.out corrupted",
    82: "Attempting to link in too many libs",
    83: "Attempting to exec a shared library",
    84: "Illegal byte sequence",
    86: "Streams pipe error",
    87: "Too many users",
    88: "Socket operation on non-socket",
    89: "Destination address required",
    90: "Message too long",
    91: "Protocol wrong type for socket",
    92: "Protocol not available",
    93: "Unknown protocol",
    94: "Socket type not supported",
    95: "Not supported",
    96: "Protocol family not supported",
    97: "Address family not supported by protocol family",
    98: "Address already in use",
    99: "Address not available",
    100: "Network interface is not configured",
    101: "Network is unreachable",
    102: "Connection reset by network",
    103: "Connection aborted",
    104: "Connection reset by peer",
    105: "No buffer space available",
    106: "Socket is already connected",
    107: "Socket is not connected",
    108: "Can't send after socket shutdown",
    109: "Too many references",
    110: "Connection timed out",
    111: "Connection refused",
    112: "Host is down",
    113: "Host is unreachable",
    114: "Socket already connected",
    115: "Connection already in progress",
    116: "Stale file handle",
    122: "Quota exceeded",
    123: "No medium (in tape drive)",
    125: "Operation canceled",
    130: "Previous owner died",
    131: "State not recoverable"
};
var PATH = {
    splitPath: (function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1)
    }),
    normalizeArray: (function (parts, allowAboveRoot) {
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
            var last = parts[i];
            if (last === ".") {
                parts.splice(i, 1)
            } else if (last === "..") {
                parts.splice(i, 1);
                up++
            } else if (up) {
                parts.splice(i, 1);
                up--
            }
        }
        if (allowAboveRoot) {
            for (; up--; up) {
                parts.unshift("..")
            }
        }
        return parts
    }),
    normalize: (function (path) {
        var isAbsolute = path.charAt(0) === "/",
            trailingSlash = path.substr(-1) === "/";
        path = PATH.normalizeArray(path.split("/").filter((function (p) {
            return !!p
        })), !isAbsolute).join("/");
        if (!path && !isAbsolute) {
            path = "."
        }
        if (path && trailingSlash) {
            path += "/"
        }
        return (isAbsolute ? "/" : "") + path
    }),
    dirname: (function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
            return "."
        }
        if (dir) {
            dir = dir.substr(0, dir.length - 1)
        }
        return root + dir
    }),
    basename: (function (path) {
        if (path === "/") return "/";
        var lastSlash = path.lastIndexOf("/");
        if (lastSlash === -1) return path;
        return path.substr(lastSlash + 1)
    }),
    extname: (function (path) {
        return PATH.splitPath(path)[3]
    }),
    join: (function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join("/"))
    }),
    join2: (function (l, r) {
        return PATH.normalize(l + "/" + r)
    }),
    resolve: (function () {
        var resolvedPath = "",
            resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
            var path = i >= 0 ? arguments[i] : FS.cwd();
            if (typeof path !== "string") {
                throw new TypeError("Arguments to path.resolve must be strings")
            } else if (!path) {
                return ""
            }
            resolvedPath = path + "/" + resolvedPath;
            resolvedAbsolute = path.charAt(0) === "/"
        }
        resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter((function (p) {
            return !!p
        })), !resolvedAbsolute).join("/");
        return (resolvedAbsolute ? "/" : "") + resolvedPath || "."
    }),
    relative: (function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);

        function trim(arr) {
            var start = 0;
            for (; start < arr.length; start++) {
                if (arr[start] !== "") break
            }
            var end = arr.length - 1;
            for (; end >= 0; end--) {
                if (arr[end] !== "") break
            }
            if (start > end) return [];
            return arr.slice(start, end - start + 1)
        }
        var fromParts = trim(from.split("/"));
        var toParts = trim(to.split("/"));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
            if (fromParts[i] !== toParts[i]) {
                samePartsLength = i;
                break
            }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
            outputParts.push("..")
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join("/")
    })
};
var TTY = {
    ttys: [],
    init: (function () {}),
    shutdown: (function () {}),
    register: (function (dev, ops) {
        TTY.ttys[dev] = {
            input: [],
            output: [],
            ops: ops
        };
        FS.registerDevice(dev, TTY.stream_ops)
    }),
    stream_ops: {
        open: (function (stream) {
            var tty = TTY.ttys[stream.node.rdev];
            if (!tty) {
                throw new FS.ErrnoError(ERRNO_CODES.ENODEV)
            }
            stream.tty = tty;
            stream.seekable = false
        }),
        close: (function (stream) {
            stream.tty.ops.flush(stream.tty)
        }),
        flush: (function (stream) {
            stream.tty.ops.flush(stream.tty)
        }),
        read: (function (stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.get_char) {
                throw new FS.ErrnoError(ERRNO_CODES.ENXIO)
            }
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
                var result;
                try {
                    result = stream.tty.ops.get_char(stream.tty)
                } catch (e) {
                    throw new FS.ErrnoError(ERRNO_CODES.EIO)
                }
                if (result === undefined && bytesRead === 0) {
                    throw new FS.ErrnoError(ERRNO_CODES.EAGAIN)
                }
                if (result === null || result === undefined) break;
                bytesRead++;
                buffer[offset + i] = result
            }
            if (bytesRead) {
                stream.node.timestamp = Date.now()
            }
            return bytesRead
        }),
        write: (function (stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.put_char) {
                throw new FS.ErrnoError(ERRNO_CODES.ENXIO)
            }
            for (var i = 0; i < length; i++) {
                try {
                    stream.tty.ops.put_char(stream.tty, buffer[offset + i])
                } catch (e) {
                    throw new FS.ErrnoError(ERRNO_CODES.EIO)
                }
            }
            if (length) {
                stream.node.timestamp = Date.now()
            }
            return i
        })
    },
    default_tty_ops: {
        get_char: (function (tty) {
            if (!tty.input.length) {
                var result = null;
                if (ENVIRONMENT_IS_NODE) {
                    var BUFSIZE = 256;
                    var buf = new Buffer(BUFSIZE);
                    var bytesRead = 0;
                    var fd = process.stdin.fd;
                    var usingDevice = false;
                    try {
                        fd = fs.openSync("/dev/stdin", "r");
                        usingDevice = true
                    } catch (e) {}
                    bytesRead = fs.readSync(fd, buf, 0, BUFSIZE, null);
                    if (usingDevice) {
                        fs.closeSync(fd)
                    }
                    if (bytesRead > 0) {
                        result = buf.slice(0, bytesRead).toString("utf-8")
                    } else {
                        result = null
                    }
                } else if (typeof window != "undefined" && typeof window.prompt == "function") {
                    result = window.prompt("Input: ");
                    if (result !== null) {
                        result += "\n"
                    }
                } else if (typeof readline == "function") {
                    result = readline();
                    if (result !== null) {
                        result += "\n"
                    }
                }
                if (!result) {
                    return null
                }
                tty.input = intArrayFromString(result, true)
            }
            return tty.input.shift()
        }),
        put_char: (function (tty, val) {
            if (val === null || val === 10) {
                Module["print"](UTF8ArrayToString(tty.output, 0));
                tty.output = []
            } else {
                if (val != 0) tty.output.push(val)
            }
        }),
        flush: (function (tty) {
            if (tty.output && tty.output.length > 0) {
                Module["print"](UTF8ArrayToString(tty.output, 0));
                tty.output = []
            }
        })
    },
    default_tty1_ops: {
        put_char: (function (tty, val) {
            if (val === null || val === 10) {
                Module["printErr"](UTF8ArrayToString(tty.output, 0));
                tty.output = []
            } else {
                if (val != 0) tty.output.push(val)
            }
        }),
        flush: (function (tty) {
            if (tty.output && tty.output.length > 0) {
                Module["printErr"](UTF8ArrayToString(tty.output, 0));
                tty.output = []
            }
        })
    }
};
var MEMFS = {
    ops_table: null,
    mount: (function (mount) {
        return MEMFS.createNode(null, "/", 16384 | 511, 0)
    }),
    createNode: (function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        if (!MEMFS.ops_table) {
            MEMFS.ops_table = {
                dir: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr,
                        lookup: MEMFS.node_ops.lookup,
                        mknod: MEMFS.node_ops.mknod,
                        rename: MEMFS.node_ops.rename,
                        unlink: MEMFS.node_ops.unlink,
                        rmdir: MEMFS.node_ops.rmdir,
                        readdir: MEMFS.node_ops.readdir,
                        symlink: MEMFS.node_ops.symlink
                    },
                    stream: {
                        llseek: MEMFS.stream_ops.llseek
                    }
                },
                file: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr
                    },
                    stream: {
                        llseek: MEMFS.stream_ops.llseek,
                        read: MEMFS.stream_ops.read,
                        write: MEMFS.stream_ops.write,
                        allocate: MEMFS.stream_ops.allocate,
                        mmap: MEMFS.stream_ops.mmap,
                        msync: MEMFS.stream_ops.msync
                    }
                },
                link: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr,
                        readlink: MEMFS.node_ops.readlink
                    },
                    stream: {}
                },
                chrdev: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr
                    },
                    stream: FS.chrdev_stream_ops
                }
            }
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
            node.node_ops = MEMFS.ops_table.dir.node;
            node.stream_ops = MEMFS.ops_table.dir.stream;
            node.contents = {}
        } else if (FS.isFile(node.mode)) {
            node.node_ops = MEMFS.ops_table.file.node;
            node.stream_ops = MEMFS.ops_table.file.stream;
            node.usedBytes = 0;
            node.contents = null
        } else if (FS.isLink(node.mode)) {
            node.node_ops = MEMFS.ops_table.link.node;
            node.stream_ops = MEMFS.ops_table.link.stream
        } else if (FS.isChrdev(node.mode)) {
            node.node_ops = MEMFS.ops_table.chrdev.node;
            node.stream_ops = MEMFS.ops_table.chrdev.stream
        }
        node.timestamp = Date.now();
        if (parent) {
            parent.contents[name] = node
        }
        return node
    }),
    getFileDataAsRegularArray: (function (node) {
        if (node.contents && node.contents.subarray) {
            var arr = [];
            for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
            return arr
        }
        return node.contents
    }),
    getFileDataAsTypedArray: (function (node) {
        if (!node.contents) return new Uint8Array;
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
        return new Uint8Array(node.contents)
    }),
    expandFileStorage: (function (node, newCapacity) {
        if (node.contents && node.contents.subarray && newCapacity > node.contents.length) {
            node.contents = MEMFS.getFileDataAsRegularArray(node);
            node.usedBytes = node.contents.length
        }
        if (!node.contents || node.contents.subarray) {
            var prevCapacity = node.contents ? node.contents.buffer.byteLength : 0;
            if (prevCapacity >= newCapacity) return;
            var CAPACITY_DOUBLING_MAX = 1024 * 1024;
            newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) | 0);
            if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
            var oldContents = node.contents;
            node.contents = new Uint8Array(newCapacity);
            if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
            return
        }
        if (!node.contents && newCapacity > 0) node.contents = [];
        while (node.contents.length < newCapacity) node.contents.push(0)
    }),
    resizeFileStorage: (function (node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
            node.contents = null;
            node.usedBytes = 0;
            return
        }
        if (!node.contents || node.contents.subarray) {
            var oldContents = node.contents;
            node.contents = new Uint8Array(new ArrayBuffer(newSize));
            if (oldContents) {
                node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)))
            }
            node.usedBytes = newSize;
            return
        }
        if (!node.contents) node.contents = [];
        if (node.contents.length > newSize) node.contents.length = newSize;
        else
            while (node.contents.length < newSize) node.contents.push(0);
        node.usedBytes = newSize
    }),
    node_ops: {
        getattr: (function (node) {
            var attr = {};
            attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
            attr.ino = node.id;
            attr.mode = node.mode;
            attr.nlink = 1;
            attr.uid = 0;
            attr.gid = 0;
            attr.rdev = node.rdev;
            if (FS.isDir(node.mode)) {
                attr.size = 4096
            } else if (FS.isFile(node.mode)) {
                attr.size = node.usedBytes
            } else if (FS.isLink(node.mode)) {
                attr.size = node.link.length
            } else {
                attr.size = 0
            }
            attr.atime = new Date(node.timestamp);
            attr.mtime = new Date(node.timestamp);
            attr.ctime = new Date(node.timestamp);
            attr.blksize = 4096;
            attr.blocks = Math.ceil(attr.size / attr.blksize);
            return attr
        }),
        setattr: (function (node, attr) {
            if (attr.mode !== undefined) {
                node.mode = attr.mode
            }
            if (attr.timestamp !== undefined) {
                node.timestamp = attr.timestamp
            }
            if (attr.size !== undefined) {
                MEMFS.resizeFileStorage(node, attr.size)
            }
        }),
        lookup: (function (parent, name) {
            throw FS.genericErrors[ERRNO_CODES.ENOENT]
        }),
        mknod: (function (parent, name, mode, dev) {
            return MEMFS.createNode(parent, name, mode, dev)
        }),
        rename: (function (old_node, new_dir, new_name) {
            if (FS.isDir(old_node.mode)) {
                var new_node;
                try {
                    new_node = FS.lookupNode(new_dir, new_name)
                } catch (e) {}
                if (new_node) {
                    for (var i in new_node.contents) {
                        throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY)
                    }
                }
            }
            delete old_node.parent.contents[old_node.name];
            old_node.name = new_name;
            new_dir.contents[new_name] = old_node;
            old_node.parent = new_dir
        }),
        unlink: (function (parent, name) {
            delete parent.contents[name]
        }),
        rmdir: (function (parent, name) {
            var node = FS.lookupNode(parent, name);
            for (var i in node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY)
            }
            delete parent.contents[name]
        }),
        readdir: (function (node) {
            var entries = [".", ".."];
            for (var key in node.contents) {
                if (!node.contents.hasOwnProperty(key)) {
                    continue
                }
                entries.push(key)
            }
            return entries
        }),
        symlink: (function (parent, newname, oldpath) {
            var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
            node.link = oldpath;
            return node
        }),
        readlink: (function (node) {
            if (!FS.isLink(node.mode)) {
                throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
            }
            return node.link
        })
    },
    stream_ops: {
        read: (function (stream, buffer, offset, length, position) {
            var contents = stream.node.contents;
            if (position >= stream.node.usedBytes) return 0;
            var size = Math.min(stream.node.usedBytes - position, length);
            assert(size >= 0);
            if (size > 8 && contents.subarray) {
                buffer.set(contents.subarray(position, position + size), offset)
            } else {
                for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i]
            }
            return size
        }),
        write: (function (stream, buffer, offset, length, position, canOwn) {
            if (!length) return 0;
            var node = stream.node;
            node.timestamp = Date.now();
            if (buffer.subarray && (!node.contents || node.contents.subarray)) {
                if (canOwn) {
                    node.contents = buffer.subarray(offset, offset + length);
                    node.usedBytes = length;
                    return length
                } else if (node.usedBytes === 0 && position === 0) {
                    node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
                    node.usedBytes = length;
                    return length
                } else if (position + length <= node.usedBytes) {
                    node.contents.set(buffer.subarray(offset, offset + length), position);
                    return length
                }
            }
            MEMFS.expandFileStorage(node, position + length);
            if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position);
            else {
                for (var i = 0; i < length; i++) {
                    node.contents[position + i] = buffer[offset + i]
                }
            }
            node.usedBytes = Math.max(node.usedBytes, position + length);
            return length
        }),
        llseek: (function (stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
                position += stream.position
            } else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                    position += stream.node.usedBytes
                }
            }
            if (position < 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
            }
            return position
        }),
        allocate: (function (stream, offset, length) {
            MEMFS.expandFileStorage(stream.node, offset + length);
            stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length)
        }),
        mmap: (function (stream, buffer, offset, length, position, prot, flags) {
            if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(ERRNO_CODES.ENODEV)
            }
            var ptr;
            var allocated;
            var contents = stream.node.contents;
            if (!(flags & 2) && (contents.buffer === buffer || contents.buffer === buffer.buffer)) {
                allocated = false;
                ptr = contents.byteOffset
            } else {
                if (position > 0 || position + length < stream.node.usedBytes) {
                    if (contents.subarray) {
                        contents = contents.subarray(position, position + length)
                    } else {
                        contents = Array.prototype.slice.call(contents, position, position + length)
                    }
                }
                allocated = true;
                ptr = _malloc(length);
                if (!ptr) {
                    throw new FS.ErrnoError(ERRNO_CODES.ENOMEM)
                }
                buffer.set(contents, ptr)
            }
            return {
                ptr: ptr,
                allocated: allocated
            }
        }),
        msync: (function (stream, buffer, offset, length, mmapFlags) {
            if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(ERRNO_CODES.ENODEV)
            }
            if (mmapFlags & 2) {
                return 0
            }
            var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
            return 0
        })
    }
};
var IDBFS = {
    dbs: {},
    indexedDB: (function () {
        if (typeof indexedDB !== "undefined") return indexedDB;
        var ret = null;
        if (typeof window === "object") ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        assert(ret, "IDBFS used, but indexedDB not supported");
        return ret
    }),
    DB_VERSION: 21,
    DB_STORE_NAME: "FILE_DATA",
    mount: (function (mount) {
        return MEMFS.mount.apply(null, arguments)
    }),
    syncfs: (function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, (function (err, local) {
            if (err) return callback(err);
            IDBFS.getRemoteSet(mount, (function (err, remote) {
                if (err) return callback(err);
                var src = populate ? remote : local;
                var dst = populate ? local : remote;
                IDBFS.reconcile(src, dst, callback)
            }))
        }))
    }),
    getDB: (function (name, callback) {
        var db = IDBFS.dbs[name];
        if (db) {
            return callback(null, db)
        }
        var req;
        try {
            req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION)
        } catch (e) {
            return callback(e)
        }
        req.onupgradeneeded = (function (e) {
            var db = e.target.result;
            var transaction = e.target.transaction;
            var fileStore;
            if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
                fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME)
            } else {
                fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME)
            }
            if (!fileStore.indexNames.contains("timestamp")) {
                fileStore.createIndex("timestamp", "timestamp", {
                    unique: false
                })
            }
        });
        req.onsuccess = (function () {
            db = req.result;
            IDBFS.dbs[name] = db;
            callback(null, db)
        });
        req.onerror = (function (e) {
            callback(this.error);
            e.preventDefault()
        })
    }),
    getLocalSet: (function (mount, callback) {
        var entries = {};

        function isRealDir(p) {
            return p !== "." && p !== ".."
        }

        function toAbsolute(root) {
            return (function (p) {
                return PATH.join2(root, p)
            })
        }
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
        while (check.length) {
            var path = check.pop();
            var stat;
            try {
                stat = FS.stat(path)
            } catch (e) {
                return callback(e)
            }
            if (FS.isDir(stat.mode)) {
                check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)))
            }
            entries[path] = {
                timestamp: stat.mtime
            }
        }
        return callback(null, {
            type: "local",
            entries: entries
        })
    }),
    getRemoteSet: (function (mount, callback) {
        var entries = {};
        IDBFS.getDB(mount.mountpoint, (function (err, db) {
            if (err) return callback(err);
            var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readonly");
            transaction.onerror = (function (e) {
                callback(this.error);
                e.preventDefault()
            });
            var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
            var index = store.index("timestamp");
            index.openKeyCursor().onsuccess = (function (event) {
                var cursor = event.target.result;
                if (!cursor) {
                    return callback(null, {
                        type: "remote",
                        db: db,
                        entries: entries
                    })
                }
                entries[cursor.primaryKey] = {
                    timestamp: cursor.key
                };
                cursor.continue()
            })
        }))
    }),
    loadLocalEntry: (function (path, callback) {
        var stat, node;
        try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path)
        } catch (e) {
            return callback(e)
        }
        if (FS.isDir(stat.mode)) {
            return callback(null, {
                timestamp: stat.mtime,
                mode: stat.mode
            })
        } else if (FS.isFile(stat.mode)) {
            node.contents = MEMFS.getFileDataAsTypedArray(node);
            return callback(null, {
                timestamp: stat.mtime,
                mode: stat.mode,
                contents: node.contents
            })
        } else {
            return callback(new Error("node type not supported"))
        }
    }),
    storeLocalEntry: (function (path, entry, callback) {
        try {
            if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode)
            } else if (FS.isFile(entry.mode)) {
                FS.writeFile(path, entry.contents, {
                    encoding: "binary",
                    canOwn: true
                })
            } else {
                return callback(new Error("node type not supported"))
            }
            FS.chmod(path, entry.mode);
            FS.utime(path, entry.timestamp, entry.timestamp)
        } catch (e) {
            return callback(e)
        }
        callback(null)
    }),
    removeLocalEntry: (function (path, callback) {
        try {
            var lookup = FS.lookupPath(path);
            var stat = FS.stat(path);
            if (FS.isDir(stat.mode)) {
                FS.rmdir(path)
            } else if (FS.isFile(stat.mode)) {
                FS.unlink(path)
            }
        } catch (e) {
            return callback(e)
        }
        callback(null)
    }),
    loadRemoteEntry: (function (store, path, callback) {
        var req = store.get(path);
        req.onsuccess = (function (event) {
            callback(null, event.target.result)
        });
        req.onerror = (function (e) {
            callback(this.error);
            e.preventDefault()
        })
    }),
    storeRemoteEntry: (function (store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = (function () {
            callback(null)
        });
        req.onerror = (function (e) {
            callback(this.error);
            e.preventDefault()
        })
    }),
    removeRemoteEntry: (function (store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = (function () {
            callback(null)
        });
        req.onerror = (function (e) {
            callback(this.error);
            e.preventDefault()
        })
    }),
    reconcile: (function (src, dst, callback) {
        var total = 0;
        var create = [];
        Object.keys(src.entries).forEach((function (key) {
            var e = src.entries[key];
            var e2 = dst.entries[key];
            if (!e2 || e.timestamp > e2.timestamp) {
                create.push(key);
                total++
            }
        }));
        var remove = [];
        Object.keys(dst.entries).forEach((function (key) {
            var e = dst.entries[key];
            var e2 = src.entries[key];
            if (!e2) {
                remove.push(key);
                total++
            }
        }));
        if (!total) {
            return callback(null)
        }
        var errored = false;
        var completed = 0;
        var db = src.type === "remote" ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readwrite");
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);

        function done(err) {
            if (err) {
                if (!done.errored) {
                    done.errored = true;
                    return callback(err)
                }
                return
            }
            if (++completed >= total) {
                return callback(null)
            }
        }
        transaction.onerror = (function (e) {
            done(this.error);
            e.preventDefault()
        });
        create.sort().forEach((function (path) {
            if (dst.type === "local") {
                IDBFS.loadRemoteEntry(store, path, (function (err, entry) {
                    if (err) return done(err);
                    IDBFS.storeLocalEntry(path, entry, done)
                }))
            } else {
                IDBFS.loadLocalEntry(path, (function (err, entry) {
                    if (err) return done(err);
                    IDBFS.storeRemoteEntry(store, path, entry, done)
                }))
            }
        }));
        remove.sort().reverse().forEach((function (path) {
            if (dst.type === "local") {
                IDBFS.removeLocalEntry(path, done)
            } else {
                IDBFS.removeRemoteEntry(store, path, done)
            }
        }))
    })
};
var NODEFS = {
    isWindows: false,
    staticInit: (function () {
        NODEFS.isWindows = !!process.platform.match(/^win/)
    }),
    mount: (function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, "/", NODEFS.getMode(mount.opts.root), 0)
    }),
    createNode: (function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node
    }),
    getMode: (function (path) {
        var stat;
        try {
            stat = fs.lstatSync(path);
            if (NODEFS.isWindows) {
                stat.mode = stat.mode | (stat.mode & 146) >> 1
            }
        } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code])
        }
        return stat.mode
    }),
    realPath: (function (node) {
        var parts = [];
        while (node.parent !== node) {
            parts.push(node.name);
            node = node.parent
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts)
    }),
    flagsToPermissionStringMap: {
        0: "r",
        1: "r+",
        2: "r+",
        64: "r",
        65: "r+",
        66: "r+",
        129: "rx+",
        193: "rx+",
        514: "w+",
        577: "w",
        578: "w+",
        705: "wx",
        706: "wx+",
        1024: "a",
        1025: "a",
        1026: "a+",
        1089: "a",
        1090: "a+",
        1153: "ax",
        1154: "ax+",
        1217: "ax",
        1218: "ax+",
        4096: "rs",
        4098: "rs+"
    },
    flagsToPermissionString: (function (flags) {
        flags &= ~32768;
        if (flags in NODEFS.flagsToPermissionStringMap) {
            return NODEFS.flagsToPermissionStringMap[flags]
        } else {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
    }),
    node_ops: {
        getattr: (function (node) {
            var path = NODEFS.realPath(node);
            var stat;
            try {
                stat = fs.lstatSync(path)
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
            if (NODEFS.isWindows && !stat.blksize) {
                stat.blksize = 4096
            }
            if (NODEFS.isWindows && !stat.blocks) {
                stat.blocks = (stat.size + stat.blksize - 1) / stat.blksize | 0
            }
            return {
                dev: stat.dev,
                ino: stat.ino,
                mode: stat.mode,
                nlink: stat.nlink,
                uid: stat.uid,
                gid: stat.gid,
                rdev: stat.rdev,
                size: stat.size,
                atime: stat.atime,
                mtime: stat.mtime,
                ctime: stat.ctime,
                blksize: stat.blksize,
                blocks: stat.blocks
            }
        }),
        setattr: (function (node, attr) {
            var path = NODEFS.realPath(node);
            try {
                if (attr.mode !== undefined) {
                    fs.chmodSync(path, attr.mode);
                    node.mode = attr.mode
                }
                if (attr.timestamp !== undefined) {
                    var date = new Date(attr.timestamp);
                    fs.utimesSync(path, date, date)
                }
                if (attr.size !== undefined) {
                    fs.truncateSync(path, attr.size)
                }
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
        }),
        lookup: (function (parent, name) {
            var path = PATH.join2(NODEFS.realPath(parent), name);
            var mode = NODEFS.getMode(path);
            return NODEFS.createNode(parent, name, mode)
        }),
        mknod: (function (parent, name, mode, dev) {
            var node = NODEFS.createNode(parent, name, mode, dev);
            var path = NODEFS.realPath(node);
            try {
                if (FS.isDir(node.mode)) {
                    fs.mkdirSync(path, node.mode)
                } else {
                    fs.writeFileSync(path, "", {
                        mode: node.mode
                    })
                }
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
            return node
        }),
        rename: (function (oldNode, newDir, newName) {
            var oldPath = NODEFS.realPath(oldNode);
            var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
            try {
                fs.renameSync(oldPath, newPath)
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
        }),
        unlink: (function (parent, name) {
            var path = PATH.join2(NODEFS.realPath(parent), name);
            try {
                fs.unlinkSync(path)
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
        }),
        rmdir: (function (parent, name) {
            var path = PATH.join2(NODEFS.realPath(parent), name);
            try {
                fs.rmdirSync(path)
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
        }),
        readdir: (function (node) {
            var path = NODEFS.realPath(node);
            try {
                return fs.readdirSync(path)
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
        }),
        symlink: (function (parent, newName, oldPath) {
            var newPath = PATH.join2(NODEFS.realPath(parent), newName);
            try {
                fs.symlinkSync(oldPath, newPath)
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
        }),
        readlink: (function (node) {
            var path = NODEFS.realPath(node);
            try {
                path = fs.readlinkSync(path);
                path = NODEJS_PATH.relative(NODEJS_PATH.resolve(node.mount.opts.root), path);
                return path
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
        })
    },
    stream_ops: {
        open: (function (stream) {
            var path = NODEFS.realPath(stream.node);
            try {
                if (FS.isFile(stream.node.mode)) {
                    stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags))
                }
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
        }),
        close: (function (stream) {
            try {
                if (FS.isFile(stream.node.mode) && stream.nfd) {
                    fs.closeSync(stream.nfd)
                }
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
        }),
        read: (function (stream, buffer, offset, length, position) {
            if (length === 0) return 0;
            var nbuffer = new Buffer(length);
            var res;
            try {
                res = fs.readSync(stream.nfd, nbuffer, 0, length, position)
            } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
            if (res > 0) {
                for (var i = 0; i < res; i++) {
                    buffer[offset + i] = nbuffer[i]
                }
            }
            return res
        }),
        write: (function (stream, buffer, offset, length, position) {
            var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
            var res;
            try {
                res = fs.writeSync(stream.nfd, nbuffer, 0, length, position)
            } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
            return res
        }),
        llseek: (function (stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
                position += stream.position
            } else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                    try {
                        var stat = fs.fstatSync(stream.nfd);
                        position += stat.size
                    } catch (e) {
                        throw new FS.ErrnoError(ERRNO_CODES[e.code])
                    }
                }
            }
            if (position < 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
            }
            return position
        })
    }
};
var WORKERFS = {
    DIR_MODE: 16895,
    FILE_MODE: 33279,
    reader: null,
    mount: (function (mount) {
        assert(ENVIRONMENT_IS_WORKER);
        if (!WORKERFS.reader) WORKERFS.reader = new FileReaderSync;
        var root = WORKERFS.createNode(null, "/", WORKERFS.DIR_MODE, 0);
        var createdParents = {};

        function ensureParent(path) {
            var parts = path.split("/");
            var parent = root;
            for (var i = 0; i < parts.length - 1; i++) {
                var curr = parts.slice(0, i + 1).join("/");
                if (!createdParents[curr]) {
                    createdParents[curr] = WORKERFS.createNode(parent, curr, WORKERFS.DIR_MODE, 0)
                }
                parent = createdParents[curr]
            }
            return parent
        }

        function base(path) {
            var parts = path.split("/");
            return parts[parts.length - 1]
        }
        Array.prototype.forEach.call(mount.opts["files"] || [], (function (file) {
            WORKERFS.createNode(ensureParent(file.name), base(file.name), WORKERFS.FILE_MODE, 0, file, file.lastModifiedDate)
        }));
        (mount.opts["blobs"] || []).forEach((function (obj) {
            WORKERFS.createNode(ensureParent(obj["name"]), base(obj["name"]), WORKERFS.FILE_MODE, 0, obj["data"])
        }));
        (mount.opts["packages"] || []).forEach((function (pack) {
            pack["metadata"].files.forEach((function (file) {
                var name = file.filename.substr(1);
                WORKERFS.createNode(ensureParent(name), base(name), WORKERFS.FILE_MODE, 0, pack["blob"].slice(file.start, file.end))
            }))
        }));
        return root
    }),
    createNode: (function (parent, name, mode, dev, contents, mtime) {
        var node = FS.createNode(parent, name, mode);
        node.mode = mode;
        node.node_ops = WORKERFS.node_ops;
        node.stream_ops = WORKERFS.stream_ops;
        node.timestamp = (mtime || new Date).getTime();
        assert(WORKERFS.FILE_MODE !== WORKERFS.DIR_MODE);
        if (mode === WORKERFS.FILE_MODE) {
            node.size = contents.size;
            node.contents = contents
        } else {
            node.size = 4096;
            node.contents = {}
        }
        if (parent) {
            parent.contents[name] = node
        }
        return node
    }),
    node_ops: {
        getattr: (function (node) {
            return {
                dev: 1,
                ino: undefined,
                mode: node.mode,
                nlink: 1,
                uid: 0,
                gid: 0,
                rdev: undefined,
                size: node.size,
                atime: new Date(node.timestamp),
                mtime: new Date(node.timestamp),
                ctime: new Date(node.timestamp),
                blksize: 4096,
                blocks: Math.ceil(node.size / 4096)
            }
        }),
        setattr: (function (node, attr) {
            if (attr.mode !== undefined) {
                node.mode = attr.mode
            }
            if (attr.timestamp !== undefined) {
                node.timestamp = attr.timestamp
            }
        }),
        lookup: (function (parent, name) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT)
        }),
        mknod: (function (parent, name, mode, dev) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }),
        rename: (function (oldNode, newDir, newName) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }),
        unlink: (function (parent, name) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }),
        rmdir: (function (parent, name) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }),
        readdir: (function (node) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }),
        symlink: (function (parent, newName, oldPath) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }),
        readlink: (function (node) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        })
    },
    stream_ops: {
        read: (function (stream, buffer, offset, length, position) {
            if (position >= stream.node.size) return 0;
            var chunk = stream.node.contents.slice(position, position + length);
            var ab = WORKERFS.reader.readAsArrayBuffer(chunk);
            buffer.set(new Uint8Array(ab), offset);
            return chunk.size
        }),
        write: (function (stream, buffer, offset, length, position) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO)
        }),
        llseek: (function (stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
                position += stream.position
            } else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                    position += stream.node.size
                }
            }
            if (position < 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
            }
            return position
        })
    }
};
var _stdin = allocate(1, "i32*", ALLOC_STATIC);
var _stdout = allocate(1, "i32*", ALLOC_STATIC);
var _stderr = allocate(1, "i32*", ALLOC_STATIC);
var FS = {
    root: null,
    mounts: [],
    devices: [null],
    streams: [],
    nextInode: 1,
    nameTable: null,
    currentPath: "/",
    initialized: false,
    ignorePermissions: true,
    trackingDelegate: {},
    tracking: {
        openFlags: {
            READ: 1,
            WRITE: 2
        }
    },
    ErrnoError: null,
    genericErrors: {},
    filesystems: null,
    handleFSError: (function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + " : " + stackTrace();
        return ___setErrNo(e.errno)
    }),
    lookupPath: (function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};
        if (!path) return {
            path: "",
            node: null
        };
        var defaults = {
            follow_mount: true,
            recurse_count: 0
        };
        for (var key in defaults) {
            if (opts[key] === undefined) {
                opts[key] = defaults[key]
            }
        }
        if (opts.recurse_count > 8) {
            throw new FS.ErrnoError(ERRNO_CODES.ELOOP)
        }
        var parts = PATH.normalizeArray(path.split("/").filter((function (p) {
            return !!p
        })), false);
        var current = FS.root;
        var current_path = "/";
        for (var i = 0; i < parts.length; i++) {
            var islast = i === parts.length - 1;
            if (islast && opts.parent) {
                break
            }
            current = FS.lookupNode(current, parts[i]);
            current_path = PATH.join2(current_path, parts[i]);
            if (FS.isMountpoint(current)) {
                if (!islast || islast && opts.follow_mount) {
                    current = current.mounted.root
                }
            }
            if (!islast || opts.follow) {
                var count = 0;
                while (FS.isLink(current.mode)) {
                    var link = FS.readlink(current_path);
                    current_path = PATH.resolve(PATH.dirname(current_path), link);
                    var lookup = FS.lookupPath(current_path, {
                        recurse_count: opts.recurse_count
                    });
                    current = lookup.node;
                    if (count++ > 40) {
                        throw new FS.ErrnoError(ERRNO_CODES.ELOOP)
                    }
                }
            }
        }
        return {
            path: current_path,
            node: current
        }
    }),
    getPath: (function (node) {
        var path;
        while (true) {
            if (FS.isRoot(node)) {
                var mount = node.mount.mountpoint;
                if (!path) return mount;
                return mount[mount.length - 1] !== "/" ? mount + "/" + path : mount + path
            }
            path = path ? node.name + "/" + path : node.name;
            node = node.parent
        }
    }),
    hashName: (function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
            hash = (hash << 5) - hash + name.charCodeAt(i) | 0
        }
        return (parentid + hash >>> 0) % FS.nameTable.length
    }),
    hashAddNode: (function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node
    }),
    hashRemoveNode: (function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
            FS.nameTable[hash] = node.name_next
        } else {
            var current = FS.nameTable[hash];
            while (current) {
                if (current.name_next === node) {
                    current.name_next = node.name_next;
                    break
                }
                current = current.name_next
            }
        }
    }),
    lookupNode: (function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
            throw new FS.ErrnoError(err, parent)
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
            var nodeName = node.name;
            if (node.parent.id === parent.id && nodeName === name) {
                return node
            }
        }
        return FS.lookup(parent, name)
    }),
    createNode: (function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
            FS.FSNode = (function (parent, name, mode, rdev) {
                if (!parent) {
                    parent = this
                }
                this.parent = parent;
                this.mount = parent.mount;
                this.mounted = null;
                this.id = FS.nextInode++;
                this.name = name;
                this.mode = mode;
                this.node_ops = {};
                this.stream_ops = {};
                this.rdev = rdev
            });
            FS.FSNode.prototype = {};
            var readMode = 292 | 73;
            var writeMode = 146;
            Object.defineProperties(FS.FSNode.prototype, {
                read: {
                    get: (function () {
                        return (this.mode & readMode) === readMode
                    }),
                    set: (function (val) {
                        val ? this.mode |= readMode : this.mode &= ~readMode
                    })
                },
                write: {
                    get: (function () {
                        return (this.mode & writeMode) === writeMode
                    }),
                    set: (function (val) {
                        val ? this.mode |= writeMode : this.mode &= ~writeMode
                    })
                },
                isFolder: {
                    get: (function () {
                        return FS.isDir(this.mode)
                    })
                },
                isDevice: {
                    get: (function () {
                        return FS.isChrdev(this.mode)
                    })
                }
            })
        }
        var node = new FS.FSNode(parent, name, mode, rdev);
        FS.hashAddNode(node);
        return node
    }),
    destroyNode: (function (node) {
        FS.hashRemoveNode(node)
    }),
    isRoot: (function (node) {
        return node === node.parent
    }),
    isMountpoint: (function (node) {
        return !!node.mounted
    }),
    isFile: (function (mode) {
        return (mode & 61440) === 32768
    }),
    isDir: (function (mode) {
        return (mode & 61440) === 16384
    }),
    isLink: (function (mode) {
        return (mode & 61440) === 40960
    }),
    isChrdev: (function (mode) {
        return (mode & 61440) === 8192
    }),
    isBlkdev: (function (mode) {
        return (mode & 61440) === 24576
    }),
    isFIFO: (function (mode) {
        return (mode & 61440) === 4096
    }),
    isSocket: (function (mode) {
        return (mode & 49152) === 49152
    }),
    flagModes: {
        "r": 0,
        "rs": 1052672,
        "r+": 2,
        "w": 577,
        "wx": 705,
        "xw": 705,
        "w+": 578,
        "wx+": 706,
        "xw+": 706,
        "a": 1089,
        "ax": 1217,
        "xa": 1217,
        "a+": 1090,
        "ax+": 1218,
        "xa+": 1218
    },
    modeStringToFlags: (function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === "undefined") {
            throw new Error("Unknown file open mode: " + str)
        }
        return flags
    }),
    flagsToPermissionString: (function (flag) {
        var perms = ["r", "w", "rw"][flag & 3];
        if (flag & 512) {
            perms += "w"
        }
        return perms
    }),
    nodePermissions: (function (node, perms) {
        if (FS.ignorePermissions) {
            return 0
        }
        if (perms.indexOf("r") !== -1 && !(node.mode & 292)) {
            return ERRNO_CODES.EACCES
        } else if (perms.indexOf("w") !== -1 && !(node.mode & 146)) {
            return ERRNO_CODES.EACCES
        } else if (perms.indexOf("x") !== -1 && !(node.mode & 73)) {
            return ERRNO_CODES.EACCES
        }
        return 0
    }),
    mayLookup: (function (dir) {
        var err = FS.nodePermissions(dir, "x");
        if (err) return err;
        if (!dir.node_ops.lookup) return ERRNO_CODES.EACCES;
        return 0
    }),
    mayCreate: (function (dir, name) {
        try {
            var node = FS.lookupNode(dir, name);
            return ERRNO_CODES.EEXIST
        } catch (e) {}
        return FS.nodePermissions(dir, "wx")
    }),
    mayDelete: (function (dir, name, isdir) {
        var node;
        try {
            node = FS.lookupNode(dir, name)
        } catch (e) {
            return e.errno
        }
        var err = FS.nodePermissions(dir, "wx");
        if (err) {
            return err
        }
        if (isdir) {
            if (!FS.isDir(node.mode)) {
                return ERRNO_CODES.ENOTDIR
            }
            if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
                return ERRNO_CODES.EBUSY
            }
        } else {
            if (FS.isDir(node.mode)) {
                return ERRNO_CODES.EISDIR
            }
        }
        return 0
    }),
    mayOpen: (function (node, flags) {
        if (!node) {
            return ERRNO_CODES.ENOENT
        }
        if (FS.isLink(node.mode)) {
            return ERRNO_CODES.ELOOP
        } else if (FS.isDir(node.mode)) {
            if ((flags & 2097155) !== 0 || flags & 512) {
                return ERRNO_CODES.EISDIR
            }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags))
    }),
    MAX_OPEN_FDS: 4096,
    nextfd: (function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
            if (!FS.streams[fd]) {
                return fd
            }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE)
    }),
    getStream: (function (fd) {
        return FS.streams[fd]
    }),
    createStream: (function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
            FS.FSStream = (function () {});
            FS.FSStream.prototype = {};
            Object.defineProperties(FS.FSStream.prototype, {
                object: {
                    get: (function () {
                        return this.node
                    }),
                    set: (function (val) {
                        this.node = val
                    })
                },
                isRead: {
                    get: (function () {
                        return (this.flags & 2097155) !== 1
                    })
                },
                isWrite: {
                    get: (function () {
                        return (this.flags & 2097155) !== 0
                    })
                },
                isAppend: {
                    get: (function () {
                        return this.flags & 1024
                    })
                }
            })
        }
        var newStream = new FS.FSStream;
        for (var p in stream) {
            newStream[p] = stream[p]
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream
    }),
    closeStream: (function (fd) {
        FS.streams[fd] = null
    }),
    chrdev_stream_ops: {
        open: (function (stream) {
            var device = FS.getDevice(stream.node.rdev);
            stream.stream_ops = device.stream_ops;
            if (stream.stream_ops.open) {
                stream.stream_ops.open(stream)
            }
        }),
        llseek: (function () {
            throw new FS.ErrnoError(ERRNO_CODES.ESPIPE)
        })
    },
    major: (function (dev) {
        return dev >> 8
    }),
    minor: (function (dev) {
        return dev & 255
    }),
    makedev: (function (ma, mi) {
        return ma << 8 | mi
    }),
    registerDevice: (function (dev, ops) {
        FS.devices[dev] = {
            stream_ops: ops
        }
    }),
    getDevice: (function (dev) {
        return FS.devices[dev]
    }),
    getMounts: (function (mount) {
        var mounts = [];
        var check = [mount];
        while (check.length) {
            var m = check.pop();
            mounts.push(m);
            check.push.apply(check, m.mounts)
        }
        return mounts
    }),
    syncfs: (function (populate, callback) {
        if (typeof populate === "function") {
            callback = populate;
            populate = false
        }
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;

        function done(err) {
            if (err) {
                if (!done.errored) {
                    done.errored = true;
                    return callback(err)
                }
                return
            }
            if (++completed >= mounts.length) {
                callback(null)
            }
        }
        mounts.forEach((function (mount) {
            if (!mount.type.syncfs) {
                return done(null)
            }
            mount.type.syncfs(mount, populate, done)
        }))
    }),
    mount: (function (type, opts, mountpoint) {
        var root = mountpoint === "/";
        var pseudo = !mountpoint;
        var node;
        if (root && FS.root) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY)
        } else if (!root && !pseudo) {
            var lookup = FS.lookupPath(mountpoint, {
                follow_mount: false
            });
            mountpoint = lookup.path;
            node = lookup.node;
            if (FS.isMountpoint(node)) {
                throw new FS.ErrnoError(ERRNO_CODES.EBUSY)
            }
            if (!FS.isDir(node.mode)) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR)
            }
        }
        var mount = {
            type: type,
            opts: opts,
            mountpoint: mountpoint,
            mounts: []
        };
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
        if (root) {
            FS.root = mountRoot
        } else if (node) {
            node.mounted = mount;
            if (node.mount) {
                node.mount.mounts.push(mount)
            }
        }
        return mountRoot
    }),
    unmount: (function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, {
            follow_mount: false
        });
        if (!FS.isMountpoint(lookup.node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
        Object.keys(FS.nameTable).forEach((function (hash) {
            var current = FS.nameTable[hash];
            while (current) {
                var next = current.name_next;
                if (mounts.indexOf(current.mount) !== -1) {
                    FS.destroyNode(current)
                }
                current = next
            }
        }));
        node.mounted = null;
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1)
    }),
    lookup: (function (parent, name) {
        return parent.node_ops.lookup(parent, name)
    }),
    mknod: (function (path, mode, dev) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === "." || name === "..") {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        var err = FS.mayCreate(parent, name);
        if (err) {
            throw new FS.ErrnoError(err)
        }
        if (!parent.node_ops.mknod) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        return parent.node_ops.mknod(parent, name, mode, dev)
    }),
    create: (function (path, mode) {
        mode = mode !== undefined ? mode : 438;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0)
    }),
    mkdir: (function (path, mode) {
        mode = mode !== undefined ? mode : 511;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0)
    }),
    mkdev: (function (path, mode, dev) {
        if (typeof dev === "undefined") {
            dev = mode;
            mode = 438
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev)
    }),
    symlink: (function (oldpath, newpath) {
        if (!PATH.resolve(oldpath)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT)
        }
        var lookup = FS.lookupPath(newpath, {
            parent: true
        });
        var parent = lookup.node;
        if (!parent) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT)
        }
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
            throw new FS.ErrnoError(err)
        }
        if (!parent.node_ops.symlink) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        return parent.node_ops.symlink(parent, newname, oldpath)
    }),
    rename: (function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        var lookup, old_dir, new_dir;
        try {
            lookup = FS.lookupPath(old_path, {
                parent: true
            });
            old_dir = lookup.node;
            lookup = FS.lookupPath(new_path, {
                parent: true
            });
            new_dir = lookup.node
        } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY)
        }
        if (!old_dir || !new_dir) throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        if (old_dir.mount !== new_dir.mount) {
            throw new FS.ErrnoError(ERRNO_CODES.EXDEV)
        }
        var old_node = FS.lookupNode(old_dir, old_name);
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY)
        }
        var new_node;
        try {
            new_node = FS.lookupNode(new_dir, new_name)
        } catch (e) {}
        if (old_node === new_node) {
            return
        }
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
            throw new FS.ErrnoError(err)
        }
        err = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
        if (err) {
            throw new FS.ErrnoError(err)
        }
        if (!old_dir.node_ops.rename) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY)
        }
        if (new_dir !== old_dir) {
            err = FS.nodePermissions(old_dir, "w");
            if (err) {
                throw new FS.ErrnoError(err)
            }
        }
        try {
            if (FS.trackingDelegate["willMovePath"]) {
                FS.trackingDelegate["willMovePath"](old_path, new_path)
            }
        } catch (e) {
            console.log("FS.trackingDelegate['willMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message)
        }
        FS.hashRemoveNode(old_node);
        try {
            old_dir.node_ops.rename(old_node, new_dir, new_name)
        } catch (e) {
            throw e
        } finally {
            FS.hashAddNode(old_node)
        }
        try {
            if (FS.trackingDelegate["onMovePath"]) FS.trackingDelegate["onMovePath"](old_path, new_path)
        } catch (e) {
            console.log("FS.trackingDelegate['onMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message)
        }
    }),
    rmdir: (function (path) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
            throw new FS.ErrnoError(err)
        }
        if (!parent.node_ops.rmdir) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY)
        }
        try {
            if (FS.trackingDelegate["willDeletePath"]) {
                FS.trackingDelegate["willDeletePath"](path)
            }
        } catch (e) {
            console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message)
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
            if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path)
        } catch (e) {
            console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message)
        }
    }),
    readdir: (function (path) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR)
        }
        return node.node_ops.readdir(node)
    }),
    unlink: (function (path) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
            if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
            throw new FS.ErrnoError(err)
        }
        if (!parent.node_ops.unlink) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY)
        }
        try {
            if (FS.trackingDelegate["willDeletePath"]) {
                FS.trackingDelegate["willDeletePath"](path)
            }
        } catch (e) {
            console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message)
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
            if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path)
        } catch (e) {
            console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message)
        }
    }),
    readlink: (function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT)
        }
        if (!link.node_ops.readlink) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        return PATH.resolve(FS.getPath(link.parent), link.node_ops.readlink(link))
    }),
    stat: (function (path, dontFollow) {
        var lookup = FS.lookupPath(path, {
            follow: !dontFollow
        });
        var node = lookup.node;
        if (!node) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT)
        }
        if (!node.node_ops.getattr) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        return node.node_ops.getattr(node)
    }),
    lstat: (function (path) {
        return FS.stat(path, true)
    }),
    chmod: (function (path, mode, dontFollow) {
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, {
                follow: !dontFollow
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        node.node_ops.setattr(node, {
            mode: mode & 4095 | node.mode & ~4095,
            timestamp: Date.now()
        })
    }),
    lchmod: (function (path, mode) {
        FS.chmod(path, mode, true)
    }),
    fchmod: (function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(ERRNO_CODES.EBADF)
        }
        FS.chmod(stream.node, mode)
    }),
    chown: (function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, {
                follow: !dontFollow
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        node.node_ops.setattr(node, {
            timestamp: Date.now()
        })
    }),
    lchown: (function (path, uid, gid) {
        FS.chown(path, uid, gid, true)
    }),
    fchown: (function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(ERRNO_CODES.EBADF)
        }
        FS.chown(stream.node, uid, gid)
    }),
    truncate: (function (path, len) {
        if (len < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, {
                follow: true
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        if (FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EISDIR)
        }
        if (!FS.isFile(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        var err = FS.nodePermissions(node, "w");
        if (err) {
            throw new FS.ErrnoError(err)
        }
        node.node_ops.setattr(node, {
            size: len,
            timestamp: Date.now()
        })
    }),
    ftruncate: (function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(ERRNO_CODES.EBADF)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        FS.truncate(stream.node, len)
    }),
    utime: (function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        var node = lookup.node;
        node.node_ops.setattr(node, {
            timestamp: Math.max(atime, mtime)
        })
    }),
    open: (function (path, flags, mode, fd_start, fd_end) {
        if (path === "") {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT)
        }
        flags = typeof flags === "string" ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === "undefined" ? 438 : mode;
        if (flags & 64) {
            mode = mode & 4095 | 32768
        } else {
            mode = 0
        }
        var node;
        if (typeof path === "object") {
            node = path
        } else {
            path = PATH.normalize(path);
            try {
                var lookup = FS.lookupPath(path, {
                    follow: !(flags & 131072)
                });
                node = lookup.node
            } catch (e) {}
        }
        var created = false;
        if (flags & 64) {
            if (node) {
                if (flags & 128) {
                    throw new FS.ErrnoError(ERRNO_CODES.EEXIST)
                }
            } else {
                node = FS.mknod(path, mode, 0);
                created = true
            }
        }
        if (!node) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT)
        }
        if (FS.isChrdev(node.mode)) {
            flags &= ~512
        }
        if (flags & 65536 && !FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR)
        }
        if (!created) {
            var err = FS.mayOpen(node, flags);
            if (err) {
                throw new FS.ErrnoError(err)
            }
        }
        if (flags & 512) {
            FS.truncate(node, 0)
        }
        flags &= ~(128 | 512);
        var stream = FS.createStream({
            node: node,
            path: FS.getPath(node),
            flags: flags,
            seekable: true,
            position: 0,
            stream_ops: node.stream_ops,
            ungotten: [],
            error: false
        }, fd_start, fd_end);
        if (stream.stream_ops.open) {
            stream.stream_ops.open(stream)
        }
        if (Module["logReadFiles"] && !(flags & 1)) {
            if (!FS.readFiles) FS.readFiles = {};
            if (!(path in FS.readFiles)) {
                FS.readFiles[path] = 1;
                Module["printErr"]("read file: " + path)
            }
        }
        try {
            if (FS.trackingDelegate["onOpenFile"]) {
                var trackingFlags = 0;
                if ((flags & 2097155) !== 1) {
                    trackingFlags |= FS.tracking.openFlags.READ
                }
                if ((flags & 2097155) !== 0) {
                    trackingFlags |= FS.tracking.openFlags.WRITE
                }
                FS.trackingDelegate["onOpenFile"](path, trackingFlags)
            }
        } catch (e) {
            console.log("FS.trackingDelegate['onOpenFile']('" + path + "', flags) threw an exception: " + e.message)
        }
        return stream
    }),
    close: (function (stream) {
        if (stream.getdents) stream.getdents = null;
        try {
            if (stream.stream_ops.close) {
                stream.stream_ops.close(stream)
            }
        } catch (e) {
            throw e
        } finally {
            FS.closeStream(stream.fd)
        }
    }),
    llseek: (function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
            throw new FS.ErrnoError(ERRNO_CODES.ESPIPE)
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position
    }),
    read: (function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(ERRNO_CODES.EBADF)
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EISDIR)
        }
        if (!stream.stream_ops.read) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        var seeking = true;
        if (typeof position === "undefined") {
            position = stream.position;
            seeking = false
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(ERRNO_CODES.ESPIPE)
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead
    }),
    write: (function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EBADF)
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EISDIR)
        }
        if (!stream.stream_ops.write) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        if (stream.flags & 1024) {
            FS.llseek(stream, 0, 2)
        }
        var seeking = true;
        if (typeof position === "undefined") {
            position = stream.position;
            seeking = false
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(ERRNO_CODES.ESPIPE)
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        try {
            if (stream.path && FS.trackingDelegate["onWriteToFile"]) FS.trackingDelegate["onWriteToFile"](stream.path)
        } catch (e) {
            console.log("FS.trackingDelegate['onWriteToFile']('" + path + "') threw an exception: " + e.message)
        }
        return bytesWritten
    }),
    allocate: (function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EBADF)
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV)
        }
        if (!stream.stream_ops.allocate) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP)
        }
        stream.stream_ops.allocate(stream, offset, length)
    }),
    mmap: (function (stream, buffer, offset, length, position, prot, flags) {
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(ERRNO_CODES.EACCES)
        }
        if (!stream.stream_ops.mmap) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV)
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags)
    }),
    msync: (function (stream, buffer, offset, length, mmapFlags) {
        if (!stream || !stream.stream_ops.msync) {
            return 0
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags)
    }),
    munmap: (function (stream) {
        return 0
    }),
    ioctl: (function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTTY)
        }
        return stream.stream_ops.ioctl(stream, cmd, arg)
    }),
    readFile: (function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || "r";
        opts.encoding = opts.encoding || "binary";
        if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
            throw new Error('Invalid encoding type "' + opts.encoding + '"')
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === "utf8") {
            ret = UTF8ArrayToString(buf, 0)
        } else if (opts.encoding === "binary") {
            ret = buf
        }
        FS.close(stream);
        return ret
    }),
    writeFile: (function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || "w";
        opts.encoding = opts.encoding || "utf8";
        if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
            throw new Error('Invalid encoding type "' + opts.encoding + '"')
        }
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === "utf8") {
            var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
            var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
            FS.write(stream, buf, 0, actualNumBytes, 0, opts.canOwn)
        } else if (opts.encoding === "binary") {
            FS.write(stream, data, 0, data.length, 0, opts.canOwn)
        }
        FS.close(stream)
    }),
    cwd: (function () {
        return FS.currentPath
    }),
    chdir: (function (path) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        if (!FS.isDir(lookup.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR)
        }
        var err = FS.nodePermissions(lookup.node, "x");
        if (err) {
            throw new FS.ErrnoError(err)
        }
        FS.currentPath = lookup.path
    }),
    createDefaultDirectories: (function () {
        FS.mkdir("/tmp");
        FS.mkdir("/home");
        FS.mkdir("/home/web_user")
    }),
    createDefaultDevices: (function () {
        FS.mkdir("/dev");
        FS.registerDevice(FS.makedev(1, 3), {
            read: (function () {
                return 0
            }),
            write: (function (stream, buffer, offset, length, pos) {
                return length
            })
        });
        FS.mkdev("/dev/null", FS.makedev(1, 3));
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev("/dev/tty", FS.makedev(5, 0));
        FS.mkdev("/dev/tty1", FS.makedev(6, 0));
        var random_device;
        if (typeof crypto !== "undefined") {
            var randomBuffer = new Uint8Array(1);
            random_device = (function () {
                crypto.getRandomValues(randomBuffer);
                return randomBuffer[0]
            })
        } else if (ENVIRONMENT_IS_NODE) {
            random_device = (function () {
                return require("crypto").randomBytes(1)[0]
            })
        } else {
            random_device = (function () {
                return Math.random() * 256 | 0
            })
        }
        FS.createDevice("/dev", "random", random_device);
        FS.createDevice("/dev", "urandom", random_device);
        FS.mkdir("/dev/shm");
        FS.mkdir("/dev/shm/tmp")
    }),
    createSpecialDirectories: (function () {
        FS.mkdir("/proc");
        FS.mkdir("/proc/self");
        FS.mkdir("/proc/self/fd");
        FS.mount({
            mount: (function () {
                var node = FS.createNode("/proc/self", "fd", 16384 | 511, 73);
                node.node_ops = {
                    lookup: (function (parent, name) {
                        var fd = +name;
                        var stream = FS.getStream(fd);
                        if (!stream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
                        var ret = {
                            parent: null,
                            mount: {
                                mountpoint: "fake"
                            },
                            node_ops: {
                                readlink: (function () {
                                    return stream.path
                                })
                            }
                        };
                        ret.parent = ret;
                        return ret
                    })
                };
                return node
            })
        }, {}, "/proc/self/fd")
    }),
    createStandardStreams: (function () {
        if (Module["stdin"]) {
            FS.createDevice("/dev", "stdin", Module["stdin"])
        } else {
            FS.symlink("/dev/tty", "/dev/stdin")
        }
        if (Module["stdout"]) {
            FS.createDevice("/dev", "stdout", null, Module["stdout"])
        } else {
            FS.symlink("/dev/tty", "/dev/stdout")
        }
        if (Module["stderr"]) {
            FS.createDevice("/dev", "stderr", null, Module["stderr"])
        } else {
            FS.symlink("/dev/tty1", "/dev/stderr")
        }
        var stdin = FS.open("/dev/stdin", "r");
        assert(stdin.fd === 0, "invalid handle for stdin (" + stdin.fd + ")");
        var stdout = FS.open("/dev/stdout", "w");
        assert(stdout.fd === 1, "invalid handle for stdout (" + stdout.fd + ")");
        var stderr = FS.open("/dev/stderr", "w");
        assert(stderr.fd === 2, "invalid handle for stderr (" + stderr.fd + ")")
    }),
    ensureErrnoError: (function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno, node) {
            this.node = node;
            this.setErrno = (function (errno) {
                this.errno = errno;
                for (var key in ERRNO_CODES) {
                    if (ERRNO_CODES[key] === errno) {
                        this.code = key;
                        break
                    }
                }
            });
            this.setErrno(errno);
            this.message = ERRNO_MESSAGES[errno]
        };
        FS.ErrnoError.prototype = new Error;
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        [ERRNO_CODES.ENOENT].forEach((function (code) {
            FS.genericErrors[code] = new FS.ErrnoError(code);
            FS.genericErrors[code].stack = "<generic error, no stack>"
        }))
    }),
    staticInit: (function () {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.mount(MEMFS, {}, "/");
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
        FS.filesystems = {
            "MEMFS": MEMFS,
            "IDBFS": IDBFS,
            "NODEFS": NODEFS,
            "WORKERFS": WORKERFS
        }
    }),
    init: (function (input, output, error) {
        assert(!FS.init.initialized, "FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)");
        FS.init.initialized = true;
        FS.ensureErrnoError();
        Module["stdin"] = input || Module["stdin"];
        Module["stdout"] = output || Module["stdout"];
        Module["stderr"] = error || Module["stderr"];
        FS.createStandardStreams()
    }),
    quit: (function () {
        FS.init.initialized = false;
        var fflush = Module["_fflush"];
        if (fflush) fflush(0);
        for (var i = 0; i < FS.streams.length; i++) {
            var stream = FS.streams[i];
            if (!stream) {
                continue
            }
            FS.close(stream)
        }
    }),
    getMode: (function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode
    }),
    joinPath: (function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == "/") path = path.substr(1);
        return path
    }),
    absolutePath: (function (relative, base) {
        return PATH.resolve(base, relative)
    }),
    standardizePath: (function (path) {
        return PATH.normalize(path)
    }),
    findObject: (function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
            return ret.object
        } else {
            ___setErrNo(ret.error);
            return null
        }
    }),
    analyzePath: (function (path, dontResolveLastLink) {
        try {
            var lookup = FS.lookupPath(path, {
                follow: !dontResolveLastLink
            });
            path = lookup.path
        } catch (e) {}
        var ret = {
            isRoot: false,
            exists: false,
            error: 0,
            name: null,
            path: null,
            object: null,
            parentExists: false,
            parentPath: null,
            parentObject: null
        };
        try {
            var lookup = FS.lookupPath(path, {
                parent: true
            });
            ret.parentExists = true;
            ret.parentPath = lookup.path;
            ret.parentObject = lookup.node;
            ret.name = PATH.basename(path);
            lookup = FS.lookupPath(path, {
                follow: !dontResolveLastLink
            });
            ret.exists = true;
            ret.path = lookup.path;
            ret.object = lookup.node;
            ret.name = lookup.node.name;
            ret.isRoot = lookup.path === "/"
        } catch (e) {
            ret.error = e.errno
        }
        return ret
    }),
    createFolder: (function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode)
    }),
    createPath: (function (parent, path, canRead, canWrite) {
        parent = typeof parent === "string" ? parent : FS.getPath(parent);
        var parts = path.split("/").reverse();
        while (parts.length) {
            var part = parts.pop();
            if (!part) continue;
            var current = PATH.join2(parent, part);
            try {
                FS.mkdir(current)
            } catch (e) {}
            parent = current
        }
        return current
    }),
    createFile: (function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode)
    }),
    createDataFile: (function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
            if (typeof data === "string") {
                var arr = new Array(data.length);
                for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
                data = arr
            }
            FS.chmod(node, mode | 146);
            var stream = FS.open(node, "w");
            FS.write(stream, data, 0, data.length, 0, canOwn);
            FS.close(stream);
            FS.chmod(node, mode)
        }
        return node
    }),
    createDevice: (function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        FS.registerDevice(dev, {
            open: (function (stream) {
                stream.seekable = false
            }),
            close: (function (stream) {
                if (output && output.buffer && output.buffer.length) {
                    output(10)
                }
            }),
            read: (function (stream, buffer, offset, length, pos) {
                var bytesRead = 0;
                for (var i = 0; i < length; i++) {
                    var result;
                    try {
                        result = input()
                    } catch (e) {
                        throw new FS.ErrnoError(ERRNO_CODES.EIO)
                    }
                    if (result === undefined && bytesRead === 0) {
                        throw new FS.ErrnoError(ERRNO_CODES.EAGAIN)
                    }
                    if (result === null || result === undefined) break;
                    bytesRead++;
                    buffer[offset + i] = result
                }
                if (bytesRead) {
                    stream.node.timestamp = Date.now()
                }
                return bytesRead
            }),
            write: (function (stream, buffer, offset, length, pos) {
                for (var i = 0; i < length; i++) {
                    try {
                        output(buffer[offset + i])
                    } catch (e) {
                        throw new FS.ErrnoError(ERRNO_CODES.EIO)
                    }
                }
                if (length) {
                    stream.node.timestamp = Date.now()
                }
                return i
            })
        });
        return FS.mkdev(path, mode, dev)
    }),
    createLink: (function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path)
    }),
    forceLoadFile: (function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== "undefined") {
            throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.")
        } else if (Module["read"]) {
            try {
                obj.contents = intArrayFromString(Module["read"](obj.url), true);
                obj.usedBytes = obj.contents.length
            } catch (e) {
                success = false
            }
        } else {
            throw new Error("Cannot load without read() or XMLHttpRequest.")
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success
    }),
    createLazyFile: (function (parent, name, url, canRead, canWrite) {
        function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length - 1 || idx < 0) {
                return undefined
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = idx / this.chunkSize | 0;
            return this.getter(chunkNum)[chunkOffset]
        };
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter
        };
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
            var xhr = new XMLHttpRequest;
            xhr.open("HEAD", url, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
            var chunkSize = 1024 * 1024;
            if (!hasByteServing) chunkSize = datalength;
            var doXHR = (function (from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");
                var xhr = new XMLHttpRequest;
                xhr.open("GET", url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                if (typeof Uint8Array != "undefined") xhr.responseType = "arraybuffer";
                if (xhr.overrideMimeType) {
                    xhr.overrideMimeType("text/plain; charset=x-user-defined")
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                    return new Uint8Array(xhr.response || [])
                } else {
                    return intArrayFromString(xhr.responseText || "", true)
                }
            });
            var lazyArray = this;
            lazyArray.setDataGetter((function (chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum + 1) * chunkSize - 1;
                end = Math.min(end, datalength - 1);
                if (typeof lazyArray.chunks[chunkNum] === "undefined") {
                    lazyArray.chunks[chunkNum] = doXHR(start, end)
                }
                if (typeof lazyArray.chunks[chunkNum] === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum]
            }));
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true
        };
        if (typeof XMLHttpRequest !== "undefined") {
            if (!ENVIRONMENT_IS_WORKER) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
            var lazyArray = new LazyUint8Array;
            Object.defineProperty(lazyArray, "length", {
                get: (function () {
                    if (!this.lengthKnown) {
                        this.cacheLength()
                    }
                    return this._length
                })
            });
            Object.defineProperty(lazyArray, "chunkSize", {
                get: (function () {
                    if (!this.lengthKnown) {
                        this.cacheLength()
                    }
                    return this._chunkSize
                })
            });
            var properties = {
                isDevice: false,
                contents: lazyArray
            }
        } else {
            var properties = {
                isDevice: false,
                url: url
            }
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        if (properties.contents) {
            node.contents = properties.contents
        } else if (properties.url) {
            node.contents = null;
            node.url = properties.url
        }
        Object.defineProperty(node, "usedBytes", {
            get: (function () {
                return this.contents.length
            })
        });
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach((function (key) {
            var fn = node.stream_ops[key];
            stream_ops[key] = function forceLoadLazyFile() {
                if (!FS.forceLoadFile(node)) {
                    throw new FS.ErrnoError(ERRNO_CODES.EIO)
                }
                return fn.apply(null, arguments)
            }
        }));
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
            if (!FS.forceLoadFile(node)) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO)
            }
            var contents = stream.node.contents;
            if (position >= contents.length) return 0;
            var size = Math.min(contents.length - position, length);
            assert(size >= 0);
            if (contents.slice) {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents[position + i]
                }
            } else {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents.get(position + i)
                }
            }
            return size
        };
        node.stream_ops = stream_ops;
        return node
    }),
    createPreloadedFile: (function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
        Browser.init();
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        var dep = getUniqueRunDependency("cp " + fullname);

        function processData(byteArray) {
            function finish(byteArray) {
                if (preFinish) preFinish();
                if (!dontCreateFile) {
                    FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn)
                }
                if (onload) onload();
                removeRunDependency(dep)
            }
            var handled = false;
            Module["preloadPlugins"].forEach((function (plugin) {
                if (handled) return;
                if (plugin["canHandle"](fullname)) {
                    plugin["handle"](byteArray, fullname, finish, (function () {
                        if (onerror) onerror();
                        removeRunDependency(dep)
                    }));
                    handled = true
                }
            }));
            if (!handled) finish(byteArray)
        }
        addRunDependency(dep);
        if (typeof url == "string") {
            Browser.asyncLoad(url, (function (byteArray) {
                processData(byteArray)
            }), onerror)
        } else {
            processData(url)
        }
    }),
    indexedDB: (function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
    }),
    DB_NAME: (function () {
        return "EM_FS_" + window.location.pathname
    }),
    DB_VERSION: 20,
    DB_STORE_NAME: "FILE_DATA",
    saveFilesToDB: (function (paths, onload, onerror) {
        onload = onload || (function () {});
        onerror = onerror || (function () {});
        var indexedDB = FS.indexedDB();
        try {
            var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
        } catch (e) {
            return onerror(e)
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
            console.log("creating db");
            var db = openRequest.result;
            db.createObjectStore(FS.DB_STORE_NAME)
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
            var db = openRequest.result;
            var transaction = db.transaction([FS.DB_STORE_NAME], "readwrite");
            var files = transaction.objectStore(FS.DB_STORE_NAME);
            var ok = 0,
                fail = 0,
                total = paths.length;

            function finish() {
                if (fail == 0) onload();
                else onerror()
            }
            paths.forEach((function (path) {
                var putRequest = files.put(FS.analyzePath(path).object.contents, path);
                putRequest.onsuccess = function putRequest_onsuccess() {
                    ok++;
                    if (ok + fail == total) finish()
                };
                putRequest.onerror = function putRequest_onerror() {
                    fail++;
                    if (ok + fail == total) finish()
                }
            }));
            transaction.onerror = onerror
        };
        openRequest.onerror = onerror
    }),
    loadFilesFromDB: (function (paths, onload, onerror) {
        onload = onload || (function () {});
        onerror = onerror || (function () {});
        var indexedDB = FS.indexedDB();
        try {
            var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
        } catch (e) {
            return onerror(e)
        }
        openRequest.onupgradeneeded = onerror;
        openRequest.onsuccess = function openRequest_onsuccess() {
            var db = openRequest.result;
            try {
                var transaction = db.transaction([FS.DB_STORE_NAME], "readonly")
            } catch (e) {
                onerror(e);
                return
            }
            var files = transaction.objectStore(FS.DB_STORE_NAME);
            var ok = 0,
                fail = 0,
                total = paths.length;

            function finish() {
                if (fail == 0) onload();
                else onerror()
            }
            paths.forEach((function (path) {
                var getRequest = files.get(path);
                getRequest.onsuccess = function getRequest_onsuccess() {
                    if (FS.analyzePath(path).exists) {
                        FS.unlink(path)
                    }
                    FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
                    ok++;
                    if (ok + fail == total) finish()
                };
                getRequest.onerror = function getRequest_onerror() {
                    fail++;
                    if (ok + fail == total) finish()
                }
            }));
            transaction.onerror = onerror
        };
        openRequest.onerror = onerror
    })
};
var SYSCALLS = {
    DEFAULT_POLLMASK: 5,
    mappings: {},
    umask: 511,
    calculateAt: (function (dirfd, path) {
        if (path[0] !== "/") {
            var dir;
            if (dirfd === -100) {
                dir = FS.cwd()
            } else {
                var dirstream = FS.getStream(dirfd);
                if (!dirstream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
                dir = dirstream.path
            }
            path = PATH.join2(dir, path)
        }
        return path
    }),
    doStat: (function (func, path, buf) {
        try {
            var stat = func(path)
        } catch (e) {
            if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
                return -ERRNO_CODES.ENOTDIR
            }
            throw e
        }
        HEAP32[buf >> 2] = stat.dev;
        HEAP32[buf + 4 >> 2] = 0;
        HEAP32[buf + 8 >> 2] = stat.ino;
        HEAP32[buf + 12 >> 2] = stat.mode;
        HEAP32[buf + 16 >> 2] = stat.nlink;
        HEAP32[buf + 20 >> 2] = stat.uid;
        HEAP32[buf + 24 >> 2] = stat.gid;
        HEAP32[buf + 28 >> 2] = stat.rdev;
        HEAP32[buf + 32 >> 2] = 0;
        HEAP32[buf + 36 >> 2] = stat.size;
        HEAP32[buf + 40 >> 2] = 4096;
        HEAP32[buf + 44 >> 2] = stat.blocks;
        HEAP32[buf + 48 >> 2] = stat.atime.getTime() / 1e3 | 0;
        HEAP32[buf + 52 >> 2] = 0;
        HEAP32[buf + 56 >> 2] = stat.mtime.getTime() / 1e3 | 0;
        HEAP32[buf + 60 >> 2] = 0;
        HEAP32[buf + 64 >> 2] = stat.ctime.getTime() / 1e3 | 0;
        HEAP32[buf + 68 >> 2] = 0;
        HEAP32[buf + 72 >> 2] = stat.ino;
        return 0
    }),
    doMsync: (function (addr, stream, len, flags) {
        var buffer = new Uint8Array(HEAPU8.subarray(addr, addr + len));
        FS.msync(stream, buffer, 0, len, flags)
    }),
    doMkdir: (function (path, mode) {
        path = PATH.normalize(path);
        if (path[path.length - 1] === "/") path = path.substr(0, path.length - 1);
        FS.mkdir(path, mode, 0);
        return 0
    }),
    doMknod: (function (path, mode, dev) {
        switch (mode & 61440) {
            case 32768:
            case 8192:
            case 24576:
            case 4096:
            case 49152:
                break;
            default:
                return -ERRNO_CODES.EINVAL
        }
        FS.mknod(path, mode, dev);
        return 0
    }),
    doReadlink: (function (path, buf, bufsize) {
        if (bufsize <= 0) return -ERRNO_CODES.EINVAL;
        var ret = FS.readlink(path);
        ret = ret.slice(0, Math.max(0, bufsize));
        writeStringToMemory(ret, buf, true);
        return ret.length
    }),
    doAccess: (function (path, amode) {
        if (amode & ~7) {
            return -ERRNO_CODES.EINVAL
        }
        var node;
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        node = lookup.node;
        var perms = "";
        if (amode & 4) perms += "r";
        if (amode & 2) perms += "w";
        if (amode & 1) perms += "x";
        if (perms && FS.nodePermissions(node, perms)) {
            return -ERRNO_CODES.EACCES
        }
        return 0
    }),
    doDup: (function (path, flags, suggestFD) {
        var suggest = FS.getStream(suggestFD);
        if (suggest) FS.close(suggest);
        return FS.open(path, flags, 0, suggestFD, suggestFD).fd
    }),
    doReadv: (function (stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAP32[iov + i * 8 >> 2];
            var len = HEAP32[iov + (i * 8 + 4) >> 2];
            var curr = FS.read(stream, HEAP8, ptr, len, offset);
            if (curr < 0) return -1;
            ret += curr;
            if (curr < len) break
        }
        return ret
    }),
    doWritev: (function (stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAP32[iov + i * 8 >> 2];
            var len = HEAP32[iov + (i * 8 + 4) >> 2];
            var curr = FS.write(stream, HEAP8, ptr, len, offset);
            if (curr < 0) return -1;
            ret += curr
        }
        return ret
    }),
    varargs: 0,
    get: (function (varargs) {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
        return ret
    }),
    getStr: (function () {
        var ret = Pointer_stringify(SYSCALLS.get());
        return ret
    }),
    getStreamFromFD: (function () {
        var stream = FS.getStream(SYSCALLS.get());
        if (!stream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        return stream
    }),
    getSocketFromFD: (function () {
        var socket = SOCKFS.getSocket(SYSCALLS.get());
        if (!socket) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        return socket
    }),
    getSocketAddress: (function (allowNull) {
        var addrp = SYSCALLS.get(),
            addrlen = SYSCALLS.get();
        if (allowNull && addrp === 0) return null;
        var info = __read_sockaddr(addrp, addrlen);
        if (info.errno) throw new FS.ErrnoError(info.errno);
        info.addr = DNS.lookup_addr(info.addr) || info.addr;
        return info
    }),
    get64: (function () {
        var low = SYSCALLS.get(),
            high = SYSCALLS.get();
        if (low >= 0) assert(high === 0);
        else assert(high === -1);
        return low
    }),
    getZero: (function () {
        assert(SYSCALLS.get() === 0)
    })
};

function ___syscall5(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var pathname = SYSCALLS.getStr(),
            flags = SYSCALLS.get(),
            mode = SYSCALLS.get();
        var stream = FS.open(pathname, flags, mode);
        return stream.fd
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function _emscripten_memcpy_big(dest, src, num) {
    HEAPU8.set(HEAPU8.subarray(src, src + num), dest);
    return dest
}
Module["_memcpy"] = _memcpy;

function ___syscall6(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD();
        FS.close(stream);
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}
var _cos = Math_cos;

function _sbrk(bytes) {
    var self = _sbrk;
    if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP);
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = (function () {
            abort("cannot dynamically allocate, sbrk now has control")
        })
    }
    var ret = DYNAMICTOP;
    if (bytes != 0) {
        var success = self.alloc(bytes);
        if (!success) return -1 >>> 0
    }
    return ret
}
var _BItoD = true;

function ___syscall54(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(),
            op = SYSCALLS.get();
        switch (op) {
            case 21505:
                {
                    if (!stream.tty) return -ERRNO_CODES.ENOTTY;
                    return 0
                };
            case 21506:
                {
                    if (!stream.tty) return -ERRNO_CODES.ENOTTY;
                    return 0
                };
            case 21519:
                {
                    if (!stream.tty) return -ERRNO_CODES.ENOTTY;
                    var argp = SYSCALLS.get();HEAP32[argp >> 2] = 0;
                    return 0
                };
            case 21520:
                {
                    if (!stream.tty) return -ERRNO_CODES.ENOTTY;
                    return -ERRNO_CODES.EINVAL
                };
            case 21531:
                {
                    var argp = SYSCALLS.get();
                    return FS.ioctl(stream, op, argp)
                };
            default:
                abort("bad ioctl syscall " + op)
        }
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}
var _ceilf = Math_ceil;

function __embind_register_memory_view(rawType, dataTypeIndex, name) {
    var typeMapping = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array];
    var TA = typeMapping[dataTypeIndex];

    function decodeMemoryView(handle) {
        handle = handle >> 2;
        var heap = HEAPU32;
        var size = heap[handle];
        var data = heap[handle + 1];
        return new TA(heap["buffer"], data, size)
    }
    name = readLatin1String(name);
    registerType(rawType, {
        name: name,
        "fromWireType": decodeMemoryView,
        "argPackAdvance": 8,
        "readValueFromPointer": decodeMemoryView
    }, {
        ignoreDuplicateRegistrations: true
    })
}

function _time(ptr) {
    var ret = Date.now() / 1e3 | 0;
    if (ptr) {
        HEAP32[ptr >> 2] = ret
    }
    return ret
}

function _pthread_self() {
    return 0
}

function ___syscall140(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(),
            offset_high = SYSCALLS.get(),
            offset_low = SYSCALLS.get(),
            result = SYSCALLS.get(),
            whence = SYSCALLS.get();
        var offset = offset_low;
        assert(offset_high === 0);
        FS.llseek(stream, offset, whence);
        HEAP32[result >> 2] = stream.position;
        if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall146(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(),
            iov = SYSCALLS.get(),
            iovcnt = SYSCALLS.get();
        return SYSCALLS.doWritev(stream, iov, iovcnt)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall221(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(),
            cmd = SYSCALLS.get();
        switch (cmd) {
            case 0:
                {
                    var arg = SYSCALLS.get();
                    if (arg < 0) {
                        return -ERRNO_CODES.EINVAL
                    }
                    var newStream;newStream = FS.open(stream.path, stream.flags, 0, arg);
                    return newStream.fd
                };
            case 1:
            case 2:
                return 0;
            case 3:
                return stream.flags;
            case 4:
                {
                    var arg = SYSCALLS.get();stream.flags |= arg;
                    return 0
                };
            case 12:
            case 12:
                {
                    var arg = SYSCALLS.get();
                    var offset = 0;HEAP16[arg + offset >> 1] = 2;
                    return 0
                };
            case 13:
            case 14:
            case 13:
            case 14:
                return 0;
            case 16:
            case 8:
                return -ERRNO_CODES.EINVAL;
            case 9:
                ___setErrNo(ERRNO_CODES.EINVAL);
                return -1;
            default:
                {
                    return -ERRNO_CODES.EINVAL
                }
        }
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall145(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(),
            iov = SYSCALLS.get(),
            iovcnt = SYSCALLS.get();
        return SYSCALLS.doReadv(stream, iov, iovcnt)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}
var ___dso_handle = allocate(1, "i32*", ALLOC_STATIC);
embind_init_charCodes();
BindingError = Module["BindingError"] = extendError(Error, "BindingError");
InternalError = Module["InternalError"] = extendError(Error, "InternalError");
init_emval();
UnboundTypeError = Module["UnboundTypeError"] = extendError(Error, "UnboundTypeError");
FS.staticInit();
__ATINIT__.unshift((function () {
    if (!Module["noFSInit"] && !FS.init.initialized) FS.init()
}));
__ATMAIN__.push((function () {
    FS.ignorePermissions = false
}));
__ATEXIT__.push((function () {
    FS.quit()
}));
Module["FS_createFolder"] = FS.createFolder;
Module["FS_createPath"] = FS.createPath;
Module["FS_createDataFile"] = FS.createDataFile;
Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
Module["FS_createLazyFile"] = FS.createLazyFile;
Module["FS_createLink"] = FS.createLink;
Module["FS_createDevice"] = FS.createDevice;
Module["FS_unlink"] = FS.unlink;
__ATINIT__.unshift((function () {
    TTY.init()
}));
__ATEXIT__.push((function () {
    TTY.shutdown()
}));
if (ENVIRONMENT_IS_NODE) {
    var fs = require("fs");
    var NODEJS_PATH = require("path");
    NODEFS.staticInit()
}
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true;
STACK_MAX = STACK_BASE + TOTAL_STACK;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");
var cttz_i8 = allocate([8, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 6, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 7, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 6, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0], "i8", ALLOC_DYNAMIC);

function invoke_iiii(index, a1, a2, a3) {
    try {
        return Module["dynCall_iiii"](index, a1, a2, a3)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        asm["setThrew"](1, 0)
    }
}

function invoke_viiiii(index, a1, a2, a3, a4, a5) {
    try {
        Module["dynCall_viiiii"](index, a1, a2, a3, a4, a5)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        asm["setThrew"](1, 0)
    }
}

function invoke_dii(index, a1, a2) {
    try {
        return Module["dynCall_dii"](index, a1, a2)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        asm["setThrew"](1, 0)
    }
}

function invoke_vid(index, a1, a2) {
    try {
        Module["dynCall_vid"](index, a1, a2)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        asm["setThrew"](1, 0)
    }
}

function invoke_di(index, a1) {
    try {
        return Module["dynCall_di"](index, a1)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        asm["setThrew"](1, 0)
    }
}

function invoke_i(index) {
    try {
        return Module["dynCall_i"](index)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        asm["setThrew"](1, 0)
    }
}

function invoke_vi(index, a1) {
    try {
        Module["dynCall_vi"](index, a1)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        asm["setThrew"](1, 0)
    }
}

function invoke_vii(index, a1, a2) {
    try {
        Module["dynCall_vii"](index, a1, a2)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        asm["setThrew"](1, 0)
    }
}

function invoke_ii(index, a1) {
    try {
        return Module["dynCall_ii"](index, a1)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        asm["setThrew"](1, 0)
    }
}

function invoke_viii(index, a1, a2, a3) {
    try {
        Module["dynCall_viii"](index, a1, a2, a3)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        asm["setThrew"](1, 0)
    }
}

function invoke_v(index) {
    try {
        Module["dynCall_v"](index)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        asm["setThrew"](1, 0)
    }
}

function invoke_viid(index, a1, a2, a3) {
    try {
        Module["dynCall_viid"](index, a1, a2, a3)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        asm["setThrew"](1, 0)
    }
}

function invoke_iiiii(index, a1, a2, a3, a4) {
    try {
        return Module["dynCall_iiiii"](index, a1, a2, a3, a4)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        asm["setThrew"](1, 0)
    }
}

function invoke_viiiiii(index, a1, a2, a3, a4, a5, a6) {
    try {
        Module["dynCall_viiiiii"](index, a1, a2, a3, a4, a5, a6)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        asm["setThrew"](1, 0)
    }
}

function invoke_iii(index, a1, a2) {
    try {
        return Module["dynCall_iii"](index, a1, a2)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        asm["setThrew"](1, 0)
    }
}

function invoke_viiii(index, a1, a2, a3, a4) {
    try {
        Module["dynCall_viiii"](index, a1, a2, a3, a4)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        asm["setThrew"](1, 0)
    }
}
Module.asmGlobalArg = {
    "Math": Math,
    "Int8Array": Int8Array,
    "Int16Array": Int16Array,
    "Int32Array": Int32Array,
    "Uint8Array": Uint8Array,
    "Uint16Array": Uint16Array,
    "Uint32Array": Uint32Array,
    "Float32Array": Float32Array,
    "Float64Array": Float64Array,
    "NaN": NaN,
    "Infinity": Infinity
};
Module.asmLibraryArg = {
    "abort": abort,
    "assert": assert,
    "invoke_iiii": invoke_iiii,
    "invoke_viiiii": invoke_viiiii,
    "invoke_dii": invoke_dii,
    "invoke_vid": invoke_vid,
    "invoke_di": invoke_di,
    "invoke_i": invoke_i,
    "invoke_vi": invoke_vi,
    "invoke_vii": invoke_vii,
    "invoke_ii": invoke_ii,
    "invoke_viii": invoke_viii,
    "invoke_v": invoke_v,
    "invoke_viid": invoke_viid,
    "invoke_iiiii": invoke_iiiii,
    "invoke_viiiiii": invoke_viiiiii,
    "invoke_iii": invoke_iii,
    "invoke_viiii": invoke_viiii,
    "_fabs": _fabs,
    "___syscall221": ___syscall221,
    "_sin": _sin,
    "floatReadValueFromPointer": floatReadValueFromPointer,
    "simpleReadValueFromPointer": simpleReadValueFromPointer,
    "integerReadValueFromPointer": integerReadValueFromPointer,
    "__embind_register_memory_view": __embind_register_memory_view,
    "throwInternalError": throwInternalError,
    "get_first_emval": get_first_emval,
    "_abort": _abort,
    "count_emval_handles": count_emval_handles,
    "_pthread_cleanup_push": _pthread_cleanup_push,
    "__embind_register_integer": __embind_register_integer,
    "extendError": extendError,
    "___assert_fail": ___assert_fail,
    "init_emval": init_emval,
    "__embind_register_void": __embind_register_void,
    "___cxa_find_matching_catch": ___cxa_find_matching_catch,
    "_ceilf": _ceilf,
    "getShiftFromSize": getShiftFromSize,
    "__embind_register_function": __embind_register_function,
    "embind_init_charCodes": embind_init_charCodes,
    "_emscripten_asm_const_33": _emscripten_asm_const_33,
    "throwBindingError": throwBindingError,
    "___setErrNo": ___setErrNo,
    "__emval_register": __emval_register,
    "_sbrk": _sbrk,
    "readLatin1String": readLatin1String,
    "___cxa_allocate_exception": ___cxa_allocate_exception,
    "_emscripten_memcpy_big": _emscripten_memcpy_big,
    "__embind_register_bool": __embind_register_bool,
    "___resumeException": ___resumeException,
    "__ZSt18uncaught_exceptionv": __ZSt18uncaught_exceptionv,
    "_sysconf": _sysconf,
    "_embind_repr": _embind_repr,
    "__embind_register_std_wstring": __embind_register_std_wstring,
    "createNamedFunction": createNamedFunction,
    "__embind_register_emval": __embind_register_emval,
    "_cos": _cos,
    "throwUnboundTypeError": throwUnboundTypeError,
    "_pthread_self": _pthread_self,
    "craftInvokerFunction": craftInvokerFunction,
    "__emval_decref": __emval_decref,
    "_sqrt": _sqrt,
    "__embind_register_float": __embind_register_float,
    "makeLegalFunctionName": makeLegalFunctionName,
    "___syscall54": ___syscall54,
    "___unlock": ___unlock,
    "heap32VectorToArray": heap32VectorToArray,
    "_pthread_cleanup_pop": _pthread_cleanup_pop,
    "whenDependentTypesAreResolved": whenDependentTypesAreResolved,
    "_exit": _exit,
    "__embind_register_std_string": __embind_register_std_string,
    "new_": new_,
    "___cxa_atexit": ___cxa_atexit,
    "registerType": registerType,
    "___cxa_throw": ___cxa_throw,
    "__exit": __exit,
    "___lock": ___lock,
    "___syscall6": ___syscall6,
    "___syscall5": ___syscall5,
    "ensureOverloadTable": ensureOverloadTable,
    "__embind_register_constant": __embind_register_constant,
    "_time": _time,
    "requireFunction": requireFunction,
    "runDestructors": runDestructors,
    "getTypeName": getTypeName,
    "_atexit": _atexit,
    "___syscall140": ___syscall140,
    "exposePublicSymbol": exposePublicSymbol,
    "_emscripten_asm_const_5": _emscripten_asm_const_5,
    "_emscripten_asm_const_4": _emscripten_asm_const_4,
    "replacePublicSymbol": replacePublicSymbol,
    "___syscall145": ___syscall145,
    "___syscall146": ___syscall146,
    "STACKTOP": STACKTOP,
    "STACK_MAX": STACK_MAX,
    "tempDoublePtr": tempDoublePtr,
    "ABORT": ABORT,
    "cttz_i8": cttz_i8,
    "___dso_handle": ___dso_handle
}; // EMSCRIPTEN_START_ASM
