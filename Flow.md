✅ Gợi ý luồng tương tác cải tiến cho hệ thống phân tích use case

🧠 Giai đoạn 1: Trích xuất + Đề xuất từ LLM

Nguồn vào: OCR + STT (speech) → gom thành text → gửi đến Gemini hoặc GPT để:

✅ Trích xuất các use_cases chính xác

💡 Sinh thêm các use_cases đề xuất (gợi ý từ ngữ cảnh hoặc từ phản hồi của người dùng)

Trả về frontend:

{
  "accepted_use_cases": [ ... ],
  "suggested_use_cases": [ ... ]
}

🧭 Giai đoạn 2: Xác nhận ở frontend

✅ Người dùng sẽ thấy từng use case đề xuất với nút:

[✔] Chấp nhận

[✖] Từ chối

✅ Có nút "Chấp nhận tất cả" / "Bỏ tất cả"

✅ Sau khi xác nhận xong → hợp nhất accepted_use_cases + các đề xuất được đồng ý thành final_use_cases[]

📄 Giai đoạn 3: Lựa chọn loại tài liệu

✅ Hiển thị lựa chọn:



→ Gửi final_use_cases[] và options{} đến /api/generate-doc/json

🖥 Giai đoạn 4: Tùy chọn mở rộng kết xuất tài liệu

Loại sơ đồ/tài liệu

Gợi ý sinh từ đâu

🧭 Use Case Diagram

Dựa vào Actor + Goal + Triggers

🔄 Activity Diagram

Dựa vào Tasks[]

🎯 Sequence Diagram

Tasks + Inputs/Outputs

🧬 ERD / DB Schema

Inputs + Outputs tổng hợp

📘 SRS

Tổng hợp toàn bộ Use Case + Field + Rule

📍 Cần triển khai:



Muốn mình tạo luôn UI xác nhận use case và lựa chọn tài liệu không? Gật là làm liền!

