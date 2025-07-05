import sys
import os
import io
import json
import torch
import whisper
from dotenv import load_dotenv
import google.generativeai as genai

# === Thiết lập mã hóa UTF-8 cho đầu ra console (Windows)
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# === Thư mục gốc dự án ===
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# === Load biến môi trường từ .env ===
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")
CUSTOM_FFMPEG_PATH = os.getenv("FFMPEG_PATH")
CUSTOM_MODEL_PATH = os.getenv("WHISPER_MODEL_PATH")
TOTAL_MEMORY_LARGE = float(os.getenv("TOTAL_MEMORY_LARGE"))
TOTAL_MEMORY_MEDIUM = float(os.getenv("TOTAL_MEMORY_MEDIUM"))
TOTAL_MEMORY_SMALL = float(os.getenv("TOTAL_MEMORY_SMALL"))

# === Cấu hình đường dẫn FFMPEG ===
if CUSTOM_FFMPEG_PATH:
    os.environ["PATH"] += os.pathsep + CUSTOM_FFMPEG_PATH
else:
    default_ffmpeg = os.path.join(BASE_DIR, '..', 'libraries', 'ffmpeg', 'ffmpeg-7.1.1-full_build', 'bin')
    os.environ["PATH"] += os.pathsep + default_ffmpeg

# === Cấu hình Gemini (LLM từ Google) ===
genai.configure(api_key=API_KEY)
llm_model = genai.GenerativeModel(model_name="gemini-2.0-flash")

# === Chọn thiết bị xử lý ===
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"[DEVICE] whisper_device={device}", file=sys.stderr)

# === Tự động chọn mô hình Whisper phù hợp theo GPU ===
def choose_model_name():
    if device == "cuda":
        total_mem = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)
        if total_mem >= TOTAL_MEMORY_LARGE:
            return "large"
        elif total_mem >= TOTAL_MEMORY_MEDIUM:
            return "medium"
        elif total_mem >= TOTAL_MEMORY_SMALL:
            return "small"
        else:
            return "tiny"
    return "small"

MODEL_NAME = choose_model_name()
DOWNLOAD_ROOT = CUSTOM_MODEL_PATH or os.path.join(BASE_DIR, '..', 'libraries', 'models_whisper')
SUPPORTED_FORMATS = ['.mp3', '.m4a', '.webm', '.wav', '.flac', '.aac', '.ogg']

print(f"Đang tải mô hình Whisper: {MODEL_NAME}", file=sys.stderr)
model = whisper.load_model(MODEL_NAME, device=device, download_root=DOWNLOAD_ROOT)

# === Cải thiện kết quả văn bản bằng LLM (Gemini) ===
def improve_transcription(text, lang="unknown", context=None):
    if not text or len(text.strip()) < 5:
        return "⚠️ Văn bản quá ngắn để cải thiện."

    context_note = f"\n{f'Ngữ cảnh: {context.strip()}' if lang.startswith('vi') else f'Context: {context.strip()}'}\n" if context else ""

    if lang.startswith("vi"):
        prompt = f"""
Bạn là trợ lý AI chuyên cải thiện nội dung hội thoại đã được chuyển từ giọng nói thành văn bản. Hãy chỉnh sửa đoạn hội thoại dưới đây để:

- Rõ ràng, dễ hiểu, đúng ngữ cảnh
- Có phân vai như: **Khách hàng**, **Chuyên viên Phân tích Kinh doanh** ...
- Giữ đúng ngôn ngữ gốc (KHÔNG dịch)
- KHÔNG thêm mô tả, KHÔNG giải thích, KHÔNG ghi lý do

Nếu một câu không rõ nghĩa, hãy cố viết lại cho hợp lý nhất theo ngữ cảnh bên dưới (nếu có):
{context_note}
--- Nội dung gốc ---
{text}

--- Hội thoại đã chỉnh sửa ---
"""
    else:
        prompt = f"""
You are an AI assistant specialized in cleaning up spoken transcripts. Your task is to rewrite the raw dialogue below to make it:

- Clear, structured, and easy to understand
- With speaker labels like **Customer**, **Business Analyst**, etc.
- Keep the original language (DO NOT translate)
- DO NOT include any explanation or summary

If a sentence is unclear, try to rewrite it in the most contextually accurate way possible.
{context_note}
--- Raw transcript ---
{text}

--- Revised dialogue ---
"""

    try:
        response = llm_model.generate_content(prompt)
        return response.text.strip() if response.text else "⚠️ Không có phản hồi từ LLM."
    except Exception as e:
        return f"⚠️ Không thể cải thiện nội dung: {str(e)}"

# === Đánh giá độ tin cậy của văn bản (trả về số từ 1–10 hoặc phần trăm)
def evaluate_confidence(text):
    prompt = f"""
Cho đoạn hội thoại đã được cải thiện dưới đây, hãy đánh giá độ tin cậy khi chuyển từ âm thanh sang văn bản, theo thang điểm phần trăm từ 0 đến 100.

Chỉ trả về một số duy nhất (không kèm giải thích).
--- Văn bản ---
{text}
"""
    try:
        response = llm_model.generate_content(prompt)
        confidence_value = float(response.text.strip())
        return round(confidence_value, 2)
    except Exception as e:
        return None

# === Hàm chuyển âm thanh thành văn bản và tách segment
def transcribe(audio_path):
    if not os.path.isfile(audio_path):
        raise FileNotFoundError(f"Không tìm thấy file: {audio_path}")

    ext = os.path.splitext(audio_path)[1].lower()
    if ext not in SUPPORTED_FORMATS:
        raise ValueError(f"Định dạng không hỗ trợ: {ext}")

    result = model.transcribe(audio_path, fp16=(device == "cuda"))

    segments = []
    for seg in result.get("segments", []):
        segments.append({
            "start": round(seg["start"], 2),
            "end": round(seg["end"], 2),
            "text": seg["text"].strip()
        })

    return {
        "text": result["text"].strip(),
        "language": result.get("language", "unknown"),
        "segments": segments
    }

# === Chạy như CLI
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Cách dùng: python process_STT.py <file1> <file2> ... [--context=ngữ_cảnh]", file=sys.stderr)
        sys.exit(1)

    context = None
    args = []
    for arg in sys.argv[1:]:
        if arg.startswith("--context="):
            context = arg.split("=", 1)[1]
        else:
            args.append(arg)

    results = []

    for path in args:
        entry = {"file": os.path.basename(path)}
        try:
            output = transcribe(path)
            raw_text = output["text"]
            lang = output["language"]
            segments = output.get("segments", [])
            entry["language"] = lang
            entry["segments"] = segments

            if not raw_text.strip():
                entry["text"] = ""
                entry["warning"] = "⚠️ Không nhận diện được nội dung trong âm thanh."
            else:
                improved = improve_transcription(raw_text, lang, context)
                confidence = evaluate_confidence(improved)
                entry["text"] = improved
                if confidence is not None:
                    entry["confidence"] = confidence

        except Exception as e:
            entry["error"] = str(e)

        results.append(entry)

    print(json.dumps(results, ensure_ascii=False, indent=2))




