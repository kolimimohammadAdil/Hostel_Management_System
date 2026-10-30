import { config } from '../config/env';

export interface FaceServiceExtractionResult {
  success: boolean;
  facesDetected: number;
  box?: number[];
  confidence?: number;
  embedding?: number[];
  error?: string;
}

export interface FaceServiceComparisonResult {
  success: boolean;
  cosineSimilarity: number;
  similarityScore: number;
  isMatch: boolean;
  threshold: number;
  error?: string;
}

/**
 * Robust HTTP client communicating with Python OpenCV YuNet & SFace microservice (Port 5001).
 */
export async function callFaceMicroservice<T = any>(
  endpoint: string,
  payload: any,
  timeoutMs: number = 8000
): Promise<{ ok: boolean; status: number; data: T }> {
  const url = `${config.faceServiceUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = (await response.json()) as T;
    return { ok: response.ok, status: response.status, data };
  } catch (error: any) {
    throw new Error(
      `Face Recognition Microservice unreachable or timed out at ${config.faceServiceUrl}: ${error.message}`
    );
  }
}

/**
 * Extracts a genuine 128-D L2-normalized float face embedding vector from a captured image.
 */
export async function extractFaceEmbedding(
  image: string
): Promise<FaceServiceExtractionResult> {
  const res = await callFaceMicroservice<FaceServiceExtractionResult>(
    '/extract-embedding',
    { image }
  );
  return res.data;
}

/**
 * Compares two 128-D embeddings using calibrated Cosine Distance.
 */
export async function compareFaceEmbeddings(
  embedding1: number[],
  embedding2: number[]
): Promise<FaceServiceComparisonResult> {
  const res = await callFaceMicroservice<FaceServiceComparisonResult>('/compare', {
    embedding1,
    embedding2,
  });
  return res.data;
}

