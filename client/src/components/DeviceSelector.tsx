'use client';

import { useEffect, useState } from 'react';

interface Device {
  deviceId: string;
  label: string;
  kind: string;
}

interface DeviceSelectorProps {
  onDeviceChange?: (deviceId: string, kind: string) => void;
}

export default function DeviceSelector({ onDeviceChange }: DeviceSelectorProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [selectedAudio, setSelectedAudio] = useState<string>('');

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      setDevices(deviceList);
      
      // Устанавливаем первые доступные устройства по умолчанию
      const firstVideo = deviceList.find(d => d.kind === 'videoinput');
      const firstAudio = deviceList.find(d => d.kind === 'audioinput');
      
      if (firstVideo) setSelectedVideo(firstVideo.deviceId);
      if (firstAudio) setSelectedAudio(firstAudio.deviceId);
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  };

  const handleVideoChange = (deviceId: string) => {
    setSelectedVideo(deviceId);
    onDeviceChange?.(deviceId, 'videoinput');
  };

  const handleAudioChange = (deviceId: string) => {
    setSelectedAudio(deviceId);
    onDeviceChange?.(deviceId, 'audioinput');
  };

  const videoDevices = devices.filter(d => d.kind === 'videoinput');
  const audioDevices = devices.filter(d => d.kind === 'audioinput');

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="font-semibold mb-4">Device Settings</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Camera</label>
          <select
            value={selectedVideo}
            onChange={(e) => handleVideoChange(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
          >
            {videoDevices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Microphone</label>
          <select
            value={selectedAudio}
            onChange={(e) => handleAudioChange(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
          >
            {audioDevices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={loadDevices}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
        >
          🔄 Refresh Devices
        </button>
      </div>
    </div>
  );
} 