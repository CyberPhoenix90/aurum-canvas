import { AurumComponentAPI, DataSource, dsUnique, ReadOnlyDataSource, Renderable } from 'aurumjs';
import { CommonProps } from '../common_props';
import { ComponentModel, ComponentType } from '../component_model';

export interface AurumTexteProps extends CommonProps {
	font?: string | DataSource<string>;
	fontSize?: number | DataSource<number>;
	fontWeight?: string | DataSource<string>;
	wrapWidth?: number | DataSource<number>;
	lineHeight?: number | DataSource<number>;
}

export interface TextComponentModel extends ComponentModel {
	text: string | DataSource<string>;
	font?: string | DataSource<string>;
	fontSize?: number | DataSource<number>;
	strokeColor?: string | DataSource<string>;
	fontWeight?: string | DataSource<string>;
	fillColor?: string | DataSource<string>;
	opacity?: number | DataSource<number>;
	wrapWidth?: number | DataSource<number>;
	lineHeight?: number | DataSource<number>;
}

export function AurumText(props: AurumTexteProps, children: Renderable[], api: AurumComponentAPI): TextComponentModel {
	const content = api.prerender(children).filter((c) => !!c);
	const text = new DataSource('');

	if (props.font instanceof DataSource) {
		props.font.listen(() => {
			if (result.renderedState) {
				result.renderedState.lines = [];
			}
		});
	}

	if (props.fontWeight instanceof DataSource) {
		props.fontWeight.listen(() => {
			if (result.renderedState) {
				result.renderedState.lines = [];
			}
		});
	}

	if (props.fontSize instanceof DataSource) {
		props.fontSize.listen(() => {
			if (result.renderedState) {
				result.renderedState.lines = [];
			}
		});
	}

	if (props.wrapWidth instanceof DataSource) {
		props.wrapWidth.listen(() => {
			if (result.renderedState) {
				result.renderedState.lines = [];
			}
		});
	}

	for (const i of content as Array<string | ReadOnlyDataSource<string>>) {
		if (i instanceof DataSource) {
			i.transform(dsUnique()).listen((v) => {
				if (result.renderedState) {
					result.renderedState.lines = [];
				}
				updateText(text, content as any);
			});
		}
	}
	updateText(text, content as any);

	const result = {
		...props,
		opacity: props.opacity ?? 1,
		renderedState: undefined,
		text,
		children: [],
		animations: [],
		type: ComponentType.TEXT
	};
	return result;
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
