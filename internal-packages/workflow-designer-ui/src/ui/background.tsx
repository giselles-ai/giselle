"use client";

import { useEffect, useRef } from "react";

// Fixed grid and dot size in pixels
const gridSize = 16;
const dotSize = 2.5;
export function Background() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		const container = containerRef.current;
		if (!canvas || !container) return;

		const gl = canvas.getContext("webgl", { antialias: true });
		if (!gl) return;

		// Enable blending for WebGL
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		// Set canvas size to match container
		const resizeCanvas = () => {
			const { width, height } = container.getBoundingClientRect();

			// Set device pixel ratio for high DPI displays
			const pixelRatio = window.devicePixelRatio || 1;
			canvas.width = width * pixelRatio;
			canvas.height = height * pixelRatio;

			// Set canvas CSS size
			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;

			gl.viewport(0, 0, canvas.width, canvas.height);
			render();
		};

		// Create shaders for dots
		const dotVertexShaderSource = `
      attribute vec2 a_position;
      uniform vec2 u_resolution;
      uniform float u_pixelRatio;
      void main() {
        // Convert from pixel space to clip space (-1 to 1)
        vec2 zeroToOne = a_position / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

        // Keep dot size fixed regardless of resolution
        gl_PointSize = ${dotSize} * u_pixelRatio;
      }
    `;

		const dotFragmentShaderSource = `
      precision mediump float;
      void main() {
        // Create a circle for dots (using distance from center)
        vec2 coord = gl_PointCoord - vec2(0.5);
        if(length(coord) > 0.5) {
          discard;
        }
        gl_FragColor = vec4(1.0, 1.0, 1.0, 0.1);
      }
    `;

		// Create shaders for lines
		const lineVertexShaderSource = `
      attribute vec2 a_position;
      uniform vec2 u_resolution;
      void main() {
        // Convert from pixel space to clip space (-1 to 1)
        vec2 zeroToOne = a_position / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      }
    `;

		const lineFragmentShaderSource = `
      precision mediump float;
      void main() {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 0.1);
      }
    `;

		// Create and compile shaders
		function createShader(
			gl: WebGLRenderingContext,
			type: number,
			source: string,
		) {
			const shader = gl.createShader(type);
			if (!shader) return null;
			gl.shaderSource(shader, source);
			gl.compileShader(shader);
			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				console.error(gl.getShaderInfoLog(shader));
				gl.deleteShader(shader);
				return null;
			}
			return shader;
		}

		// Create programs
		function createProgram(
			vertexShader: WebGLShader,
			fragmentShader: WebGLShader,
		) {
			if (!gl) return null;
			const program = gl.createProgram();
			if (!program) return null;
			gl.attachShader(program, vertexShader);
			gl.attachShader(program, fragmentShader);
			gl.linkProgram(program);
			if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
				console.error(gl.getProgramInfoLog(program));
				return null;
			}
			return program;
		}

		// Create dot program
		const dotVertexShader = createShader(
			gl,
			gl.VERTEX_SHADER,
			dotVertexShaderSource,
		);
		const dotFragmentShader = createShader(
			gl,
			gl.FRAGMENT_SHADER,
			dotFragmentShaderSource,
		);
		if (!dotVertexShader || !dotFragmentShader) return;
		const dotProgram = createProgram(dotVertexShader, dotFragmentShader);
		if (!dotProgram) return;

		// Create line program
		const lineVertexShader = createShader(
			gl,
			gl.VERTEX_SHADER,
			lineVertexShaderSource,
		);
		const lineFragmentShader = createShader(
			gl,
			gl.FRAGMENT_SHADER,
			lineFragmentShaderSource,
		);
		if (!lineVertexShader || !lineFragmentShader) return;
		const lineProgram = createProgram(lineVertexShader, lineFragmentShader);
		if (!lineProgram) return;

		// Get attribute and uniform locations for dots
		const dotPositionAttributeLocation = gl.getAttribLocation(
			dotProgram,
			"a_position",
		);
		const dotResolutionUniformLocation = gl.getUniformLocation(
			dotProgram,
			"u_resolution",
		);
		const dotPixelRatioUniformLocation = gl.getUniformLocation(
			dotProgram,
			"u_pixelRatio",
		);

		// Create buffers
		const dotPositionBuffer = gl.createBuffer();
		const linePositionBuffer = gl.createBuffer();

		function render() {
			if (!gl || !canvas) return;

			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);

			const pixelRatio = window.devicePixelRatio || 1;
			const screenWidth = canvas.width / pixelRatio;
			const screenHeight = canvas.height / pixelRatio;

			// Calculate grid dimensions with fixed cell size
			const horizontalLines = Math.floor(screenHeight / gridSize) + 1;
			const verticalLines = Math.floor(screenWidth / gridSize) + 1;

			// Now draw dots on top
			// biome-ignore lint/correctness/useHookAtTopLevel: This is not a React hook, but a WebGL API https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/useProgram
			gl.useProgram(dotProgram);
			gl.uniform2f(dotResolutionUniformLocation, canvas.width, canvas.height);
			gl.uniform1f(dotPixelRatioUniformLocation, pixelRatio);
			gl.bindBuffer(gl.ARRAY_BUFFER, dotPositionBuffer);
			gl.enableVertexAttribArray(dotPositionAttributeLocation);
			gl.vertexAttribPointer(
				dotPositionAttributeLocation,
				2,
				gl.FLOAT,
				false,
				0,
				0,
			);

			// Generate intersection points
			const dotPoints: number[] = [];
			for (let y = 0; y < horizontalLines; y++) {
				for (let x = 0; x < verticalLines; x++) {
					dotPoints.push(x * gridSize * pixelRatio, y * gridSize * pixelRatio);
				}
			}

			gl.bufferData(
				gl.ARRAY_BUFFER,
				new Float32Array(dotPoints),
				gl.STATIC_DRAW,
			);
			gl.drawArrays(gl.POINTS, 0, dotPoints.length / 2);
		}

		// Initial render and setup resize listener
		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);

		return () => {
			window.removeEventListener("resize", resizeCanvas);
			// Clean up WebGL resources
			gl.deleteProgram(dotProgram);
			gl.deleteProgram(lineProgram);
			gl.deleteShader(dotVertexShader);
			gl.deleteShader(dotFragmentShader);
			gl.deleteShader(lineVertexShader);
			gl.deleteShader(lineFragmentShader);
			gl.deleteBuffer(dotPositionBuffer);
			gl.deleteBuffer(linePositionBuffer);
		};
	}, []);

	return (
		<div className="relative w-full h-full bg-stage" ref={containerRef}>
			<canvas ref={canvasRef} className="absolute inset-0" />
			<div className="absolute w-full h-full bg-(image:--stage-radial-overlay)" />
		</div>
	);
}
