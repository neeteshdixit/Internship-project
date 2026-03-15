/**
 * Video Call Module - WebRTC signaling via STOMP.
 */

let localStream = null;
let peerConnections = {};
let currentCallId = null;

const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
];

const PC_CONFIG = { iceServers: ICE_SERVERS };

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startCallBtn = document.getElementById('startCallBtn');
const endCallBtn = document.getElementById('endCallBtn');
const toggleAudioBtn = document.getElementById('toggleAudioBtn');
const toggleVideoBtn = document.getElementById('toggleVideoBtn');
const callStatusEl = document.getElementById('callStatus');

if (startCallBtn) startCallBtn.addEventListener('click', initializeLocalStream);
if (endCallBtn) endCallBtn.addEventListener('click', endCall);
if (toggleAudioBtn) toggleAudioBtn.addEventListener('click', toggleAudio);
if (toggleVideoBtn) toggleVideoBtn.addEventListener('click', toggleVideo);

async function initializeLocalStream() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
            audio: true
        });

        if (localVideo) localVideo.srcObject = localStream;
        if (callStatusEl) callStatusEl.textContent = 'Ready';

        if (startCallBtn) startCallBtn.style.display = 'none';
        if (endCallBtn) endCallBtn.style.display = 'block';
        if (toggleAudioBtn) toggleAudioBtn.style.display = 'block';
        if (toggleVideoBtn) toggleVideoBtn.style.display = 'block';

        showNotification('Camera and microphone enabled', 'success');
    } catch (error) {
        console.error('Error accessing media devices:', error);
        showNotification(`Unable to access camera/microphone: ${error.message}`, 'error');
        if (callStatusEl) callStatusEl.textContent = 'Permission denied';
    }
}

async function initiateCall(recipientId) {
    if (!currentUser || !currentUser.id || !recipientId) {
        showNotification('Invalid call recipient', 'error');
        return;
    }

    if (!localStream) {
        await initializeLocalStream();
    }

    currentCallId = generateCallId();

    try {
        const peerConnection = createPeerConnection(recipientId);
        peerConnections[recipientId] = peerConnection;

        localStream.getTracks().forEach((track) => {
            peerConnection.addTrack(track, localStream);
        });

        const offer = await peerConnection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
        });

        await peerConnection.setLocalDescription(offer);

        sendSignal({
            callId: currentCallId,
            caller: currentUser.id,
            recipient: recipientId,
            type: 'offer',
            sdp: offer.sdp
        });

        if (callStatusEl) callStatusEl.textContent = 'Calling...';
        showNotification(`Calling user ${recipientId}`, 'info');
    } catch (error) {
        console.error('Error initiating call:', error);
        showNotification(`Failed to initiate call: ${error.message}`, 'error');
    }
}

async function answerCall(offerSignal, peerId) {
    if (!localStream) {
        await initializeLocalStream();
    }

    try {
        const peerConnection = createPeerConnection(peerId);
        peerConnections[peerId] = peerConnection;

        localStream.getTracks().forEach((track) => {
            peerConnection.addTrack(track, localStream);
        });

        await peerConnection.setRemoteDescription(
            new RTCSessionDescription({ type: 'offer', sdp: offerSignal.sdp })
        );

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        sendSignal({
            callId: offerSignal.callId,
            caller: currentUser.id,
            recipient: peerId,
            type: 'answer',
            sdp: answer.sdp
        });

        if (callStatusEl) callStatusEl.textContent = 'Connected';
        showNotification('Call connected', 'success');
    } catch (error) {
        console.error('Error answering call:', error);
        showNotification(`Failed to answer call: ${error.message}`, 'error');
    }
}

async function handleSignal(signal) {
    if (!currentUser || !currentUser.id || !signal) return;

    const isForMe = signal.recipient === currentUser.id || signal.caller === currentUser.id;
    if (!isForMe) return;

    const peerId = signal.caller === currentUser.id ? signal.recipient : signal.caller;

    try {
        if (signal.type === 'offer') {
            if (signal.recipient !== currentUser.id) return;
            const accept = confirm(`Incoming call from user ${peerId}. Accept?`);
            if (accept) {
                await answerCall(signal, peerId);
            } else {
                rejectCall(signal.callId, peerId);
            }
            return;
        }

        if (signal.type === 'answer') {
            if (signal.recipient !== currentUser.id) return;
            const peerConnection = peerConnections[peerId];
            if (peerConnection) {
                await peerConnection.setRemoteDescription(
                    new RTCSessionDescription({ type: 'answer', sdp: signal.sdp })
                );
            }
            return;
        }

        if (signal.type === 'ice-candidate') {
            if (signal.recipient !== currentUser.id) return;
            const peerConnection = peerConnections[peerId];
            if (peerConnection && signal.candidate) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
            }
            return;
        }

        if (signal.type === 'reject') {
            if (signal.recipient === currentUser.id) {
                showNotification('Call rejected by recipient', 'info');
                endCall();
            }
        }
    } catch (error) {
        console.error('Error handling signal:', error);
    }
}

function endCall() {
    Object.values(peerConnections).forEach((peerConnection) => {
        try {
            peerConnection.close();
        } catch (_) {
            // no-op
        }
    });
    peerConnections = {};

    if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        localStream = null;
    }

    if (localVideo) localVideo.srcObject = null;
    if (remoteVideo) remoteVideo.srcObject = null;

    currentCallId = null;

    if (startCallBtn) startCallBtn.style.display = 'block';
    if (endCallBtn) endCallBtn.style.display = 'none';
    if (toggleAudioBtn) toggleAudioBtn.style.display = 'none';
    if (toggleVideoBtn) toggleVideoBtn.style.display = 'none';
    if (callStatusEl) callStatusEl.textContent = 'Call ended';
}

function rejectCall(callId, callerId) {
    sendSignal({
        callId,
        caller: currentUser.id,
        recipient: callerId,
        type: 'reject'
    });
    showNotification('Call rejected', 'info');
}

function createPeerConnection(peerId) {
    const peerConnection = new RTCPeerConnection(PC_CONFIG);

    peerConnection.onicecandidate = (event) => {
        if (!event.candidate) return;
        sendSignal({
            callId: currentCallId,
            caller: currentUser.id,
            recipient: peerId,
            type: 'ice-candidate',
            candidate: event.candidate
        });
    };

    peerConnection.ontrack = (event) => {
        if (remoteVideo) remoteVideo.srcObject = event.streams[0];
        if (callStatusEl) callStatusEl.textContent = 'Video connected';
    };

    peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === 'failed') {
            showNotification('Call connection failed', 'error');
        }
    };

    return peerConnection;
}

function sendSignal(payload) {
    if (stompClient && stompClient.connected) {
        stompClient.send('/app/call', {}, JSON.stringify(payload));
    }
}

function toggleAudio() {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    if (toggleAudioBtn) toggleAudioBtn.textContent = audioTrack.enabled ? 'Mute' : 'Unmute';
    showNotification(audioTrack.enabled ? 'Microphone on' : 'Microphone off', 'info');
}

function toggleVideo() {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;
    if (toggleVideoBtn) toggleVideoBtn.textContent = videoTrack.enabled ? 'Video Off' : 'Video On';
    showNotification(videoTrack.enabled ? 'Camera on' : 'Camera off', 'info');
}

function generateCallId() {
    return `call-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

window.CallModule = {
    initiateCall,
    answerCall,
    handleSignal,
    endCall,
    rejectCall
};
