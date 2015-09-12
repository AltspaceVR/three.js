(function () {
	if (window.altspace) {
		var noop = function () {};

		document.body.style.backgroundColor = 'transparent';
		document.body.appendChild = noop;

		THREE.WebGLRenderer = function () {
			var renderer =  altspace.getThreeJSRenderer({version: '0.2.0'});
			renderer.setSize = noop;
			renderer.setPixelRatio = noop;
			renderer.getMaxAnisotropy = noop;

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
