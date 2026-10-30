/**
 * Direct Unit & Integration Test Suite for face_service/service.py
 */

const FACE_SERVICE_BASE = 'http://127.0.0.1:5001';

const PRIYA_FACE_URL = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';
const AARAV_FACE_URL = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400';
const MULTI_FACE_URL = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=600';
const BLANK_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

let passed = 0;
let total = 0;

function assert(condition, testName, details = '') {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    console.error(`  ✗ [FAIL] ${testName} - ${details}`);
    throw new Error(`Failed: ${testName} (${details})`);
  }
}

async function run() {
  console.log('=======================================================');
  console.log('🧪 DIRECT TEST SUITE: face_service/service.py');
  console.log('=======================================================\n');

  // Test 1: Health endpoint
  console.log('1. Health Check Endpoint (/health)');
  const healthRes = await fetch(`${FACE_SERVICE_BASE}/health`);
  const health = await healthRes.json();
  assert(healthRes.ok, 'HTTP 200 returned');
  assert(health.status === 'healthy', 'Status reports healthy');
  assert(health.embeddingDimensions === 128, 'embeddingDimensions is 128');
  assert(health.detector.includes('YuNet'), 'Detector includes YuNet');
  assert(health.recognizer.includes('SFace'), 'Recognizer includes SFace');

  // Test 2: Detect faces endpoint (/detect)
  console.log('\n2. Detect Faces Endpoint (/detect)');
  const detectRes = await fetch(`${FACE_SERVICE_BASE}/detect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: PRIYA_FACE_URL }),
  });
  const detect = await detectRes.json();
  assert(detectRes.ok, 'Detect returns HTTP 200');
  assert(detect.success === true, 'Detect reports success');
  assert(detect.facesDetected >= 1, `Detected ${detect.facesDetected} face(s)`);
  assert(Array.isArray(detect.faces) && detect.faces[0].box.length === 4, 'Bounding box format is [x, y, w, h]');

  // Test 3: Extract embedding endpoint (/extract-embedding) - Single face
  console.log('\n3. Extract Embedding Endpoint (/extract-embedding)');
  const ext1Res = await fetch(`${FACE_SERVICE_BASE}/extract-embedding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: PRIYA_FACE_URL }),
  });
  const ext1 = await ext1Res.json();
  assert(ext1Res.ok, 'Extraction returns HTTP 200 for single face');
  assert(ext1.success === true, 'Extraction reports success: true');
  assert(ext1.facesDetected === 1, 'facesDetected is exactly 1');
  assert(Array.isArray(ext1.embedding) && ext1.embedding.length === 128, 'Generates 128-D vector');
  assert(typeof ext1.confidence === 'number' && ext1.confidence > 0.8, `Confidence > 0.8 (${ext1.confidence})`);

  // Test 4: Extract embedding - Blank image (0 faces) -> HTTP 400
  console.log('\n4. Zero Face Rejection');
  const blankRes = await fetch(`${FACE_SERVICE_BASE}/extract-embedding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: `data:image/png;base64,${BLANK_IMAGE_BASE64}` }),
  });
  const blank = await blankRes.json();
  assert(blankRes.status === 400, 'Rejection returns HTTP 400');
  assert(blank.success === false, 'success is false');
  assert(blank.facesDetected === 0, 'facesDetected is 0');
  assert(blank.error.toLowerCase().includes('no face'), 'Error message states no face detected');

  // Test 5: Extract embedding - Multiple faces -> HTTP 400
  console.log('\n5. Multiple Faces Rejection');
  const multiRes = await fetch(`${FACE_SERVICE_BASE}/extract-embedding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: MULTI_FACE_URL }),
  });
  const multi = await multiRes.json();
  assert(multiRes.status === 400, 'Multiple faces returns HTTP 400');
  assert(multi.success === false, 'success is false');
  assert(multi.facesDetected > 1, `facesDetected > 1 (${multi.facesDetected})`);
  assert(multi.error.toLowerCase().includes('multiple faces'), 'Error specifies multiple faces restriction');

  // Test 6: Extract embedding - Corrupted/Invalid image data -> HTTP 400
  console.log('\n6. Corrupted Image Rejection');
  const corruptRes = await fetch(`${FACE_SERVICE_BASE}/extract-embedding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: 'invalid-not-an-image' }),
  });
  const corrupt = await corruptRes.json();
  assert(corruptRes.status === 400, 'Corrupted image returns HTTP 400');
  assert(corrupt.success === false, 'success is false');
  assert(Boolean(corrupt.error), 'Provides error message');

  // Test 7: Compare endpoint (/compare) - Same person vs different person
  console.log('\n7. Compare Embeddings Endpoint (/compare)');
  const ext2Res = await fetch(`${FACE_SERVICE_BASE}/extract-embedding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: AARAV_FACE_URL }),
  });
  const ext2 = await ext2Res.json();
  assert(ext2Res.ok && ext2.embedding.length === 128, 'Extracted second face embedding');

  // Same face comparison
  const sameCompRes = await fetch(`${FACE_SERVICE_BASE}/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embedding1: ext1.embedding, embedding2: ext1.embedding }),
  });
  const sameComp = await sameCompRes.json();
  assert(sameCompRes.ok, 'Compare returns HTTP 200');
  assert(sameComp.isMatch === true, 'Same face reports isMatch: true');
  assert(sameComp.similarityScore >= 99, `Similarity score >= 99% (${sameComp.similarityScore}%)`);
  assert(sameComp.cosineSimilarity >= 0.95, `Cosine similarity >= 0.95 (${sameComp.cosineSimilarity})`);

  // Different face comparison
  const diffCompRes = await fetch(`${FACE_SERVICE_BASE}/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embedding1: ext1.embedding, embedding2: ext2.embedding }),
  });
  const diffComp = await diffCompRes.json();
  assert(diffComp.isMatch === false, 'Different face reports isMatch: false');
  assert(diffComp.similarityScore < 70, `Different face similarity below match threshold (${diffComp.similarityScore}%)`);

  // Test 8: Match Candidate (/match-candidate)
  console.log('\n8. Match Candidate Endpoint (/match-candidate)');
  const candidateMatchRes = await fetch(`${FACE_SERVICE_BASE}/match-candidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      candidateEmbedding: ext1.embedding,
      enrolledList: [
        { id: 'usr_002', rollNumber: '22ALTS002', name: 'Aarav Patel', embedding: ext2.embedding },
        { id: 'usr_001', rollNumber: '22ALTS001', name: 'Priya Sharma', embedding: ext1.embedding },
      ],
    }),
  });
  const candidateMatch = await candidateMatchRes.json();
  assert(candidateMatchRes.ok, 'match-candidate returns HTTP 200');
  assert(candidateMatch.matched === true, 'Correct candidate matched');
  assert(candidateMatch.bestMatch?.id === 'usr_001', 'Identified correct candidate ID (usr_001)');
  assert(candidateMatch.bestMatch?.name === 'Priya Sharma', 'Identified correct name');

  // Test 9: Malformed JSON handling -> HTTP 400 (not 500)
  console.log('\n9. Malformed JSON Request Handling');
  const malformedRes = await fetch(`${FACE_SERVICE_BASE}/extract-embedding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{ "image": "incomplete json...',
  });
  const malformed = await malformedRes.json();
  assert(malformedRes.status === 400, 'Malformed JSON returns HTTP 400 Bad Request');
  assert(malformed.success === false, 'Reports success: false');

  // Test 10: Empty body handling
  console.log('\n10. Empty Request Handling');
  const emptyRes = await fetch(`${FACE_SERVICE_BASE}/extract-embedding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '',
  });
  assert(emptyRes.status === 400, 'Empty body returns HTTP 400');

  // Test 11: CORS Preflight (OPTIONS)
  console.log('\n11. CORS Preflight (OPTIONS)');
  const optionsRes = await fetch(`${FACE_SERVICE_BASE}/extract-embedding`, {
    method: 'OPTIONS',
  });
  assert(optionsRes.status === 204, 'OPTIONS request returns HTTP 204');
  assert(optionsRes.headers.get('access-control-allow-origin') === '*', 'Includes CORS allow-origin header');

  console.log('\n=======================================================');
  console.log(`🎉 ALL TESTS PASSED: ${passed}/${total} Assertions Verified`);
  console.log('=======================================================\n');
}

run().catch((err) => {
  console.error('\n❌ Test failure:', err);
  process.exit(1);
});

