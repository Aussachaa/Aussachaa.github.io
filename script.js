// --- Configuration ---
// !!! สำคัญ: แก้ไข URL นี้เป็น Production URL ของ Webhook n8n ของคุณ !!!
const N8N_WEBHOOK_URL = 'https://5524-184-22-101-28.ngrok-free.app/webhook/testweb';
// ---------------------

// ดึง Element ต่างๆ จากหน้า HTML
const userNameInput = document.getElementById('userName');
const userPromptInput = document.getElementById('userPrompt');
const submitButton = document.getElementById('submitBtn');
const resultArea = document.getElementById('resultArea');
const loadingIndicator = document.getElementById('loading');

// เพิ่ม Event Listener ให้กับปุ่ม Submit
submitButton.addEventListener('click', async () => {
    // 1. ดึงข้อมูลจาก Input
    const userName = userNameInput.value.trim();
    const userPrompt = userPromptInput.value.trim();

    // ตรวจสอบว่าใส่ข้อมูลครบหรือไม่ (เบื้องต้น)
    if (!userName || !userPrompt) {
        alert('กรุณากรอกข้อมูลให้ครบทั้งชื่อและคำสั่ง');
        return; // หยุดการทำงานถ้าข้อมูลไม่ครบ
    }

    // 2. แสดงสถานะกำลังโหลด และล้างผลลัพธ์เก่า
    loadingIndicator.style.display = 'block'; // แสดง "กำลังประมวลผล..."
    resultArea.textContent = ''; // ล้างผลลัพธ์เดิม
    submitButton.disabled = true; // ปิดปุ่มชั่วคราวกันกดซ้ำ
    resultArea.textContent = 'กำลังรอผลลัพธ์จาก AI...'; // ข้อความเริ่มต้น

    // 3. เตรียมข้อมูลที่จะส่งไปยัง n8n (ต้องเป็น JSON)
    const dataToSend = {
        userName: userName,
        userPrompt: userPrompt
        // คุณสามารถเพิ่มข้อมูลอื่นๆ ที่ต้องการส่งไปได้ตรงนี้
    };

    // 4. ส่ง Request ไปยัง n8n Webhook ด้วย Fetch API
    try {
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST', // ใช้ Method POST ตามที่ตั้งค่าใน n8n Webhook
            headers: {
                'Content-Type': 'application/json',
                // หาก n8n Webhook มีการตั้งค่า Authentication (เช่น Header Auth) ให้เพิ่ม header ตรงนี้
                // 'Authorization': 'Bearer YOUR_TOKEN'
            },
            body: JSON.stringify(dataToSend) // แปลง Object เป็น JSON string
        });

        // 5. ตรวจสอบว่า n8n ตอบกลับมาสำเร็จหรือไม่
        if (!response.ok) {
            // ถ้าเกิด Error จากฝั่ง n8n (เช่น status code ไม่ใช่ 2xx)
            const errorText = await response.text(); // ลองอ่านข้อความ error
            throw new Error(`n8n Workflow Error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        // 6. แปลง Response ที่ได้จาก n8n เป็น JSON
        const resultData = await response.json();

        // 7. แสดงผลลัพธ์ที่ได้จาก n8n
        // *** สำคัญ: แก้ไข 'result' ให้ตรงกับ key ของข้อมูลผลลัพธ์ที่คุณส่งกลับมาจาก n8n ***
        // สมมติว่า n8n ส่งกลับมาเป็น { "result": "ข้อความที่ AI สร้าง" }
        if (resultData && resultData.result) {
            resultArea.textContent = resultData.result;
        } else {
            // กรณี n8n ไม่ได้ส่ง key ชื่อ 'result' กลับมา หรือโครงสร้างไม่ตรง
            resultArea.textContent = 'ได้รับข้อมูลตอบกลับ แต่ไม่พบ key "result" หรือมีโครงสร้างไม่ถูกต้อง:\n' + JSON.stringify(resultData, null, 2);
        }

    } catch (error) {
        // 8. จัดการ Error ที่อาจเกิดขึ้น (เช่น Network Error, URL ผิด)
        console.error('Error calling n8n webhook:', error);
        resultArea.textContent = `เกิดข้อผิดพลาด: ${error.message}`;
        alert(`เกิดข้อผิดพลาดในการเชื่อมต่อกับ Agent: ${error.message}`); // แจ้งเตือนผู้ใช้ด้วย
    } finally {
        // 9. ไม่ว่าจะสำเร็จหรือล้มเหลว: ซ่อนสถานะกำลังโหลด และเปิดปุ่มให้กดได้อีกครั้ง
        loadingIndicator.style.display = 'none';
        submitButton.disabled = false;
    }
});