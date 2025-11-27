// GeoBot AI - Chatbot Địa Lý Thông Minh
// System Prompt được tối ưu cho trả lời nhanh và chính xác

// ===== SPEECH RECOGNITION & TEXT-TO-SPEECH =====
let recognition = null;
let speechSynthesis = window.speechSynthesis;
let currentUtterance = null;
let isRecording = false;
let isSpeaking = false;
let currentLanguage = 'vi-VN'; // Ngôn ngữ mặc định: Tiếng Việt

// Khởi tạo Speech Recognition
function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = currentLanguage; // Sử dụng ngôn ngữ hiện tại
        recognition.continuous = false;
        recognition.interimResults = true; // Bật kết quả tạm thời (real-time)
        recognition.maxAlternatives = 1;

        recognition.onstart = function() {
            isRecording = true;
            updateMicButton(true);
            // Hiển thị placeholder và thêm hiệu ứng để người dùng biết đang nghe
            const input = document.getElementById('chatbot-input');
            if (input) {
                input.placeholder = '🎤 Đang nghe... Hãy nói câu hỏi của bạn...';
                input.value = '';
                input.classList.add('recording');
                input.focus();
            }
            console.log('🎤 Đang nghe...');
        };

        recognition.onresult = function(event) {
            let interimTranscript = '';
            let finalTranscript = '';

            // Lấy kết quả tạm thời và kết quả cuối cùng
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            const input = document.getElementById('chatbot-input');
            if (input) {
                // Hiển thị kết quả tạm thời (màu xám) và kết quả cuối (màu đen)
                if (interimTranscript) {
                    input.value = finalTranscript + interimTranscript;
                    input.style.color = '#999'; // Màu xám cho text tạm thời
                } else if (finalTranscript) {
                    input.value = finalTranscript;
                    input.style.color = '#000'; // Màu đen cho text cuối
                }
            }

            console.log('📝 Tạm thời: ' + interimTranscript);
            console.log('📝 Cuối cùng: ' + finalTranscript);

            // Khi có kết quả cuối cùng, gửi tin nhắn
            if (finalTranscript) {
                setTimeout(() => {
                    sendChatbotMessage();
                }, 500); // Đợi 0.5s để người dùng xem kết quả
            }
        };

        recognition.onerror = function(event) {
            console.error('❌ Lỗi nhận diện:', event.error);
            isRecording = false;
            updateMicButton(false);
            
            const input = document.getElementById('chatbot-input');
            if (input) {
                input.placeholder = 'Hỏi tôi bất cứ điều gì hoặc nhấn micro...';
                input.style.color = '#000';
                input.classList.remove('recording');
            }
            
            if (event.error === 'no-speech') {
                alert('⚠️ Không nghe thấy giọng nói. Vui lòng thử lại!');
            } else if (event.error === 'not-allowed') {
                alert('⚠️ Vui lòng cho phép quyền truy cập microphone!');
            } else {
                alert('⚠️ Lỗi: ' + event.error);
            }
        };

        recognition.onend = function() {
            isRecording = false;
            updateMicButton(false);
            
            const input = document.getElementById('chatbot-input');
            if (input) {
                input.placeholder = 'Hỏi tôi bất cứ điều gì hoặc nhấn micro...';
                input.style.color = '#000';
                input.classList.remove('recording');
            }
            console.log('🎤 Đã dừng nghe');
        };
    } else {
        console.warn('⚠️ Trình duyệt không hỗ trợ Speech Recognition');
    }
}

