let questions = [];
let currentIndex = 0;
let answers = {};

// TIMER
let timerInterval;
let totalTime = 0;
let examStartTime = null;

async function initExam() {
    const sub = localStorage.getItem('selectedSubject');
    const lvl = localStorage.getItem('selectedLevel');
    const token = localStorage.getItem('token');

    const infoHeader = document.getElementById('exam-info');
    if (infoHeader) {
        infoHeader.innerText = `${sub} - ${lvl}`;
    }

    // TIMER SETUP
    if (lvl === "levelA") totalTime = 20 * 60;
    else if (lvl === "levelB") totalTime = 15 * 60;
    else if (lvl === "levelC") totalTime = 10 * 60;

    examStartTime = new Date();
    startTimer();

    try {
        const userRes = await fetch('http://localhost:5000/user-data', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const userData = await userRes.json();

        await fetch('http://localhost:5000/start-exam', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ subject: sub, level: lvl })
        });

        const attempts = userData.subjects[sub][lvl].attempts || 0;
        const setNumber = (attempts % 3) + 1;

        const res = await fetch(
            `http://localhost:5000/questions?subject=${sub}&level=${lvl}&setNumber=${setNumber}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );

        questions = await res.json();

        if (questions.length > 0) {
            renderQuestion();
        } else {
            document.getElementById('quiz-area').innerHTML =
                `<p style="color:white; text-align:center;">No questions found.</p>`;
        }

    } catch (err) {
        console.error(err);
    }
}

// TIMER
function startTimer() {
    const timerBox = document.getElementById("timer-box");

    timerInterval = setInterval(() => {
        const minutes = Math.floor(totalTime / 60);
        const seconds = totalTime % 60;

        timerBox.innerText = `⏱ ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        totalTime--;

        if (totalTime < 0) {
            clearInterval(timerInterval);
            submitExam();
        }
    }, 1000);
}

// ✅ FIXED OPTIONS UI
function renderQuestion() {
    const q = questions[currentIndex];
    const area = document.getElementById('quiz-area');
    if (!q) return;

    const letters = ['A', 'B', 'C', 'D'];

    area.innerHTML = `
        <div class="glass-card" style="padding: 30px; max-width: 800px; margin: 0 auto;">
            
            <p style="font-size: 1.3rem; margin-bottom: 20px; color: white;">
                <strong>Q${currentIndex + 1}:</strong> ${q.questionText}
            </p>

            <div>
                ${q.options.map((opt, i) => `
                    <label class="option-label">
                        <input type="radio" name="currentQ" value="${opt}" 
                        ${answers[currentIndex] === opt ? 'checked' : ''}>
                        
                        <span class="option-prefix">${letters[i]}.</span>
                        ${opt}
                    </label>
                `).join('')}
            </div>

            <div style="display:flex; justify-content:space-between; margin-top:30px;">
                <button onclick="prev()" style="${currentIndex === 0 ? 'visibility:hidden' : ''}">
                    Previous
                </button>

                <span style="color:white;">
                    ${currentIndex + 1} / ${questions.length}
                </span>

                ${currentIndex === questions.length - 1
            ? `<button onclick="submitExam()">Finish</button>`
            : `<button onclick="next()">Next</button>`}
            </div>

        </div>
    `;
}

function next() {
    saveAnswer();
    currentIndex++;
    renderQuestion();
}

function prev() {
    saveAnswer();
    currentIndex--;
    renderQuestion();
}

function saveAnswer() {
    const selected = document.querySelector('input[name="currentQ"]:checked');
    if (selected) answers[currentIndex] = selected.value;
}

// SUBMIT
async function submitExam() {
    clearInterval(timerInterval);
    saveAnswer();

    let score = 0;
    questions.forEach((q, i) => {
        if (answers[i] === q.correctAnswer) score++;
    });

    const finalScore = Math.round((score / questions.length) * 100);

    const token = localStorage.getItem('token');
    const subject = localStorage.getItem('selectedSubject');
    const level = localStorage.getItem('selectedLevel');

    const endTime = new Date();
    const timeTaken = Math.floor((endTime - examStartTime) / 1000);

    try {
        const response = await fetch('http://localhost:5000/submit-exam', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                subject,
                level,
                score: finalScore,
                timeTaken
            })
        });
        
        const userRes = await fetch('http://localhost:5000/user-data', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const userData = await userRes.json();

        window.userBadges = userData.badges || [];

        if (finalScore >= 60) {
            triggerCelebration(level, subject, finalScore);
        } else {
            showResultPage(false, finalScore);
        }

    } catch (err) {
        console.error(err);
        alert("Error submitting exam");
    }
}

function triggerCelebration(level, subject, score) {
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });

        if (Date.now() < end) requestAnimationFrame(frame);
    })();

    showResultPage(true, score);
}
function showResultPage(isPassed, score) {
    const area = document.getElementById('quiz-area');

    const subject = localStorage.getItem('selectedSubject');
    const level = localStorage.getItem('selectedLevel');

    let badgeHTML = "";

    if (isPassed && window.userBadges) {
        const badge = window.userBadges.find(
            b => b.subject === subject && b.level === level
        );

        if (badge && badge.badgeId) {
            const imageUrl = "http://localhost:5000" + badge.badgeId.image;

            badgeHTML = `
                <p style="color:#00ff88;">Badge Earned 🏅</p>

                <div style="margin:15px 0;">
                    <img src="${imageUrl}" 
                         style="width:80px; height:80px; border-radius:10px;" />
                </div>

                <a href="${imageUrl}" download 
                   style="color:#00d2ff; text-decoration:none;">
                   ⬇ Download Badge
                </a>
            `;
        }
    }

    area.innerHTML = `
        <div style="text-align:center; color:white;">
            <h1>${isPassed ? "Passed 🎉" : "Failed ❌"}</h1>
            <h2>${score}%</h2>

            ${isPassed
            ? badgeHTML
            : `
                    <button class="retake" onclick="goToExam('${subject}','${level}')">
                        Retake Exam
                    </button>
                `
        }

            <br><br>

            <button onclick="window.location.href='dashboard.html'">
                Back to Dashboard
            </button>
        </div>
    `;
}
function goToExam(sub, lvl) {
    localStorage.setItem('selectedSubject', sub);
    localStorage.setItem('selectedLevel', lvl);

    // reload exam properly
    window.location.href = 'exam.html?retry=' + Date.now();
}

window.onload = initExam;