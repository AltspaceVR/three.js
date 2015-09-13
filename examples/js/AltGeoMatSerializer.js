/*
 * AltGeoMatSerializer serializes a Three.js scene into a JSON string.
 *
 * Copyright (c) 2015 AltspaceVR
 */

altspace._internal.AltGeoMatSerializer = function () {
	var getGeometries = function (obj, geometries) {
		if (obj.geometry) {
			geometries[obj.geometry.uuid] = obj.geometry;
		}
		for (var i = 0, l = obj.children.length; i < l; i ++) {
			getGeometries(obj.children[i], geometries);
		}
	};
	var geoNeedsUpdate = function (geo) {
		return (
			geo &&
			(
				geo.verticesNeedUpdate ||
				geo.elementsNeedUpdate ||
				geo.uvsNeedUpdate ||
				geo.normalsNeedUpdate ||
				geo.tangentsNeedUpdate ||
				geo.colorsNeedUpdate ||
				geo.lineDistancesNeedUpdate ||
				geo.groupsNeedUpdate
			)
		);
	};
	var resetGeoFlags = function (geo) {
		if (geo) {
			geo.needsUpdate = false;
			geo.verticesNeedUpdate = false;
			geo.elementsNeedUpdate = false;
			geo.uvsNeedUpdate = false;
			geo.normalsNeedUpdate = false;
			geo.tangentsNeedUpdate = false;
			geo.colorsNeedUpdate = false;
			geo.lineDistancesNeedUpdate = false;
			geo.groupsNeedUpdate = false;
		}
	};
	var serializeGeometries = function (scene, output) {
		if (!output.geometries) { return; }
		var geometries = {};
		getGeometries(scene, geometries);
		for (var j = 0, l = output.geometries.length; j < l; j++) {
			var geometry = geometries[output.geometries[j].uuid];
			// Basic, parameterized geometries do not set a dirty flag,
			// so we work around this by setting one ourselves.
			if (geometry.needsUpdate === undefined) {
				geometry.needsUpdate = true;
			}
			if (
				(geometry.needsUpdate || geoNeedsUpdate(geometry)) &&
				geometry.faces && 
				geometry.faces.length
			) {
				resetGeoFlags(geometry);
				// We clone the geo to work around behavior of the toJSON
				// function that causes it to omit vertices for parameterized
				// geos.
				var geometryClone = geometry.clone();
				output.geometries[j].data =
					THREE.Geometry.prototype.toJSON.call(geometryClone).data;
			}
			else {
				// Don't bother serializing any geo info if it doesn't need an
				// update.
				delete output.geometries[j];
			}
		}
	};

	var getMaterials = function (obj, materials) {
		if (obj.material) {
			materials[obj.material.uuid] = obj.material;
		}
		if (!obj.children) { return; }
		for (var i = 0, l = obj.children.length; i < l; i ++) {
			getMaterials(obj.children[i], materials);
		}
	};
	var getDataUri = function (image) {
		return new Promise(function (resolve) {
			if (image.nodeName === 'CANVAS') {
				resolve(image.toDataURL('image/png'));
				return;
			}
			if (!image.src) {
				resolve();
				return;
			}
			var img = new Image();
			var src = image.src;
			var dummySrc = (
				'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP' +
				'///ywAAAAAAQABAAACAUwAOw==');
			img.crossOrigin = 'Anonymous';
			img.onload = function () {
				if (img.src === dummySrc) { return; }
				var canvas = document.createElement('canvas');
				canvas.width = img.width;
				canvas.height = img.height;
				var context = canvas.getContext('2d');
				context.drawImage(img, 0, 0, img.width, img.height);
				resolve(canvas.toDataURL('image/png'));
			};
			img.src = src;
		});
	};
	var serializeMaterial = function (
		material,
		outMaterial,
		pendingMaterials,
		resolve
	) {
		outMaterial.visible = material.visible;
		if (!material.map || !material.map.needsUpdate) {
			pendingMaterials.pop();
		}
		else if (!material.map.image) {
			outMaterial.loaded = false;
			pendingMaterials.pop();
		}
		else {
			outMaterial.loaded = true;
			getDataUri(material.map.image).then(
				function (dataUri) {
					outMaterial.textureDataUri = dataUri;
					pendingMaterials.pop();
					if (pendingMaterials.length === 0) {
						resolve();
					}
				}
			);
		}
		if (pendingMaterials.length === 0) {
			resolve();
		}
	};
	var serializeMaterials = function (scene, output) {
		if (!output.materials) {
			return Promise.resolve();
		}
		return new Promise(function (resolve) {
			var materials = {};
			var pendingMaterials = [];
			getMaterials(scene, materials);
			for (var j = 0; j < output.materials.length; j++) {
				pendingMaterials.push(j)
				var outMaterial = output.materials[j];
				serializeMaterial(
					materials[outMaterial.uuid],
					outMaterial,
					pendingMaterials,
					resolve
				);
			}
		});
	};

	var getChildByUuid = function (obj, uuid) {
		for (var i = 0, l = obj.children.length; i < l; i ++) {
			var child = obj.children[i];
			if (child.uuid === uuid) {
				return child;
			}
		}
	};

	var stripMatrices = function (obj) {
		if (obj.matrix) {
			delete obj.matrix;
		}
		if (!obj.children) { return; }
		for (var i = 0, l = obj.children.length; i < l; i ++) {
			stripMatrices(obj.children[i]);
		}
	};
	var resetFlags = function (obj) {
		obj.matrixWorldNeedsUpdate = false;
		var isMesh = obj instanceof THREE.Mesh;
		var geo = isMesh && obj.geo;
		resetGeoFlags(geo);
		var mat = isMesh && obj.material;
		if (mat) {
			mat.needsUpdate = false;
		}
		var map = mat && mat.map;
		if (map) {
			map.needsUpdate = false;
		}
		for (var i = 0; i < obj.children.length; i++) {
			resetFlags(obj.children[i]);
		}
	};

	var sceneUuidList = [];

	this.sceneNeedsUpdate = function (scene) {
		var needsUpdate = false;
		var objCounter = 0;
		scene.traverse(function (obj) {
			var objNeedsUpdate = obj.matrixWorldNeedsUpdate;

			var isMesh = obj instanceof THREE.Mesh;
			var geo = isMesh && obj.geo;

			var mat = isMesh && obj.material;
			var matNeedsUpdate = mat && mat.needsUpdate;

			var map = mat && mat.map;
			var mapNeedsUpdate = map && map.needsUpdate;

			var sceneListChanged = sceneUuidList[objCounter] !== obj.uuid;

			if (
				objNeedsUpdate ||
				geoNeedsUpdate(geo) || 
				matNeedsUpdate ||
				mapNeedsUpdate ||
				sceneListChanged
			) {
				needsUpdate = true;
			}

			sceneUuidList[objCounter] = obj.uuid;
			objCounter++;
		});
		return needsUpdate;
	};

	this.serializeScene = function (scene) {
		// TODO-BP: Either diff the scene or avoid exporting the entire
		// thing on each render call.
		var output = scene.toJSON();
		stripMatrices(output.object);
		serializeGeometries(scene, output);
		return new Promise(function (resolve) {
			serializeMaterials(scene, output).then(function () {
				resetFlags(scene);
				resolve(JSON.stringify(output));
			});
		});
	};
};

