/**
 * Video Call Module - WebRTC Implementation
 * Handles peer-to-peer video/audio calling
 */

// ===== STATE MANAGEMENT =====
let localStream = null;
let peerConnections = {};
let currentCallId = null;
let isCallActive = false;

// ===== CONFIGURATION =====
const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
];

const PC_CONFIG = {
    iceServers: ICE_SERVERS
};

// ===== DOM ELEMENTS =====
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startCallBtn = document.getElementById('startCallBtn');
const endCallBtn = document.getElementById('endCallBtn');
const toggleAudioBtn = document.getElementById('toggleAudioBtn');
const toggleVideoBtn = document.getElementById('toggleVideoBtn');
const callStatusEl = document.getElementById('callStatus');

// ===== EVENT LISTENERS =====
if (startCallBtn) startCallBtn.addEventListener('click', initializeLocalStream);
if (endCallBtn) endCallBtn.addEventListener('click', endCall);
if (toggleAudioBtn) toggleAudioBtn.addEventListener('click', toggleAudio);
if (toggleVideoBtn) toggleVideoBtn.addEventListener('click', toggleVideo);

// ===== INITIALIZATION =====

async function initializeLocalStream() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
            audio: true
        });

        localVideo.srcObject = localStream;
        isCallActive = true;
        if (callStatusEl) callStatusEl.textContent = 'Ready to call';
        showNotification('Camera and microphone enabled', 'success');

        if (startCallBtn) startCallBtn.style.display = 'none';
        if (endCallBtn) endCallBtn.style.display = 'block';
        if (toggleAudioBtn) toggleAudioBtn.style.display = 'block';
        if (toggleVideoBtn) toggleVideoBtn.style.display = 'block';

    } catch (error) {
        console.error('Error accessing media devices:', error);
        showNotification('Unable to access camera/microphone: ' + error.message, 'error');
        if (callStatusEl) callStatusEl.textContent = 'Camera/Microphone access denied';
    }
}

// ===== CALL MANAGEMENT =====

async function initiateCall(recipientId) {
    if (!currentUser || !recipientId) {
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

        // Add local stream tracks
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });

        // Create and send offer
        const offer = await peerConnection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
        });

        await peerConnection.setLocalDescription(offer);

        // Send call signal to recipient via STOMP
        if (stompClient && stompClient.connected) {
            stompClient.send('/app/call-signal', {}, JSON.stringify({
                callId: currentCallId,
                caller: currentUser,
                recipient: recipientId,
                type: 'offer',
                sdp: offer.sdp
            }));
        }

        if (callStatusEl) callStatusEl.textContent = 'Calling...';
        showNotification('Calling ' + recipientId, 'info');

    } catch (error) {
        console.error('Error initiating call:', error);
        showNotification('Failed to initiate call: ' + error.message, 'error');
    }
}

async function answerCall(offer, callerId) {
    if (!localStream) {
        await initializeLocalStream();
    }

    try {
        const peerConnection = createPeerConnection(callerId);
        peerConnections[callerId] = peerConnection;

        // Add local stream tracks
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });

        // Set remote description (offer)
        await peerConnection.setRemoteDescription(new RTCSessionDescription({
            type: 'offer',
            sdp: offer.sdp
        }));

        // Create answer
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        // Send answer back
        if (stompClient && stompClient.connected) {
            stompClient.send('/app/call-signal', {}, JSON.stringify({
                callId: offer.callId,
                caller: callerId,
                recipient: currentUser,
                type: 'answer',
                sdp: answer.sdp
            }));
        }

        if (callStatusEl) callStatusEl.textContent = 'Connected';
        showNotification('Call connected', 'success');

    } catch (error) {
        console.error('Error answering call:', error);
        showNotification('Failed to answer call: ' + error.message, 'error');
    }
}

