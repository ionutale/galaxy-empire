import { writable } from 'svelte/store';

export type Toast = {
	id: number;
	message: string;
	type?: 'info' | 'success' | 'error';
	timeout?: number;
};

const toasts = writable<Toast[]>([]);
let nextId = 1;

export function pushToast(message: string, type: Toast['type'] = 'info', timeout = 3000) {
	const t = { id: nextId++, message, type, timeout };
	toasts.update((v) => [...v, t]);
	if (timeout > 0) setTimeout(() => removeToast(t.id), timeout);
}

export function removeToast(id: number) {
	toasts.update((v) => v.filter((t) => t.id !== id));
}

export default toasts;
