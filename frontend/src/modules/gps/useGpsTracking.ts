import { ref, onUnmounted } from 'vue';
import { getSocket, disconnectSocket } from './socket.service';
import type { Socket } from 'socket.io-client';

interface GpsCoords {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
}

export function useGpsTracking() {
  const isTracking = ref(false);
  const currentPosition = ref<GpsCoords | null>(null);
  const error = ref<string | null>(null);

  let watchId: number | null = null;
  let socket: Socket | null = null;
  let tripId: string | null = null;
  let segmentId: string | null = null;

  // ─── Offline buffer for GPS points ───
  const offlineBuffer: any[] = [];

  function startTracking(tid: string, sid: string) {
    tripId = tid;
    segmentId = sid;
    error.value = null;

    if (!navigator.geolocation) {
      error.value = 'Geolocation not supported';
      return;
    }

    // Connect WebSocket
    socket = getSocket();
    socket.emit('trip:join', { tripId: tid });

    // Listen for ack
    socket.on('gps:ack', (data) => {
      // GPS point confirmed saved
    });

    // Start watching position
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: GpsCoords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
        };

        currentPosition.value = coords;

        const payload = {
          tripId,
          segmentId,
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          speed: coords.speed,
          heading: coords.heading,
          recordedAt: new Date().toISOString(),
        };

        if (socket?.connected) {
          // Send buffered points first
          if (offlineBuffer.length > 0) {
            socket.emit('gps:batch', { points: offlineBuffer });
            offlineBuffer.length = 0;
          }
          socket.emit('gps:send', payload);
        } else {
          // Offline — buffer the point
          offlineBuffer.push(payload);
        }
      },
      (err) => {
        error.value = err.message;
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      },
    );

    isTracking.value = true;
  }

  function updateSegment(newSegmentId: string) {
    segmentId = newSegmentId;
  }

  function pauseTracking() {
    // Keep watchPosition running to maintain GPS lock,
    // but stop sending to WebSocket
    isTracking.value = false;
  }

  function resumeTracking(newSegmentId: string) {
    segmentId = newSegmentId;
    isTracking.value = true;
  }

  function stopTracking() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }

    if (socket) {
      socket.emit('trip:leave', { tripId });
    }

    disconnectSocket();

    isTracking.value = false;
    currentPosition.value = null;
    tripId = null;
    segmentId = null;
  }

  onUnmounted(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
  });

  return {
    isTracking,
    currentPosition,
    error,
    startTracking,
    updateSegment,
    pauseTracking,
    resumeTracking,
    stopTracking,
  };
}
