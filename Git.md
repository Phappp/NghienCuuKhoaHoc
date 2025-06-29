🧩 1. CẬP NHẬT CODE MỚI NHẤT TRƯỚC KHI BẮT ĐẦU

git checkout main
git pull origin main

Luôn làm bước này đầu tiên mỗi ngày để đảm bảo bạn đang làm việc trên phiên bản mới nhất.


🧩  2. TẠO NHÁNH RIÊNG CHO CHỨC NĂNG MÌNH LÀM

git checkout -b feature/<tên-nhánh>

<tên-nhánh> = <tên-bạn>-<tên-chức-năng>

Ví dụ:
feature/phap-login-api
feature/linh-fix-lỗi-tìm-kiếm


🧩  3. LÀM VIỆC, COMMIT THƯỜNG XUYÊN

git add .
git commit -m "feat: mô tả chức năng cụ thể"

Ví dụ commit:
feat: thêm xử lý đăng nhập bằng JWT
fix: sửa lỗi hiện sai danh sách lớp



🧩  4. TRƯỚC KHI PUSH, LUÔN ĐỒNG BỘ VỚI main

git checkout main
git pull origin main

git checkout feature/<tên-nhánh>
git merge main

Giúp phát hiện xung đột sớm → dễ xử lý hơn, tránh conflict khi tạo Pull Request.


🧩  5. PUSH CODE LÊN GITHUB

git push -u origin feature/<tên-nhánh>


🧩  6. TẠO PULL REQUEST (PR) ĐỂ ĐƯỢC REVIEW VÀ MERGE

Vào GitHub → Chọn nhánh bạn vừa push → "Create Pull Request"

Ghi mô tả chi tiết về chức năng hoặc fix bạn đã làm

Gắn nhãn (label): feature, bugfix, urgent, v.v.


🧩 7. SAU KHI PR ĐƯỢC MERGE → CẬP NHẬT main LẠI

git checkout main
git pull origin main


🧩  8. XOÁ NHÁNH ĐÃ DÙNG (NẾU MUỐN)

git branch -d feature/<tên-nhánh>           # Xóa local
git push origin --delete feature/<tên-nhánh> # Xóa trên GitHub




📌 Một số quy ước đặt <tên-nhánh> phổ biến

Tính năng mới	feature/<tên-bạn>-<tính-năng>	feature/linh-profile-page
Sửa lỗi	        bugfix/<tên-bạn>-<lỗi>	        bugfix/phuong-fix-null-api
Cải tiến nhỏ	chore/<tên-bạn>-<việc-phụ>	    chore/phap-update-readme
Hotfix gấp	    hotfix/<tên-bạn>-<lỗi>	        hotfix/phap-login-broken