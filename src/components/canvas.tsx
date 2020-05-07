import {
	AurumElement,
	ChildNode,
	Aurum,
	DataSource,
	prerender,
	ArrayDataSource,
	DuplexDataSource,
	aurumElementModelIdentitiy,
	CancellationToken
} from 'aurumjs';
import { ComponentModel, ComponentType } from './component_model';
import { RectangleComponentModel } from './drawables/aurum_rectangle';
import { TextComponentModel } from './drawables/aurum_text';
import { LineComponentModel } from './drawables/aurum_line';
import { ElipseComponentModel } from './drawables/aurum_elipse';
import { stateSymbol, StateComponentModel } from './drawables/state';
import { EventEmitter } from 'aurumjs/dist/utilities/event_emitter';
import { PathComponentModel } from './drawables/aurum_path';

const renderCache = new WeakMap();
export interface AurumCanvasProps {
	backgroundColor?: DataSource<string> | string;
	class?: DataSource<string> | string;
	style?: DataSource<string> | string;
	width?: DataSource<string> | string;
	height?: DataSource<string> | string;
}

export function AurumCanvas(props: AurumCanvasProps, children: ChildNode[]): AurumElement {
	const components = children.map(prerender);
	let pendingRerender;
	const cancellationToken: CancellationToken = new CancellationToken();
	let onMouseMove: EventEmitter<MouseEvent> = new EventEmitter();
	let onMouseUp: EventEmitter<MouseEvent> = new EventEmitter();
	let onMouseDown: EventEmitter<MouseEvent> = new EventEmitter();

	return (
		<canvas
			onAttach={(canvas) => {
				bindCanvas(canvas, components as any, cancellationToken);
				render(canvas, components as any);
			}}
			onDetach={() => {
				cancellationToken.cancel();
			}}
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
		context.clearRect(0, 0, canvas.width, canvas.height);
		for (const child of components) {
			renderChild(context, child, 0, 0);
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
				renderCache.set(child, prerender(child));
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

		switch (child.type) {
			case ComponentType.PATH:
				renderPath(context, child as PathComponentModel, offsetX, offsetY);
				break;
			case ComponentType.RECTANGLE:
				renderRectangle(context, child as RectangleComponentModel, offsetX, offsetY);
				break;
			case ComponentType.TEXT:
				renderText(context, child as TextComponentModel, offsetX, offsetY);
				break;
			case ComponentType.LINE:
				renderLine(context, child as LineComponentModel, offsetX, offsetY);
				break;
			case ComponentType.ELIPSE:
				renderElipse(context, child as ElipseComponentModel, offsetX, offsetY);
				break;
		}

		for (const subChild of child.children) {
			renderChild(context, subChild, deref(child.x) + offsetX, deref(child.y) + offsetY);
		}

		function renderElipse(context: CanvasRenderingContext2D, child: ElipseComponentModel, offsetX: number, offsetY: number) {
			const renderedState = resolveValues(
				child,
				['x', 'y', 'opacity', 'strokeColor', 'fillColor', 'rotation', 'rx', 'ry', 'startAngle', 'endAngle'],
				offsetX,
				offsetY
			);
			const { x, y, idle, fillColor, strokeColor, opacity, rx, ry, rotation, startAngle, endAngle } = renderedState;
			child.renderedState = renderedState;

			if (!idle) {
				invalidate(context.canvas);
			}

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
		}

		function renderLine(context: CanvasRenderingContext2D, child: LineComponentModel, offsetX: number, offsetY: number) {
			const renderedState = resolveValues(child, ['x', 'y', 'opacity', 'strokeColor', 'fillColor', 'tx', 'ty', 'lineWidth'], offsetX, offsetY);
			const { x, y, idle, fillColor, strokeColor, opacity, tx, ty, lineWidth } = renderedState;
			child.renderedState = renderedState;

			if (!idle) {
				invalidate(context.canvas);
			}

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
		}

		function renderPath(context: CanvasRenderingContext2D, child: PathComponentModel, offsetX: number, offsetY: number) {
			const renderedState = resolveValues(child, ['x', 'y', 'opacity', 'strokeColor', 'fillColor', 'path', 'lineWidth'], offsetX, offsetY);
			const { x, y, idle, fillColor, strokeColor, opacity, path, lineWidth } = renderedState;
			child.renderedState = renderedState;

			if (!idle) {
				invalidate(context.canvas);
			}

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
		}

		function renderText(context: CanvasRenderingContext2D, child: TextComponentModel, offsetX: number, offsetY: number) {
			const renderedState = resolveValues(
				child,
				['x', 'y', 'width', 'height', 'font', 'fontSize', 'opacity', 'strokeColor', 'fillColor', 'text'],
				offsetX,
				offsetY
			);
			const { x, y, idle, fontSize, font, fillColor, strokeColor, opacity, text } = renderedState;
			child.renderedState = renderedState;

			if (!idle) {
				invalidate(context.canvas);
			}

			context.globalAlpha = opacity;
			context.font = `${fontSize}px ${font ?? 'Arial'}`;
			if (fillColor) {
				context.fillStyle = fillColor;
				context.fillText(text, x, y);
			}
			if (strokeColor) {
				context.strokeStyle = strokeColor;
				context.strokeText(text, x, y);
			}
		}

		function renderRectangle(context: CanvasRenderingContext2D, child: RectangleComponentModel, offsetX: number, offsetY: number) {
			const renderedState = resolveValues(child, ['x', 'y', 'width', 'height', 'opacity', 'strokeColor', 'fillColor'], offsetX, offsetY);
			const { x, y, width, height, idle, fillColor, strokeColor, opacity } = renderedState;
			child.renderedState = renderedState;

			if (!idle) {
				invalidate(context.canvas);
			}

			context.globalAlpha = opacity;

			if (fillColor) {
				context.fillStyle = fillColor;
				context.fillRect(x, y, width, height);
			}
			if (strokeColor) {
				context.strokeStyle = strokeColor;
				context.strokeRect(x, y, width, height);
			}
		}
	}
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
