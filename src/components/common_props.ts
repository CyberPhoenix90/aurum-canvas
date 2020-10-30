import { DataSource } from 'aurumjs';
import { ComponentModel, RenderData } from './component_model';

export interface CommonProps extends InteractionProps {
	state?: string | DataSource<string>;
	clip?: boolean | DataSource<boolean>;
	originX?: number | DataSource<number>;
	originY?: number | DataSource<number>;
	x: number | DataSource<number>;
	y: number | DataSource<number>;
	strokeColor?: string | DataSource<string> | CanvasGradient | DataSource<CanvasGradient>;
	fillColor?: string | DataSource<string> | CanvasGradient | DataSource<CanvasGradient>;
	opacity?: number | DataSource<number>;
	rotation?: number | DataSource<number>;
	onPreDraw?(props: RenderData);
}

export interface InteractionProps {
	onMouseEnter?(e: MouseEvent, target: ComponentModel): void;
	onMouseLeave?(e: MouseEvent, target: ComponentModel): void;
	onMouseDown?(e: MouseEvent, target: ComponentModel): void;
	onMouseUp?(e: MouseEvent, target: ComponentModel): void;
	onMouseClick?(e: MouseEvent, target: ComponentModel): void;
	onMouseMove?(e: MouseEvent, target: ComponentModel): void;
}
