import {
	AurumElement,
	Aurum,
	DataSource,
	ArrayDataSource,
	DuplexDataSource,
	aurumElementModelIdentitiy,
	CancellationToken,
	Renderable,
	AurumComponentAPI,
	EventEmitter
} from 'aurumjs';
import { ComponentModel, ComponentType } from './component_model';
import { RectangleComponentModel } from './drawables/aurum_rectangle';
import { TextComponentModel } from './drawables/aurum_text';
import { LineComponentModel } from './drawables/aurum_line';
import { ElipseComponentModel } from './drawables/aurum_elipse';
import { stateSymbol, StateComponentModel } from './drawables/state';
import { PathComponentModel } from './drawables/aurum_path';

export interface AurumnCanvasFeatures {
	mouseWheelZoom?: {
		zoomIncrements: number;
		maxZoom: number;
		minZoom: number;
	},
	panning?: {
		// minX?: number;
		// minY?: number;
		// maxX?: number;
		// maxY?: number;
		mouse: boolean;
		keyboard?: {
			upKeyCode: number;
			rightKeyCode: number;
			leftKeyCode: number;
			downKeyCode: number;
			pixelsPerFrame: number;
		}

	},
}

const renderCache = new WeakMap();
export interface AurumCanvasProps {
	backgroundColor?: DataSource<string> | string;
	onAttach?(canvas: HTMLCanvasElement): void;
	onDetach?(): void;
	class?: DataSource<string> | string;
	style?: DataSource<string> | string;
	width?: DataSource<string> | string;
	height?: DataSource<string> | string;
	translate?: DataSource<{ x: number; y: number }>;
	scale?: DataSource<{ x: number; y: number }>;
	features?: AurumnCanvasFeatures;
}

