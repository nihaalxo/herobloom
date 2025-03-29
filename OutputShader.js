const OutputShader = {
	name: "OutputShader",
	uniforms: {
		"tDiffuse": { value: null },
		"toneMappingExposure": { value: 1.0 }
	},
	vertexShader: /* glsl */`
		precision highp float;
		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;
		attribute vec3 position;
		attribute vec2 uv;
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
	`,
	fragmentShader: /* glsl */`
		precision highp float;
		uniform sampler2D tDiffuse;
		uniform float toneMappingExposure;
		#include <tonemapping_pars_fragment>
		// Removed: #include <colorspace_pars_fragment>
		varying vec2 vUv;
		void main() {
			vec4 texel = texture2D(tDiffuse, vUv);
			#ifdef LINEAR_TONE_MAPPING
				gl_FragColor.rgb = LinearToneMapping(texel.rgb);
			#elif defined(REINHARD_TONE_MAPPING)
				gl_FragColor.rgb = ReinhardToneMapping(texel.rgb);
			#elif defined(CINEON_TONE_MAPPING)
				gl_FragColor.rgb = CineonToneMapping(texel.rgb);
			#elif defined(ACES_FILMIC_TONE_MAPPING)
				gl_FragColor.rgb = ACESFilmicToneMapping(texel.rgb);
			#else
				gl_FragColor.rgb = texel.rgb;
			#endif
			// Color space conversion removed since colorspace_pars_fragment is not available.
		}`
};

export { OutputShader };
