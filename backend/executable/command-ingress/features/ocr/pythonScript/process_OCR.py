#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UltimateOCR (Advanced Version)
Mục tiêu: Trích xuất văn bản từ ảnh tay viết, bảng trắng/đen, tài liệu scan...
Công nghệ: Tesseract OCR + OpenCV + PIL + Deskew + Pipeline + Fallbacks
"""
import os
import sys
import io
import cv2
import numpy as np
from PIL import Image, ImageEnhance
import pytesseract
import logging
from datetime import datetime
import requests

class AIRefiner:
    def __init__(self, api_key, endpoint, model='gemini-2.0-flash'):
        self.api_key = api_key
        self.endpoint = endpoint
        self.model = model
        self.llm_used = False
        self.raw_text_before_llm = ''

    def refine_text(self, raw_text):
        # Tự động phát hiện ngôn ngữ dựa trên nội dung
        if any(char in raw_text for char in 'àáâãèéêìíòóôõùúýỳỹỷỵ'):
            prompt = f"""Bạn là một chuyên gia xử lý văn bản tiếng Việt. Hãy:
                    1. Sửa các lỗi OCR phổ biến (thiếu dấu, nhầm font, khoảng cách)
                    2. Chuẩn hóa cách viết (chính tả, ngữ pháp)
                    3. Giữ nguyên nội dung gốc
                    4. Loại bỏ nhiễu/nội dung không liên quan
                    Văn bản cần xử lý:
                    {raw_text}
                    Yêu cầu:
                    - Chỉ trả về văn bản đã được sửa, không thêm bất kỳ ghi chú nào
                    - Giữ nguyên ngắt dòng nếu cần thiết
                    - Đảm bảo tính tự nhiên của tiếng Việt"""
        else:
            prompt = f"""You are an English text refinement expert. Please:
                    1. Correct common OCR errors (character recognition mistakes)
                    2. Normalize spacing and punctuation
                    3. Preserve original meaning
                    4. Remove noise/unrelated content
                    Text to process:
                    {raw_text}
                    Requirements:
                    - Return only the corrected text without any additional notes
                    - Preserve line breaks when appropriate
                    - Maintain natural English flow"""

        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        headers = {
            "Content-Type": "application/json"
        }
        try:
            response = requests.post(self.endpoint, json=payload, headers=headers)
            response.raise_for_status()
            result = response.json()
            return result['candidates'][0]['content']['parts'][0]['text']
        except Exception as e:
            return f"[LLM LỖI] {str(e)}"

# Unicode stdout
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

logging.basicConfig(level=logging.INFO,
                    format='[%(levelname)s] %(message)s')

class UltimateOCR:
    def __init__(self, use_llm=False, llm_api_key='', llm_endpoint=''):
        self.use_llm = use_llm
        self.llm_api_key = llm_api_key
        self.llm_endpoint = llm_endpoint
        self.tesseract_paths = [
            r'F:\Tesseract-OCR\tesseract.exe',
            '/usr/bin/tesseract',
            '/usr/local/bin/tesseract'
        ]
        self.min_confidence = 60
        self.pipeline = [
            self.to_gray,
            self.apply_clahe,
            self.deskew,
            self.sharpen,
            self.auto_invert_if_needed,
            self.adaptive_threshold,
            self.denoise
        ]
        self.setup_tesseract()

    def setup_tesseract(self):
        for path in self.tesseract_paths:
            if os.path.exists(path):
                pytesseract.pytesseract.tesseract_cmd = path
                try:
                    langs = pytesseract.get_languages(config='')
                    if 'vie' not in langs:
                        raise EnvironmentError("Thiếu tiếng Việt (vie.traineddata)")
                except:
                    raise EnvironmentError("Không thể kiểm tra ngôn ngữ Tesseract")
                return
        raise EnvironmentError("Không tìm thấy Tesseract")

    def load_image(self, path):
        if not os.path.exists(path):
            raise FileNotFoundError(f"Không tồn tại ảnh: {path}")
        img = cv2.imread(path)
        if img is not None:
            return img
        try:
            pil_img = Image.open(path)
            return cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        except Exception as e:
            raise ValueError(f"Không đọc được ảnh: {str(e)}")

    def to_gray(self, img):
        return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    def apply_clahe(self, img):
        clahe = cv2.createCLAHE(3.0, (8, 8))
        return clahe.apply(img)

    def deskew(self, image):
        try:
            coords = np.column_stack(np.where(image > 0))
            angle = cv2.minAreaRect(coords)[-1]
            if angle < -45:
                angle = -(90 + angle)
            else:
                angle = -angle
            (h, w) = image.shape[:2]
            M = cv2.getRotationMatrix2D((w//2, h//2), angle, 1.0)
            return cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        except:
            return image

    def sharpen(self, img):
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        return cv2.filter2D(img, -1, kernel)

    def auto_invert_if_needed(self, img):
        mean_val = np.mean(img)
        return cv2.bitwise_not(img) if mean_val > 180 else img

    def adaptive_threshold(self, img):
        return cv2.adaptiveThreshold(img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                     cv2.THRESH_BINARY_INV, 31, 12)

    def denoise(self, img):
        return cv2.fastNlMeansDenoising(img, None, 30, 7, 21)

    def preprocess(self, img):
        for step in self.pipeline:
            img = step(img)
        return img

    def extract_text(self, image_path):
        try:
            raw_img = self.load_image(image_path)
            preprocessed = self.preprocess(raw_img)
        
            best_conf, best_text = 0, ''
            configs = [
                ('--psm 6 --oem 1', 'vie+eng'),
                ('--psm 11 --oem 1', 'vie'),
                ('--psm 3 --oem 1', 'eng')
            ]
            
            for config, lang in configs:
                data = pytesseract.image_to_data(
                    Image.fromarray(preprocessed),
                    lang=lang,
                    config=config,
                    output_type=pytesseract.Output.DICT
                )
                confidences = [float(c) for c in data['conf'] if c != '-1']
                if not confidences:
                    continue
                avg_conf = sum(confidences) / len(confidences)
                if avg_conf > best_conf:
                    best_conf = avg_conf
                    result = pytesseract.image_to_string(Image.fromarray(preprocessed), lang=lang, config=config)
                    if result.strip():
                        best_text = result
            
            self.raw_text_before_llm = best_text
            text_to_return = best_text
            self.llm_used = False
            
            if best_conf < self.min_confidence:
                text_to_return, best_conf = self.fallback(raw_img)
            else:
                text_to_return = best_text

            if self.use_llm and self.llm_api_key:
                logging.info("Đang tinh chỉnh văn bản bằng Gemini LLM...")
                refined = AIRefiner(self.llm_api_key, self.llm_endpoint).refine_text(text_to_return)
                if refined.strip() and refined != text_to_return:
                    text_to_return = refined
                    self.llm_used = True    
            return self.clean_text(text_to_return), best_conf
        except Exception as e:
            return f"[LỖI] {str(e)}", 0

    def fallback(self, img):
        logging.warning("Kích hoạt fallback OCR")
        try:
            h, w = img.shape[:2]
            resized = cv2.resize(img, (w*2, h*2), interpolation=cv2.INTER_CUBIC)
            gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
            _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            result = pytesseract.image_to_string(Image.fromarray(binary), config='--psm 6')
            if result.strip():
                return result, 50
            raise RuntimeError("Fallback thất bại")
        except:
            raise RuntimeError("Không trích xuất được văn bản")

    def clean_text(self, text):
        text = ' '.join(text.split())
        fixes = {
            "ﬁ": "fi", "ﬂ": "fl", "˜": " ", "ˆ": " ", "¨": " ",
            "…": "...", "‘": "'", "’": "'", "“": '"', "”": '"'
        }
        for k, v in fixes.items():
            text = text.replace(k, v)
        for k, v in {"sinhvien": "sinh viên", "giaovien": "giáo viên"}.items():
            text = text.replace(k, v)
        return text.strip()

    def save_result(self, text, image_path):
        name = os.path.splitext(os.path.basename(image_path))[0]
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        out_file = f"{name}_refined.txt"
        with open(out_file, 'w', encoding='utf-8') as f:
            f.write(text)
        return out_file

import json

def handle_cli(image_paths):
    ocr = UltimateOCR(
        use_llm=True,
        llm_api_key="AIzaSyDxgIidcVd_PVlt43ij238cGW99ug_vdD8",
        llm_endpoint="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDxgIidcVd_PVlt43ij238cGW99ug_vdD8"
    )

    results = []
    for image_path in image_paths:
        try:
            text, conf = ocr.extract_text(image_path)
            results.append({
                "text": text,
                "confidence": conf,
                "error": None
            })
        except Exception as e:
            results.append({
                "text": f"[LỖI] {str(e)}",
                "confidence": 0,
                "error": str(e)
            })

    print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Dùng: python process_OCR.py <ảnh1> <ảnh2> ...")
        sys.exit(1)

    image_paths = sys.argv[1:]
    handle_cli(image_paths)