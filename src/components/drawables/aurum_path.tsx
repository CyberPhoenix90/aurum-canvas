import { DataSource, prerender } from 'aurumjs';
import { ComponentModel, ComponentType } from '../component_model';
import { CommonProps } from '../common_props';

export interface AurumPathProps extends CommonProps {
	path: string | DataSource<string>;
	lineWidth?: number | DataSource<number>;
}

export interface PathComponentModel extends ComponentModel {
	strokeColor?: string | DataSource<string>;
	fillColor?: string | DataSource<string>;
	opacity?: number | DataSource<number>;
	path?: string | DataSource<string>;
	lineWidth?: number | DataSource<number>;
}

export function AurumPath(props: AurumPathProps, children: ChildNode[]): PathComponentModel {
	const components = children.map(prerender);
	return {
		...props,
		opacity: props.opacity ?? 1,
		renderedState: undefined,
		children: components as any,
		animations: [],
		type: ComponentType.PATH
	};
}
