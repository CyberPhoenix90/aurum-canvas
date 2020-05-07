import { DataSource } from 'aurumjs';
import { StateComponentModel } from './drawables/state';
import { InteractionProps } from './common_props';

export interface ComponentModel extends InteractionProps {
	type: ComponentType;
	state?: string | DataSource<string>;
	clip?: boolean | DataSource<boolean>;
	x: number | DataSource<number>;
	y: number | DataSource<number>;
	children: ComponentModel[];
	animationStates?: StateComponentModel[];
	animationTime?: number;
	animations: StateComponentModel[];
	renderedState: RenderData;
}

export interface RenderData {
	x: number;
	y: number;
	width?: number;
	height?: number;
	tx?: number;
	ty?: number;
	strokeColor?: string;
	fillColor?: string;
	rx?: number;
	ry?: number;
	originX?: number;
	originY?: number;
	opacity?: number;
	rotation?: number;
	lineThickness?: number;
	fontSize?: number;
	font?: string;
}

export enum ComponentType {
	RECTANGLE,
	ELIPSE,
	LINE,
	TEXT,
	IMAGE,
	GROUP,
	STATE,
	PATH
}