export function AurumCanvas(props: AurumCanvasProps, children: Renderable[], api: AurumComponentAPI): AurumElement {
	const components = api.prerender(children);
	let pendingRerender;
	const cancellationToken: CancellationToken = new CancellationToken();
	let onMouseMove: EventEmitter<MouseEvent> = new EventEmitter();
	let onMouseUp: EventEmitter<MouseEvent> = new EventEmitter();
	let onMouseDown: EventEmitter<MouseEvent> = new EventEmitter();

	return (
		<canvas
			onAttach={(canvas) => {
				if (props.features) {
					if (!props.scale) {
						props.scale = new DataSource({ x: 1, y: 1 });
					}

					if (!props.translate) {
						props.translate = new DataSource({ x: 0, y: 0 });
					}

					if (props.features.mouseWheelZoom) {
						initializeZoomFeature(props, canvas);
					}
					if (props.features.panning?.mouse) {
						initializeMousePanningFeature(props, canvas);
					}
					if (props.features.panning?.keyboard) {
						initializeKeyboardPanningFeature(props, canvas);
					}
				}

				if (props.width instanceof DataSource) {
					props.width.listen(() => {
						invalidate(canvas);
					}, api.cancellationToken)
				}

				if (props.backgroundColor instanceof DataSource) {
					props.backgroundColor.listen(() => {
						invalidate(canvas);
					}, api.cancellationToken)
				}

				if (props.height instanceof DataSource) {
					props.height.listen(() => {
						invalidate(canvas);
					}, api.cancellationToken)
				}

				bindCanvas(canvas, components as any, cancellationToken);
				render(canvas, components as any);
				if (props.translate) {
					props.translate.listen((v) => {
						invalidate(canvas);
					});
				}
				if (props.translate) {
					props.scale.listen((v) => {
						invalidate(canvas);
					});
				}
				props.onAttach?.(canvas);
			}}
			onDetach={() => {
				cancellationToken.cancel();
				props.onDetach?.();
			}}
			style={props.style}
			class={props.class}
			width={props.width}
			height={props.height}
		></canvas>
	);

	function bindCanvas(canvas: HTMLCanvasElement, components: ComponentModel[], cancellationToken: CancellationToken) {
		cancellationToken.registerDomEvent(canvas, 'mousemove', (e) => {
			onMouseMove.fire(e as MouseEvent);
		});
		cancellationToken.registerDomEvent(canvas, 'mousedown', (e) => {
			onMouseDown.fire(e as MouseEvent);
		});
		cancellationToken.registerDomEvent(canvas, 'mouseup', (e) => {
			onMouseUp.fire(e as MouseEvent);
		});

		bind(canvas, components, components, undefined, cancellationToken);
	}

	function isOnTopOf(e: MouseEvent, target: ComponentModel): boolean {
		if (!target.renderedState) {
			return;
		}
		switch (target.type) {
			case ComponentType.IMAGE:
			case ComponentType.RECTANGLE:
			case ComponentType.TEXT:
				return (
					e.offsetX >= target.renderedState.x &&
					e.offsetY >= target.renderedState.y &&
					e.offsetX <= target.renderedState.x + target.renderedState.width &&
					e.offsetY <= target.renderedState.y + target.renderedState.height
				);
		}
	}

	function bind(
		canvas: HTMLCanvasElement,
		components: ComponentModel[],
		children: ComponentModel[],
		parent: ComponentModel,
		cancellationToken: CancellationToken
	): void {
		for (const child of children) {
			if (child instanceof ArrayDataSource || child instanceof DataSource || child instanceof DuplexDataSource) {
				child.listen(() => {
					invalidate(canvas);
				});
				continue;
			}

			if (child[stateSymbol]) {
				if (!parent) {
					throw new Error('Cannot use <State> nodes at root level');
				}
				parent.animations.push(child as StateComponentModel);
				continue;
			}

			for (const key in child) {
				if (key === 'onMouseUp') {
					onMouseUp.subscribe((e) => {
						if (isOnTopOf(e, child)) {
							child.onMouseUp(e, child);
						}
					});
					continue;
				}
				if (key === 'onMouseDown') {
					onMouseDown.subscribe((e) => {
						if (isOnTopOf(e, child)) {
							child.onMouseDown(e, child);
						}
					});
					continue;
				}

				if (child[key] instanceof DataSource) {
					let value = child[key].value;
					let lastState;
					if (key === 'state') {
						const value = deref(child[key]);
						lastState = value;
						child.animationStates = child.animations.filter((e) => e.id === value);
						child.animationTime = Date.now();
					}

					child[key].listen((newValue) => {
						if (value !== newValue) {
							value = newValue;
							if (key === 'state') {
								if (lastState !== newValue) {
									lastState = newValue;
									child.animationStates = child.animations.filter((e) => e.id === newValue);
									child.animationTime = Date.now();
									invalidate(canvas);
								}
							} else {
								invalidate(canvas);
							}
						}
					}, cancellationToken);
				}
			}
			bind(canvas, components, child.children, child, cancellationToken);
		}
	}

	function invalidate(canvas: HTMLCanvasElement): void {
		if (!pendingRerender) {
			pendingRerender = requestAnimationFrame(() => {
				pendingRerender = undefined;
				if (canvas.isConnected) {
					render(canvas, components as any);
				}
			});
		}
	}

	function render(canvas: HTMLCanvasElement, components: ComponentModel[]): void {

		const context = canvas.getContext('2d');
		if (props.backgroundColor === undefined) {
			context.clearRect(0, 0, canvas.width, canvas.height);
		} else {
			context.fillStyle = deref(props.backgroundColor);
			context.fillRect(0, 0, canvas.width, canvas.height)
		}
		if (props.scale || props.translate) {
			context.save();
			if (props.scale?.value) {
				context.scale(props.scale.value.x, props.scale.value.y);
			}
			if (props.translate?.value) {
				context.translate(props.translate.value.x, props.translate.value.y);
			}
		}
		for (const child of components) {
			renderChild(context, child, 0, 0);
		}
		if (props.scale || props.translate) {
			context.restore();
		}
	}

	function renderChild(context: CanvasRenderingContext2D, child: ComponentModel, offsetX: number, offsetY: number): void {
		if (Array.isArray(child)) {
			for (const item of child) {
				renderChild(context, item, offsetX, offsetY);
			}
			return;
		}

		if (child[stateSymbol]) {
			return;
		}

		if (child[aurumElementModelIdentitiy]) {
			if (!renderCache.has(child)) {
				renderCache.set(child, api.prerender(child as any));
			}
			child = renderCache.get(child);
		}
		if (child instanceof ArrayDataSource) {
			for (const node of child.getData()) {
				renderChild(context, node, offsetY, offsetY);
			}
			return;
		}

		if (child instanceof DataSource || child instanceof DuplexDataSource) {
			renderChild(context, child.value, offsetY, offsetY);
			return;
		}

		context.save();
		let idle: boolean;
		switch (child.type) {
			case ComponentType.PATH:
				idle = renderPath(context, child as PathComponentModel, offsetX, offsetY);
				break;
			case ComponentType.RECTANGLE:
				idle = renderRectangle(context, child as RectangleComponentModel, offsetX, offsetY);
				break;
			case ComponentType.TEXT:
				idle = renderText(context, child as TextComponentModel, offsetX, offsetY);
				break;
			case ComponentType.LINE:
				idle = renderLine(context, child as LineComponentModel, offsetX, offsetY);
				break;
			case ComponentType.ELIPSE:
				idle = renderElipse(context, child as ElipseComponentModel, offsetX, offsetY);
				break;
			case ComponentType.GROUP:
				idle = true;
				break;
		}
		if (!idle) {
			invalidate(context.canvas);
		}

		for (const subChild of child.children) {
			renderChild(context, subChild, deref(child.x) + offsetX, deref(child.y) + offsetY);
		}
		context.restore();
	}
}

