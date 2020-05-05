import { AurumElement, ChildNode, Aurum, DataSource, prerender, ArrayDataSource, DuplexDataSource, aurumElementModelIdentitiy } from 'aurumjs';
import { ComponentModel, ComponentType } from './component_model';
import { RectangleComponentModel } from './drawables/aurum_rectangle';
import { TextComponentModel } from './drawables/aurum_text';
import { LineComponentModel } from './drawables/aurum_line';
import { ElipseComponentModel } from './drawables/aurum_elipse';

const renderCache = new WeakMap();
export interface AurumCanvasProps {
	class?: DataSource<string> | string;
	style?: DataSource<string> | string;
	width?: DataSource<string> | string;
	height?: DataSource<string> | string;
}

export function AurumCanvas(props: AurumCanvasProps, children: ChildNode[]): AurumElement {
	const components = children.map(prerender);
	let pendingRerender;

	return (
		<canvas
			onAttach={(canvas) => {
				bind(canvas, components as any, components as any);
				render(canvas, components as any);
			}}
			class={props.class}
			width={props.width}
			height={props.height}
		></canvas>
	);

	function bind(canvas: HTMLCanvasElement, components: ComponentModel[], children: ComponentModel[]): void {
		for (const child of children) {
			if (child instanceof ArrayDataSource || child instanceof DataSource || child instanceof DuplexDataSource) {
				child.listen(() => {
					invalidate(canvas, components);
				});
				return;
			}

			for (const key in child) {
				if (child[key] instanceof DataSource) {
					let value = child[key].value;
					child[key].listen((newValue) => {
						if (value !== newValue) {
							value = newValue;
							invalidate(canvas, components);
						}
					});
				}
			}
			bind(canvas, components, child.children);
		}
	}

	function invalidate(canvas: HTMLCanvasElement, components: ComponentModel[]): void {
		if (!pendingRerender) {
			pendingRerender = requestAnimationFrame(() => {
				pendingRerender = undefined;
				if (canvas.isConnected) {
					render(canvas, components);
				}
			});
		}
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
		renderChild(context, subChild, deref(subChild.x) + offsetX, deref(subChild.y) + offsetY);
	}
}

function renderElipse(context: CanvasRenderingContext2D, child: ElipseComponentModel, offsetX: number, offsetY: number) {
	if (child.fillColor || child.strokeColor) {
		context.beginPath();
		context.ellipse(
			deref(child.x) + offsetX,
			deref(child.y) + offsetY,
			deref(child.rx),
			deref(child.ry),
			deref(child.rotation),
			deref(child.startAngle) ?? 0,
			deref(child.endAngle) ?? Math.PI * 2
		);
	}

	context.globalAlpha = deref(child.opacity) ?? 1;
	if (child.fillColor) {
		context.fillStyle = deref(child.fillColor);
		context.fill();
	}
	if (child.strokeColor) {
		context.strokeStyle = deref(child.strokeColor);
		context.stroke();
	}
}

function renderLine(context: CanvasRenderingContext2D, child: LineComponentModel, offsetX: number, offsetY: number) {
	if (child.fillColor || child.strokeColor) {
		context.beginPath();
		context.moveTo(deref(child.x) + offsetX, deref(child.y) + offsetY);
		context.lineTo(deref(child.tx) + offsetX, deref(child.ty) + offsetY);
		context.lineWidth = deref(child.lineWidth) ?? 1;
	}

	context.globalAlpha = deref(child.opacity) ?? 1;
	if (child.fillColor) {
		context.fillStyle = deref(child.fillColor);
		context.fill();
	}
	if (child.strokeColor) {
		context.strokeStyle = deref(child.strokeColor);
		context.stroke();
	}
}

function renderText(context: CanvasRenderingContext2D, child: TextComponentModel, offsetX: number, offsetY: number) {
	context.globalAlpha = deref(child.opacity) ?? 1;
	if (child.fillColor) {
		context.fillStyle = deref(child.fillColor);
		context.fillText(deref(child.text), deref(child.x) + offsetX, deref(child.y) + offsetY);
	}
	if (child.strokeColor) {
		context.strokeStyle = deref(child.strokeColor);
		context.strokeText(deref(child.text), deref(child.x) + offsetX, deref(child.y) + offsetY);
	}
}

function renderRectangle(context: CanvasRenderingContext2D, child: RectangleComponentModel, offsetX: number, offsetY: number) {
	context.globalAlpha = deref(child.opacity) ?? 1;
	if (child.fillColor) {
		context.fillStyle = deref(child.fillColor);
		context.fillRect(deref(child.x) + offsetX, deref(child.y) + offsetY, deref(child.width), deref(child.heigth));
	}
	if (child.strokeColor) {
		context.strokeStyle = deref(child.strokeColor);
		context.strokeRect(deref(child.x) + offsetX, deref(child.y) + offsetY, deref(child.width), deref(child.heigth));
	}
}

function deref<T>(source: DataSource<T> | T): T {
	if (source instanceof DataSource) {
		return source.value;
	} else {
		return source;
	}
}
