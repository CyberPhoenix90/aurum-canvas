import { DataSource, prerender } from 'aurumjs';
import { ComponentModel, ComponentType } from '../component_model';

export interface AurumRectangleProps {
	x: number | DataSource<number>;
	y: number | DataSource<number>;
	strokeColor?: string | DataSource<string>;
	fillColor?: string | DataSource<string>;
	opacity?: number | DataSource<number>;
	width: number | DataSource<number>;
	heigth: number | DataSource<number>;
}

export interface RectangleComponentModel extends ComponentModel {
	strokeColor?: string | DataSource<string>;
	fillColor?: string | DataSource<string>;
	opacity?: number | DataSource<number>;
	width: number | DataSource<number>;
	heigth: number | DataSource<number>;
}

export function AurumRectangle(props: AurumRectangleProps, children: ChildNode[]): RectangleComponentModel {
	const components = children.map(prerender);
	return {
		...props,
		children: components as any,
		type: ComponentType.RECTANGLE
	};
}