function initializeKeyboardPanningFeature(props: AurumCanvasProps, canvas: HTMLCanvasElement): void {
	let moveToken: CancellationToken;
	const keyDown = new Set();
	const moveVector = {
		x: 0,
		y: 0
	};

	window.addEventListener('keyup', e => {
		if (e.keyCode === props.features.panning.keyboard.leftKeyCode || e.keyCode === props.features.panning.keyboard.rightKeyCode) {
			moveVector.x = 0;
			keyDown.delete(e.keyCode);
		}

		if (e.keyCode === props.features.panning.keyboard.upKeyCode || e.keyCode === props.features.panning.keyboard.downKeyCode) {
			moveVector.y = 0;
			keyDown.delete(e.keyCode);
		}

		if (moveToken && keyDown.size === 0) {
			moveToken.cancel();
			moveToken = undefined;
		}
	});

	window.addEventListener('keydown', e => {
		if (e.keyCode === props.features.panning.keyboard.leftKeyCode) {
			moveVector.x = -props.features.panning.keyboard.pixelsPerFrame;
			keyDown.add(e.keyCode);
		}

		if (e.keyCode === props.features.panning.keyboard.downKeyCode) {
			moveVector.y = props.features.panning.keyboard.pixelsPerFrame;
			keyDown.add(e.keyCode);
		}

		if (e.keyCode === props.features.panning.keyboard.rightKeyCode) {
			moveVector.x = props.features.panning.keyboard.pixelsPerFrame;
			keyDown.add(e.keyCode);
		}

		if (e.keyCode === props.features.panning.keyboard.upKeyCode) {
			moveVector.y = -props.features.panning.keyboard.pixelsPerFrame;
			keyDown.add(e.keyCode);
		}

		if (!moveToken && keyDown.size > 0) {
			moveToken = new CancellationToken();
			moveToken.animationLoop(() => {
				props.translate.update({
					x: props.translate.value.x + moveVector.x / props.scale.value.x,
					y: props.translate.value.y + moveVector.y / props.scale.value.x
				});
			});
		}
	});

}

function initializeMousePanningFeature(props: AurumCanvasProps, canvas: HTMLCanvasElement): void {
	let downX: number;
	let downY: number;
	let beforeX: number;
	let beforeY: number;
	let down: boolean = false;

	canvas.addEventListener('mousedown', e => {
		downX = e.clientX;
		downY = e.clientY;
		beforeX = props.translate.value.x;
		beforeY = props.translate.value.y;
		down = true;
	});

	document.addEventListener('mousemove', e => {
		if (down) {
			props.translate.update({
				x: beforeX - (downX - e.clientX) / props.scale.value.x,
				y: beforeY - (downY - e.clientY) / props.scale.value.y
			});
		}
	});

	document.addEventListener('mouseup', e => {
		down = false;
	});
}

