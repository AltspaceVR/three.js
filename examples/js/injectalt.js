(function () {
	if (window.altspace) {
		var scripts = [
			'https://cdnjs.cloudflare.com/ajax/libs/core-js/1.1.4/core.min.js',
			'js/AltGeoMatSerializer.js',
			'js/AltRenderer.js'
		];

		scripts.forEach(function (src) {
			// Use document.write to force blocking so that we can override 
			// the existing scripts.
			document.write('<script src="' + src + '"></script>');
		});

		var noop = function () {};

		document.body.style.backgroundColor = 'transparent';

		THREE.WebGLRenderer = function () {
			var renderer =  altspace.getThreeJSRenderer({version: '0.2.0'});
			renderer.setSize = noop;
			renderer.setPixelRatio = noop;
			renderer.getMaxAnisotropy = noop;

			Object.defineProperty(renderer, "domElement", {
				get : function(){
					return document.createElement('span');
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
