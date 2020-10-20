import { RectangleComponentModel } from './drawables/aurum_rectangle';
import { TextComponentModel } from './drawables/aurum_text';
import { LineComponentModel } from './drawables/aurum_line';
import { ElipseComponentModel } from './drawables/aurum_elipse';
import { PathComponentModel } from './drawables/aurum_path';
import { QuadraticCurveComponentModel } from './drawables/aurum_quadratic_curve';
import { BezierCurveComponentModel } from './drawables/aurum_bezier_curve';
import { deref } from './utilities';
import { ComponentModel } from './component_model';
import { CommonProps } from './common_props';

export function renderElipse(context: CanvasRenderingContext2D, child: ElipseComponentModel, offsetX: number, offsetY: number): boolean {
	const renderedState = resolveValues(
		child,
		['x', 'y', 'opacity', 'strokeColor', 'fillColor', 'rotation', 'rx', 'ry', 'startAngle', 'endAngle', 'originX', 'originY'],
		offsetX,
		offsetY
	);
	const { x, y, idle, fillColor, strokeColor, opacity, rx, ry, rotation, startAngle, endAngle } = renderedState;
	child.renderedState = renderedState;

	child.onPreDraw?.(child.renderedState);
	context.globalAlpha = opacity;

	if (fillColor || strokeColor) {
		context.beginPath();
		context.ellipse(x, y, rx, ry, rotation ?? 0, startAngle ?? 0, endAngle ?? Math.PI * 2);
	}

	drawCanvasPath(child, context, fillColor, strokeColor);

	return idle;
}

export function renderLine(context: CanvasRenderingContext2D, child: LineComponentModel, offsetX: number, offsetY: number): boolean {
	const renderedState = resolveValues(
		child,
		['x', 'y', 'opacity', 'strokeColor', 'fillColor', 'tx', 'ty', 'lineWidth', 'originX', 'originY'],
		offsetX,
		offsetY
	);
	const { x, y, idle, fillColor, strokeColor, opacity, tx, ty, lineWidth } = renderedState;
	child.renderedState = renderedState;
	child.onPreDraw?.(child.renderedState);

	context.globalAlpha = opacity;
	if (fillColor || strokeColor) {
		context.beginPath();
		context.moveTo(x, y);
		context.lineTo(tx, ty);
		context.lineWidth = lineWidth;
	}

	drawCanvasPath(child, context, fillColor, strokeColor);

	return idle;
}

export function renderQuadraticCurve(context: CanvasRenderingContext2D, child: QuadraticCurveComponentModel, offsetX: number, offsetY: number): boolean {
	const renderedState = resolveValues(
		child,
		['x', 'y', 'opacity', 'strokeColor', 'fillColor', 'tx', 'ty', 'cx', 'cy', 'lineWidth', 'originX', 'originY'],
		offsetX,
		offsetY
	);
	const { x, y, cx, cy, idle, fillColor, strokeColor, opacity, tx, ty, lineWidth } = renderedState;
	child.renderedState = renderedState;
	child.onPreDraw?.(child.renderedState);

	context.globalAlpha = opacity;
	if (fillColor || strokeColor) {
		context.beginPath();
		context.moveTo(x, y);
		context.quadraticCurveTo(cx, cy, tx, ty);
		context.lineWidth = lineWidth;
	}

	drawCanvasPath(child, context, fillColor, strokeColor);

	return idle;
}

export function renderBezierCurve(context: CanvasRenderingContext2D, child: BezierCurveComponentModel, offsetX: number, offsetY: number): boolean {
	const renderedState = resolveValues(
		child,
		['x', 'y', 'opacity', 'strokeColor', 'fillColor', 'tx', 'ty', 'cx', 'cy', 'c2x', 'c2y', 'lineWidth', 'originX', 'originY'],
		offsetX,
		offsetY
	);
	const { x, y, cx, cy, c2x, c2y, idle, fillColor, strokeColor, opacity, tx, ty, lineWidth } = renderedState;
	child.renderedState = renderedState;
	child.onPreDraw?.(child.renderedState);

	context.globalAlpha = opacity;
	if (fillColor || strokeColor) {
		context.beginPath();
		context.moveTo(x, y);
		context.bezierCurveTo(cx, cy, c2x, c2y, tx, ty);
		context.lineWidth = lineWidth;
	}

	drawCanvasPath(child, context, fillColor, strokeColor);

	return idle;
}

