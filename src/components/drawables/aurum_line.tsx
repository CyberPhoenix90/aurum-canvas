import { AurumComponentAPI, DataSource, Renderable } from 'aurumjs';
import { CommonProps } from '../common_props';
import { ComponentModel, ComponentType } from '../component_model';

export interface AurumLineProps extends CommonProps {
	tx: number | DataSource<number>;
	ty: number | DataSource<number>;
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

export function AurumLine(props: AurumLineProps, children: Renderable[], api: AurumComponentAPI): LineComponentModel {
	const components = api.prerender(children).filter((c) => !!c);
	return {
		...props,
		opacity: props.opacity ?? 1,
		lineWidth: props.lineWidth ?? 1,
		renderedState: undefined,
		children: components as any,
		animations: [],
		type: ComponentType.LINE
	};
}
