import { DataSource, prerender } from 'aurumjs';
import { ComponentModel, ComponentType } from '../component_model';

export interface AurumElipseProps {
	x: number | DataSource<number>;
	y: number | DataSource<number>;
	rx: number | DataSource<number>;
	ry: number | DataSource<number>;
	strokeColor?: string | DataSource<string>;
	fillColor?: string | DataSource<string>;
	opacity?: number | DataSource<number>;
	rotation?: number | DataSource<number>;
	startAngle?: number | DataSource<number>;
	endAngle?: number | DataSource<number>;
}

export interface ElipseComponentModel extends ComponentModel {
	strokeColor?: string | DataSource<string>;
	fillColor?: string | DataSource<string>;
	opacity?: number | DataSource<number>;
	rx: number | DataSource<number>;
	ry: number | DataSource<number>;
	rotation?: number | DataSource<number>;
	startAngle?: number | DataSource<number>;
	endAngle?: number | DataSource<number>;
}

export function AurumElipse(props: AurumElipseProps, children: ChildNode[]): ElipseComponentModel {
	const components = children.map(prerender);
	return {
		...props,
		children: components as any,
		type: ComponentType.ELIPSE
	};
}
