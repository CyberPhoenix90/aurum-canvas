import { DataSource } from 'aurumjs';

export interface ComponentModel {
	type: ComponentType;
	x: number | DataSource<number>;
	y: number | DataSource<number>;
	children: ComponentModel[];
}

export enum ComponentType {
	RECTANGLE,
	ELIPSE,
	LINE,
	TEXT,
	IMAGE
}
