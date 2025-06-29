🧩 1. Luôn cập nhật nhánh main mới nhất

Bấm vào menu Branch > main.
Chọn "Fetch origin" để tải dữ liệu mới.
Sau đó chọn "Pull origin" để đồng bộ.


🧩 2. Tạo nhánh riêng để làm việc

Menu → Branch > New branch...
Đặt tên nhánh: feature/<tên-nhánh>
                    <tên-nhánh> = <tên-bạn>-<chức-năng>
                    Ví dụ: feature/phap-login
Chọn "Create branch".

-> Bạn sẽ tự động chuyển sang nhánh mới sau khi tạo


🧩 3. Thay đổi code + Commit thường xuyên

Sửa code trong VS Code (hoặc IDE bạn dùng)
Trở lại GitHub Desktop, bạn sẽ thấy thay đổi trong tab Changes
Nhập lời nhắn commit (ví dụ: feat: thêm login bằng JWT)
Nhấn "Commit to feature/phap-login"


🧩 4. Đồng bộ với nhánh main (trước khi push)

Chọn lại nhánh main → Pull origin
Quay lại nhánh feature/...
Chọn Branch > Merge into current branch... > main


🧩 5. Push nhánh của bạn lên GitHub

Nhấn nút "Push origin" góc trên phải


🧩 6. Tạo Pull Request (PR)

Sau khi push, GitHub Desktop thường hiển thị nút "Create Pull Request"
Nhấn vào đó → trình duyệt sẽ mở GitHub để tạo PR
Ghi tiêu đề + mô tả rõ ràng
Gửi reviewer đánh giá


🧩 7. Review & Merge (thường làm trên GitHub Web)

Thành viên khác xem xét PR
Nếu hợp lệ, bấm Merge Pull Request trên GitHub


🧩 8. Xoá nhánh sau khi merge (nếu muốn)

Trong GitHub Desktop:
Chọn nhánh vừa dùng
Vào menu Branch > Delete...



📌 Một số quy ước đặt <tên-nhánh> phổ biến

Tính năng mới	feature/<tên-bạn>-<tính-năng>	feature/linh-profile-page
Sửa lỗi	        bugfix/<tên-bạn>-<lỗi>	        bugfix/phuong-fix-null-api
Cải tiến nhỏ	chore/<tên-bạn>-<việc-phụ>	    chore/phap-update-readme
Hotfix gấp	    hotfix/<tên-bạn>-<lỗi>	        hotfix/phap-login-broken