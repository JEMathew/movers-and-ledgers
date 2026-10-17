// Actual Firebase web SDK; never Admin SDK. All attempts target disposable emulator state.
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');
const load = createRequire(path.resolve(__dirname, '../apps/web/package.json'));
const { initializeApp, deleteApp } = load('firebase/app');
const { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, terminate } = load('firebase/firestore');

(async () => {
  assert.equal(process.env.MOVEBOOKS_LOCAL_FIRESTORE_TESTS, '1');
  const endpoint = process.env.FIRESTORE_EMULATOR_HOST || '';
  assert.match(endpoint, /^127\.0\.0\.1:[1-9][0-9]{0,4}$/);
  const port = Number(endpoint.split(':')[1]);
  assert.ok(port < 65536);
  let checked = 0;
  for (const databaseId of ['(default)', 'movebooks-operations']) {
    for (const identity of ['anonymous', 'signed-in']) {
      const name = `rules-${identity}-${databaseId}`;
      const app = initializeApp({ projectId: 'demo-movebooks-local', apiKey: 'emulator-only' }, name);
      const firestore = getFirestore(app, databaseId);
      connectFirestoreEmulator(firestore, '127.0.0.1', port, identity === 'signed-in'
        ? { mockUserToken: { sub: 'synthetic-test-owner', user_id: 'synthetic-test-owner' } } : {});
      try {
        const ref = doc(firestore, 'movebooks_model_controls', 'policy');
        await assert.rejects(getDoc(ref), error => error.code === 'permission-denied');
        await assert.rejects(setDoc(ref, { enabled: true }), error => error.code === 'permission-denied');
        checked += 2;
        console.log(`PASS direct client denied: ${databaseId}, ${identity}, read/write`);
      } finally {
        await terminate(firestore);
        await deleteApp(app);
      }
    }
  }
  console.log(`Firebase web SDK: ${checked} deny-all checks passed; no IAM claim`);
})().catch(error => { console.error(error); process.exitCode = 1; });
