(function () {
	if (window.altspace) {
		// Load source scripts dynamically for debugging.
		var DEBUG = true;
		if (DEBUG) {
			var scripts = [
				'../../UnityClient/js/src/AltGeoMatSerializer.js',
				'../../UnityClient/js/src/AltThriftSerializer.js',
				'../../UnityClient/js/src/AltRenderer.js'
			];

			scripts.forEach(function (src) {
				/* jshint -W060 */
				// Use document.write to force blocking so that we can override 
				// the existing scripts.
				document.write('<script src="' + src + '"></script>');
				/* jshint +W060 */
			});
		}

		var noop = function () {};

		document.body.style.backgroundColor = 'transparent';

		var fakeDomElement = document.createElement('span');
		THREE.WebGLRenderer = function () {
			var renderer =  altspace.getThreeJSRenderer({version: '0.2.0'});
			renderer.setSize = noop;
			renderer.setPixelRatio = noop;
			renderer.setClearColor = noop;
			renderer.clear = noop;
			renderer.enableScissorTest = noop;
			renderer.setScissor = noop;
			renderer.setViewport = noop;
			renderer.getPixelRatio = noop;
			renderer.getMaxAnisotropy = noop;
			renderer.setFaceCulling = noop;
			renderer.context = {canvas: {}};
			renderer.shadowMap = {};

			Object.defineProperty(renderer, "domElement", {
				get : function(){
					return fakeDomElement;
				}
			});

			return renderer;
		};

		THREE._Scene = THREE.Scene;
		THREE.Scene = function () {
			var scene =  new THREE._Scene();
			scene.scale.multiplyScalar(0.7);
			scene.position.set(100, 0, 0);

			return scene;
		};
	}
}());
