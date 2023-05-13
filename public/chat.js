const socket = io();
const divVideoChatLobby = document.getElementById('video-chat-lobby');
const divVideoChat = document.getElementById('video-chat-room');
const joinButton = document.getElementById('join');
const userVideo = document.getElementById('user-video');
const peerVideo = document.getElementById('peer-video');
const roomInput = document.getElementById('roomName');

const divButtonGroup = document.getElementById('btn-group');
const muteButton = document.getElementById('muteButton');
const hideCameraButton = document.getElementById('hideCameraButton');
const leaveRoomButton = document.getElementById('leaveRoomButton');

let muteFlag = false;
let hideCameraFlag = false;

let roomName = roomInput.value;
var creator = false;
var rtcPeerConnection;
var userStream;

var iceServers = {
    'iceServers': [
        { 'urls': 'stun:stun.services.mozilla.com' },
        { 'urls': 'stun:stun.l.google.com:19302' },
    ]
};


joinButton.addEventListener('click', () => {
    if (roomInput.value == '') {
        alert('Please enter a room name');
    } else {
        roomName = roomInput.value;
        socket.emit('join', roomName);
    }
});

muteButton.addEventListener('click', () => {
    muteFlag = !muteFlag;
    if (muteFlag) {
        userStream.getAudioTracks()[0].enabled = false;
        muteButton.innerHTML = 'Unmute';
    } else {
        userStream.getAudioTracks()[0].enabled = true;
        muteButton.innerHTML = 'Mute';
    }
});

hideCameraButton.addEventListener('click', () => {
    hideCameraFlag = !hideCameraFlag;
    if (hideCameraFlag) {
        userStream.getVideoTracks()[0].enabled = false;
        hideCameraButton.innerHTML = 'Show Camera';
    } else {
        userStream.getVideoTracks()[0].enabled = true;
        hideCameraButton.innerHTML = 'Hide Camera';
    }
});

socket.on('created', () => {
    creator = true;
    navigator.mediaDevices.getUserMedia({
        video: {
            width: 500,
            height: 500,
        }, audio: true
    }).then(stream => {
        userStream = stream;
        userVideo.srcObject = stream;
        userVideo.onloadedmetadata = () => {
            userVideo.play();
        }
        divVideoChatLobby.style.display = 'none';
        divButtonGroup.style.display = 'flex';
        socket.emit('ready', roomName);
    }).catch(err => {
        alert('Please allow access to your webcam and mic');
    });
});
socket.on('joined', () => {
    creator = false;
    navigator.mediaDevices.getUserMedia({
        video: {
            width: 500,
            height: 500,
        }, audio: true
    }).then(stream => {
        userStream = stream;
        userVideo.srcObject = stream;
        userVideo.onloadedmetadata = () => {
            userVideo.play();
        }
        divVideoChatLobby.style.display = 'none';
        divButtonGroup.style.display = 'flex';
        socket.emit('ready', roomName);
    }).catch(err => {
        alert('Please allow access to your webcam and mic');
    });
});
socket.on('full', () => {
    alert('Room is full, please try another one');
});
socket.on('ready', () => {
    if (creator) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
        rtcPeerConnection.ontrack = OnTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
        rtcPeerConnection.createOffer().then(offer => {
            socket.emit('offer', offer, roomName);
            rtcPeerConnection.setLocalDescription(offer);
        }).catch(error => {
            console.log(error);
        });
    }

});
socket.on('candidate', (candidate) => {
    var icecandidate = new RTCIceCandidate({
        sdpMLineIndex: candidate.sdpMLineIndex,
        candidate: candidate.candidate
    });
    rtcPeerConnection.addIceCandidate(icecandidate);

});
socket.on('offer', (offer) => {
    if (!creator) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
        rtcPeerConnection.ontrack = OnTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
        rtcPeerConnection.setRemoteDescription(offer);
        rtcPeerConnection.createAnswer().then(answer => {
            rtcPeerConnection.setLocalDescription(answer);
            socket.emit('answer', answer, roomName);
        }).catch(error => {
            console.log(error);
        });
    }

});
socket.on('answer', (answer) => {
    rtcPeerConnection.setRemoteDescription(answer);
});


leaveRoomButton.addEventListener('click', () => {
    socket.emit('leave', roomName);
    divVideoChatLobby.style.display = 'block';
    divButtonGroup.style.display = 'none';

    if (userVideo.srcObject) {
        userVideo.srcObject.getTracks().forEach(track => track.stop());
        userVideo.srcObject = null;
    }

    if (peerVideo.srcObject) {
        peerVideo.srcObject.getTracks().forEach(track => track.stop());
        peerVideo.srcObject = null;
    }

    if (rtcPeerConnection) {
        rtcPeerConnection.onicecandidate = null;
        rtcPeerConnection.ontrack = null;
        rtcPeerConnection.close();
        rtcPeerConnection = null;
    }

});

socket.on('leave', () => {
    creator = true;
    if (rtcPeerConnection) {
        rtcPeerConnection.onicecandidate = null;
        rtcPeerConnection.ontrack = null;
        rtcPeerConnection.close();
        rtcPeerConnection = null;
    }

    if (peerVideo.srcObject) {
        peerVideo.srcObject.getTracks().forEach(track => track.stop());
        peerVideo.srcObject = null;
    }
});


function OnIceCandidateFunction(event) {
    if (event.candidate) {
        socket.emit('candidate', event.candidate, roomName);
    }
}

function OnTrackFunction(event) {
    peerVideo.srcObject = event.streams[0];
    peerVideo.onloadedmetadata = () => {
        peerVideo.play();
    }
}

