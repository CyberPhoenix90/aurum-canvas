import { DataSource, prerender } from 'aurumjs';
import { ComponentModel, ComponentType } from '../component_model';

export interface AurumLineProps {
	x: number | DataSource<number>;
	y: number | DataSource<number>;
	tx: number | DataSource<number>;
	ty: number | DataSource<number>;
	strokeColor?: string | DataSource<string>;
	fillColor?: string | DataSource<string>;
	opacity?: number | DataSource<number>;
	lineWidth?: number | DataSource<number>;
}

export interface LineComponentModel extends ComponentModel {
	strokeColor?: string | DataSource<string>;
	fillColor?: string | DataSource<string>;
	opacity?: number | DataSource<number>;
	tx: number | DataSource<number>;
	ty: number | DataSource<number>;
	lineWidth?: number | DataSource<number>;
}

export function AurumLine(props: AurumLineProps, children: ChildNode[]): LineComponentModel {
	const components = children.map(prerender);
	return {
		...props,
		children: components as any,
		type: ComponentType.LINE
	};
}
