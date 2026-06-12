// Tên sự kiện Socket.io dùng chung client & server.

export const SOCKET_EVENTS = {
  // client -> server
  ROOM_CREATE: "room:create",
  ROOM_JOIN: "room:join",
  ROOM_LEAVE: "room:leave",
  PLAYER_READY: "player:ready",
  ROOM_UPDATE_SETTINGS: "room:updateSettings",
  GAME_START: "game:start",
  CARD_REVEAL: "card:reveal",
  FORCE_DISCUSS: "game:forceDiscuss",
  NEXT_SPEAKER: "game:nextSpeaker",
  SKIP_TO_VOTE: "game:skipToVote",
  VOTE_CAST: "vote:cast",
  VOTE_SKIP: "vote:skip",
  NEXT_ROUND: "game:nextRound",
  RESET_LOBBY: "game:resetLobby",

  // ----- Chat -----
  CHAT_SEND: "chat:send", // client -> server: gửi tin nhắn
  CHAT_NEW: "chat:new", // server -> client: một tin nhắn mới
  CHAT_HISTORY: "chat:history", // server -> client: lịch sử khi vừa vào phòng

  // ----- Video call (WebRTC mesh, Socket.io làm signaling) -----
  RTC_JOIN: "rtc:join", // client -> server: tham gia cuộc gọi
  RTC_LEAVE: "rtc:leave", // client -> server: rời cuộc gọi
  RTC_PEER_JOINED: "rtc:peerJoined", // server -> client: có người mới vào gọi
  RTC_PEER_LEFT: "rtc:peerLeft", // server -> client: có người rời gọi
  RTC_OFFER: "rtc:offer", // relay SDP offer
  RTC_ANSWER: "rtc:answer", // relay SDP answer
  RTC_ICE: "rtc:ice", // relay ICE candidate

  // server -> client
  ROOM_STATE: "room:state",
  ROOM_CREATED: "room:created",
  ERROR: "game:error",
} as const;
