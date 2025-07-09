# #!/usr/bin/env python3
# # -*- coding: utf-8 -*-
# import sys
# import json
# import os
# import google.generativeai as genai
# from dotenv import load_dotenv
# import io

# # Đảm bảo in Unicode UTF-8
# sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# # Load môi trường và khởi tạo LLM
# load_dotenv()
# genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
# llm = genai.GenerativeModel(model_name="gemini-2.0-flash")

# def extract_metadata(text):
#     prompt = f"""
# Bạn là một chuyên gia phân tích nghiệp vụ phần mềm (Business Analyst), được giao nhiệm vụ trích xuất yêu cầu nghiệp vụ từ hội thoại hoặc văn bản người dùng.

# --- Đoạn văn hội thoại hoặc yêu cầu người dùng ---
# {text}

# --- Yêu cầu ---
# 1. Nếu đoạn văn chứa **nhiều yêu cầu khác nhau**, hãy chia thành nhiều `use_case` tương ứng.
# 2. Với **mỗi use_case**, hãy trích xuất chi tiết các thành phần sau:

# - **role**
# - **goal**
# - **tasks**
# - **inputs**
# - **outputs**
# - **context**
# - **priority**
# - **feedback**
# - **rules**
# - **triggers**

# 3. Trả về kết quả ở định dạng JSON duy nhất:
# {{ "use_cases": [...] }}

# ❗ Không markdown, không tiêu đề, chỉ JSON hợp lệ.
# """
#     try:
#         response = llm.generate_content(prompt)
#         return response.text.strip()
#     except Exception as e:
#         return json.dumps({"error": str(e)})

# def extract_with_suggestion(text):
#     prompt = f"""
# Bạn là một chuyên gia phân tích nghiệp vụ phần mềm (Business Analyst).

# --- Văn bản ---
# {text}

# --- Yêu cầu ---
# 1. Trích xuất các `use_case` rõ ràng được nêu ra.
# 2. Gợi ý thêm các `use_case` tiềm năng dựa trên ngữ cảnh, feedback, dữ liệu gián tiếp.
# 3. Với mỗi `use_case`, bao gồm đầy đủ các trường sau (bắt buộc):
# - **role**
# - **goal**: bắt buộc là một object JSON gồm:
#   {{
#     "main": "Mục tiêu chính",
#     "sub": ["Mục tiêu phụ 1", "Mục tiêu phụ 2", ...] // nếu có
#   }}
# - **tasks**
# - **inputs**
# - **outputs**
# - **context**
# - **priority**
# - **feedback**
# - **rules**
# - **triggers**

# 4. Trả về kết quả ở định dạng JSON duy nhất:
# {{
#   "accepted_use_cases": [ {{...}} ],
#   "suggested_use_cases": [ {{...}} ]
# }}

# ⚠️ **Lưu ý**:
# - Không được để goal là chuỗi đơn lẻ.
# - Không thêm markdown, không giải thích, không chú thích.
# """
#     try:
#         response = llm.generate_content(prompt)
#         return response.text.strip()
#     except Exception as e:
#         return json.dumps({"error": str(e)})


# if __name__ == "__main__":
#     if len(sys.argv) < 2:
#         print("Usage: python process_metadata.py <text>", file=sys.stderr)
#         sys.exit(1)

#     mode = "default"
#     text_arg = []

#     for arg in sys.argv[1:]:
#         if arg.startswith("--mode="):
#             mode = arg.split("=", 1)[1].strip()
#         else:
#             text_arg.append(arg)

#     full_text = " ".join(text_arg).strip()

#     if mode == "all":
#         result = extract_with_suggestion(full_text)
#     else:
#         result = extract_metadata(full_text)

#     print(result)



#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import json
import os
import google.generativeai as genai
from dotenv import load_dotenv
import io

# Đảm bảo in Unicode UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Load môi trường và khởi tạo LLM
load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
llm = genai.GenerativeModel(model_name="gemini-2.0-flash")