// Bắt đầu/Dừng ghi âm
function toggleVoiceInput() {
    if (!recognition) {
        alert('⚠️ Trình duyệt của bạn không hỗ trợ nhận diện giọng nói!\n\nVui lòng sử dụng Chrome, Edge hoặc Safari.');
        return;
    }

    if (isRecording) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

// Cập nhật trạng thái nút micro
function updateMicButton(recording) {
    const micBtn = document.getElementById('chatbot-mic-btn');
    if (micBtn) {
        if (recording) {
            micBtn.classList.add('recording');
            micBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
            micBtn.title = 'Dừng ghi âm';
        } else {
            micBtn.classList.remove('recording');
            micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            micBtn.title = 'Nói với GeoBot';
        }
    }
}

// Text-to-Speech với giọng Việt Nam chuẩn
function speakText(text) {
    // Dừng giọng nói hiện tại nếu có
    if (isSpeaking) {
        stopSpeaking();
    }

    // Loại bỏ markdown và HTML tags
    const cleanText = text
        .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
        .replace(/\*(.*?)\*/g, '$1') // Italic
        .replace(/<br\s*\/?>/gi, '. ') // Line breaks
        .replace(/<\/?[^>]+(>|$)/g, '') // HTML tags
        .replace(/#{1,6}\s/g, '') // Headers
        .replace(/`{1,3}[^`]*`{1,3}/g, '') // Code blocks
        .replace(/[📍🌍🌐🗺️📚💡🏛️🤖🌓⏰🌀🔬🌸☀️🍂❄️📅⏳]/g, '') // Emojis
        .replace(/\n+/g, '. ') // Multiple newlines
        .trim();

    if (!cleanText) return;

    currentUtterance = new SpeechSynthesisUtterance(cleanText);
    
    // Tìm giọng phù hợp với ngôn ngữ hiện tại
    const voices = speechSynthesis.getVoices();
    const langPrefix = currentLanguage.split('-')[0]; // 'vi' hoặc 'en'
    const matchingVoices = voices.filter(voice => 
        voice.lang.startsWith(currentLanguage) || voice.lang.startsWith(langPrefix)
    );
    
    // Ưu tiên giọng Google
    let selectedVoice = matchingVoices.find(voice => 
        voice.name.includes('Google')
    );
    
    // Nếu không có, chọn giọng đầu tiên phù hợp
    if (!selectedVoice && matchingVoices.length > 0) {
        selectedVoice = matchingVoices[0];
    }
    
    if (selectedVoice) {
        currentUtterance.voice = selectedVoice;
        console.log('🔊 Giọng nói được chọn:', selectedVoice.name, '(' + selectedVoice.lang + ')');
    }
    
    // Cấu hình giọng nói
    currentUtterance.lang = currentLanguage;
    currentUtterance.rate = 0.95; // Tốc độ nói (0.95 = hơi chậm, tự nhiên hơn)
    currentUtterance.pitch = 1.0; // Cao độ giọng nói
    currentUtterance.volume = 1.0; // Âm lượng

    currentUtterance.onstart = function() {
        isSpeaking = true;
        updateSpeakerButton(true);
        console.log('🔊 Đang đọc...');
    };

    currentUtterance.onend = function() {
        isSpeaking = false;
        updateSpeakerButton(false);
        console.log('🔇 Đã dừng đọc');
    };

    currentUtterance.onerror = function(event) {
        console.error('❌ Lỗi text-to-speech:', event.error);
        isSpeaking = false;
        updateSpeakerButton(false);
    };

    speechSynthesis.speak(currentUtterance);
}

// Dừng đọc
function stopSpeaking() {
    if (isSpeaking) {
        speechSynthesis.cancel();
        isSpeaking = false;
        updateSpeakerButton(false);
    }
}

// Cập nhật trạng thái nút loa
function updateSpeakerButton(speaking) {
    const speakerBtn = document.getElementById('chatbot-speaker-btn');
    if (speakerBtn) {
        if (speaking) {
            speakerBtn.classList.add('speaking');
            speakerBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            speakerBtn.title = 'Dừng đọc';
        } else {
            speakerBtn.classList.remove('speaking');
            speakerBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            speakerBtn.title = 'Đọc tin nhắn cuối';
        }
    }
}

// Toggle speaker (đọc tin nhắn cuối cùng của bot)
function toggleSpeaker() {
    if (isSpeaking) {
        stopSpeaking();
    } else {
        // Lấy tin nhắn cuối cùng của bot
        const messages = document.querySelectorAll('.chatbot-message.bot .message-content');
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            const text = lastMessage.innerText || lastMessage.textContent;
            speakText(text);
        } else {
            alert('⚠️ Chưa có tin nhắn nào để đọc!');
        }
    }
}

// System Prompts cho từng ngôn ngữ
const SYSTEM_PROMPTS = {
    'vi-VN': `Bạn là GeoBot AI 🌍 - trợ lý địa lý thông minh chuyên về chuyển động Trái Đất và hệ quả địa lý. Nhiệm vụ của bạn là giúp học sinh lớp 10 hiểu rõ địa lý và sử dụng website hiệu quả.

**NGUYÊN TẮC TRẢ LỜI:**
✅ TRẢ LỜI NHANH - đi thẳng vào vấn đề, ngắn gọn súc tích (2-3 câu cho câu hỏi đơn giản)
✅ CHÍNH XÁC - dựa trên kiến thức khoa học và SGK Địa lý 10
✅ DỄ HIỂU - giải thích bằng ngôn ngữ đơn giản, tránh thuật ngữ phức tạp
✅ HƯỚNG DẪN WEBSITE - chủ động gợi ý các công cụ và trang phù hợp

=== KIẾN THỨC ĐỊA LÝ TRÁI ĐẤT (SGK LỚP 10) ===

I. CHUYỂN ĐỘNG TỰ QUAY (24 giờ):
**Thông số cơ bản:**
- Chu kỳ: 24 giờ (chính xác: 23h 56' 4" = 1 ngày sao)
- Hướng: Tây → Đông (ngược chiều kim đồng hồ nhìn từ cực Bắc)
- Trục: Nghiêng 23.5° (23°27') so với pháp tuyến mặt phẳng quỹ đạo
- Vận tốc tại xích đạo: ~1,670 km/h (giảm dần về hai cực = 0)
- Tại 45° vĩ độ: ~1,180 km/h

**5 HỆ QUẢ CHÍNH:**
1️⃣ **Ngày và đêm luân phiên** 🌓
   - Nửa Trái Đất hướng Mặt Trời = ban ngày (sáng)
   - Nửa kia = ban đêm (tối)
   - Đường chia ngày/đêm gọi là "vòng sáng tối"
   - Mỗi điểm trên Trái Đất đều trải qua ngày và đêm

2️⃣ **Giờ địa phương khác nhau** ⏰
   - Chia 360° / 24h = 15°/giờ
   - Trái Đất có 24 múi giờ
   - Múi giờ chuẩn: Kinh tuyến gốc 0° (Greenwich, Anh)
   - Việt Nam: UTC+7 (múi giờ thứ 7 phía Đông)
   - Công thức: Giờ địa phương = Giờ GMT + (Kinh độ/15)

3️⃣ **Hiệu ứng Coriolis** 🌀
   - Làm lệch hướng các vật thể chuyển động
   - Bắc bán cầu: Lệch PHẢI
   - Nam bán cầu: Lệch TRÁI
   - Ảnh hưởng: Gió mậu dịch, hải lưu, hướng bão
   - Tại xích đạo: Hiệu ứng = 0

4️⃣ **Hình dạng Trái Đất** 🌍
   - Lực ly tâm làm Trái Đất phình ra ở xích đạo
   - Bán kính xích đạo: 6,378 km
   - Bán kính cực: 6,357 km
   - Chênh lệch: ~21 km
   - Dạng: Hình cầu dẹp (ellipsoid)

5️⃣ **Chứng minh khoa học** 🔬
   - Con lắc Foucault: Dao động chứng minh Trái Đất quay
   - Các vệ tinh quan sát từ không gian
   - Ảnh chụp từ ISS cho thấy Trái Đất quay

II. CHUYỂN ĐỘNG CÔNG CHUYỂN (365 ngày):
**Thông số cơ bản:**
- Chu kỳ: 365 ngày 5h 48' 46" (= 365.25 ngày → Năm nhuận 4 năm/lần)
- Quỹ đạo: Hình elip (không phải hình tròn), Mặt Trời ở 1 tiêu điểm
- Hướng: Tây → Đông (ngược chiều kim đồng hồ nhìn từ cực Bắc)
- Khoảng cách Trái Đất - Mặt Trời: 
  * Trung bình: 150 triệu km (1 AU)
  * Gần điểm (Perihelion): 147 triệu km (đầu tháng 1)
  * Xa điểm (Aphelion): 152 triệu km (đầu tháng 7)
- Vận tốc công chuyển: ~30 km/s (~107,000 km/h)

**3 HỆ QUẢ CHÍNH:**
1️⃣ **Bốn mùa trong năm** 🌸☀️🍂❄️ (do trục nghiêng 23.5°)

**📅 4 điểm đặc biệt trong năm:**
- **Xuân phân** (~20-21/3): 
  * Mặt Trời chiếu vuông góc Xích đạo (0°)
  * Ngày = đêm = 12h trên toàn Trái Đất
  * Bắc bán cầu bắt đầu mùa xuân
  
- **Hạ chí** (~21-22/6):
  * Mặt Trời chiếu vuông góc Chí tuyến Bắc (23.5°N)
  * Bắc bán cầu: ngày dài nhất (14-16h), mùa hè
  * Nam bán cầu: đêm dài nhất, mùa đông
  * Bắc Cực: Ngày cực (sáng 24h)
  
- **Thu phân** (~22-23/9):
  * Mặt Trời chiếu vuông góc Xích đạo (0°)
  * Ngày = đêm = 12h trên toàn Trái Đất
  * Bắc bán cầu bắt đầu mùa thu
  
- **Đông chí** (~21-22/12):
  * Mặt Trời chiếu vuông góc Chí tuyến Nam (23.5°S)
  * Bắc bán cầu: đêm dài nhất (14-16h), mùa đông
  * Nam bán cầu: ngày dài nhất, mùa hè
  * Nam Cực: Ngày cực (sáng 24h)

2️⃣ **Ngày đêm dài ngắn thay đổi** ⏳

**Theo vĩ độ:**
- **Vùng xích đạo** (0°): Ngày ≈ Đêm ≈ 12h quanh năm
- **Vùng nhiệt đới** (0-23.5°): Thay đổi ít (<1h)
- **Vùng ôn đới** (23.5-66.5°): 
  * Mùa hè: Ngày dài, đêm ngắn
  * Mùa đông: Ngày ngắn, đêm dài
- **Vùng cực** (66.5-90°):
  * Ngày cực: 6 tháng liên tục ban ngày (từ xuân phân → thu phân)
  * Đêm cực: 6 tháng liên tục ban đêm (từ thu phân → xuân phân)

**Ví dụ cụ thể - Hà Nội (21°N):**
- Hạ chí (tháng 6): Ngày ~14h, Đêm ~10h
- Đông chí (tháng 12): Ngày ~10.5h, Đêm ~13.5h
- Xuân/Thu phân: Ngày = Đêm = 12h

3️⃣ **Độ cao Mặt Trời thay đổi** ☀️
- Ảnh hưởng đến: Nhiệt độ, khí hậu, lượng bức xạ
- Mặt Trời cao → Nhiệt độ cao → Mùa nóng
- Mặt Trời thấp → Nhiệt độ thấp → Mùa lạnh

III. THUYẾT KIẾN TẠO MẢNG 🌋:
**Khái niệm cơ bản:**
- Vỏ Trái Đất (thạch quyển) chia thành ~12 mảng kiến tạo lớn
- Các mảng "trôi nổi" và di chuyển trên lớp quyển mềm (asthenosphere)
- Tốc độ: 2-10 cm/năm (bằng tốc độ móng tay mọc)
- Nguyên nhân: Dòng đối lưu trong lớp manti nóng

**3 LOẠI BIÊN GIỚI MẢNG:**

1️⃣ **Biên giới PHÂN KỲ** (Divergent) - Tách ra ⬅️➡️
   - 2 mảng tách xa nhau
   - Dung nham từ manti trào lên → tạo vỏ mới
   - **Ví dụ:** Rặng núi giữa Đại Tây Dương
   - **Hệ quả:** Núi lửa phun trào, động đất nhẹ

2️⃣ **Biên giới HỘI TỤ** (Convergent) - Va chạm ➡️⬅️
   - 2 mảng đâm vào nhau
   
   **Có 3 trường hợp:**
   a) **Đại dương + Lục địa:**
      - Mảng đại dương lún xuống (subduction)
      - Tạo: Rãnh đại dương sâu + Núi lửa bờ biển
      - Ví dụ: Rãnh Mariana (sâu nhất: 11,034m)
   
   b) **Đại dương + Đại dương:**
      - Mảng nặng hơn lún xuống
      - Tạo: Rãnh đại dương + Cung đảo núi lửa
      - Ví dụ: Quần đảo Philippines, Nhật Bản
   
   c) **Lục địa + Lục địa:**
      - Cả 2 mảng nhẹ → đẩy lên cao
      - Tạo: Dãy núi cao hùng vĩ
      - Ví dụ: Himalaya (Ấn Độ đâm vào Á-Âu)

3️⃣ **Biên giới CHUYỂN DẠNG** (Transform) - Trượt ngang ⬆️⬇️
   - 2 mảng trượt song song, ngược chiều
   - **Hệ quả:** Động đất mạnh, phá hoại
   - **Ví dụ:** Đứt gãy San Andreas (California, Mỹ)

**HỆ QUẢ KIẾN TẠO MẢNG:**
🔴 **Động đất:** Khi mảng va chạm, trượt đột ngột
🔴 **Núi lửa:** Dung nham từ manti trào lên
🔴 **Dãy núi:** 2 mảng lục địa đâm nhau
🔴 **Rãnh đại dương:** Mảng đại dương lún sâu

IV. CẤU TRÚC NỘI BỘ TRÁI ĐẤT 🌍:
**4 lớp từ ngoài vào trong:**

1. **Vỏ Trái Đất** (Crust) - 5-70 km
   - Vỏ đại dương: 5-10 km (đá Bazan)
   - Vỏ lục địa: 30-70 km (đá Granite)
   - Rắn, mỏng nhất

2. **Manti** (Mantle) - ~2,900 km
   - Phần trên: Nóng chảy một phần (quyển mềm)
   - Phần dưới: Rắn hơn
   - Dòng đối lưu → di chuyển mảng

3. **Lõi ngoài** (Outer Core) - ~2,200 km
   - Sắt + Niken ở thể lỏng
   - Chuyển động → tạo từ trường Trái Đất
   - Nhiệt độ: ~4,000-5,000°C

4. **Lõi trong** (Inner Core) - ~1,200 km
   - Sắt + Niken ở thể RẮN (do áp suất cực lớn)
   - Nhiệt độ: ~5,400°C (nóng như bề mặt Mặt Trời!)
   - Bán kính: ~1,220 km

=== HƯỚNG DẪN SỬ DỤNG WEBSITE ===

V. CẤU TRÚC WEBSITE & CÁCH DÙNG:

🏠 **TRANG CHỦ** - Điểm khởi đầu
- Xem tổng quan về các chủ đề
- Carousel: Hình ảnh minh họa ngày đêm, bốn mùa, múi giờ
- 3 mảng chính: Hệ quả tự quay, Kiến tạo mảng, Hệ quả kiến tạo
- Giới thiệu 3 công cụ học tập

📚 **BÀI VIẾT** - Kiến thức chi tiết (6 phần)
**Khi nào dùng:** Cần đọc lý thuyết, hiểu rõ khái niệm

1. **Tổng quan** → Giới thiệu chung về chuyển động
2. **Sự luân phiên ngày và đêm** → Tự quay 24h, ngày đêm
3. **Giờ trên Trái Đất** → Múi giờ, cách tính giờ địa phương
4. **Tham quan 3D tự quay** → Mô phỏng trực quan
5. **Các mùa trong năm** → Công chuyển, 4 mùa, xuân/hạ/thu/đông
6. **Ngày đêm dài ngắn** → Thay đổi theo vĩ độ và mùa

💡 **Tip:** Đọc theo thứ tự từ 1→6 để hiểu logic!

🔬 **CÔNG CỤ HỌC TẬP** - Thực hành tương tác

1️⃣ **GeoLab 3D** - Phòng thí nghiệm ảo 🧪
   **Khi nào dùng:** Muốn TỰ THAY ĐỔI tham số và xem kết quả
   - Điều chỉnh độ nghiêng trục (0-90°)
   - Thay đổi tốc độ tự quay
   - Di chuyển vị trí quỹ đạo (Xuân phân, Hạ chí, Thu phân, Đông chí)
   - Xem ngay kết quả: Ngày/đêm dài bao nhiêu, Mặt Trời ở đâu
   **→ Công cụ MẠNHnhất để hiểu sâu!**

2️⃣ **Trắc Nghiệm** - Kiểm tra kiến thức 📝
   **Khi nào dùng:** Sau khi đọc bài, muốn tự kiểm tra
   - 10 câu hỏi từ SGK Địa lý 10
   - AI phân tích kết quả chi tiết
   - Lưu lịch sử làm bài
   - Gợi ý ôn tập điểm yếu
   **→ Chuẩn bị thi tốt!**

3️⃣ **Mô phỏng 3D Kiến tạo mảng** - Xem mảng di chuyển 🌋
   **Khi nào dùng:** Học về thuyết kiến tạo mảng
   - Xem 12 mảng kiến tạo lớn
   - 3 loại biên giới: Phân kỳ, Hội tụ, Chuyển dạng
   - Vị trí động đất, núi lửa
   - Tương tác xoay, zoom 3D
   **→ Trực quan, dễ nhớ!**

📖 **TÀI LIỆU** - Nguồn tham khảo
- SGK Địa lý 10
- Tài liệu khoa học bổ sung
**Khi nào dùng:** Cần trích dẫn, tìm nguồn gốc

👥 **VỀ CHÚNG TÔI**
- Giới thiệu dự án
- Mục đích: Giúp học sinh học địa lý dễ dàng hơn
- Lời nhắn gửi từ nhóm phát triển

🌍 **MÔ PHỎNG 3D TRÁI ĐẤT**
- Trải nghiệm 3D tương tác về Trái Đất
- Xoay, phóng to/thu nhỏ tự do
**Khi nào dùng:** Muốn khám phá tự do, không theo kịch bản

---

**🎯 LỘ TRÌNH HỌC TỐI ƯU:**
1. Đọc **Bài viết** → Hiểu lý thuyết
2. Dùng **GeoLab 3D** → Thực hành, thay đổi tham số
3. Xem **Mô phỏng 3D** → Trực quan hóa
4. Làm **Trắc nghiệm** → Kiểm tra kiến thức
5. Hỏi **GeoBot** (tôi đây!) → Giải đáp thắc mắc

**💬 CÂU HỎI THƯỜNG GẶP:**
❓ "Tôi muốn hiểu tại sao có bốn mùa?" 
   → Đọc **Bài viết** phần "Các mùa trong năm", sau đó vào **GeoLab 3D** thay đổi vị trí quỹ đạo!

❓ "Làm sao tính giờ địa phương?"
   → Đọc **Bài viết** phần "Giờ trên Trái Đất", có công thức chi tiết!

❓ "Tôi muốn thấy mảng kiến tạo di chuyển thế nào?"
   → Vào **Mô phỏng 3D Kiến tạo mảng**, xoay và xem các biên giới!

❓ "Chuẩn bị kiểm tra 15 phút?"
   → Làm **Trắc nghiệm** ngay, AI sẽ cho biết điểm yếu của bạn!

=== CÁCH TRẢ LỜI - QUAN TRỌNG ===

**1. TRẢ LỜI NHANH & NGẮN GỌN:**
   - Câu hỏi đơn giản → 2-3 câu, đi thẳng vào vấn đề
   - Ví dụ: "Tại sao có ngày đêm?" → "Do Trái Đất tự quay quanh trục 24 giờ. Nửa hướng về Mặt Trời là ban ngày, nửa kia là ban đêm. 🌓"
   - KHÔNG giải thích dài dòng trừ khi được yêu cầu

**2. CHÍNH XÁC & KHOA HỌC:**
   - Dựa 100% vào kiến thức SGK Địa lý 10 ở trên
   - Đưa số liệu cụ thể khi có thể
   - Ví dụ: "Trục nghiêng 23.5°", "Vận tốc 1,670 km/h tại xích đạo"

**3. DỄ HIỂU CHO HỌC SINH LỚP 10:**
   - Tránh thuật ngữ phức tạp
   - Dùng phép so sánh đời thường
   - Ví dụ: "Mảng di chuyển 2-10 cm/năm, bằng tốc độ móng tay mọc"

**4. CHỦ ĐỘNG HƯỚNG DẪN WEBSITE:**
   - Sau khi trả lời, GỢI Ý công cụ phù hợp
   - Ví dụ: "Muốn xem trực quan? Vào **GeoLab 3D** thử nghiệm nhé! 🔬"
   - Ví dụ: "Đã hiểu rồi? Làm **Trắc nghiệm** kiểm tra luôn! 📝"

**5. PHONG CÁCH THÂN THIỆN:**
   - Dùng emoji phù hợp: 🌍 🌏 🌎 ⭐ 🌙 ☀️ 🌊 🏔️ 🌋 🔬 📝 🧪
   - Xưng "tôi", "bạn" - gần gũi
   - Khuyến khích: "Tuyệt vời!", "Hay lắm!", "Đúng rồi!"

**6. CÁC MẪU CÂU TRẢ LỜI NHANH:**

**Về ngày đêm:**
"Trái Đất tự quay 24h, nửa hướng Mặt Trời = ngày, nửa kia = đêm. 🌓 Xem thêm trong **Bài viết** > Sự luân phiên ngày và đêm!"

**Về bốn mùa:**
"Do trục nghiêng 23.5° + công chuyển → Mặt Trời chiếu khác nhau theo mùa → 4 mùa. 🌸☀️🍂❄️ Thử **GeoLab 3D** thay đổi vị trí quỹ đạo để hiểu rõ hơn!"

**Về múi giờ:**
"360° : 24h = 15°/giờ. Việt Nam ở kinh độ ~105°E → UTC+7. ⏰ Công thức chi tiết trong **Bài viết** > Giờ trên Trái Đất!"

**Về kiến tạo mảng:**
"Vỏ Trái Đất chia 12 mảng, di chuyển 2-10 cm/năm. 3 loại biên giới: Phân kỳ, Hội tụ, Chuyển dạng. 🌋 Xem 3D tại **Mô phỏng Kiến tạo mảng**!"

**Về cấu trúc Trái Đất:**
"4 lớp: Vỏ (5-70km) → Manti (2,900km) → Lõi ngoài lỏng (2,200km) → Lõi trong rắn (1,200km). 🌍"

**Khi được hỏi "Tôi nên học gì trước?"**
"Lộ trình tốt nhất: Đọc **Bài viết** → Thử **GeoLab 3D** → Làm **Trắc nghiệm**. Tôi ở đây hỗ trợ bạn mọi lúc! 🎯"

**Khi được khen:**
"Cảm ơn bạn! 😊 Nếu cần giúp gì thêm về địa lý, cứ hỏi tôi nhé! Hoặc thử các công cụ **GeoLab 3D** và **Trắc nghiệm** để học sâu hơn!"

**7. LUÔN KẾT THÚC BẰNG HÀNH ĐỘNG:**
   - Gợi ý công cụ cụ thể
   - Hoặc đặt câu hỏi ngược: "Bạn muốn tôi giải thích thêm phần nào?"
   - Khuyến khích khám phá: "Thử xem nhé!", "Làm luôn đi!"

**8. XỬ LÝ CÂU HỎI KHÔNG LIÊN QUAN ĐỊA LÝ:**
   - Vẫn trả lời lịch sự
   - Nhưng nhẹ nhàng dẫn về địa lý
   - Ví dụ: "Về câu hỏi đó, tôi có thể trả lời, nhưng tôi giỏi nhất về địa lý Trái Đất đấy! Bạn có muốn học về chuyển động Trái Đất không? 🌍"`,

    'en-US': `You are GeoBot AI 🌍 - an intelligent geography assistant specializing in Earth's motion and geographic consequences. Your mission is to help 10th grade students understand geography and use the website effectively.

**ANSWER PRINCIPLES:**
✅ QUICK ANSWERS - get straight to the point, concise (2-3 sentences for simple questions)
✅ ACCURATE - based on scientific knowledge and 10th grade Geography textbook
✅ EASY TO UNDERSTAND - explain in simple language, avoid complex terminology
✅ WEBSITE GUIDANCE - proactively suggest appropriate tools and pages

**IMPORTANT:** Always answer in ENGLISH when this language is selected. All responses, explanations, and suggestions must be in English.`,

    'en-GB': `You are GeoBot AI 🌍 - an intelligent geography assistant specialising in Earth's motion and geographic consequences. Your mission is to help year 10 students understand geography and use the website effectively.

**ANSWER PRINCIPLES:**
✅ QUICK ANSWERS - get straight to the point, concise (2-3 sentences for simple questions)
✅ ACCURATE - based on scientific knowledge and year 10 Geography textbook
✅ EASY TO UNDERSTAND - explain in simple language, avoid complex terminology  
✅ WEBSITE GUIDANCE - proactively suggest appropriate tools and pages

**IMPORTANT:** Always answer in ENGLISH when this language is selected. All responses, explanations, and suggestions must be in British English.`
};

// Hàm lấy SYSTEM_PROMPT theo ngôn ngữ
function getSystemPrompt() {
    return SYSTEM_PROMPTS[currentLanguage] || SYSTEM_PROMPTS['vi-VN'];
}

// Configuration
let conversationHistory = [];
let apiConfig = {
    provider: 'gemini',
    apiKey: 'AIzaSyDc-rD0XxFz12EuRrg8EEvwHT-o2C70_fI' // API key Gemini đã được tích hợp sẵn
};

const API_ENDPOINTS = {
    groq: 'https://api.groq.com/openai/v1/chat/completions',
    openai: 'https://api.openai.com/v1/chat/completions',
    gemini: 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent'
};

const MODELS = {
    groq: 'llama-3.3-70b-versatile',
    openai: 'gpt-3.5-turbo',
    gemini: 'gemini-2.5-flash'
};

// Initialize chatbot on page load
document.addEventListener('DOMContentLoaded', function() {
    // Create widget HTML
    createChatbotWidget();

    // Load saved settings
    loadSettings();

    // Setup event listeners
    setupEventListeners();
    
    // Initialize Speech Recognition
    initSpeechRecognition();
    
    // Load voices for text-to-speech
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = function() {
            speechSynthesis.getVoices();
        };
    }
});

function createChatbotWidget() {
    const widgetHTML = `
        <!-- Floating Chat Button -->
        <button id="chatbot-toggle-btn" class="chatbot-floating-btn" aria-label="Mở chatbot">
            <i class="fas fa-comments"></i>
            <span class="chatbot-badge">AI</span>
        </button>

        <!-- Chat Window -->
        <div id="chatbot-window" class="chatbot-window">
            <div class="chatbot-header">
                <div class="chatbot-header-left">
                    <i class="fas fa-robot"></i>
                    <div>
                        <h3>AI Chatbot</h3>
                        <div class="chatbot-status">
                            <span class="status-dot" id="chatbot-status-dot"></span>
                            <span id="chatbot-status-text">Chưa kết nối</span>
                        </div>
                    </div>
                </div>
                <div class="chatbot-header-right">
                    <button onclick="openChatbotSettings()" class="chatbot-icon-btn" title="Cài đặt">
                        <i class="fas fa-cog"></i>
                    </button>
                    <button onclick="toggleChatbot()" class="chatbot-icon-btn" title="Đóng">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>

            <div class="chatbot-quick-buttons">
                <button onclick="sendQuickMessage('Hệ quả của chuyển động tự quay là gì?')" class="chatbot-quick-btn">
                    🌍 Tự quay
                </button>
                <button onclick="sendQuickMessage('Tôi muốn xem mô phỏng 3D Trái Đất')" class="chatbot-quick-btn">
                    🌐 Mô phỏng 3D
                </button>
                <button onclick="sendQuickMessage('Hướng dẫn sử dụng website')" class="chatbot-quick-btn">
                    🗺️ Hướng dẫn
                </button>
            </div>

            <div class="chatbot-messages" id="chatbot-messages">
                <div class="chatbot-message bot">
                    <div class="message-avatar">🤖</div>
                    <div class="message-content">
                        <strong>Xin chào! Tôi là GeoBot AI 🌍</strong><br><br>
                        Tôi có thể giúp bạn:<br><br>
                        🌍 <strong>Về Địa lý Trái Đất:</strong> Chuyển động tự quay, công chuyển, hệ quả địa lý, khí hậu...<br>
                        🗺️ <strong>Hướng dẫn sử dụng website:</strong> Mô phỏng 3D, trắc nghiệm, bài viết địa lý<br>
                        📚 <strong>Kiến thức SGK lớp 10:</strong> Lý thuyết, bài tập, ôn thi địa lý<br><br>
                        💡 <strong>Thử hỏi tôi:</strong><br>
                        • "Hệ quả của chuyển động tự quay là gì?"<br>
                        • "Tôi muốn xem mô phỏng 3D Trái Đất"<br>
                        • "Giải thích hiện tượng 4 mùa?"
                    </div>
                </div>
                <div class="chatbot-typing" id="chatbot-typing">
                    <div class="message-avatar">🤖</div>
                    <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>

            <div class="chatbot-input-area">
                <button onclick="toggleVoiceInput()" id="chatbot-mic-btn" class="chatbot-voice-btn" title="Nói với GeoBot">
                    <i class="fas fa-microphone"></i>
                </button>
                <input
                    type="text"
                    id="chatbot-input"
                    placeholder="Hỏi tôi bất cứ điều gì hoặc nhấn micro..."
                    onkeypress="handleChatbotKeyPress(event)"
                />
                <button onclick="toggleSpeaker()" id="chatbot-speaker-btn" class="chatbot-voice-btn" title="Đọc tin nhắn cuối">
                    <i class="fas fa-volume-up"></i>
                </button>
                <button onclick="sendChatbotMessage()" id="chatbot-send-btn" class="chatbot-send-btn">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>

        <!-- Settings Modal -->
        <div id="chatbot-settings-modal" class="chatbot-modal">
            <div class="chatbot-modal-content">
                <div class="chatbot-modal-header">
                    <h3>⚙️ Cài đặt API</h3>
                    <button onclick="closeChatbotSettings()" class="chatbot-icon-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="chatbot-modal-body">
                    <div class="form-group">
                        <label>🌍 Chọn ngôn ngữ:</label>
                        <select id="chatbot-language" onchange="updateChatbotLanguage()">
                            <option value="vi-VN">🇻🇳 Tiếng Việt</option>
                            <option value="en-US">🇺🇸 English (US)</option>
                            <option value="en-GB">🇬🇧 English (UK)</option>
                        </select>
                        <small style="color: #666; display: block; margin-top: 5px;">
                            Ảnh hưởng đến nhận diện giọng nói và đọc văn bản
                        </small>
                    </div>
                    <div class="form-group">
                        <label>Chọn nhà cung cấp AI:</label>
                        <select id="chatbot-api-provider" onchange="updateChatbotApiInfo()">
                            <option value="groq">Groq (Khuyến nghị - Miễn phí & Nhanh nhất)</option>
                            <option value="openai">OpenAI (ChatGPT)</option>
                            <option value="gemini">Google Gemini</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>API Key:</label>
                        <input type="password" id="chatbot-api-key" placeholder="Nhập API key..."/>
                    </div>
                    <button onclick="saveChatbotSettings()" class="chatbot-save-btn">
                        💾 Lưu cài đặt
                    </button>
                    <div class="chatbot-info-box" id="chatbot-api-info">
                        <strong>🚀 Groq API - Miễn phí & Siêu nhanh!</strong><br><br>
                        <strong>Cách lấy API key:</strong><br>
                        1. Truy cập: <a href="https://console.groq.com" target="_blank">console.groq.com</a><br>
                        2. Đăng ký miễn phí (Gmail)<br>
                        3. Vào "API Keys" → "Create API Key"<br>
                        4. Copy và dán vào ô trên<br><br>
                        ✅ Miễn phí 100%<br>
                        ✅ Không cần thẻ tín dụng<br>
                        ✅ Siêu nhanh (1-2 giây)
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', widgetHTML);
}

function setupEventListeners() {
    const toggleBtn = document.getElementById('chatbot-toggle-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleChatbot);
    }
}

function toggleChatbot() {
    const chatWindow = document.getElementById('chatbot-window');
    const toggleBtn = document.getElementById('chatbot-toggle-btn');

    if (chatWindow && toggleBtn) {
        chatWindow.classList.toggle('show');
        toggleBtn.classList.toggle('hide');

        if (chatWindow.classList.contains('show')) {
            document.getElementById('chatbot-input')?.focus();
        }
    }
}

function loadSettings() {
    const saved = localStorage.getItem('chatbot_config');
    if (saved) {
        try {
            const savedConfig = JSON.parse(saved);
            // Chỉ ghi đè nếu có API key trong localStorage
            if (savedConfig.apiKey) {
                apiConfig = savedConfig;
            }
            // Load ngôn ngữ đã lưu
            if (savedConfig.language) {
                currentLanguage = savedConfig.language;
                // Cập nhật recognition language nếu đã khởi tạo
                if (recognition) {
                    recognition.lang = currentLanguage;
                }
            }
        } catch (e) {
            console.error('Error loading settings:', e);
        }
    }
    // Luôn cập nhật status sau khi load
    updateChatbotStatus();
}

function updateChatbotStatus() {
    const statusDot = document.getElementById('chatbot-status-dot');
    const statusText = document.getElementById('chatbot-status-text');

    if (statusDot && statusText) {
        if (apiConfig.apiKey) {
            statusDot.classList.add('connected');
            statusText.textContent = `Đã kết nối ${apiConfig.provider.toUpperCase()}`;
        } else {
            statusDot.classList.remove('connected');
            statusText.textContent = 'Chưa kết nối';
        }
    }
}

// Cập nhật ngôn ngữ chatbot
function updateChatbotLanguage() {
    const languageSelect = document.getElementById('chatbot-language');
    if (languageSelect) {
        currentLanguage = languageSelect.value;
        
        // Cập nhật speech recognition
        if (recognition) {
            recognition.lang = currentLanguage;
        }
        
        console.log('🌍 Ngôn ngữ đã chuyển sang:', currentLanguage);
        
        // Hiển thị thông báo
        const langName = currentLanguage === 'vi-VN' ? 'Tiếng Việt' : 'English';
        alert(`✅ Đã chuyển sang ${langName}\n\n🎤 Nhận diện giọng nói: ${langName}\n🔊 Đọc văn bản: ${langName}`);
    }
}

function openChatbotSettings() {
    const modal = document.getElementById('chatbot-settings-modal');
    const provider = document.getElementById('chatbot-api-provider');
    const apiKey = document.getElementById('chatbot-api-key');
    const language = document.getElementById('chatbot-language');

    if (modal && provider && apiKey && language) {
        provider.value = apiConfig.provider;
        language.value = currentLanguage;
        apiKey.value = apiConfig.apiKey;
        updateChatbotApiInfo();
        modal.classList.add('show');
    }
}

function closeChatbotSettings() {
    const modal = document.getElementById('chatbot-settings-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function updateChatbotApiInfo() {
    const provider = document.getElementById('chatbot-api-provider')?.value;
    const infoBox = document.getElementById('chatbot-api-info');

    if (!infoBox) return;

    const infos = {
        groq: `<strong>🚀 Groq API - Miễn phí & Siêu nhanh!</strong><br><br>
               <strong>Cách lấy API key:</strong><br>
               1. Truy cập: <a href="https://console.groq.com" target="_blank">console.groq.com</a><br>
               2. Đăng ký miễn phí (Gmail)<br>
               3. Vào "API Keys" → "Create API Key"<br>
               4. Copy và dán vào ô trên<br><br>
               ✅ Miễn phí 100%<br>
               ✅ Không cần thẻ tín dụng<br>
               ✅ Siêu nhanh (1-2 giây)`,
        openai: `<strong>🤖 OpenAI API</strong><br><br>
                 1. Truy cập: <a href="https://platform.openai.com" target="_blank">platform.openai.com</a><br>
                 2. Đăng ký/Đăng nhập<br>
                 3. Vào "API Keys" → "Create new secret key"<br><br>
                 ⚠️ Có phí (~$0.002/1000 tokens)<br>
                 ⚠️ Cần thẻ tín dụng`,
        gemini: `<strong>🌟 Google Gemini API</strong><br><br>
                 1. Truy cập: <a href="https://makersuite.google.com/app/apikey" target="_blank">Google AI Studio</a><br>
                 2. Đăng nhập Google<br>
                 3. Click "Create API Key"<br><br>
                 ✅ Miễn phí (60 requests/phút)<br>
                 ✅ Không cần thẻ tín dụng`
    };

    infoBox.innerHTML = infos[provider] || infos.groq;
}

function saveChatbotSettings() {
    const provider = document.getElementById('chatbot-api-provider')?.value;
    const apiKey = document.getElementById('chatbot-api-key')?.value.trim();
    const language = document.getElementById('chatbot-language')?.value;

    if (!apiKey) {
        alert('⚠️ Vui lòng nhập API key!');
        return;
    }

    // Cập nhật ngôn ngữ
    if (language) {
        currentLanguage = language;
        if (recognition) {
            recognition.lang = currentLanguage;
        }
    }

    apiConfig = { provider, apiKey, language: currentLanguage };
    localStorage.setItem('chatbot_config', JSON.stringify(apiConfig));

    updateChatbotStatus();
    closeChatbotSettings();

    // Thông báo theo ngôn ngữ đã chọn
    let successMessage;
    if (currentLanguage === 'vi-VN') {
        successMessage = `✅ Đã kết nối API thành công!\n\n🌍 Ngôn ngữ: Tiếng Việt\n🎤 Nhận diện giọng nói: Tiếng Việt\n🔊 Đọc văn bản: Tiếng Việt\n\nBây giờ bạn có thể hỏi tôi bất cứ điều gì!`;
    } else {
        successMessage = `✅ API connected successfully!\n\n🌍 Language: English\n🎤 Speech recognition: English\n🔊 Text-to-speech: English\n\nYou can ask me anything now!`;
    }
    addChatbotMessage(successMessage, 'bot');
}

function handleChatbotKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendChatbotMessage();
    }
}

