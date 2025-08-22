'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import DeviceSelector from './DeviceSelector';

interface VideoCallProps {
  serverUrl?: string;
}

export default function VideoCall({ serverUrl }: VideoCallProps) {
  // Определяем URL сервера автоматически
  const getServerUrl = () => {
    if (serverUrl) return serverUrl;
    
    // В продакшене используем текущий хост
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol;
      const host = window.location.host;
      return `${protocol}//${host}`;
    }
    
    return 'http://localhost:10000';
  };

  const finalServerUrl = getServerUrl();
  const [isConnected, setIsConnected] = useState(false);

  const [mediaStatus, setMediaStatus] = useState('Not ready');
  const [connectionStatus, setConnectionStatus] = useState('Not started');
  const [audioLevel, setAudioLevel] = useState(0);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  // Инициализация Socket.IO
  useEffect(() => {
    socketRef.current = io(finalServerUrl, {
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to server with ID:', socketRef.current?.id);
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socketRef.current.on('connected', (data) => {
      console.log('Server confirmed connection, ID:', data.id);
    });

    socketRef.current.on('signal', handleSignal);

    return () => {
      socketRef.current?.disconnect();
    };
  }, [finalServerUrl]);

  // Получение медиапотока
  const getMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setMediaStatus('Ready');
      console.log('Got media stream');
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setMediaStatus('Error: ' + (error as Error).message);
      alert('Cannot access camera/microphone: ' + (error as Error).message);
    }
  };

  // Создание Peer Connection
  const createPeerConnection = () => {
    if (!localStreamRef.current) return;

    peerConnectionRef.current = new RTCPeerConnection(configuration);

    localStreamRef.current.getTracks().forEach(track => {
      peerConnectionRef.current?.addTrack(track, localStreamRef.current!);
    });

    peerConnectionRef.current.ontrack = (event) => {
      console.log('Received remote stream');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setupAudioMonitoring(event.streams[0]);
      }
    };

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('signal', {
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    peerConnectionRef.current.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnectionRef.current?.connectionState);
      setConnectionStatus(peerConnectionRef.current?.connectionState || 'Unknown');
    };

    peerConnectionRef.current.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', peerConnectionRef.current?.iceConnectionState);
    };
  };

  // Обработка сигналов
  const handleSignal = async (data: { type: string; offer?: RTCSessionDescriptionInit; answer?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }) => {
    console.log('Received signal:', data.type);
    
    if (!peerConnectionRef.current) {
      createPeerConnection();
    }

          try {
        if (data.type === 'offer' && data.offer) {
          await peerConnectionRef.current?.setRemoteDescription(data.offer);
          const answer = await peerConnectionRef.current?.createAnswer();
          if (answer) {
            await peerConnectionRef.current?.setLocalDescription(answer);
            
            socketRef.current?.emit('signal', {
              type: 'answer',
              answer: answer
            });
          }
        } else if (data.type === 'answer' && data.answer) {
          await peerConnectionRef.current?.setRemoteDescription(data.answer);
        } else if (data.type === 'ice-candidate' && data.candidate) {
          await peerConnectionRef.current?.addIceCandidate(data.candidate);
        }
      } catch (error) {
        console.error('Error handling signal:', error);
      }
  };

  // Настройка мониторинга аудио
  const setupAudioMonitoring = (stream: MediaStream) => {
    if (!remoteVideoRef.current) return;

    try {
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      
      updateAudioLevels();
    } catch (error) {
      console.error('Error setting up audio monitoring:', error);
    }
  };

  // Обновление уровня аудио
  const updateAudioLevels = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    setAudioLevel(average);
    
    requestAnimationFrame(updateAudioLevels);
  };

  // Начало звонка
  const startCall = async () => {
    if (!peerConnectionRef.current) {
      createPeerConnection();
    }
    
    try {
      const offer = await peerConnectionRef.current?.createOffer();
      await peerConnectionRef.current?.setLocalDescription(offer);
      
      socketRef.current?.emit('signal', {
        type: 'offer',
        offer: offer
      });
      console.log('Offer sent');
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  // Переключение аудио вывода
  const switchAudioOutput = async () => {
    if (!remoteVideoRef.current) return;

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
      
      if (audioOutputs.length > 0) {
        await (remoteVideoRef.current as HTMLVideoElement & { setSinkId: (deviceId: string) => Promise<void> }).setSinkId(audioOutputs[0].deviceId);
        console.log('Audio output switched');
      }
    } catch (error) {
      console.error('Error switching audio:', error);
    }
  };

  // Обработка смены устройства
  const handleDeviceChange = async (deviceId: string, kind: string) => {
    if (!localStreamRef.current) return;

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: kind === 'videoinput' ? { deviceId: { exact: deviceId } } : true,
        audio: kind === 'audioinput' ? { deviceId: { exact: deviceId } } : true
      });

      // Заменяем треки в существующем потоке
      const oldTrack = localStreamRef.current.getTracks().find(track => 
        track.kind === kind.replace('input', '')
      );
      const newTrack = newStream.getTracks().find(track => 
        track.kind === kind.replace('input', '')
      );

      if (oldTrack && newTrack) {
        oldTrack.stop();
        localStreamRef.current.removeTrack(oldTrack);
        localStreamRef.current.addTrack(newTrack);
      }

      // Обновляем peer connection если он существует
      if (peerConnectionRef.current) {
        const senders = peerConnectionRef.current.getSenders();
        const sender = senders.find(s => s.track?.kind === kind.replace('input', ''));
        if (sender && newTrack) {
          sender.replaceTrack(newTrack);
        }
      }
    } catch (error) {
      console.error('Error switching device:', error);
    }
  };

  // Инициализация медиа при загрузке
  useEffect(() => {
    getMedia();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Video Chat</h1>
        
        {/* Видео контейнер */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <div className="relative">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-80 h-60 bg-gray-800 rounded-lg border-2 border-blue-500"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
              Local Video
            </div>
          </div>
          
          <div className="relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              controls
              className="w-80 h-60 bg-gray-800 rounded-lg border-2 border-green-500"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
              Remote Video
            </div>
          </div>
        </div>

        {/* Кнопки управления */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={startCall}
            disabled={!isConnected || !localStreamRef.current}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
          >
            Start Call
          </button>
          
          <button
            onClick={switchAudioOutput}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
          >
            🔊 Switch Speaker
          </button>

          <button
            onClick={() => setShowDeviceSelector(!showDeviceSelector)}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
          >
            ⚙️ Devices
          </button>
        </div>

        {/* Device Selector */}
        {showDeviceSelector && (
          <div className="mb-8">
            <DeviceSelector onDeviceChange={handleDeviceChange} />
          </div>
        )}

        {/* Статус */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">WebSocket</h3>
            <p className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Media</h3>
            <p className="text-sm text-blue-400">{mediaStatus}</p>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Connection</h3>
            <p className="text-sm text-yellow-400">{connectionStatus}</p>
          </div>
        </div>

        {/* Аудио индикатор */}
        <div className="flex justify-center">
          <div className="flex items-end gap-1 h-16">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-3 bg-gray-600 rounded-t transition-all duration-100"
                style={{
                  height: `${Math.max(4, (audioLevel / 255) * 60 * (i + 1) / 5)}px`,
                  backgroundColor: audioLevel > 50 ? '#10b981' : '#6b7280'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 