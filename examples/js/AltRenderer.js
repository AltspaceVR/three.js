/*
 * AltRenderer renders a Three.js scene in the Altspace web browser.
 *
 * Author: Gavan Wilhite
 * Copyright (c) 2015 AltspaceVR
 */

var GEO_MAT_VERSION = '0.2.0';

altspace._internal.AltRenderer = function ( options ) {
	options = options || {};
	console.log( 'THREE.AltRenderer', THREE.REVISION );

	var serializationFilter;
	var geoMatSerializer;
	if (!options.version || options.version === GEO_MAT_VERSION) {
		options.version = GEO_MAT_VERSION;
		geoMatSerializer = new altspace._internal.AltGeoMatSerializer();
		serializationFilter = function (object3d) {
			return object3d instanceof THREE.Mesh;
		}
	}
	else {
		options.version = '0.1.0';
		serializationFilter = function (object3d) {
			// Objects loaded by AltOBJMTLLoader have a 'src' property.
			return object3d.userData.hasOwnProperty('src');
		}
	}
	console.log("AltRenderer version " + options.version);
	var byteSerializer = new altspace._internal.AltByteSerializer(
		serializationFilter);

	Object.defineProperty(this, "domElement", {
		get : function(){
			console.log("AltRenderer.domElement not implemented");
			return null;
		},
		configurable: true
	});

	function callClientStringFunction(func, str) {
		altspace._internal.callClientFunction(
			func,
			{ String0: str, String1: String(options.version) },
			{ argsType: "JSTypeString" }
		);
	}

	function sendSceneToAltspace(serializedScene){
		callClientStringFunction("RenderThreeJSScene", serializedScene);
	}

	function sendUpdatesToAltspace(sceneUpdates){
		callClientStringFunction("UpdateThreeJSScene", sceneUpdates);
	}

	var initialRender = true;
	this.render = throttle(function ( scene ) {
		altspace._internal.setThreeJSScene(scene);
		scene.updateMatrixWorld();
		if (options.version === GEO_MAT_VERSION) {
			if(geoMatSerializer.sceneNeedsUpdate(scene) || initialRender) {
				initialRender = false;
				geoMatSerializer.serializeScene(scene).then(
					function (serializedScene) {
						sendSceneToAltspace( serializedScene );
					}
				);
			}
		}
		var sceneUpdates = byteSerializer.serializeScene(scene);
		sendUpdatesToAltspace(sceneUpdates);
	}, 33);

	function throttle(func, wait, options) {
		var context, args, result;
		var timeout = null;
		var previous = 0;
		if (!options) options = {};
		var later = function() {
			previous = options.leading === false ? 0 : Date.now();
			timeout = null;
			result = func.apply(context, args);
			if (!timeout) context = args = null;
		};
		return function() {
			var now = Date.now();
			if (!previous && options.leading === false) previous = now;
			var remaining = wait - (now - previous);
			context = this;
			args = arguments;
			if (remaining <= 0 || remaining > wait) {
				if (timeout) {
					clearTimeout(timeout);
					timeout = null;
				}
				previous = now;
				result = func.apply(context, args);
				if (!timeout) context = args = null;
			} else if (!timeout && options.trailing !== false) {
				timeout = setTimeout(later, remaining);
			}
			return result;
		};
	}

};
