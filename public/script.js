document.addEventListener("DOMContentLoaded", () => {
  const socket = io("/");
  const videoGrid = document.getElementById("video-grid");
  const myVideo = document.createElement("video");
  myVideo.muted = true;

  const user = prompt("Enter your name") || "Anonymous";

  let peer = new Peer(undefined, {
    host: "/",
    port: location.protocol === "https:" ? 443 : 3030,
    path: "/peerjs",
  });

  let myVideoStream;

  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
    })
    .then((stream) => {
      myVideoStream = stream;
      addVideoStream(myVideo, stream);

      peer.on("call", (call) => {
        call.answer(stream);
        const video = document.createElement("video");
        call.on("stream", (userVideoStream) => {
          addVideoStream(video, userVideoStream);
        });
      });

      socket.on("user-connected", (userId) => {
        connectToNewUser(userId, stream);
      });
    })
    .catch((error) => {
      console.error("Error accessing media devices.", error);
      alert("Could not access your camera or microphone.");
    });

  peer.on("open", (id) => {
    socket.emit("join-room", ROOM_ID, id);
    console.log(`Your Peer ID: ${id}`);
  });

  const connectToNewUser = (userId, stream) => {
    console.log("You are calling someone " + userId);
    const call = peer.call(userId, stream);
    const video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
      addVideoStream(video, userVideoStream);
    });
  };

  const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
      video.play();
      videoGrid.append(video);
    });
  };

  // Mute/Unmute button
  const muteButton = document.querySelector("#muteButton");
  muteButton.addEventListener("click", () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
      myVideoStream.getAudioTracks()[0].enabled = false;
      muteButton.innerHTML = `<i class="fas fa-microphone-slash"></i>`;
      muteButton.classList.add("background_red");
    } else {
      myVideoStream.getAudioTracks()[0].enabled = true;
      muteButton.innerHTML = `<i class="fas fa-microphone"></i>`;
      muteButton.classList.remove("background_red");
    }
  });

  // Stop/Start Video button
  const stopVideo = document.querySelector("#stopVideo");
  stopVideo.addEventListener("click", () => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
      myVideoStream.getVideoTracks()[0].enabled = false;
      stopVideo.innerHTML = `<i class="fas fa-video-slash"></i>`;
      stopVideo.classList.add("background_red");
    } else {
      myVideoStream.getVideoTracks()[0].enabled = true;
      stopVideo.innerHTML = `<i class="fas fa-video"></i>`;
      stopVideo.classList.remove("background_red");
    }
  });

  // Invite button
  const inviteButton = document.querySelector("#inviteButton");
  inviteButton.addEventListener("click", () => {
    prompt(
      "Copy this link and send it to people you want to have a video call with",
      window.location.href
    );
  });

  // Disconnect button
  const disconnectBtn = document.querySelector("#disconnect");
  disconnectBtn.addEventListener("click", () => {
    peer.destroy();
    socket.emit("leave-room", ROOM_ID, peer.id);
    const myVideoElement = document.querySelector("#video");
    if (myVideoElement) {
      myVideoElement.remove();
    }
    window.location.href = "https://www.google.com";
  });

  // Error Handling
  peer.on("error", (err) => {
    console.error("PeerJS error:", err);
  });

  socket.on("error", (error) => {
    console.error("Socket.IO error:", error);
  });
});
