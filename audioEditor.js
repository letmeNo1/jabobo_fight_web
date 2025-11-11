// 核心变量
const playhead = document.getElementById('playhead');
const playPauseBtn = document.getElementById('playPauseBtn');
const stopBtn = document.getElementById('stopBtn');
const syncBtn = document.getElementById('syncBtn');
const timecodeEl = document.getElementById('timecode');
const rulerMarks = document.getElementById('rulerMarks');
const tracksContent = document.getElementById('tracksContent');

// 进度条相关元素
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const progressThumb = document.getElementById('progressThumb');
const progressTime = document.getElementById('progressTime');

// 音频元素（关联MP3文件）
const audio1 = document.getElementById('audio1');
const audio2 = document.getElementById('audio2');
// 新增轨道3-6的音频元素引用
const audio3 = document.getElementById('audio3');
const audio4 = document.getElementById('audio4');
const audio5 = document.getElementById('audio5');
const audio6 = document.getElementById('audio6');
const audios = [audio1, audio2, audio3, audio4, audio5, audio6];

// 状态变量
let isPlaying = false;
let currentTime = 0; // 当前时间（秒）
let duration = 20; // 默认总时长（秒，会根据音频实际长度更新）
let frameRate = 30; // 帧率（用于时间显示）
let animationFrameId = null;
let mutedTracks = {1: false, 2: false, 3: false, 4: false, 5: false, 6: false};
let isDragging = false; // 进度条拖动状态

// 初始化：获取音频实际时长并更新时间线
function initAudio() {
    // 监听音频加载完成事件，获取实际时长
    audio1.addEventListener('loadedmetadata', () => {
        duration = Math.ceil(audio1.duration); // 取轨道1时长为基准
        initRuler(); // 重新生成时间标尺
        updateProgressDisplay(); // 更新进度显示
    });
    audio2.addEventListener('loadedmetadata', () => {
        // 确保时间线时长不短于任一轨道
        duration = Math.max(duration, Math.ceil(audio2.duration));
        initRuler();
        updateProgressDisplay();
    });

    // 监听音频时间更新事件（用于播放时同步进度）
    audio1.addEventListener('timeupdate', syncAudioProgress);
}

// 初始化时间标尺（每1秒1个刻度，每5秒1个主刻度）
function initRuler() {
    rulerMarks.innerHTML = '';
    for (let i = 0; i <= duration; i++) {
        const mark = document.createElement('div');
        mark.className = `ruler-mark ${i % 5 === 0 ? 'major' : ''}`;
        mark.dataset.time = i < 10 ? `00:00:0${i}.00` : `00:00:${i}.00`;
        rulerMarks.appendChild(mark);
    }
}

// 格式化时间（00:00:00.00）
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    const frames = Math.floor((seconds % 1) * frameRate).toString().padStart(2, '0');
    return `00:${mins}:${secs}.${frames}`;
}

// 格式化短时间（00:00）
function formatShortTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

// 更新播放头位置（与音频进度同步）
function updatePlayhead() {
    const gridWidth = 50; // 每个刻度的宽度
    const position = 50 + (currentTime / duration) * (duration * gridWidth);
    playhead.style.left = `${position}px`;
    timecodeEl.textContent = formatTime(currentTime);
}

// 更新进度条显示
function updateProgressDisplay() {
    if (duration <= 0) return;
    
    const progress = (currentTime / duration) * 100;
    progressFill.style.width = `${progress}%`;
    progressThumb.style.left = `${progress}%`;
    progressTime.textContent = `${formatShortTime(currentTime)} / ${formatShortTime(duration)}`;
}

// 同步音频进度（播放时自动更新）
function syncAudioProgress() {
    if (!isDragging) {
        currentTime = audio1.currentTime;
        updatePlayhead();
        updateProgressDisplay();
        
        // 播放结束时自动停止
        if (currentTime >= duration) {
            stopPlay();
        }
    }
}

// 播放/暂停控制（同步音频和播放头）
function togglePlay() {
    isPlaying = !isPlaying;
    playPauseBtn.innerHTML = isPlaying ? '<span>⏸</span> 播放/暂停' : '<span>▶</span> 播放/暂停';
    
    if (isPlaying) {
        // 开始播放音频
        audios.forEach(audio => {
            audio.play().catch(err => {
                alert('请先点击页面任意位置激活播放（浏览器限制）');
                isPlaying = false;
                playPauseBtn.innerHTML = '<span>▶</span> 播放/暂停';
            });
        });
        animatePlayhead(); // 启动播放头动画
    } else {
        // 暂停音频和播放头
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        audios.forEach(audio => audio.pause());
    }
}