async function handleSignal(signal) {
    const { type, callId, caller, sdp } = signal;

    try {
        if (type === 'offer') {
            // Incoming call - ask user to accept/reject
            const accept = confirm(`Incoming call from ${caller}. Accept?`);
            if (accept) {
                await answerCall(signal, caller);
            } else {
                rejectCall(callId, caller);
            }
        } else if (type === 'answer') {
            // Offer was accepted
            const peerConnection = peerConnections[caller];
            if (peerConnection) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription({
                    type: 'answer',
                    sdp: sdp
                }));
            }
        } else if (type === 'ice-candidate') {
            // Handle ICE candidate
            const peerConnection = peerConnections[caller];
            if (peerConnection && signal.candidate) {
                await peerConnection.addIceCandidate(
                    new RTCIceCandidate(signal.candidate)
                );
            }
        }
    } catch (error) {
        console.error('Error handling signal:', error);
    }
}

function endCall() {
    // Close all peer connections
    Object.values(peerConnections).forEach(pc => {
        pc.close();
    });
    peerConnections = {};

    // Stop all tracks in local stream
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }

    if (localVideo) localVideo.srcObject = null;
    if (remoteVideo) remoteVideo.srcObject = null;

    isCallActive = false;
    currentCallId = null;

    if (startCallBtn) startCallBtn.style.display = 'block';
    if (endCallBtn) endCallBtn.style.display = 'none';
    if (toggleAudioBtn) toggleAudioBtn.style.display = 'none';
    if (toggleVideoBtn) toggleVideoBtn.style.display = 'none';

    if (callStatusEl) callStatusEl.textContent = 'Call ended';

    showNotification('Call ended', 'info');
}

function rejectCall(callId, callerId) {
    if (stompClient && stompClient.connected) {
        stompClient.send('/app/call-signal', {}, JSON.stringify({
            callId: callId,
            caller: callerId,
            recipient: currentUser,
            type: 'reject'
        }));
    }
    showNotification('Call rejected', 'info');
}

// ===== PEER CONNECTION SETUP =====

function createPeerConnection(peerId) {
    const peerConnection = new RTCPeerConnection(PC_CONFIG);

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate && stompClient && stompClient.connected) {
            stompClient.send('/app/call-signal', {}, JSON.stringify({
                callId: currentCallId,
                caller: currentUser,
                recipient: peerId,
                type: 'ice-candidate',
                candidate: event.candidate
            }));
        }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
        console.log('Received remote stream');
        if (remoteVideo) remoteVideo.srcObject = event.streams[0];
        if (callStatusEl) callStatusEl.textContent = 'Video connected';
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'failed') {
            showNotification('Connection failed', 'error');
        }
    };

    // Handle ICE connection state changes
    peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE Connection state:', peerConnection.iceConnectionState);
        if (peerConnection.iceConnectionState === 'disconnected') {
            showNotification('Connection lost', 'error');
        }
    };

    return peerConnection;
}

// ===== MEDIA CONTROL =====

function toggleAudio() {
    if (!localStream) return;

    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        if (toggleAudioBtn) {
            toggleAudioBtn.textContent = audioTrack.enabled ? '🎤' : '🔇';
            toggleAudioBtn.style.background = audioTrack.enabled ? '#27ae60' : '#e74c3c';
        }
        showNotification(audioTrack.enabled ? 'Microphone on' : 'Microphone off', 'info');
    }
}

function toggleVideo() {
    if (!localStream) return;

    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        if (toggleVideoBtn) {
            toggleVideoBtn.textContent = videoTrack.enabled ? '📹' : '❌';
            toggleVideoBtn.style.background = videoTrack.enabled ? '#27ae60' : '#e74c3c';
        }
        showNotification(videoTrack.enabled ? 'Camera on' : 'Camera off', 'info');
    }
}

// ===== UTILITY FUNCTIONS =====

function generateCallId() {
    return `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Export functions for use in chat.js
window.CallModule = {
    initiateCall,
    answerCall,
    handleSignal,
    endCall,
    rejectCall
};
