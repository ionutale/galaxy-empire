export interface User {
	id: string;
	username: string;
}

export interface PlayerState {
	userId: string;
	level: number;
	power: number;
	credits: number;
	metal: number;
	crystal: number;
	fuel: number;
}

export interface PlayerBuilding {
	id?: string;
	userId: string;
	buildingId: string;
	level: number;
}

export interface BuildEntry {
	id: string;
	type: 'building' | 'ship' | string;
	buildingId?: string;
	createdAt: string;
	durationSeconds: number;
	remainingSeconds: number;
	status: 'queued' | 'in-progress' | 'complete';
	userId: string;
}

export interface BuildingDef {
	cost?: (level: number) => Partial<Record<'credits' | 'metal' | 'crystal' | 'fuel', number>>;
	time?: number | ((level: number) => number);
}
