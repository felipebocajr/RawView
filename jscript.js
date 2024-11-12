const videoDatabaseUrl = "https://cinema-online-1ee04-default-rtdb.firebaseio.com/video.json";
const chatDatabaseUrl = "https://cinema-online-1ee04-default-rtdb.firebaseio.com/chat.json";
const playbackStateUrl = "https://cinema-online-1ee04-default-rtdb.firebaseio.com/playbackState.json";
let currentVideoId = null;
let isPlaying = false;
let videoIframe = null;

// Carregar vídeo
function loadVideo() {
    const url = document.getElementById('video-url').value;
    const videoId = url.split("v=")[1]?.split("&")[0];

    if (videoId) {
        currentVideoId = videoId;
        updateVideoPlayer();
        saveVideoToFirebase(videoId);
    } else {
        alert("Por favor, insira um link válido do YouTube.");
    }
}

function updateVideoPlayer() {
    const player = document.getElementById('video-player');
    player.innerHTML = `
        <iframe width="100%" height="100%" src="https://www.youtube.com/embed/${currentVideoId}?enablejsapi=1" 
        title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    `;
    videoIframe = player.querySelector('iframe');
    // Carregar o estado de reprodução
    loadPlaybackState();
}

function saveVideoToFirebase(videoId) {
    fetch(videoDatabaseUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ videoId: videoId })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao salvar o vídeo');
        }
        console.log('Vídeo salvo com sucesso!');
    })
    .catch(error => {
        console.error('Erro:', error);
    });
}

// Play/Pause
function togglePlay() {
    isPlaying = !isPlaying;
    const action = isPlaying ? 'play' : 'pause';
    fetch(playbackStateUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ isPlaying: isPlaying })
    });
    syncPlayback(action);
}

function syncPlayback(action) {
    if (action === 'play') {
        videoIframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
    } else {
        videoIframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
    }
}

// Carregar o estado de reprodução
function loadPlaybackState() {
    fetch(playbackStateUrl)
        .then(response => response.json())
        .then(data => {
            const latestState = Object.values(data).pop();
            if (latestState && latestState.isPlaying) {
                syncPlayback('play');
                isPlaying = true;
            } else {
                syncPlayback('pause');
                isPlaying = false;
            }
        })
        .catch(error => {
            console.error('Erro ao carregar estado de reprodução:', error);
        });
}

// Enviar mensagem para o chat
function sendMessage() {
    const message = document.getElementById('chat-message').value;
    if (message) {
        const messageData = {
            message: message,
            timestamp: new Date().toLocaleTimeString()
        };

        // Enviar a mensagem para o Firebase usando a API REST
        fetch(chatDatabaseUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(messageData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao enviar a mensagem');
            }
            console.log('Mensagem enviada com sucesso!');
            document.getElementById('chat-message').value = '';
        })
        .catch(error => {
            console.error('Erro:', error);
        });
    } else {
        alert("Digite uma mensagem antes de enviar.");
    }
}

// Carregar mensagens do chat em tempo real
function loadMessages() {
    fetch(chatDatabaseUrl)
        .then(response => response.json())
        .then(data => {
            const chatBox = document.getElementById('chat-box');
            chatBox.innerHTML = ''; // Limpa o chat existente
            for (const key in data) {
                const msgData = data[key];
                const msgElement = document.createElement("div");
                msgElement.classList.add("message");
                msgElement.textContent = `[${msgData.timestamp}] ${msgData.message}`;
                chatBox.appendChild(msgElement);
            }
            chatBox.scrollTop = chatBox.scrollHeight; // Rolagem para a última mensagem
        })
        .catch(error => {
            console.error('Erro ao carregar mensagens:', error);
        });
}

// Carregar vídeos armazenados
function loadStoredVideo() {
    fetch(videoDatabaseUrl)
        .then(response => response.json())
        .then(data => {
            const videoKeys = Object.keys(data);
            if (videoKeys.length > 0) {
                const latestVideo = data[videoKeys[videoKeys.length - 1]];
                currentVideoId = latestVideo.videoId;
                updateVideoPlayer();
            }
        })
        .catch(error => {
            console.error('Erro ao carregar vídeos:', error);
        });
}

// Carregar mensagens a cada 2 segundos
setInterval(loadMessages, 2000);
window.onload = loadStoredVideo;