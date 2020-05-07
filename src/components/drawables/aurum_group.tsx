import { DataSource, prerender } from 'aurumjs';
import { ComponentModel, ComponentType } from '../component_model';
import { InteractionProps } from '../common_props';

export interface AurumGroupProps extends InteractionProps {
	state?: string | DataSource<string>;
	x: number | DataSource<number>;
	y: number | DataSource<number>;
}

export interface GroupComponentModel extends ComponentModel {}

export function AurumGroup(props: AurumGroupProps, children: ChildNode[]): GroupComponentModel {
	const components = children.map(prerender);
	return {
		...props,
		renderedState: undefined,
		children: components as any,
		animations: [],
		type: ComponentType.GROUP
	};
}