function initializeZoomFeature(props: AurumCanvasProps, canvas: HTMLCanvasElement): void {
	canvas.addEventListener('wheel', e => {
		if (e.deltaY > 0) {
			if (props.scale.value.x < props.features.mouseWheelZoom.minZoom) {
				return;
			}

			props.translate.update({
				x: props.translate.value.x + (e.clientX * (props.features.mouseWheelZoom.zoomIncrements - 1)) / props.scale.value.x,
				y: props.translate.value.y + (e.clientY * (props.features.mouseWheelZoom.zoomIncrements - 1)) / props.scale.value.y
			});
			props.scale.update({
				x: props.scale.value.x / props.features.mouseWheelZoom.zoomIncrements,
				y: props.scale.value.y / props.features.mouseWheelZoom.zoomIncrements
			});
		} else {
			if (props.scale.value.x > props.features.mouseWheelZoom.maxZoom) {
				return;
			}

			props.scale.update({
				x: props.scale.value.x * props.features.mouseWheelZoom.zoomIncrements,
				y: props.scale.value.y * props.features.mouseWheelZoom.zoomIncrements
			});
			props.translate.update({
				x: props.translate.value.x - (e.clientX * (props.features.mouseWheelZoom.zoomIncrements - 1)) / props.scale.value.x,
				y: props.translate.value.y - (e.clientY * (props.features.mouseWheelZoom.zoomIncrements - 1)) / props.scale.value.y
			});
		}
	});
}

function renderElipse(context: CanvasRenderingContext2D, child: ElipseComponentModel, offsetX: number, offsetY: number): boolean {
	const renderedState = resolveValues(
		child,
		['x', 'y', 'opacity', 'strokeColor', 'fillColor', 'rotation', 'rx', 'ry', 'startAngle', 'endAngle'],
		offsetX,
		offsetY
	);
	const { x, y, idle, fillColor, strokeColor, opacity, rx, ry, rotation, startAngle, endAngle } = renderedState;
	child.renderedState = renderedState;

	context.globalAlpha = opacity;

	if (fillColor || strokeColor) {
		context.beginPath();
		context.ellipse(x, y, rx, ry, rotation, startAngle ?? 0, endAngle ?? Math.PI * 2);
	}

	if (fillColor) {
		context.fillStyle = fillColor;
		context.fill();
	}
	if (child.strokeColor) {
		context.strokeStyle = strokeColor;
		context.stroke();
	}

	if (child.clip) {
		context.clip();
	}

	return idle;
}

function renderLine(context: CanvasRenderingContext2D, child: LineComponentModel, offsetX: number, offsetY: number): boolean {
	const renderedState = resolveValues(child, ['x', 'y', 'opacity', 'strokeColor', 'fillColor', 'tx', 'ty', 'lineWidth'], offsetX, offsetY);
	const { x, y, idle, fillColor, strokeColor, opacity, tx, ty, lineWidth } = renderedState;
	child.renderedState = renderedState;

	context.globalAlpha = opacity;
	if (fillColor || strokeColor) {
		context.beginPath();
		context.moveTo(x, y);
		context.lineTo(tx, ty);
		context.lineWidth = lineWidth;
	}

	if (child.fillColor) {
		context.fillStyle = fillColor;
		context.fill();
	}
	if (child.strokeColor) {
		context.strokeStyle = strokeColor;
		context.stroke();
	}

	if (child.clip) {
		context.clip();
	}

	return idle;
}

function renderPath(context: CanvasRenderingContext2D, child: PathComponentModel, offsetX: number, offsetY: number): boolean {
	const renderedState = resolveValues(child, ['x', 'y', 'opacity', 'strokeColor', 'fillColor', 'path', 'lineWidth'], offsetX, offsetY);
	const { x, y, idle, fillColor, strokeColor, opacity, path, lineWidth } = renderedState;
	child.renderedState = renderedState;

	let path2d: Path2D;
	context.globalAlpha = opacity;
	if (fillColor || strokeColor) {
		context.lineWidth = lineWidth;
		path2d = new Path2D(path);
	}

	if (child.fillColor) {
		context.translate(x, y);
		context.fillStyle = fillColor;
		context.fill(path2d);
		context.translate(-x, -y);
	}
	if (child.strokeColor) {
		context.translate(x, y);
		context.strokeStyle = strokeColor;
		context.stroke(path2d);
		context.translate(-x, -y);
	}

	if (child.clip) {
		context.translate(x, y);
		context.clip(path2d);
		context.translate(-x, -y);
	}

	return idle;
}

