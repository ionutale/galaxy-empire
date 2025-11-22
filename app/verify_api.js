const BASE_URL = 'http://localhost:5173';
const ADMIN_KEY = 'secret'; // Assuming this is the env value, will need to check env if fails

async function runTests() {
	console.log('Starting verification tests...');

	// 1. Register a new user
	const username = `testuser_${Date.now()}`;
	const password = 'password123';
	console.log(`\n1. Testing Registration for ${username}...`);
	const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ username, password })
	});

	if (registerRes.status !== 200 && registerRes.status !== 201) {
		console.error('Registration failed:', await registerRes.text());
		return;
	}
	const registerData = await registerRes.json();
	console.log('Registration successful:', registerData);
	const userId = registerData.userId; // Assuming response structure

	// Login to get session cookie (if needed) or just use the fact that we might need to handle auth manually
	// For this simple test, we might need to simulate the auth header or cookie if the API requires it.
	// Looking at the code, it seems some endpoints use `locals.user`.
	// We might need to login first if register doesn't auto-login or return a token.
	// Let's assume for now we might need to login.

	console.log(`\n2. Testing Login...`);
	const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ username, password })
	});

	if (loginRes.status !== 200) {
		console.error('Login failed:', await loginRes.text());
		return;
	}

	// Capture cookies
	const cookies = loginRes.headers.get('set-cookie');
	const headers = {
		'Content-Type': 'application/json',
		Cookie: cookies || ''
	};
	console.log('Login successful, cookies obtained.');

	// 3. Get Player State
	console.log(`\n3. Testing Get Player State...`);
	const stateRes = await fetch(`${BASE_URL}/api/player/state`, { headers });
	if (stateRes.status !== 200) {
		console.error('Get Player State failed:', await stateRes.text());
	} else {
		console.log('Player State:', await stateRes.json());
	}

	// 4. Upgrade Building (The one that was failing)
	console.log(`\n4. Testing Building Upgrade...`);
	// We need a building ID. Let's assume we can get it from state or we need to fetch buildings.
	// The state endpoint might return buildings.
	// If not, we might need to fetch buildings first.
	// Let's try to upgrade a "Metal Mine" or similar if we can find one.
	// For now, let's just try to hit the endpoint and see if we get "invalid request" or a proper error like "insufficient funds".
	const upgradeRes = await fetch(`${BASE_URL}/api/demo/buildings/upgrade`, {
		method: 'POST',
		headers,
		body: JSON.stringify({ buildingId: 'some-id' }) // Invalid ID should return 404 or similar, not 500
	});
	console.log('Upgrade response status:', upgradeRes.status);
	console.log('Upgrade response:', await upgradeRes.text());

	// 5. Build Ship
	console.log(`\n5. Testing Ship Building...`);
	const buildRes = await fetch(`${BASE_URL}/api/shipyard/build`, {
		method: 'POST',
		headers,
		body: JSON.stringify({ shipTemplateId: 'fighter', quantity: 1 })
	});
	console.log('Build Ship response:', await buildRes.text());

	// 6. Start Mission
	console.log(`\n6. Testing Start Mission...`);
	const missionRes = await fetch(`${BASE_URL}/api/missions/start`, {
		method: 'POST',
		headers,
		body: JSON.stringify({ missionId: 'mission-1' })
	});
	console.log('Start Mission response:', await missionRes.text());

	// 7. Admin Endpoints
	console.log(`\n7. Testing Admin Endpoints...`);
	const adminHeaders = { ...headers, 'x-admin-key': ADMIN_KEY };
}

runTests().catch(console.error);
