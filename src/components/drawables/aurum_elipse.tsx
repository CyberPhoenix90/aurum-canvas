import { DataSource, Renderable, AurumComponentAPI } from 'aurumjs';
import { ComponentModel, ComponentType } from '../component_model';
import { CommonProps } from '../common_props';

export interface AurumElipseProps extends CommonProps {
	rx: number | DataSource<number>;
	ry: number | DataSource<number>;
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

export function AurumElipse(props: AurumElipseProps, children: Renderable[], api: AurumComponentAPI): ElipseComponentModel {
	const components = api.prerender(children).filter((c) => !!c);
	return {
		...props,
		opacity: props.opacity ?? 1,
		renderedState: undefined,
		children: components as any,
		animations: [],
		type: ComponentType.ELIPSE
	};
}