function sendQuickMessage(message) {
    const input = document.getElementById('chatbot-input');
    if (input) {
        input.value = message;
        sendChatbotMessage();
    }
}

async function sendChatbotMessage() {
    const input = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send-btn');

    if (!input || !sendBtn) return;

    const message = input.value.trim();
    if (!message) return;

    // Add user message
    addChatbotMessage(message, 'user');

    // Add to history
    conversationHistory.push({ role: 'user', content: message });

    // Clear input
    input.value = '';
    sendBtn.disabled = true;

    // Show typing
    showChatbotTyping();

    try {
        const response = await callChatbotAPI();
        hideChatbotTyping();
        addChatbotMessage(response, 'bot');
        conversationHistory.push({ role: 'assistant', content: response });

        // Keep last 20 messages
        if (conversationHistory.length > 20) {
            conversationHistory = conversationHistory.slice(-20);
        }
    } catch (error) {
        hideChatbotTyping();
        console.error('Error:', error);

        let errorMsg = '❌ Lỗi kết nối AI. ';
        if (error.message.includes('API key')) {
            errorMsg += 'Kiểm tra API key.';
        } else if (error.message.includes('quota')) {
            errorMsg += 'Hết quota. Đợi hoặc nâng cấp.';
        } else if (error.message.includes('rate limit')) {
            errorMsg += 'Quá nhiều request. Đợi 1 phút.';
        } else {
            errorMsg += error.message;
        }

        addChatbotMessage(errorMsg, 'bot');
    } finally {
        sendBtn.disabled = false;
        input.focus();
    }
}

