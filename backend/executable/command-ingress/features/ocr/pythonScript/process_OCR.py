#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UltimateOCR (Advanced with LLM Confidence)
Mục tiêu: Trích xuất văn bản từ ảnh tay viết, bảng trắng/đen, tài liệu scan...
Công nghệ: Tesseract OCR + OpenCV + PIL + Deskew + Gemini + Weighted Confidence + LLM Confidence
"""
import os
import sys
import io
import cv2
import numpy as np
from PIL import Image
import pytesseract
import logging
from datetime import datetime
import requests
import argparse
import json
from dotenv import load_dotenv

# Load .env
load_dotenv()

# Unicode stdout
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')


class AIRefiner:
    def __init__(self, api_key, endpoint):
        self.api_key = api_key
        self.endpoint = endpoint

    def refine_text(self, raw_text):
        prompt = f"""Bạn là chuyên gia tiếng Việt. Sửa lỗi OCR và chuẩn hóa văn bản:
{raw_text}
Trả về kết quả cuối cùng duy nhất, không thêm ghi chú."""
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        headers = {"Content-Type": "application/json"}
        try:
            r = requests.post(self.endpoint, json=payload, headers=headers)
            r.raise_for_status()
            return r.json()['candidates'][0]['content']['parts'][0]['text']
        except Exception as e:
            logging.warning(f"LLM refine error: {e}")
            return raw_text

    def rate_confidence(self, text):
        prompt = f"""Đánh giá độ tin cậy của văn bản sau trên thang điểm 0-100. Chỉ trả về số:
{text}"""
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        headers = {"Content-Type": "application/json"}
        try:
            r = requests.post(self.endpoint, json=payload, headers=headers)
            r.raise_for_status()
            score = r.json()['candidates'][0]['content']['parts'][0]['text']
            return float(score.strip())
        except Exception as e:
            logging.warning(f"LLM confidence error: {e}")
            return None
# AIzaSyDxgIidcVd_PVlt43ij238cGW99ug_vdD8
# https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
class UltimateOCR:
    def __init__(self, use_llm=False, llm_key='', llm_endpoint=''):
        self.use_llm = use_llm
        self.llm_key = llm_key
        self.llm_endpoint = f"{llm_endpoint}?key={llm_key}" if use_llm else ''
        self.tesseract_cmds = os.getenv("TESSERACT_CMDS", r"F:\\Tesseract-OCR\\tesseract.exe,/usr/bin/tesseract").split(',')
        self.min_conf = 60
        self._setup_tesseract()

    def _setup_tesseract(self):
        for cmd in self.tesseract_cmds:
            if os.path.exists(cmd):
                pytesseract.pytesseract.tesseract_cmd = cmd
                return
        raise FileNotFoundError("Không tìm thấy Tesseract")

    def preprocess(self, img):
        img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        img = cv2.adaptiveThreshold(img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                     cv2.THRESH_BINARY_INV, 31, 12)
        return img

    def extract_text(self, image_path):
        if not os.path.exists(image_path):
            return f"[LỖI] Không tồn tại ảnh: {image_path}", 0

        img = cv2.imread(image_path)
        if img.shape[0] < 1000 or img.shape[1] < 1000:
            img = cv2.resize(img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
        pre = self.preprocess(img)

        configs = [("--psm 6 --oem 1", "vie+eng"), ("--psm 3", "eng")]
        best_text = ""
        best_conf = 0

        for config, lang in configs:
            data = pytesseract.image_to_data(Image.fromarray(pre), lang=lang, config=config, output_type=pytesseract.Output.DICT)
            weighted_sum, total_weight = 0, 0
            for i in range(len(data['text'])):
                word = data['text'][i].strip()
                try:
                    conf = float(data['conf'][i])
                    if conf < 20 or not word:
                        continue
                    weight = len(word)
                    weighted_sum += conf * weight
                    total_weight += weight
                except:
                    continue

            avg_conf = weighted_sum / total_weight if total_weight > 0 else 0
            if avg_conf > best_conf:
                best_conf = avg_conf
                best_text = pytesseract.image_to_string(Image.fromarray(pre), lang=lang, config=config)

        text_to_return = best_text.strip()

        # LLM refine + confidence
        if self.use_llm and self.llm_key:
            ai = AIRefiner(self.llm_key, self.llm_endpoint)
            refined = ai.refine_text(text_to_return)
            text_to_return = refined.strip() or text_to_return
            llm_conf = ai.rate_confidence(text_to_return)
            if llm_conf:
                best_conf = (best_conf + llm_conf) / 2  # trung bình giữa Tesseract và LLM

        return text_to_return, round(best_conf, 2)


def handle_cli():
    parser = argparse.ArgumentParser()
    parser.add_argument('images', nargs='+')
    parser.add_argument('--llm_key', type=str, default=os.getenv('LLM_API_KEY'))
    parser.add_argument('--llm_endpoint', type=str, default=os.getenv('LLM_ENDPOINT'))
    args = parser.parse_args()

    ocr = UltimateOCR(
        use_llm=bool(args.llm_key and args.llm_endpoint),
        llm_key=args.llm_key,
        llm_endpoint=args.llm_endpoint
    )

    results = []
    for path in args.images:
        try:
            text, conf = ocr.extract_text(path)
            results.append({"text": text, "confidence": conf, "error": None})
        except Exception as e:
            results.append({"text": f"[LỖI] {str(e)}", "confidence": 0, "error": str(e)})

    print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    handle_cli()
