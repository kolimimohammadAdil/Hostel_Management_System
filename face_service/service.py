#!/usr/bin/env python3
"""
HOSTELGUARD AI — High-Performance Facial Biometric Recognition Engine
Powered by OpenCV Deep Neural Network (DNN):
  - Detector: YuNet CNN (face_detection_yunet_2023mar.onnx)
  - Recognizer: SFace ResNet-based Deep Face Feature Extractor (face_recognition_sface_2021dec.onnx)

Extracts genuine 128-dimensional L2-normalized floating point biometric embeddings.
Compares faces using Cosine Similarity Metric with calibrated security threshold.
"""

import sys
import os

# Suppress noisy OpenCV internal DNN backend target warnings
os.environ["OPENCV_LOG_LEVEL"] = "ERROR"

import json
import base64
import io
import math
import logging
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
import cv2
import numpy as np
from PIL import Image

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("HostelGuard-FaceService")

PORT = int(os.environ.get("FACE_SERVICE_PORT", 5001))
HOST = os.environ.get("FACE_SERVICE_HOST", "0.0.0.0")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
YUNET_MODEL = os.path.join(MODELS_DIR, "face_detection_yunet_2023mar.onnx")
SFACE_MODEL = os.path.join(MODELS_DIR, "face_recognition_sface_2021dec.onnx")

# SFace calibrated threshold: SFace standard match threshold for cosine distance is 0.363
# We use 0.38 for high security turnstile operation
COSINE_MATCH_THRESHOLD = 0.38


