import {
	ShaderMaterial,
	UniformsUtils,
	LinearToneMapping,
	ReinhardToneMapping,
	CineonToneMapping,
	ACESFilmicToneMapping,
	sRGBEncoding
} from "three";
import { Pass, FullScreenQuad } from "./pass.js";
import { OutputShader } from "./OutputShader.js";

class OutputPass extends Pass {

	constructor() {
		super();
		const shader = OutputShader;
		this.uniforms = UniformsUtils.clone(shader.uniforms);
		// Use ShaderMaterial (not RawShaderMaterial) so that includes are processed.
		this.material = new ShaderMaterial({
			name: shader.name,
			uniforms: this.uniforms,
			vertexShader: shader.vertexShader,
			fragmentShader: shader.fragmentShader
		});
		this.fsQuad = new FullScreenQuad(this.material);
		this._toneMapping = null;
	}

	render(renderer, writeBuffer, readBuffer) {
		this.uniforms["tDiffuse"].value = readBuffer.texture;
		this.uniforms["toneMappingExposure"].value = renderer.toneMappingExposure;
		// Rebuild defines based on renderer.toneMapping.
		this.material.defines = {};
		if (renderer.outputEncoding === sRGBEncoding) {
			this.material.defines.SRGB_TRANSFER = "";
		}
		if (renderer.toneMapping === LinearToneMapping) {
			this.material.defines.LINEAR_TONE_MAPPING = "";
		} else if (renderer.toneMapping === ReinhardToneMapping) {
			this.material.defines.REINHARD_TONE_MAPPING = "";
		} else if (renderer.toneMapping === CineonToneMapping) {
			this.material.defines.CINEON_TONE_MAPPING = "";
		} else if (renderer.toneMapping === ACESFilmicToneMapping) {
			this.material.defines.ACES_FILMIC_TONE_MAPPING = "";
		}
		this.material.needsUpdate = true;

		if (this.renderToScreen === true) {
			renderer.setRenderTarget(null);
			this.fsQuad.render(renderer);
		} else {
			renderer.setRenderTarget(writeBuffer);
			if (this.clear)
				renderer.clear(
					renderer.autoClearColor,
					renderer.autoClearDepth,
					renderer.autoClearStencil
				);
			this.fsQuad.render(renderer);
		}
	}

	dispose() {
		this.material.dispose();
		this.fsQuad.dispose();
	}
}

export { OutputPass };
