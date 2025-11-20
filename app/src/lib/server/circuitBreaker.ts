type BreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

type BreakerRecord = {
	failureCount: number;
	state: BreakerState;
	openedAt: number | null;
	lastFailureError?: string | null;
};

const DEFAULT_THRESHOLD = 5;
const DEFAULT_RESET_MS = 60 * 1000; // 60s

const record: BreakerRecord = {
	failureCount: 0,
	state: 'CLOSED',
	openedAt: null,
	lastFailureError: null
};

export function isOpen() {
	if (record.state === 'OPEN') {
		// check timeout
		if (record.openedAt && Date.now() - record.openedAt > DEFAULT_RESET_MS) {
			// move to half-open
			record.state = 'HALF_OPEN';
			return false;
		}
		return true;
	}
	return false;
}

export function recordSuccess() {
	record.failureCount = 0;
	record.state = 'CLOSED';
	record.openedAt = null;
	record.lastFailureError = null;
}

export function recordFailure(err: unknown) {
	record.failureCount += 1;
	record.lastFailureError = String(err);
	if (record.failureCount >= DEFAULT_THRESHOLD) {
		record.state = 'OPEN';
		record.openedAt = Date.now();
	}
}

export function getState() {
	return { ...record, threshold: DEFAULT_THRESHOLD, resetMs: DEFAULT_RESET_MS };
}
