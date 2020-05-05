import { DataSource, prerender } from 'aurumjs';
import { ComponentModel, ComponentType } from '../component_model';

export interface AurumGroupProps {
	x: number | DataSource<number>;
	y: number | DataSource<number>;
}

export interface GroupComponentModel extends ComponentModel {}

export function AurumGroup(props: AurumGroupProps, children: ChildNode[]): GroupComponentModel {
	const components = children.map(prerender);
	return {
		...props,
		children: components as any,
		type: ComponentType.GROUP
	};
}
