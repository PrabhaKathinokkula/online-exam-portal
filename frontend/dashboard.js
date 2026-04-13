document.addEventListener('DOMContentLoaded', async () => {
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token');
    const container = document.getElementById('dashboard-content');
    const userDisplay = document.getElementById('user-display');

    if (!username || !token) {
        window.location.href = 'index.html';
        return;
    }

    userDisplay.innerText = username;
    const profilePic = document.getElementById('profile-pic');

    if (profilePic && username) {
        profilePic.innerText = username.charAt(0);
    }

    try {
        const response = await fetch('http://localhost:5000/user-data', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        window.userBadges = data.badges || [];
        const subjects = data.subjects;

        container.innerHTML = '';

        for (const [subName, levels] of Object.entries(subjects)) {

            const subjectDiv = document.createElement('div');
            subjectDiv.style.width = '100%';
            subjectDiv.style.maxWidth = '900px';

            subjectDiv.innerHTML = `
                <h2 style="color:#00d2ff; margin-bottom:15px;">${subName}</h2>
                <div style="display:flex; gap:20px; flex-wrap:wrap;">
                    ${createLevelCard(subName, 'levelA', levels.levelA)}
                    ${createLevelCard(subName, 'levelB', levels.levelB)}
                    ${createLevelCard(subName, 'levelC', levels.levelC)}
                </div>
            `;

            container.appendChild(subjectDiv);
        }

    } catch (err) {
        console.error(err);
        container.innerHTML = `<p style="color:red;">Error loading dashboard</p>`;
    }
});

// ✅ LEVEL CARD WITH COOLDOWN
function createLevelCard(subject, levelKey, data) {

    const isLocked = data.status === "locked";
    const isPassed = data.status === "passed";
    const attempted = data.attempts > 0;

    let content = "";

    // 🔒 LOCKED LEVEL
    if (isLocked) {
        content = `<p class="locked">Locked</p>`;
    }

    // ▶ FIRST TIME
    else if (!attempted) {
        content = `
            <button onclick="goToExam('${subject}','${levelKey}')">
                Start Exam
            </button>
        `;
    }

    else {
        const attempts = data.attempts || 0;
        const isFailed = !isPassed;

        let cooldownUI = "";

        // ✅ CHECK COOLDOWN (3,6,9...)
        if (isFailed && attempts % 3 === 0 && data.endTime) {

            const endTime = new Date(data.endTime).getTime();
            const unlockTime = endTime + (24 * 60 * 60 * 1000);

            const remaining = unlockTime - Date.now();

            if (remaining > 0) {
                const timerId = `timer-${subject}-${levelKey}`;

                cooldownUI = `
                    <p class="failed">Failed</p>
                    <button disabled style="opacity:0.5; cursor:not-allowed;">
                        Locked (24h cooldown)
                    </button>
                    <p id="${timerId}" style="margin-top:5px; color:#ffcc00;"></p>
                `;

                // Start timer after render
                setTimeout(() => {
                    startCooldownTimer(timerId, unlockTime);
                }, 100);
            }
        }

        // NORMAL CONTENT
        if (!cooldownUI) {
            content = `
                <p>Score: ${data.score}%</p>
                <p>Time: ${formatTime(data.timeTaken)}</p>
                <p>Attempts: ${attempts}</p>

                ${isPassed
                    ? `
    <p class="completed">Completed</p>

    ${getBadgeUI(subject, levelKey)}
`
                    : `
                        <p class="failed">Failed</p>
                        <button class="retake" onclick="goToExam('${subject}','${levelKey}')">
                            Retake
                        </button>
                    `
                }
            `;
        } else {
            content = `
                <p>Score: ${data.score}%</p>
                <p>Time: ${formatTime(data.timeTaken)}</p>
                <p>Attempts: ${attempts}</p>
                ${cooldownUI}
            `;
        }
    }

    return `
        <div class="glass-card ${isLocked ? 'locked-card' : ''}" 
             style="flex:1; min-width:220px; text-align:center; padding:20px;">
             
            <h3>${levelKey.replace('level', 'Level ')}</h3>
            ${content}

        </div>
    `;
}

// ⏱ COOLDOWN TIMER
function startCooldownTimer(elementId, unlockTime) {
    const el = document.getElementById(elementId);

    const interval = setInterval(() => {
        const diff = unlockTime - Date.now();

        if (diff <= 0) {
            clearInterval(interval);
            el.innerText = "Unlocked! Refresh page";
            return;
        }

        const hrs = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        el.innerText = `Unlock in ${hrs}h ${mins}m ${secs}s`;
    }, 1000);
}

// FORMAT TIME
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0s";

    const m = Math.floor(seconds / 60);
    const s = seconds % 60;

    return `${m}m ${s}s`;
}

// NAVIGATION
function goToExam(sub, lvl) {
    localStorage.setItem('selectedSubject', sub);
    localStorage.setItem('selectedLevel', lvl);
    window.location.href = 'exam.html';
}
function getBadgeUI(subject, levelKey) {
    if (!window.userBadges) return "";

    const badge = window.userBadges.find(
        b => b.subject === subject && b.level === levelKey
    );

    if (!badge || !badge.badgeId) return "";

    const imageUrl = "http://localhost:5000" + badge.badgeId.image;

    return `
        <div style="margin-top:10px; display:flex; justify-content:center; align-items:center; gap:10px;">
            
            <img src="${imageUrl}" 
                 style="width:40px; height:40px; border-radius:8px;" />

            <a href="${imageUrl}" download title="Download Badge"
               style="text-decoration:none; font-size:18px;">
               ⬇️
            </a>

        </div>
    `;
}