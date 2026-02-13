/**
 * Cloudflare Worker: AI Running Coach (coach.gios.blog)
 * Phase 5.1: Cleaned up UI (Removed top nav, added footer tool links).
 */

const BANNER_POOL = [
  {
    link: 'https://link.coupang.com/a/dCrdiR', 
    text: '⌚️ 페이스/고도 측정의 필수품',
    sub: '가민(Garmin) GPS 워치 최저가 확인하기'
  },
  {
    link: 'https://link.coupang.com/a/dyj430', 
    text: '⚡️ 장거리 산행/러닝 에너지 보급',
    sub: '에너지젤 로켓배송'
  },
  {
    link: 'https://link.coupang.com/a/dCreW3', 
    text: '🦵 하산할 때 무릎이 걱정된다면?',
    sub: '잠스트 무릎 보호대'
  },
  {
    link: 'https://link.coupang.com/a/dCrhi0', 
    text: '🎒 트레일러닝 조끼/배낭 모음',
    sub: '살로몬/카멜백 베스트셀러 구경하기'
  }
];

export default {
  async fetch(request, env) {
    if (request.method === 'POST') {
      try {
        const body = await request.json();
        const { userData, currentDate, question, history } = body;

        const systemPrompt = `
          너는 러너와 트레일러너들을 돕는 전문적이고 친절한 'AI 러닝 코치'야. (인간 코치나 의사인 척 하지 마).
          아래 유저의 상태를 바탕으로 데이터에 기반한 맞춤형 훈련 플랜과 조언을 작성해줘.

          [유저 정보]
          - 오늘 날짜: ${currentDate}
          - 대회 종목: ${userData.goal}
          - 세부 목표(기록 또는 코스스펙): ${userData.target}
          - 목표 대회 날짜(훈련 종료일): ${userData.raceDate}
          - 현재 10km 기록: ${userData.level}
          - 최근 2개월 내 불편한 곳: ${userData.injury}
          - 주당 훈련 일수: ${userData.days}

          [답변 필수 가이드라인 - 반드시 지킬 것]
          1. 날짜 계산: 오늘 날짜(${currentDate})와 대회 날짜(${userData.raceDate})를 정확히 비교해서 남은 기간(주차)을 파악해라. 엉뚱한 연도를 말하지 마라.
          2. 부상 해석: '최근 2개월 내 부상 없음'을 '평생 부상이 없었다'고 과장하지 마라. "최근 컨디션 관리를 잘하셨네요" 정도로만 언급해라. 부상이 있다면 무리하지 않도록 보강 훈련을 조언해라.
          3. 스케줄: 전체 훈련의 큰 그림을 짧게 설명하고, **대회 전 마지막 12주(남은 기간이 12주보다 짧다면 전체 기간)에 대해서는 '주 단위(Week 1, Week 2...)'로 구체적인 요일별 스케줄표**를 작성해라.
          4. 트레일러닝 특화: 만약 유저의 종목이 '트레일러닝'이라면, 유저가 입력한 '상승고도' 데이터를 분석하여 주말 장거리 훈련에 '언덕 훈련(Hill repeat)', '계단 훈련', '하체 보강' 등을 스케줄에 반드시 포함시켜라. 도로 러닝이라면 페이스 훈련에 집중해라.
          5. 형식: 사용자가 보기 편하도록 HTML 태그(<h3>, <strong>, <ul>, <li>, <br>, <p> 등)를 적극 사용해서 문단을 깔끔하게 나눠라. 마크다운(\`\`\`)은 쓰지 마라.
        `;

        const contents = history.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }]
        }));
        contents.push({ role: 'user', parts: [{ text: question }] });

        const apiKey = env.GEMINI_API_KEY;
        if (!apiKey) {
          return new Response("<h3>API 키가 설정되지 않았습니다. Cloudflare 변수를 확인하세요.</h3>", { status: 500 });
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const aiResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: contents
          })
        });

        if (!aiResponse.ok) {
          const errData = await aiResponse.text();
          throw new Error("API 연동 오류: " + errData);
        }

        const data = await aiResponse.json();
        const replyText = data.candidates[0].content.parts[0].text;

        return new Response(JSON.stringify({ reply: replyText }), {
          headers: { 'Content-Type': 'application/json;charset=UTF-8' }
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // --- 프론트엔드 UI (GET) ---
    const randomBanner = BANNER_POOL[Math.floor(Math.random() * BANNER_POOL.length)];

    const html = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI 러닝 코치 | GIOS</title>
        <style>
          :root { --primary: #059669; --primary-light: #d1fae5; --bg: #f0fdf4; --text: #0f172a; --gray: #64748b; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 20px; line-height: 1.6; }
          .container { max-width: 650px; margin: 0 auto; background: white; padding: 30px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          
          header { text-align: center; margin-bottom: 25px; }
          h1 { margin: 0; font-size: 2rem; color: #166534; letter-spacing: -0.5px; }
          .subtitle { color: var(--gray); font-size: 1rem; margin-top: 5px; }

          /* 쿠팡 배너 스타일 */
          .ad-banner { display: block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; text-decoration: none; padding: 15px; border-radius: 12px; text-align: center; margin-bottom: 25px; transition: transform 0.2s; }
          .ad-banner:hover { transform: translateY(-2px); }

          .section-title { font-size: 1.1rem; font-weight: bold; margin: 25px 0 10px 0; color: #1e293b; }
          
          .option-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; }
          .option-btn { background: white; border: 2px solid #e2e8f0; padding: 12px; border-radius: 12px; font-size: 0.95rem; font-weight: 600; color: var(--gray); cursor: pointer; transition: all 0.2s; outline: none; }
          .option-btn:hover { border-color: #94a3b8; }
          .option-btn.active { background: var(--primary-light); border-color: var(--primary); color: var(--primary); }
          
          .input-field { width: 100%; padding: 14px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1.05rem; font-family: inherit; outline: none; background: white; color: var(--text); cursor: pointer; box-sizing: border-box; }
          .input-field:focus { border-color: var(--primary); }

          .flex-inputs { display: flex; gap: 10px; }

          .submit-btn {
            width: 100%; background: var(--primary); color: white; border: none; padding: 16px; border-radius: 16px; font-size: 1.2rem; font-weight: bold; margin-top: 30px; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 10px; transition: transform 0.1s;
          }
          .submit-btn:active { transform: scale(0.98); }
          .submit-btn:disabled { background: #94a3b8; cursor: not-allowed; }
          .spinner { display: none; width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: white; animation: spin 1s infinite linear; }
          @keyframes spin { to { transform: rotate(360deg); } }

          #chatSection { display: none; margin-top: 20px; }
          .chat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; max-height: 600px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; }
          
          .msg-bubble { padding: 15px; border-radius: 16px; max-width: 90%; word-break: break-word; line-height: 1.6; }
          .msg-model { background: white; border: 1px solid #e2e8f0; align-self: flex-start; border-bottom-left-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
          .msg-user { background: var(--primary); color: white; align-self: flex-end; border-bottom-right-radius: 4px; box-shadow: 0 2px 4px rgba(5,150,105,0.2); }
          
          .msg-model h3 { color: #064e3b; margin: 20px 0 10px 0; border-bottom: 2px solid #d1fae5; padding-bottom: 5px; font-size:1.2rem;}
          .msg-model h3:first-child { margin-top: 0; }
          .msg-model ul { margin: 0; padding-left: 20px; }
          .msg-model li { margin-bottom: 5px; }
          
          .chat-input-area { display: flex; gap: 10px; margin-top: 15px; }
          .chat-input { flex: 1; padding: 14px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1rem; outline: none; }
          .chat-input:focus { border-color: var(--primary); }
          .chat-send-btn { background: var(--primary); color: white; border: none; padding: 0 20px; border-radius: 12px; font-weight: bold; cursor: pointer; transition: 0.2s; white-space: nowrap; }
          .chat-send-btn:hover { background: #047857; }
          .chat-send-btn:disabled { background: #94a3b8; }
          
          .reset-btn { display: block; text-align: center; color: var(--gray); margin-top: 20px; text-decoration: none; font-size: 0.9rem; font-weight: bold; cursor: pointer; border: none; background: none; width: 100%; }
          .reset-btn:hover { color: var(--text); }

          /* [추가] 하단 패밀리 링크 (도구 모음) */
          .footer-links {
            display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 50px; margin-bottom: 20px;
          }
          .footer-links a {
            background: white; color: var(--gray); padding: 8px 16px; border-radius: 20px; 
            text-decoration: none; font-size: 0.85rem; font-weight: 600; 
            border: 1px solid #e2e8f0; transition: all 0.2s;
          }
          .footer-links a:hover {
            color: var(--primary); border-color: var(--primary); background: var(--bg); transform: translateY(-2px);
          }

          .footer-disclaimer { text-align: center; font-size: 0.8rem; color: #94a3b8; margin-top: 10px; }
        </style>
      </head>
      <body>

        <div class="container" id="mainContainer">
          
          <header>
            <h1>🏃‍♂️ AI 러닝 코치</h1>
            <p class="subtitle">나의 상태를 선택하고 맞춤형 훈련 플랜을 받아보세요.</p>
          </header>

          <a href="${randomBanner.link}" target="_blank" class="ad-banner">
            ${randomBanner.text}<br>
            <span style="font-size:0.85rem; opacity:0.8;">${randomBanner.sub}</span>
          </a>

          <div id="formSection">
            <div class="section-title">🎯 이번 훈련의 목표는 무엇인가요?</div>
            <div class="option-grid" id="goal-group">
              <button class="option-btn" onclick="selectGoal('10km', this)">10km</button>
              <button class="option-btn" onclick="selectGoal('하프 마라톤', this)">하프 마라톤</button>
              <button class="option-btn" onclick="selectGoal('풀 코스', this)">풀 마라톤</button>
              <button class="option-btn" onclick="selectGoal('트레일러닝', this)">트레일러닝</button>
            </div>

            <div id="dynamicTargetSection" style="display: none;">
              <div class="section-title" id="targetTitle">⏱️ 목표 기록을 선택해주세요</div>
              
              <select id="targetTimeSelect" class="input-field" style="display:none;">
              </select>

              <div id="trailInputGroup" class="flex-inputs" style="display:none;">
                <input type="number" id="trailDist" class="input-field" placeholder="예: 50 (km)" min="1">
                <input type="number" id="trailEle" class="input-field" placeholder="예: 2500 (m)" min="1">
              </div>
            </div>

            <div class="section-title">📊 현재 10km 기록 (대략적으로)</div>
            <div class="option-grid" id="level-group">
              <button class="option-btn" onclick="selectOption('level', '초보 (60분 이상)', this)">초보 (60분 이상)</button>
              <button class="option-btn" onclick="selectOption('level', '중급 (50분대)', this)">중급 (50분대)</button>
              <button class="option-btn" onclick="selectOption('level', '고급 (40분대 이하)', this)">고급 (40분대 이하)</button>
            </div>

            <div class="section-title">⏱️ 목표 대회 날짜 (또는 훈련 종료일)</div>
            <input type="date" id="raceDate" class="input-field" onchange="userData.raceDate = this.value">

            <div class="section-title">🩹 최근 2개월 내 불편한 곳이 있었나요?</div>
            <div class="option-grid" id="injury-group">
              <button class="option-btn active" onclick="selectOption('injury', '없음 (최근 컨디션 좋음)', this)">없음 (건강함)</button>
              <button class="option-btn" onclick="selectOption('injury', '무릎 (장경인대 등)', this)">무릎/관절</button>
              <button class="option-btn" onclick="selectOption('injury', '발목/아킬레스건', this)">발목/종아리</button>
              <button class="option-btn" onclick="selectOption('injury', '족저근막염', this)">발바닥</button>
            </div>

            <div class="section-title">📅 일주일에 며칠 운동할 수 있나요?</div>
            <div class="option-grid" id="days-group">
              <button class="option-btn" onclick="selectOption('days', '주 2~3회', this)">주 2~3회</button>
              <button class="option-btn" onclick="selectOption('days', '주 4회', this)">주 4회</button>
              <button class="option-btn" onclick="selectOption('days', '주 5회 이상', this)">주 5회 이상</button>
            </div>

            <button class="submit-btn" id="submitBtn" onclick="startCoaching()">
              <span class="spinner" id="spinner"></span>
              <span id="btnText">✨ 12주 훈련 플랜 만들기</span>
            </button>
          </div>

          <div id="chatSection">
            <div class="chat-box" id="chatBox"></div>
            <div class="chat-input-area">
              <input type="text" id="chatInput" class="chat-input" placeholder="코치에게 추가로 질문해보세요! (예: 화/목으로 바꿔줘)" onkeypress="handleEnter(event)">
              <button class="chat-send-btn" id="sendBtn" onclick="sendMessage()">전송</button>
            </div>
            <button class="reset-btn" onclick="location.reload()">처음부터 다시 설정하기 ↺</button>
          </div>

          <div class="footer-links">
            <a href="https://gpx.gios.blog">⛰️ GPX 분석기</a>
            <a href="https://checklist.gios.blog">🎒 대회 준비물 체크</a>
            <a href="https://predict.gios.blog">⏱️ 기록 예측기</a>
            <a href="https://utmb-races.gios.blog">🏔️ UTMB 대회 정보</a>
          </div>

          <footer class="footer-disclaimer">
            이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
          </footer>

        </div>

        <script>
          const userData = {
            goal: '', target: '', level: '', raceDate: '', 
            injury: '없음 (최근 컨디션 좋음)', days: ''
          };
          
          let chatHistory = []; 

          const TIME_OPTIONS = {
            '10km': ['35분','40분','45분','50분','55분','1시간 00분','1시간 05분','1시간 10분','1시간 15분','1시간 20분','1시간 25분','1시간 30분'],
            '하프 마라톤': ['1시간 30분','1시간 35분','1시간 40분','1시간 45분','1시간 50분','1시간 55분','2시간 00분','2시간 05분','2시간 10분','2시간 15분','2시간 20분','2시간 25분','2시간 30분'],
            '풀 코스': ['2시간 40분','2시간 50분','3시간 00분','3시간 10분','3시간 20분','3시간 30분','3시간 40분','3시간 50분','4시간 00분','4시간 15분','4시간 30분','4시간 45분','5시간 00분','5시간 15분','5시간 30분']
          };

          window.onload = () => {
            const today = new Date();
            today.setHours(today.getHours() + 9);
            document.getElementById('raceDate').setAttribute('min', today.toISOString().split('T')[0]);
          };

          function selectGoal(value, element) {
            selectOption('goal', value, element);
            
            const dynamicSec = document.getElementById('dynamicTargetSection');
            const timeSel = document.getElementById('targetTimeSelect');
            const trailGrp = document.getElementById('trailInputGroup');
            const targetTitle = document.getElementById('targetTitle');
            
            dynamicSec.style.display = 'block';
            
            if (value === '트레일러닝') {
              targetTitle.innerText = '⛰️ 대회 거리와 예상 상승고도(m)';
              timeSel.style.display = 'none';
              trailGrp.style.display = 'flex';
              timeSel.value = ''; 
            } else {
              targetTitle.innerText = '⏱️ 목표 기록을 선택해주세요';
              trailGrp.style.display = 'none';
              timeSel.style.display = 'block';
              document.getElementById('trailDist').value = ''; 
              document.getElementById('trailEle').value = '';
              
              timeSel.innerHTML = '<option value="" disabled selected>목표 기록 선택</option>';
              TIME_OPTIONS[value].forEach(opt => {
                timeSel.innerHTML += \`<option value="\${opt}">\${opt}</option>\`;
              });
            }
          }

          function selectOption(group, value, element) {
            userData[group] = value;
            const buttons = document.querySelectorAll(\`#\${group}-group .option-btn\`);
            buttons.forEach(btn => btn.classList.remove('active'));
            element.classList.add('active');
          }

          async function startCoaching() {
            if(userData.goal === '트레일러닝') {
               const dist = document.getElementById('trailDist').value;
               const ele = document.getElementById('trailEle').value;
               if(!dist || !ele) { alert('트레일러닝 거리와 상승고도를 모두 입력해주세요.'); return; }
               userData.target = \`거리 \${dist}km, 상승고도 \${ele}m\`;
            } else {
               const time = document.getElementById('targetTimeSelect').value;
               if(!time) { alert('목표 기록을 선택해주세요.'); return; }
               userData.target = \`목표 기록: \${time}\`;
            }

            if (!userData.goal || !userData.level || !userData.raceDate || !userData.days) {
              alert('모든 항목(날짜 포함)을 선택해주세요!');
              return;
            }

            document.getElementById('formSection').style.display = 'none';
            document.getElementById('chatSection').style.display = 'block';
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            const initialQuestion = "위의 정보를 바탕으로 나만을 위한 구체적인 12주 훈련 계획표를 짜주세요.";
            await askAI(initialQuestion, true);
          }

          function handleEnter(e) {
            if (e.key === 'Enter') sendMessage();
          }

          async function sendMessage() {
            const inputEl = document.getElementById('chatInput');
            const text = inputEl.value.trim();
            if (!text) return;

            inputEl.value = ''; 
            appendMessage('user', text); 
            await askAI(text, false);    
          }

          function appendMessage(role, htmlContent, isInitial = false) {
            const chatBox = document.getElementById('chatBox');
            const div = document.createElement('div');
            div.className = \`msg-bubble msg-\${role}\`;
            div.innerHTML = htmlContent;
            chatBox.appendChild(div);
            
            if (isInitial) {
              chatBox.scrollTop = 0;
            } else {
              chatBox.scrollTop = chatBox.scrollHeight; 
            }
            return div; 
          }

          async function askAI(questionText, isInitial = false) {
            const sendBtn = document.getElementById('sendBtn');
            const inputEl = document.getElementById('chatInput');
            
            sendBtn.disabled = true;
            inputEl.disabled = true;
            let loadingBubble = null;
            
            if (isInitial) {
              loadingBubble = appendMessage('model', '<span class="spinner" style="display:inline-block; border-top-color:var(--primary); width:15px; height:15px; border-width:2px;"></span> 코치가 12주 계획표를 작성 중입니다 (15~30초 소요)...', true);
            } else {
              loadingBubble = appendMessage('model', '<span class="spinner" style="display:inline-block; border-top-color:var(--primary); width:15px; height:15px; border-width:2px;"></span> 답변을 고민 중입니다...');
            }

            try {
              const today = new Date();
              today.setHours(today.getHours() + 9);
              const currentDate = today.toISOString().split('T')[0];

              const payload = {
                userData,
                currentDate,
                question: questionText,
                history: chatHistory
              };

              const response = await fetch(window.location.href, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });

              const data = await response.json();
              if (!response.ok) throw new Error(data.error || "서버 오류");

              loadingBubble.remove();
              appendMessage('model', data.reply, isInitial);

              chatHistory.push({ role: 'user', content: questionText });
              chatHistory.push({ role: 'model', content: data.reply });

            } catch (error) {
              loadingBubble.innerHTML = \`<strong style="color:red;">오류 발생:</strong> \${error.message}<br>잠시 후 다시 시도해주세요.\`;
            } finally {
              sendBtn.disabled = false;
              inputEl.disabled = false;
              inputEl.focus();
            }
          }
        </script>
      </body>
      </html>
    `;

    return new Response(html, {
      headers: { 'content-type': 'text/html;charset=UTF-8' },
    });
  },
};
