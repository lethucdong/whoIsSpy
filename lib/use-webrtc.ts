"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSocket } from "./socket-context";
import { SOCKET_EVENTS as EV } from "./socket/events";

// STUN công cộng của Google. Nếu người chơi ở sau NAT chặt / mạng công ty,
// có thể bổ sung TURN server qua biến môi trường (xem README).
const ICE_SERVERS: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
];

interface PeerEntry {
  pc: RTCPeerConnection;
  remoteSet: boolean;
  queue: RTCIceCandidateInit[];
}

export interface RemotePeer {
  id: string; // socket id
  playerId: string;
  stream: MediaStream | null;
}

/**
 * Cuộc gọi video nhóm theo mô hình mesh (mỗi người kết nối trực tiếp tới
 * tất cả người khác). Socket.io đóng vai trò signaling.
 * Bật/tắt qua `active`.
 */
export function useWebRTC(active: boolean) {
  const { socket } = useSocket();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Record<string, RemotePeer>>({});
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const peersRef = useRef<Record<string, PeerEntry>>({});
  const localRef = useRef<MediaStream | null>(null);

  const upsertPeer = useCallback(
    (id: string, patch: Partial<RemotePeer>) => {
      setPeers((prev) => {
        const base: RemotePeer = prev[id] ?? { id, playerId: "", stream: null };
        return { ...prev, [id]: { ...base, ...patch } };
      });
    },
    []
  );

  const closePeer = useCallback((id: string) => {
    const entry = peersRef.current[id];
    if (entry) {
      entry.pc.onicecandidate = null;
      entry.pc.ontrack = null;
      entry.pc.onconnectionstatechange = null;
      try {
        entry.pc.close();
      } catch {}
      delete peersRef.current[id];
    }
    setPeers((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  // Tạo (hoặc lấy lại) kết nối tới một peer.
  const createPeer = useCallback(
    (id: string, playerId: string, initiator: boolean) => {
      if (peersRef.current[id]) return peersRef.current[id];
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      const entry: PeerEntry = { pc, remoteSet: false, queue: [] };
      peersRef.current[id] = entry;
      upsertPeer(id, { playerId });

      localRef.current?.getTracks().forEach((t) => pc.addTrack(t, localRef.current!));

      pc.onicecandidate = (e) => {
        if (e.candidate) socket?.emit(EV.RTC_ICE, { to: id, candidate: e.candidate });
      };
      pc.ontrack = (e) => {
        upsertPeer(id, { stream: e.streams[0] });
      };
      pc.onconnectionstatechange = () => {
        if (["failed", "closed", "disconnected"].includes(pc.connectionState)) {
          // disconnected có thể tự hồi phục; chỉ dọn khi đứt hẳn.
          if (pc.connectionState !== "disconnected") closePeer(id);
        }
      };

      if (initiator) {
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => socket?.emit(EV.RTC_OFFER, { to: id, sdp: pc.localDescription }))
          .catch(() => {});
      }
      return entry;
    },
    [socket, upsertPeer, closePeer]
  );

  const flushIce = useCallback((entry: PeerEntry) => {
    entry.remoteSet = true;
    entry.queue.forEach((c) => entry.pc.addIceCandidate(c).catch(() => {}));
    entry.queue = [];
  }, []);

  // Bật/tắt cuộc gọi: xin quyền cam/mic + signaling.
  useEffect(() => {
    if (!active || !socket) return;
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 480 }, height: { ideal: 360 }, facingMode: "user" },
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localRef.current = stream;
        setLocalStream(stream);
        setError(null);

        // Tham gia cuộc gọi, nhận danh sách người đang gọi để chủ động gửi offer.
        socket.emit(
          EV.RTC_JOIN,
          (existing: { id: string; playerId: string }[]) => {
            existing.forEach((p) => createPeer(p.id, p.playerId, true));
          }
        );
      } catch (err) {
        setError(
          "Không truy cập được camera/micro. Hãy cấp quyền trong trình duyệt và thử lại."
        );
      }
    })();

    const onPeerJoined = ({ id, playerId }: { id: string; playerId: string }) => {
      // Người mới sẽ gửi offer cho mình; chỉ ghi nhận trước.
      upsertPeer(id, { playerId });
    };
    const onPeerLeft = ({ id }: { id: string }) => closePeer(id);

    const onOffer = async ({
      from,
      playerId,
      sdp,
    }: {
      from: string;
      playerId: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      const entry = createPeer(from, playerId, false);
      await entry.pc.setRemoteDescription(sdp);
      flushIce(entry);
      const answer = await entry.pc.createAnswer();
      await entry.pc.setLocalDescription(answer);
      socket.emit(EV.RTC_ANSWER, { to: from, sdp: entry.pc.localDescription });
    };

    const onAnswer = async ({
      from,
      sdp,
    }: {
      from: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      const entry = peersRef.current[from];
      if (!entry) return;
      await entry.pc.setRemoteDescription(sdp);
      flushIce(entry);
    };

    const onIce = ({
      from,
      candidate,
    }: {
      from: string;
      candidate: RTCIceCandidateInit;
    }) => {
      const entry = peersRef.current[from];
      if (!entry) return;
      if (entry.remoteSet) entry.pc.addIceCandidate(candidate).catch(() => {});
      else entry.queue.push(candidate);
    };

    socket.on(EV.RTC_PEER_JOINED, onPeerJoined);
    socket.on(EV.RTC_PEER_LEFT, onPeerLeft);
    socket.on(EV.RTC_OFFER, onOffer);
    socket.on(EV.RTC_ANSWER, onAnswer);
    socket.on(EV.RTC_ICE, onIce);

    return () => {
      cancelled = true;
      socket.off(EV.RTC_PEER_JOINED, onPeerJoined);
      socket.off(EV.RTC_PEER_LEFT, onPeerLeft);
      socket.off(EV.RTC_OFFER, onOffer);
      socket.off(EV.RTC_ANSWER, onAnswer);
      socket.off(EV.RTC_ICE, onIce);
      socket.emit(EV.RTC_LEAVE);

      Object.keys(peersRef.current).forEach((id) => closePeer(id));
      localRef.current?.getTracks().forEach((t) => t.stop());
      localRef.current = null;
      setLocalStream(null);
      setPeers({});
    };
  }, [active, socket, createPeer, closePeer, upsertPeer, flushIce]);

  const toggleMic = useCallback(() => {
    const stream = localRef.current;
    if (!stream) return;
    const next = !stream.getAudioTracks()[0]?.enabled;
    stream.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicOn(next);
  }, []);

  const toggleCam = useCallback(() => {
    const stream = localRef.current;
    if (!stream) return;
    const next = !stream.getVideoTracks()[0]?.enabled;
    stream.getVideoTracks().forEach((t) => (t.enabled = next));
    setCamOn(next);
  }, []);

  return {
    localStream,
    peers: Object.values(peers),
    micOn,
    camOn,
    error,
    toggleMic,
    toggleCam,
  };
}