function drawCanvasPath(child: CommonProps, context: CanvasRenderingContext2D, fillColor: any, strokeColor: any) {
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
}

export function renderPath(context: CanvasRenderingContext2D, child: PathComponentModel, offsetX: number, offsetY: number): boolean {
	const renderedState = resolveValues(child, ['x', 'y', 'opacity', 'strokeColor', 'fillColor', 'path', 'lineWidth', 'originX', 'originY'], offsetX, offsetY);
	const { x, y, idle, fillColor, strokeColor, opacity, path, lineWidth } = renderedState;
	child.renderedState = renderedState;
	child.onPreDraw?.(child.renderedState);

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

export function renderText(context: CanvasRenderingContext2D, child: TextComponentModel, offsetX: number, offsetY: number): boolean {
	const renderedState = resolveValues(
		child,
		['x', 'y', 'width', 'font', 'fontSize', 'opacity', 'strokeColor', 'fillColor', 'text', 'fontWeight', 'wrapWidth', 'lineHeight', 'originX', 'originY'],
		offsetX,
		offsetY
	);
	let { x, y, idle, fontSize, font, fillColor, strokeColor, opacity, text, fontWeight, width, wrapWidth, lineHeight, originX } = renderedState;

	if (child.renderedState?.width && !renderedState.width) {
		renderedState.width = child.renderedState.width;
	}

	renderedState.lines = child.renderedState?.lines;
	child.renderedState = renderedState;

	child.renderedState.lines = child.renderedState.lines ?? [];
	let lines = child.renderedState.lines;
	context.font = `${fontWeight ? fontWeight + ' ' : ''}${fontSize}px ${font ?? 'Arial'}`;

	if (lines.length === 0) {
		if (wrapWidth) {
			const pieces: string[] = text.split(' ');
			let line = pieces.shift();
			while (pieces.length) {
				const measuredWidth = context.measureText(line + ' ' + pieces[0]);
				if (measuredWidth <= wrapWidth) {
					line += ' ' + pieces.shift();
				} else {
					lines.push(line);
					line = pieces.shift();
				}
			}
			lines.push(line);
		} else {
			if (!width) {
				child.renderedState.width = context.measureText(text).width;
			}
			lines.push(text);
		}
	}

	child.onPreDraw?.(child.renderedState);
	context.globalAlpha = opacity;

	if (originX) {
		x -= child.renderedState.width * originX;
	}

	for (let i = 0; i < lines.length; i++) {
		if (fillColor) {
			context.fillStyle = fillColor;
			context.fillText(lines[i], x, y + (lineHeight ?? 16) * i, width);
		}
		if (strokeColor) {
			context.strokeStyle = strokeColor;
			context.strokeText(lines[i], x, y + (lineHeight ?? 16) * i, width);
		}
	}

	return idle;
}

export function renderRectangle(context: CanvasRenderingContext2D, child: RectangleComponentModel, offsetX: number, offsetY: number): boolean {
	const renderedState = resolveValues(child, ['x', 'y', 'width', 'height', 'opacity', 'strokeColor', 'fillColor', 'originX', 'originY'], offsetX, offsetY);
	const { x, y, width, height, idle, fillColor, strokeColor, opacity } = renderedState;
	child.renderedState = renderedState;

	child.onPreDraw?.(child.renderedState);
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

export function resolveValues(node: ComponentModel, props: string[], offsetX: number, offsetY: number): any {
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

	//@ts-ignore
	if (result.originX && result.width) {
		//@ts-ignore
		result.x -= result.width * result.originX;
	}

	//@ts-ignore
	if (result.originY && result.height) {
		//@ts-ignore
		result.y -= result.height * result.originY;
	}

	if ('tx' in result) {
		//@ts-ignore
		result.tx += offsetX;
	}
	if ('ty' in result) {
		//@ts-ignore
		result.ty += offsetY;
	}

	if ('cx' in result) {
		//@ts-ignore
		result.cx += offsetX;
	}
	if ('cy' in result) {
		//@ts-ignore
		result.cy += offsetY;
	}

	if ('c2x' in result) {
		//@ts-ignore
		result.c2x += offsetX;
	}
	if ('c2y' in result) {
		//@ts-ignore
		result.c2y += offsetY;
	}
	result.idle = idle;
	return result;
}