class FaceEngine:
    def __init__(self):
        logger.info(f"Loading YuNet face detector from: {YUNET_MODEL}")
        if not os.path.exists(YUNET_MODEL):
            raise FileNotFoundError(
                f"YuNet model file not found at {YUNET_MODEL}. "
                f"Run 'python face_service/download_models.py' to download the model files."
            )
        if not os.path.exists(SFACE_MODEL):
            raise FileNotFoundError(
                f"SFace model file not found at {SFACE_MODEL}. "
                f"Run 'python face_service/download_models.py' to download the model files."
            )

        self.lock = threading.Lock()

        # Instantiate persistent detector and recognizer to eliminate disk re-load latency
        self.detector = cv2.FaceDetectorYN.create(
            model=YUNET_MODEL,
            config="",
            input_size=(320, 320),
            score_threshold=0.6,
            nms_threshold=0.3,
            top_k=5000
        )

        logger.info(f"Loading SFace deep face recognizer from: {SFACE_MODEL}")
        self.recognizer = cv2.FaceRecognizerSF.create(model=SFACE_MODEL, config="")
        logger.info("Face Engine initialized successfully with YuNet and SFace models.")

    def decode_image(self, image_data: str) -> np.ndarray:
        """Decodes base64 string, data URL, local file path, or HTTP/S URL into OpenCV BGR numpy array."""
        if not image_data or not isinstance(image_data, str):
            raise ValueError("Empty or invalid image data provided")

        image_data = image_data.strip()

        # Case 1: Local file path
        if os.path.isfile(image_data):
            try:
                img = cv2.imread(image_data)
                if img is not None and img.size > 0:
                    return img
            except Exception:
                pass

        # Case 2: HTTP or HTTPS URL
        if image_data.startswith("http://") or image_data.startswith("https://"):
            import urllib.request
            import ssl
            raw_bytes = None
            try:
                req = urllib.request.Request(image_data, headers={"User-Agent": "HostelGuard/1.0"})
                with urllib.request.urlopen(req, timeout=10) as response:
                    raw_bytes = response.read()
            except Exception:
                # Fallback to unverified SSL context if certificate verification failed
                try:
                    ctx = ssl.create_default_context()
                    ctx.check_hostname = False
                    ctx.verify_mode = ssl.CERT_NONE
                    req = urllib.request.Request(image_data, headers={"User-Agent": "HostelGuard/1.0"})
                    with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
                        raw_bytes = response.read()
                except Exception as e:
                    raise ValueError(f"Failed to fetch image from URL: {str(e)}")
        else:
            # Case 3: Base64 or Data URL
            clean_b64 = image_data
            if "," in clean_b64:
                clean_b64 = clean_b64.split(",", 1)[1]

            clean_b64 = clean_b64.strip().replace(" ", "+").replace("\n", "").replace("\r", "")

            try:
                raw_bytes = base64.b64decode(clean_b64)
            except Exception as e:
                raise ValueError(f"Base64 decoding failed: {str(e)}")

        if not raw_bytes or len(raw_bytes) == 0:
            raise ValueError("Decoded image buffer is empty")

        try:
            pil_img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
            img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        except Exception as e:
            raise ValueError(f"Corrupted or unsupported image binary format: {str(e)}")

        if img is None or img.size == 0:
            raise ValueError("Corrupted or unsupported image binary format")

        # Downscale oversized images (> 1920 on longest edge) for speed & memory safety
        h, w = img.shape[:2]
        max_dim = max(h, w)
        if max_dim > 1920:
            scale = 1920.0 / max_dim
            new_w, new_h = max(1, int(w * scale)), max(1, int(h * scale))
            img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)

        return img

    def detect_faces(self, img: np.ndarray, score_thresh: float = 0.6):
        """Runs YuNet face detection on image using persistent model and dynamic dimensions."""
        h, w = img.shape[:2]
        with self.lock:
            self.detector.setInputSize((w, h))
            self.detector.setScoreThreshold(score_thresh)
            _, faces = self.detector.detect(img)
        return faces

    def extract_embedding(self, img: np.ndarray):
        """
        Validates face presence:
          - Rejects if 0 faces detected.
          - Rejects if >1 faces detected.
          - Aligns the face using detected landmarks.
          - Extracts 128-dimensional L2-normalized float embedding.
        """
        faces = self.detect_faces(img)

        if faces is None or len(faces) == 0:
            return {
                "success": False,
                "facesDetected": 0,
                "error": "No face detected in the camera frame. Please face the camera squarely."
            }

        if len(faces) > 1:
            return {
                "success": False,
                "facesDetected": len(faces),
                "error": f"Multiple faces detected ({len(faces)}). Security turnstiles permit only one person at a time."
            }

        face = faces[0]
        box = [float(v) for v in face[0:4]]  # [x, y, w, h]
        confidence = float(face[-1])

        # Align and extract embedding under thread-safe lock
        with self.lock:
            aligned_face = self.recognizer.alignCrop(img, face)
            if aligned_face is None or aligned_face.size == 0:
                return {
                    "success": False,
                    "facesDetected": 1,
                    "error": "Could not align face for biometric extraction. Please face the camera squarely."
                }
            feature = self.recognizer.feature(aligned_face)  # Shape (1, 128)
            embedding_list = [float(v) for v in feature[0]]

        return {
            "success": True,
            "facesDetected": 1,
            "box": box,
            "confidence": round(confidence, 4),
            "embedding": embedding_list
        }

    def compute_similarity(self, emb1: list, emb2: list):
        """
        Computes cosine similarity between two 128-D embedding vectors.
        Returns cosine score and normalized percentage (0-100%).
        """
        if not isinstance(emb1, (list, tuple, np.ndarray)) or not isinstance(emb2, (list, tuple, np.ndarray)):
            raise ValueError("Embeddings must be list or array of numeric values")
        if len(emb1) != 128 or len(emb2) != 128:
            raise ValueError(f"Embeddings must be 128-dimensional vectors (received {len(emb1)} and {len(emb2)})")

        v1 = np.array(emb1, dtype=np.float32).reshape(1, 128)
        v2 = np.array(emb2, dtype=np.float32).reshape(1, 128)

        with self.lock:
            cosine_sim = float(self.recognizer.match(v1, v2, cv2.FaceRecognizerSF_FR_COSINE))

        if math.isnan(cosine_sim) or math.isinf(cosine_sim):
            cosine_sim = 0.0

        # Calibrate similarity to 0-100% scale
        # SFace typical match range: 0.363 to 1.0 -> 70% to 100%
        # Below 0.15 is random noise or completely different individuals
        if cosine_sim <= 0:
            percentage = 0.0
        elif cosine_sim < 0.2:
            percentage = round(cosine_sim * 150, 1)  # 0 to 30%
        else:
            # Map [0.2, 1.0] to [30%, 100%]
            percentage = round(30.0 + ((cosine_sim - 0.2) / 0.8) * 70.0, 1)
        percentage = min(100.0, max(0.0, percentage))

        is_match = cosine_sim >= COSINE_MATCH_THRESHOLD

        return {
            "cosineSimilarity": round(cosine_sim, 4),
            "similarityScore": percentage,
            "isMatch": is_match,
            "threshold": COSINE_MATCH_THRESHOLD
        }


# Initialize global engine
engine = FaceEngine()


class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


class FaceServiceHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200, content_type="application/json"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(204)

    def log_message(self, format, *args):
        # Clean standard logging
        logger.info("%s - %s", self.client_address[0], format % args)

    def read_json_body(self):
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length <= 0:
            return None
        if content_length > 30 * 1024 * 1024:
            raise ValueError("Payload size exceeds maximum allowed 30MB")
        body = self.rfile.read(content_length)
        try:
            return json.loads(body.decode("utf-8"))
        except Exception as e:
            raise ValueError(f"Malformed JSON payload: {str(e)}")

    def do_GET(self):
        if self.path == "/health" or self.path == "/":
            self._set_headers(200)
            self.wfile.write(json.dumps({
                "status": "healthy",
                "service": "HostelGuard AI Face Recognition Engine",
                "detector": "OpenCV YuNet CNN",
                "recognizer": "OpenCV SFace ResNet 128-D",
                "embeddingDimensions": 128,
                "cosineThreshold": COSINE_MATCH_THRESHOLD,
                "version": "1.0.0"
            }).encode("utf-8"))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode("utf-8"))

    def do_POST(self):
        try:
            data = self.read_json_body()
            if data is None:
                self._set_headers(400)
                self.wfile.write(json.dumps({"success": False, "error": "Request body must be non-empty JSON"}).encode("utf-8"))
                return

            # Endpoint 1: Detect faces
            if self.path == "/detect":
                img_data = data.get("image") or data.get("imageData") or data.get("frame")
                if not img_data:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({"success": False, "error": "Image data required"}).encode("utf-8"))
                    return

                img = engine.decode_image(img_data)
                faces = engine.detect_faces(img)
                count = 0 if faces is None else len(faces)

                boxes = []
                if faces is not None:
                    for f in faces:
                        boxes.append({
                            "box": [float(v) for v in f[0:4]],
                            "confidence": round(float(f[-1]), 4)
                        })

                self._set_headers(200)
                self.wfile.write(json.dumps({
                    "success": True,
                    "facesDetected": count,
                    "faces": boxes
                }).encode("utf-8"))
                return

            # Endpoint 2: Extract 128-D embedding
            elif self.path == "/extract-embedding":
                img_data = data.get("image") or data.get("imageData") or data.get("frame")
                if not img_data:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({"success": False, "error": "Image data required"}).encode("utf-8"))
                    return

                img = engine.decode_image(img_data)
                result = engine.extract_embedding(img)
                status_code = 200 if result.get("success") else 400
                self._set_headers(status_code)
                self.wfile.write(json.dumps(result).encode("utf-8"))
                return

            # Endpoint 3: Compare two embeddings
            elif self.path == "/compare":
                emb1 = data.get("embedding1")
                emb2 = data.get("embedding2")
                if not emb1 or not emb2:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({"success": False, "error": "Both embedding1 and embedding2 are required"}).encode("utf-8"))
                    return

                result = engine.compute_similarity(emb1, emb2)
                self._set_headers(200)
                self.wfile.write(json.dumps({"success": True, **result}).encode("utf-8"))
                return

            # Endpoint 4: Match candidate against list of enrolled profiles
            elif self.path == "/match-candidate":
                candidate_img = data.get("candidateImage") or data.get("image")
                candidate_emb = data.get("candidateEmbedding") or data.get("embedding")
                enrolled_list = data.get("enrolledList", [])  # [{ id, rollNumber, name, embedding }]

                if not candidate_emb:
                    if not candidate_img:
                        self._set_headers(400)
                        self.wfile.write(json.dumps({"success": False, "error": "candidateImage or candidateEmbedding required"}).encode("utf-8"))
                        return
                    img = engine.decode_image(candidate_img)
                    extract_res = engine.extract_embedding(img)
                    if not extract_res.get("success"):
                        self._set_headers(400)
                        self.wfile.write(json.dumps(extract_res).encode("utf-8"))
                        return
                    candidate_emb = extract_res["embedding"]
                    face_box = extract_res.get("box")
                    face_confidence = extract_res.get("confidence")
                else:
                    face_box = None
                    face_confidence = 1.0

                if not enrolled_list or len(enrolled_list) == 0:
                    self._set_headers(200)
                    self.wfile.write(json.dumps({
                        "success": True,
                        "matched": False,
                        "message": "No enrolled biometric templates found in database",
                        "bestMatch": None
                    }).encode("utf-8"))
                    return

                best_match = None
                highest_cos = -1.0

                for item in enrolled_list:
                    target_emb = item.get("embedding")
                    if not target_emb or len(target_emb) != 128:
                        continue
                    sim = engine.compute_similarity(candidate_emb, target_emb)
                    if sim["cosineSimilarity"] > highest_cos:
                        highest_cos = sim["cosineSimilarity"]
                        best_match = {
                            "id": item.get("id") or str(item.get("_id", "")),
                            "rollNumber": item.get("rollNumber", ""),
                            "name": item.get("name") or item.get("fullName", ""),
                            "hostelName": item.get("hostelName", ""),
                            "cosineSimilarity": sim["cosineSimilarity"],
                            "similarityScore": sim["similarityScore"],
                            "isMatch": sim["isMatch"]
                        }

                is_matched = best_match is not None and best_match["isMatch"]

                self._set_headers(200)
                self.wfile.write(json.dumps({
                    "success": True,
                    "matched": is_matched,
                    "bestMatch": best_match,
                    "box": face_box,
                    "confidence": face_confidence,
                    "threshold": COSINE_MATCH_THRESHOLD
                }).encode("utf-8"))
                return

            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": f"Endpoint {self.path} not recognized"}).encode("utf-8"))

        except ValueError as ve:
            self._set_headers(400)
            self.wfile.write(json.dumps({"success": False, "error": str(ve)}).encode("utf-8"))
        except Exception as e:
            logger.error("Internal service error: %s", str(e), exc_info=True)
            self._set_headers(500)
            self.wfile.write(json.dumps({"success": False, "error": f"Internal face service error: {str(e)}"}).encode("utf-8"))


def run():
    server_address = (HOST, PORT)
    httpd = ThreadingHTTPServer(server_address, FaceServiceHandler)
    logger.info(f"HostelGuard AI Face Recognition Microservice listening on http://{HOST}:{PORT}")
    try:
        httpd.serve_forever()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Face service shutting down.")
    finally:
        try:
            httpd.server_close()
        except Exception:
            pass


if __name__ == "__main__":
    run()