function renderText(context: CanvasRenderingContext2D, child: TextComponentModel, offsetX: number, offsetY: number): boolean {
	const renderedState = resolveValues(
		child,
		['x', 'y', 'width', 'height', 'font', 'fontSize', 'opacity', 'strokeColor', 'fillColor', 'text', 'fontWeight', 'wrapWidth', 'lineHeight'],
		offsetX,
		offsetY
	);
	const { x, y, idle, fontSize, font, fillColor, strokeColor, opacity, text, fontWeight, wrapWidth, lineHeight } = renderedState;
	renderedState.lines = child.renderedState?.lines;
	child.renderedState = renderedState;

	context.globalAlpha = opacity;
	context.font = `${fontWeight ? fontWeight + ' ' : ''}${fontSize}px ${font ?? 'Arial'}`;

	child.renderedState.lines = child.renderedState.lines ?? [];
	let lines = child.renderedState.lines;
	if (lines.length === 0) {
		if (wrapWidth) {
			const pieces: string[] = text.split(' ');
			let line = pieces.shift();
			while (pieces.length) {
				if (context.measureText(line + ' ' + pieces[0]).width <= wrapWidth) {
					line += ' ' + pieces.shift();
				} else {
					lines.push(line);
					line = pieces.shift();
				}
			}
			lines.push(line);
		} else {
			lines.push(text);
		}
	}

	for (let i = 0; i < lines.length; i++) {
		if (fillColor) {
			context.fillStyle = fillColor;
			context.fillText(lines[i], x, y + (lineHeight ?? 16) * i);
		}
		if (strokeColor) {
			context.strokeStyle = strokeColor;
			context.strokeText(lines[i], x, y + (lineHeight ?? 16) * i);
		}
	}

	return idle;
}

function renderRectangle(context: CanvasRenderingContext2D, child: RectangleComponentModel, offsetX: number, offsetY: number): boolean {
	const renderedState = resolveValues(child, ['x', 'y', 'width', 'height', 'opacity', 'strokeColor', 'fillColor'], offsetX, offsetY);
	const { x, y, width, height, idle, fillColor, strokeColor, opacity } = renderedState;
	child.renderedState = renderedState;

	context.globalAlpha = opacity;

	if (fillColor) {
		context.fillStyle = fillColor;
		context.fillRect(x, y, width, height);
	}
	if (strokeColor) {
		context.strokeStyle = strokeColor;
		context.strokeRect(x, y, width, height);
	}

	if (child.clip) {
		context.beginPath();
		context.rect(x, y, width, height);
		context.clip();
	}

	return idle;
}

function resolveValues(node: ComponentModel, props: string[], offsetX: number, offsetY: number): any {
	const result = {
		idle: true,
		x: 0,
		y: 0
	};
	let idle = true;

	for (const key of props) {
		const baseValue = deref(node[key]);
		const state = node.animationStates?.find((n) => n[key] != undefined);
		if (state) {
			let progress;
			if (!state.transitionTime) {
				progress = 1;
			} else {
				progress = Math.min(1, (Date.now() - node.animationTime) / deref(state.transitionTime));
			}
			const targetValue = state[key];
			result[key] = baseValue + (targetValue - baseValue) * progress;
			if (progress < 1) {
				idle = false;
			}
		} else {
			result[key] = baseValue;
		}
	}
	result.x += offsetX;
	result.y += offsetY;
	if ('tx' in result) {
		//@ts-ignore
		result.tx += offsetX;
	}
	if ('ty' in result) {
		//@ts-ignore
		result.ty += offsetY;
	}
	result.idle = idle;
	return result;
}

function deref<T>(source: DataSource<T> | T): T {
	if (source instanceof DataSource) {
		return source.value;
	} else {
		return source;
	}
}
