const username = import.meta.env.VITE_TURN_USERNAME;
const credential = import.meta.env.VITE_TURN_CREDENTIAL;

export const iceServers: RTCIceServer[] = [
  {
    urls: "stun:stun.l.google.com:19302",
  },
  {
    urls: [
      "turn:free.expressturn.com:3478?transport=udp",
      "turn:free.expressturn.com:3478?transport=tcp",
    ],
    username,
    credential,
  },
];