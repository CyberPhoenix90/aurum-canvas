import { DataSource, AurumComponentAPI, Renderable, createLifeCycle } from 'aurumjs';
import { ComponentModel, ComponentType } from '../component_model';
import { InteractionProps } from '../common_props';

export interface AurumGroupProps extends InteractionProps {
	state?: string | DataSource<string>;
	x: number | DataSource<number>;
	y: number | DataSource<number>;
}

export interface GroupComponentModel extends ComponentModel {}

export function AurumGroup(props: AurumGroupProps, children: Renderable[], api: AurumComponentAPI): GroupComponentModel {
	const lc = createLifeCycle();
	api.synchronizeLifeCycle(lc);

	const components = api.prerender(children, lc).filter((c) => !!c);
	return {
		...props,
		renderedState: undefined,
		children: components as any,
		animations: [],
		type: ComponentType.GROUP
	};
}
