import { DataSource, prerender } from 'aurumjs';
import { ComponentModel, ComponentType } from '../component_model';
import { CommonProps } from '../common_props';

export interface AurumRectangleProps extends CommonProps {
	width: number | DataSource<number>;
	height: number | DataSource<number>;
}

export interface RectangleComponentModel extends ComponentModel {
	strokeColor?: string | DataSource<string>;
	fillColor?: string | DataSource<string>;
	opacity?: number | DataSource<number>;
	width: number | DataSource<number>;
	height: number | DataSource<number>;
}

export function AurumRectangle(props: AurumRectangleProps, children: ChildNode[]): RectangleComponentModel {
	const components = children.map(prerender);
	return {
		...props,
		opacity: props.opacity ?? 1,
		renderedState: undefined,
		children: components as any,
		animations: [],
		type: ComponentType.RECTANGLE
	};
}