// 播放头动画（与音频进度实时同步）
function animatePlayhead() {
    if (!isPlaying) return;
    
    updatePlayhead();
    animationFrameId = requestAnimationFrame(animatePlayhead);
}

// 停止播放并复位
function stopPlay() {
    isPlaying = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    currentTime = 0;
    audios.forEach(audio => {
        audio.pause();
        audio.currentTime = 0; // 音频进度复位
    });
    updatePlayhead();
    updateProgressDisplay();
    playPauseBtn.innerHTML = '<span>▶</span> 播放/暂停';
}

// 同步两轨进度（强制对齐）
function syncTracks() {
    audio2.currentTime = audio1.currentTime; // 轨道2对齐轨道1
    audio3.currentTime = audio1.currentTime; // 新增
    audio4.currentTime = audio1.currentTime; // 新增
    audio5.currentTime = audio1.currentTime; // 新增
    audio6.currentTime = audio1.currentTime; // 新增
    currentTime = audio1.currentTime;
    updatePlayhead();
    updateProgressDisplay();
    alert('两轨已同步到当前位置');
}

// 轨道静音切换（关联音频静音状态）
function toggleMute(trackId) {
    mutedTracks[trackId] = !mutedTracks[trackId];
    const muteBtn = document.querySelector(`.track-name-item:nth-child(${trackId}) .track-mute`);
    muteBtn.classList.toggle('muted', mutedTracks[trackId]);
    muteBtn.textContent = mutedTracks[trackId] ? '🔈' : '🔇';
    
    // 控制对应音频的静音
    if (trackId === 1) audio1.muted = mutedTracks[trackId];
    if (trackId === 2) audio2.muted = mutedTracks[trackId];
    if (trackId === 3) audio3.muted = mutedTracks[trackId]; // 新增
    if (trackId === 4) audio4.muted = mutedTracks[trackId]; // 新增
    if (trackId === 5) audio5.muted = mutedTracks[trackId]; // 新增
    if (trackId === 6) audio6.muted = mutedTracks[trackId]; // 新增
}

// 进度条点击跳转
function seekProgress(e) {
    const rect = progressBar.getBoundingClientRect();
    const clickPos = (e.clientX - rect.left) / rect.width;
    const newTime = clickPos * duration;
    
    updateProgress(newTime);
}

// 进度条拖动开始
function startDrag() {
    isDragging = true;
    document.addEventListener('mousemove', dragProgress);
    document.addEventListener('mouseup', endDrag);
}

// 进度条拖动中
function dragProgress(e) {
    const rect = progressBar.getBoundingClientRect();
    // 限制拖动范围在0-100%
    let dragPos = (e.clientX - rect.left) / rect.width;
    dragPos = Math.max(0, Math.min(1, dragPos));
    
    const newTime = dragPos * duration;
    updateProgress(newTime);
}

// 进度条拖动结束
function endDrag() {
    isDragging = false;
    document.removeEventListener('mousemove', dragProgress);
    document.removeEventListener('mouseup', endDrag);
}

// 更新进度（同步音频、播放头、进度条）
function updateProgress(newTime) {
    currentTime = newTime;
    // 同步所有音频进度
    audios.forEach(audio => audio.currentTime = currentTime);
    // 更新显示
    updatePlayhead();
    updateProgressDisplay();
}

// 点击时间线跳转位置（同步音频进度）
tracksContent.addEventListener('click', (e) => {
    const rect = tracksContent.getBoundingClientRect();
    const clickX = e.clientX - rect.left - 50; // 减去左侧偏移
    const gridWidth = 50;
    
    if (clickX >= 0) {
        // 计算点击位置对应的时间
        const newTime = Math.min(duration, clickX / gridWidth);
        updateProgress(newTime);
    }
});

// 事件监听
playPauseBtn.addEventListener('click', togglePlay);
stopBtn.addEventListener('click', stopPlay);
syncBtn.addEventListener('click', syncTracks);
progressBar.addEventListener('click', seekProgress);
progressThumb.addEventListener('mousedown', startDrag);

// 初始化
initAudio();
updatePlayhead();
updateProgressDisplay();