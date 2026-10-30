#!/usr/bin/env python3
"""
Downloads OpenCV Zoo YuNet and SFace model weights into face_service/models/
"""
import os
import urllib.request

MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

MODELS = {
    "face_detection_yunet_2023mar.onnx": "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx",
    "face_recognition_sface_2021dec.onnx": "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx"
}

def download_models():
    for name, url in MODELS.items():
        dest = os.path.join(MODELS_DIR, name)
        if not os.path.exists(dest) or os.path.getsize(dest) < 1000:
            print(f"Downloading {name}...")
            urllib.request.urlretrieve(url, dest)
            print(f"Downloaded {name} ({os.path.getsize(dest)} bytes)")
        else:
            print(f"Verified {name} ({os.path.getsize(dest)} bytes)")

if __name__ == "__main__":
    download_models()

