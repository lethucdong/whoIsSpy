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
  NEXT_ROUND: "game:nextRound",
  RESET_LOBBY: "game:resetLobby",

  // server -> client
  ROOM_STATE: "room:state",
  ROOM_CREATED: "room:created",
  ERROR: "game:error",
} as const;
