import { AurumComponentAPI, createLifeCycle, DataSource, Renderable } from 'aurumjs';
import { CommonProps } from '../common_props';
import { ComponentModel, ComponentType } from '../component_model';

export interface AurumQuadraticCurveProps extends CommonProps {
	tx: number | DataSource<number>;
	ty: number | DataSource<number>;
	cx: number | DataSource<number>;
	cy: number | DataSource<number>;
	lineWidth?: number | DataSource<number>;
}

export interface QuadraticCurveComponentModel extends ComponentModel {
	strokeColor?: string | DataSource<string>;
	fillColor?: string | DataSource<string>;
	opacity?: number | DataSource<number>;
	cx: number | DataSource<number>;
	cy: number | DataSource<number>;
	tx: number | DataSource<number>;
	ty: number | DataSource<number>;
	lineWidth?: number | DataSource<number>;
}

export function AurumQuadraticCurve(props: AurumQuadraticCurveProps, children: Renderable[], api: AurumComponentAPI): QuadraticCurveComponentModel {
	const lc = createLifeCycle();
	api.synchronizeLifeCycle(lc);

	const components = api.prerender(children, lc).filter((c) => !!c);
	return {
		...props,
		opacity: props.opacity ?? 1,
		lineWidth: props.lineWidth ?? 1,
		renderedState: undefined,
		children: components as any,
		animations: [],
		type: ComponentType.QUADRATIC_CURVE
	};
}