def extract_metadata(text, language='vn'):
    if language == 'en':
        prompt = f"""
You are a software business analyst. Your task is to extract business requirements from the user's conversation or text.

--- Text ---
{text}

--- Instructions ---
1. If the text includes **multiple needs**, split them into individual `use_case`s.
2. For **each use_case**, extract:

- **role**
- **goal**
- **tasks**
- **inputs**
- **outputs**
- **context**
- **priority**
- **feedback**
- **rules**
- **triggers**

3. Return JSON only:
{{ "use_cases": [...] }}

❗ No markdown. No explanations.
"""
    else:
        prompt = f"""
Bạn là một chuyên gia phân tích nghiệp vụ phần mềm (Business Analyst), được giao nhiệm vụ trích xuất yêu cầu nghiệp vụ từ hội thoại hoặc văn bản người dùng.

--- Đoạn văn hội thoại hoặc yêu cầu người dùng ---
{text}

--- Yêu cầu ---
1. Nếu đoạn văn chứa **nhiều yêu cầu khác nhau**, hãy chia thành nhiều `use_case` tương ứng.
2. Với **mỗi use_case**, hãy trích xuất chi tiết các thành phần sau:

- **role**
- **goal**
- **tasks**
- **inputs**
- **outputs**
- **context**
- **priority**
- **feedback**
- **rules**
- **triggers**

3. Trả về kết quả ở định dạng JSON duy nhất:
{{ "use_cases": [...] }}

❗ Không markdown, không tiêu đề, chỉ JSON hợp lệ.
"""
    try:
        response = llm.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return json.dumps({"error": str(e)})

def extract_with_suggestion(text, language='vn'):
    if language == 'en':
        prompt = f"""
You are a software business analyst.

--- Input Text ---
{text}

--- Tasks ---
1. Extract clearly stated `use_case`s.
2. Suggest potential `use_case`s based on context, feedback, or implied needs.
3. Each `use_case` must include:
- **role**
- **goal**: must be an object:
  {{
    "main": "Main goal",
    "sub": ["Sub goal 1", "Sub goal 2"]
  }}
- **tasks**
- **inputs**
- **outputs**
- **context**
- **priority**
- **feedback**
- **rules**
- **triggers**

4. Return a single JSON:
{{
  "accepted_use_cases": [ {{...}} ],
  "suggested_use_cases": [ {{...}} ]
}}

❗ Do not return single-string goal.
❗ No markdown, no explanations.
"""
    else:
        prompt = f"""
Bạn là một chuyên gia phân tích nghiệp vụ phần mềm (Business Analyst).

--- Văn bản ---
{text}

--- Yêu cầu ---
1. Trích xuất các `use_case` rõ ràng được nêu ra.
2. Gợi ý thêm các `use_case` tiềm năng dựa trên ngữ cảnh, feedback, dữ liệu gián tiếp.
3. Với mỗi `use_case`, bao gồm đầy đủ các trường sau (bắt buộc):
- **role**
- **goal**: bắt buộc là một object JSON gồm:
  {{
    "main": "Mục tiêu chính",
    "sub": ["Mục tiêu phụ 1", "Mục tiêu phụ 2"] // nếu có
  }}
- **tasks**
- **inputs**
- **outputs**
- **context**
- **priority**
- **feedback**
- **rules**
- **triggers**

4. Trả về kết quả ở định dạng JSON duy nhất:
{{
  "accepted_use_cases": [ {{...}} ],
  "suggested_use_cases": [ {{...}} ]
}}

⚠️ **Lưu ý**:
- Không được để goal là chuỗi đơn lẻ.
- Không thêm markdown, không giải thích, không chú thích.
"""
    try:
        response = llm.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return json.dumps({"error": str(e)})


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python process_metadata.py <text>", file=sys.stderr)
        sys.exit(1)

    mode = "default"
    language = "vn"
    text_arg = []

    for arg in sys.argv[1:]:
        if arg.startswith("--mode="):
            mode = arg.split("=", 1)[1].strip()
        elif arg.startswith("--lang="):
            language = arg.split("=", 1)[1].strip()
        else:
            text_arg.append(arg)

    full_text = " ".join(text_arg).strip()

    if mode == "all":
        result = extract_with_suggestion(full_text, language)
    else:
        result = extract_metadata(full_text, language)

    print(result)