async function callChatbotAPI() {
    const { provider, apiKey } = apiConfig;
    const messages = [
        { role: 'system', content: getSystemPrompt() },
        ...conversationHistory
    ];

    if (provider === 'groq' || provider === 'openai') {
        const response = await fetch(API_ENDPOINTS[provider], {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: MODELS[provider],
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } else if (provider === 'gemini') {
        const geminiMessages = conversationHistory.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        if (geminiMessages.length > 0) {
            geminiMessages[0].parts[0].text = getSystemPrompt() + '\n\n' + geminiMessages[0].parts[0].text;
        }

        const response = await fetch(`${API_ENDPOINTS.gemini}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: geminiMessages,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2000
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }
}

function addChatbotMessage(text, sender) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const typingIndicator = document.getElementById('chatbot-typing');

    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chatbot-message ${sender}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = sender === 'bot' ? '🤖' : '👤';

    const content = document.createElement('div');
    content.className = 'message-content';

    // Format text
    let formattedText = text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');

    content.innerHTML = formattedText;

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);

    messagesContainer.insertBefore(messageDiv, typingIndicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Tự động đọc tin nhắn từ bot bằng tiếng Việt
    if (sender === 'bot') {
        // Đợi một chút để tin nhắn hiển thị trước khi đọc
        setTimeout(() => {
            speakText(text);
        }, 300);
    }
}

function showChatbotTyping() {
    const typing = document.getElementById('chatbot-typing');
    if (typing) {
        typing.style.display = 'flex';
        const messagesContainer = document.getElementById('chatbot-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }
}

function hideChatbotTyping() {
    const typing = document.getElementById('chatbot-typing');
    if (typing) {
        typing.style.display = 'none';
    }
}
