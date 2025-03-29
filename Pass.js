import {
	OrthographicCamera,
	Mesh,
	BufferGeometry,
	Float32BufferAttribute
} from "three";

class Pass {
	constructor() {
		this.isPass = true;
		this.enabled = true;
		this.needsSwap = true;
		this.clear = false;
		this.renderToScreen = false;
	}
	setSize() {}
	render() {
		console.error("THREE.Pass: .render() must be implemented in derived pass.");
	}
	dispose() {}
}

class FullScreenQuad {
	constructor(material) {
		const geometry = new BufferGeometry();
		geometry.setAttribute(
			"position",
			new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3)
		);
		geometry.setAttribute(
			"uv",
			new Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2)
		);
		this._mesh = new Mesh(geometry, material);
		this._camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
	}
	render(renderer) {
		renderer.render(this._mesh, this._camera);
	}
	dispose() {
		this._mesh.geometry.dispose();
	}
	get material() {
		return this._mesh.material;
	}
	set material(value) {
		this._mesh.material = value;
	}
}

export { Pass, FullScreenQuad };
