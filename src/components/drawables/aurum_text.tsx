import { DataSource, prerender, ReadOnlyDataSource } from 'aurumjs';
import { ComponentModel, ComponentType } from '../component_model';
import { CommonProps } from '../common_props';

export interface AurumTexteProps extends CommonProps {
	font?: string | DataSource<string>;
	fontSize?: number | DataSource<number>;
}

export interface TextComponentModel extends ComponentModel {
	text: string | DataSource<string>;
	font?: string | DataSource<string>;
	fontSize?: number | DataSource<number>;
	strokeColor?: string | DataSource<string>;
	fillColor?: string | DataSource<string>;
	opacity?: number | DataSource<number>;
}

export function AurumText(props: AurumTexteProps, children: ChildNode[]): TextComponentModel {
	const content = children.map(prerender);
	const text = new DataSource('');

	for (const i of content as Array<string | ReadOnlyDataSource<string>>) {
		if (i instanceof DataSource) {
			i.unique().listen((v) => {
				updateText(text, content as any);
			});
		}
	}
	updateText(text, content as any);

	return {
		...props,
		opacity: props.opacity ?? 1,
		renderedState: undefined,
		text,
		children: [],
		animations: [],
		type: ComponentType.TEXT
	};
}

function updateText(text: DataSource<string>, content: Array<string | ReadOnlyDataSource<string>>) {
	text.update(
		content.reduce<string>((p, c) => {
			if (typeof c === 'string') {
				return `${p}${c}`;
			} else {
				if (c.value) {
					return `${p}${c.value}`;
				} else {
					return p;
				}
			}
		}, '')
	);
}
