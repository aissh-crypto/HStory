import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Video,
  Upload,
  RefreshCw,
  Sparkles,
  Send,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  MapPin,
  X,
  Mic,
  MicOff,
  Image as ImageIcon,
  FolderCheck,
  ChevronDown,
  Building,
  Play,
  Square,
  Film,
  PhoneCall,
  Radio,
  ZoomIn,
  Download,
  ShieldCheck,
} from 'lucide-react';
import { Property, UserProfile, RecordedInspectionVideo } from '../types';
import { api } from '../services/api';

interface ChatMessage {
  id: string;
  sender: 'agent' | 'user';
  text: string;
  timestamp: string;
  severity?: 'Critical Red Flag' | 'Moderate Defect' | 'Normal / Clear' | 'Pending Verification';
  photoUrl?: string;
  suggestedChips?: string[];
  costEstimate?: string;
  statutoryRule?: string;
}

interface SightViewScreenProps {
  userProfile: UserProfile;
  initialProperty?: Property | null;
  allProperties: Property[];
  onNavigateToProperty?: (property: Property) => void;
  onSaveToCaseFile?: (session: any) => void;
  onBack?: () => void;
}

// Sample inspection photos for instant testing on desktop/laptop simulators
const SAMPLE_INSPECTION_PREVIEWS = [
  {
    title: 'Roof & Attic Flashing',
    category: 'Roof & Waterproofing',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    prompt: 'Inspecting the roof flashing and attic ceiling rafters. Are there signs of active rainwater infiltration or damaged membrane?',
  },
  {
    title: 'Ceiling Water Stain',
    category: 'Water Ingress',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    prompt: 'I see a faint yellowish water stain ring on the plaster ceiling near the AC duct. Is it an active leak?',
  },
  {
    title: 'Electrical DB Breaker',
    category: 'Electrical Safety',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    prompt: 'Inspecting the distribution board breaker. Does it comply with Suruhanjaya Tenaga 30mA RCD protection?',
  },
  {
    title: 'Hollow Floor Tiles',
    category: 'Finishes / Tiling',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    prompt: 'Tapped these living room porcelain tiles with my car keys. Two sound hollow and resonant. What is the repair cost?',
  },
  {
    title: 'Bathroom Sink Plumbing',
    category: 'Plumbing',
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    prompt: 'Looking under the vanity basin. The compression joint has green oxidation. Is this a defect?',
  },
  {
    title: 'Coffee Cup (Non-House)',
    category: 'Test Non-House AI',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    prompt: 'Here is a photo of a coffee cup on a cafe table. What do you see?',
  },
];

export const SightViewScreen: React.FC<SightViewScreenProps> = ({
  userProfile,
  initialProperty = null,
  allProperties = [],
  onNavigateToProperty,
  onSaveToCaseFile,
  onBack,
}) => {
  // Property selection: defaults to null ("Any House") unless initialProperty was passed from listing/casefile
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(initialProperty || null);
  const [isPropertyDropdownOpen, setIsPropertyDropdownOpen] = useState(false);

  // Camera & Image State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isSimulatorActive, setIsSimulatorActive] = useState(true);
  const [simulatorPresetIndex, setSimulatorPresetIndex] = useState(0);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Live AI Video Call & Walkthrough Recording state
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [videoCallDuration, setVideoCallDuration] = useState(0);
  const [recordedVideos, setRecordedVideos] = useState<RecordedInspectionVideo[]>([]);
  const [activeVideoPreview, setActiveVideoPreview] = useState<RecordedInspectionVideo | null>(null);
  const [activePhotoPreview, setActivePhotoPreview] = useState<{
    url: string;
    title: string;
    caption?: string;
    timestamp?: string;
    severity?: 'Critical Red Flag' | 'Moderate Defect' | 'Normal / Clear' | 'Pending Verification';
    sender?: 'user' | 'agent';
  } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const callTimerRef = useRef<any>(null);

  // Chat & Voice State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'agent',
      text: `Hello! I'm your SightView AI On-Site Inspection Agent. Point your camera at any ceiling, tile floor, electrical DB box, or bathroom pipe. Take a photo, start a live AI video call, or speak with me, and I'll analyze defects, statutory building regulations, and repair costs in real time.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedChips: [
        'Inspect roof flashing & water leaks',
        'Check ceiling for active water leak',
        'Inspect electrical DB breaker box',
        'Test floor tile hollowness',
      ],
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [inCallInput, setInCallInput] = useState('');
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [savedToDossierSuccess, setSavedToDossierSuccess] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const photoUploadInputRef = useRef<HTMLInputElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Scroll to top of page on mount
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // Video call duration timer
  useEffect(() => {
    if (isVideoCallActive) {
      callTimerRef.current = setInterval(() => {
        setVideoCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      setVideoCallDuration(0);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [isVideoCallActive]);

  // Scroll chat smoothly to bottom when new messages arrive (only if video call is not active)
  useEffect(() => {
    if (!isVideoCallActive) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAnalyzing, isVideoCallActive]);

  // Attempt camera startup on initial mount, or seamlessly fallback to AR defect stream
  useEffect(() => {
    if (typeof navigator !== 'undefined' && !!navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      startCamera().catch(() => {
        setIsSimulatorActive(true);
      });
    }
    return () => {
      stopCamera();
    };
  }, []);

  // Sync stream to video element whenever camera becomes active
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((e) => console.warn('Video auto-play:', e));
    }
  }, [isCameraActive]);

  // Read message aloud if audio enabled
  const speakMessage = (text: string) => {
    if (!isAudioEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*_#`⚠️✅❌]/g, '').trim();
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech error:', e);
    }
  };

  // Toggle voice speech recognition input
  const toggleListening = () => {
    if (isListening) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          sender: 'agent',
          text: 'Speech recognition is not supported on this browser. You can type your question in the chat box or tap any of the suggested chips below.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-MY';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setUserInput(transcript);
          handleSendMessage(transcript);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Recognition start error:', err);
      setIsListening(false);
    }
  };

  // Play mechanical shutter click sound via Web Audio API
  const playShutterSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch (e) {
      // Audio might be suppressed before gesture
    }
  };

  // Start live webcam / mobile camera stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        setCameraError('Camera access not supported in this preview iframe. Interactive live inspection simulator is active.');
        setIsSimulatorActive(true);
        setIsCameraActive(false);
        return;
      }

      let stream: MediaStream | null = null;
      try {
        // Attempt 1: Ideal facingMode and dimensions
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: cameraFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (firstErr) {
        // Attempt 2: Fallback to basic { video: true } (universal compatibility for all webcams)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      if (stream) {
        streamRef.current = stream;
        setIsCameraActive(true);
        setIsSimulatorActive(false);
        setCapturedImage(null);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.muted = true;
          try {
            await videoRef.current.play();
          } catch (e) {
            console.warn('Video play notice:', e);
          }
        }
      }
    } catch (err: any) {
      console.warn('Physical camera unavailable:', err);
      const isBlocked = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      if (isBlocked) {
        setCameraError('Camera permission blocked by browser or iframe. You can use the Interactive AR Defect Stream or Take Photo below.');
      } else {
        setCameraError('No webcam hardware detected. Active live defect simulator enabled.');
      }
      setIsCameraActive(false);
      setIsSimulatorActive(true);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Switch Rear / Front Camera
  const toggleCameraFacing = () => {
    stopCamera();
    setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
    setTimeout(startCamera, 300);
  };

  // Trigger shutter flash
  const triggerShutterFlash = () => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 240);
  };

  // Snap frame from active video stream or active simulator feed
  const snapFrame = () => {
    playShutterSound();
    triggerShutterFlash();
    if (isCameraActive && videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 800;
      canvas.height = videoRef.current.videoHeight || 600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(dataUrl);
        stopCamera();
        sendImageToAgent(dataUrl, 'I have captured this photo with my camera. What defects, statutory standards, or repair costs do you observe?');
      }
    } else if (isSimulatorActive) {
      const currentSample = SAMPLE_INSPECTION_PREVIEWS[simulatorPresetIndex % SAMPLE_INSPECTION_PREVIEWS.length];
      setCapturedImage(currentSample.url);
      sendImageToAgent(currentSample.url, currentSample.prompt);
    }
  };

  // Handle native mobile camera capture or photo upload
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCapturedImage(dataUrl);
        stopCamera();
        sendImageToAgent(dataUrl, 'I have captured this photo with my camera. Please analyze what you see.');
      }
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // Load sample inspection scenario photo
  const loadSampleInspection = (sample: typeof SAMPLE_INSPECTION_PREVIEWS[0]) => {
    stopCamera();
    setCapturedImage(sample.url);
    sendImageToAgent(sample.url, sample.prompt);
  };

  // Send photo + message to SightView AI Agent
  const sendImageToAgent = async (imageDataUrl: string, promptText: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      photoUrl: imageDataUrl,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsAnalyzing(true);
    setSavedToDossierSuccess(false);

    try {
      const res = await api.chatWithSightViewAgent({
        message: promptText,
        imageBase64: imageDataUrl,
        propertyTitle: selectedProperty?.title || 'Any House / On-Site Inspection',
        chatHistory: messages.map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: m.text,
        })),
      });

      const agentMsg: ChatMessage = {
        id: `msg-agent-${Date.now()}`,
        sender: 'agent',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        severity: res.severity,
        suggestedChips: res.suggestedChips,
      };

      setMessages((prev) => [...prev, agentMsg]);
      speakMessage(res.reply);
    } catch (err) {
      console.warn('Agent send error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // User submits a chat message
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setUserInput('');
    setIsAnalyzing(true);
    setSavedToDossierSuccess(false);

    try {
      const res = await api.chatWithSightViewAgent({
        message: textToSend,
        imageBase64: capturedImage || undefined,
        propertyTitle: selectedProperty?.title || 'Any House / On-Site Inspection',
        chatHistory: messages.map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: m.text,
        })),
      });

      const agentMsg: ChatMessage = {
        id: `msg-agent-${Date.now()}`,
        sender: 'agent',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        severity: res.severity,
        suggestedChips: res.suggestedChips,
      };

      setMessages((prev) => [...prev, agentMsg]);
      speakMessage(res.reply);
    } catch (err) {
      console.warn('Agent message error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Start live AI Video Call & Walkthrough Recording with simultaneous audio conversation
  const startVideoCallAndRecording = async () => {
    try {
      let stream = streamRef.current;
      if (!stream || !isCameraActive) {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: cameraFacing },
            audio: true,
          }).catch(() => null);
          if (stream) {
            streamRef.current = stream;
            setIsCameraActive(true);
            setIsSimulatorActive(false);
          }
        }
      }

      recordedChunksRef.current = [];

      if (stream && typeof MediaRecorder !== 'undefined') {
        try {
          const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
            ? 'video/webm;codecs=vp9,opus'
            : MediaRecorder.isTypeSupported('video/webm')
            ? 'video/webm'
            : 'video/mp4';
          const recorder = new MediaRecorder(stream, { mimeType: mime });
          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              recordedChunksRef.current.push(e.data);
            }
          };
          recorder.start(1000);
          mediaRecorderRef.current = recorder;
        } catch (recErr) {
          console.warn('MediaRecorder init fallback:', recErr);
        }
      }

      setIsVideoCallActive(true);
      setIsAudioEnabled(true);
      speakMessage('SightView live AI walkthrough video call connected. I am inspecting the video feed with you. Walk around the property and highlight any areas of interest.');

      setMessages((prev) => [
        ...prev,
        {
          id: `call-start-${Date.now()}`,
          sender: 'agent',
          text: `🔴 **Live AI Video Call & Walkthrough Recording Active**\nVideo stream and microphone are active. Pan your camera across rooms, ceilings, and distribution panels. I am listening and analyzing defect standards in real time.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      console.warn('Video call error:', err);
      setIsVideoCallActive(true);
    }
  };

  // Stop video call & walkthrough recording and persist video package to dossier
  const stopVideoCallAndRecording = () => {
    setIsVideoCallActive(false);
    const duration = videoCallDuration || 14;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Recorder stop:', e);
      }
    }

    let finalVideoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-living-room-4813-large.mp4';
    if (recordedChunksRef.current.length > 0) {
      try {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        finalVideoUrl = URL.createObjectURL(blob);
      } catch (e) {
        console.warn('Blob URL generation:', e);
      }
    }

    const currentPropertyTitle = selectedProperty?.title || 'Residential Property';
    const sampleImg = capturedImage || SAMPLE_INSPECTION_PREVIEWS[simulatorPresetIndex % SAMPLE_INSPECTION_PREVIEWS.length].url;

    const newVideo: RecordedInspectionVideo = {
      id: `vid-${Date.now()}`,
      title: `AI Video Call Walkthrough • ${currentPropertyTitle}`,
      videoUrl: finalVideoUrl,
      thumbnailUrl: sampleImg,
      durationSeconds: duration,
      timestamp: new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      defectsNoted: [
        'Ceiling moisture perimeter audit (CIS 7 standard)',
        'Suruhanjaya Tenaga 30mA RCD distribution board test',
        'Living hall tile hollowness resonance log',
      ],
      aiSummary: `Comprehensive ${duration}s camera walkthrough completed with SightView AI live inspection agent. Defect observations and acoustic logs appended to case dossier repository.`,
      transcripts: messages.slice(-5).map((m) => ({
        speaker: m.sender === 'user' ? 'Buyer' : 'SightView AI',
        text: m.text,
        timestamp: m.timestamp,
      })),
    };

    const updatedVids = [newVideo, ...recordedVideos];
    setRecordedVideos(updatedVids);

    if (onSaveToCaseFile) {
      onSaveToCaseFile({
        property: selectedProperty || allProperties[0],
        photoUrl: sampleImg,
        photos: [sampleImg],
        recordedVideo: newVideo,
        recordedVideos: updatedVids,
        defectObservation: `Recorded ${duration}s Live AI Video Walkthrough Inspection with verbal defect commentary.`,
        severity: 'Moderate Defect',
        timestamp: new Date().toISOString(),
      });
      setSavedToDossierSuccess(true);
      setTimeout(() => setSavedToDossierSuccess(false), 4000);
    }

    speakMessage('Walkthrough recording completed and saved to case file repository.');
  };

  // Save current inspection finding to Case File Dossier
  const handleSaveToCaseFile = () => {
    if (onSaveToCaseFile) {
      const lastAgentMsg = [...messages].reverse().find((m) => m.sender === 'agent' && m.severity);
      
      const sessionPhotos = messages
        .map((m) => m.photoUrl)
        .filter(Boolean) as string[];
      if (capturedImage && !sessionPhotos.includes(capturedImage)) {
        sessionPhotos.push(capturedImage);
      }

      const sessionTranscripts = messages.map((m) => ({
        speaker: m.sender === 'user' ? 'user' : 'SightView AI',
        text: m.text,
        timestamp: m.timestamp,
        severity: m.severity,
      }));

      onSaveToCaseFile({
        property: selectedProperty || allProperties[0],
        photoUrl: capturedImage,
        photos: sessionPhotos,
        recordedVideos: recordedVideos,
        transcripts: sessionTranscripts,
        defectObservation: lastAgentMsg?.text || messages[messages.length - 1]?.text,
        severity: lastAgentMsg?.severity || 'Pending Verification',
        timestamp: new Date().toISOString(),
      });
      setSavedToDossierSuccess(true);
      setTimeout(() => setSavedToDossierSuccess(false), 3500);
    }
  };

  const getSeverityBadge = (severity?: string) => {
    if (!severity) return null;
    switch (severity) {
      case 'Critical Red Flag':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-xs">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Critical Red Flag
          </span>
        );
      case 'Moderate Defect':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-xs">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Moderate Defect
          </span>
        );
      case 'Normal / Clear':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Clear / Normal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 shadow-xs">
            <Sparkles className="w-3 h-3 text-blue-600" />
            Inspection Active
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-24">
      {/* ================= TOP NAVIGATION BAR ================= */}
      {/* By default shows "Any house". If opened from a casefile/listing, shows the specific house */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-[#E8E2D6] shadow-[0_4px_20px_rgba(30,42,68,0.04)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-[#E8E2D6] bg-slate-50 hover:bg-amber-50 hover:border-amber-300 text-[#1E2A44] text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1 shadow-2xs"
              title="Return to previous screen"
            >
              <ArrowLeft className="w-4 h-4 text-[#C98A3E]" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Camera className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-label text-[9px] font-bold uppercase tracking-wider text-amber-600">
                SIGHTVIEW AI™ LIVE INSPECTION
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Context House Name with 1-click switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsPropertyDropdownOpen(!isPropertyDropdownOpen)}
                className="flex items-center gap-1.5 text-left font-serif font-bold text-sm sm:text-base text-[#1E2A44] hover:text-amber-700 transition-colors cursor-pointer group"
                title="Click to switch property context"
              >
                <span className="truncate max-w-[200px] sm:max-w-[320px]">
                  {selectedProperty ? selectedProperty.title : 'Any House (General Viewing)'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 shrink-0 transition-transform" />
              </button>

              {/* 1-Click Dropdown to Switch Property or choose Any House */}
              {isPropertyDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-[#E8E2D6] p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Inspection Context
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProperty(null);
                      setIsPropertyDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                      selectedProperty === null
                        ? 'bg-amber-50 text-amber-900 border border-amber-200'
                        : 'text-[#1E2A44] hover:bg-slate-50'
                    }`}
                  >
                    <span>Any House (General Viewing)</span>
                    {selectedProperty === null && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />}
                  </button>

                  <div className="my-1 border-t border-slate-100" />
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Saved / Available Properties
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {allProperties.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedProperty(p);
                          setIsPropertyDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                          selectedProperty?.id === p.id
                            ? 'bg-amber-50 text-amber-900 font-bold border border-amber-200'
                            : 'text-[#1E2A44] hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="truncate">{p.title}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{p.city}</div>
                        </div>
                        {selectedProperty?.id === p.id && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls: Audio Read-Aloud Toggle & Save Dossier */}
        <div className="flex items-center gap-2">
          {/* Read aloud toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !isAudioEnabled;
              setIsAudioEnabled(next);
              if (next) {
                speakMessage('SightView live voice assistant enabled.');
              } else if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
            }}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isAudioEnabled
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-white border-[#E8E2D6] text-slate-600 hover:text-[#1E2A44]'
            }`}
            title="Toggle voice speech synthesis"
          >
            {isAudioEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span className="hidden sm:inline">Voice: On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-400" />
                <span className="hidden sm:inline">Voice: Off</span>
              </>
            )}
          </button>

          {/* Save Finding to Case File */}
          {onSaveToCaseFile && (
            <button
              type="button"
              onClick={handleSaveToCaseFile}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                savedToDossierSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#1E2A44] hover:bg-[#2A3B5E] text-white'
              }`}
              title="Save current observation to Case File"
            >
              <FolderCheck className="w-3.5 h-3.5" />
              <span>{savedToDossierSuccess ? 'Saved to Dossier!' : 'Save to Dossier'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= CAMERA VIEWPORT & PHOTO PREVIEW ================= */}
      <div className="bg-white rounded-3xl overflow-hidden border border-[#E8E2D6] shadow-[0_10px_30px_rgba(30,42,68,0.05)]">
        <div className="relative aspect-[4/3] sm:aspect-[16/9] bg-[#0F172A] flex items-center justify-center overflow-hidden">
          {/* Always mounted video element for reliable mediaStream attachment */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
            style={{
              opacity: isCameraActive && !capturedImage ? 1 : 0,
              zIndex: isCameraActive && !capturedImage ? 10 : 0,
              pointerEvents: isCameraActive && !capturedImage ? 'auto' : 'none',
            }}
          />

          {/* Shutter Flash Animation Effect */}
          {isFlashing && (
            <div className="absolute inset-0 bg-white/90 z-40 pointer-events-none transition-opacity duration-200" />
          )}

          {/* Live AI Video Call Recording Overlay Banner */}
          {isVideoCallActive && (
            <>
              {/* Top Call Status Bar */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-40 p-2.5 rounded-2xl bg-red-600/95 text-white backdrop-blur-md border border-red-400/60 shadow-xl pointer-events-auto">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  <span className="font-bold text-[11px] sm:text-xs uppercase tracking-wider">LIVE AI VIDEO CALL &amp; WALKTHROUGH REC</span>
                  <span className="font-mono text-xs font-bold bg-black/40 px-2 py-0.5 rounded">
                    {Math.floor(videoCallDuration / 60).toString().padStart(2, '0')}:{(videoCallDuration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={stopVideoCallAndRecording}
                  className="px-3 py-1 rounded-xl bg-white hover:bg-red-50 text-red-700 font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop &amp; Save to Dossier</span>
                </button>
              </div>

              {/* In-Call Active AI Voice Inspector HUD */}
              <div className="absolute inset-0 z-35 flex flex-col justify-between p-3 sm:p-4 bg-gradient-to-b from-black/50 via-transparent to-black/85 pointer-events-none">
                {/* Upper Inspector Connected Bar */}
                <div className="mt-14 sm:mt-16 flex items-center justify-between gap-2 pointer-events-auto">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/85 border border-emerald-500/40 text-emerald-300 text-[11px] sm:text-xs backdrop-blur-md shadow-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-bold">AI Inspector Connected</span>
                    <div className="flex items-center gap-0.5 ml-1">
                      <span className="w-1 h-2.5 bg-emerald-400 rounded-full animate-bounce" />
                      <span className="w-1 h-3.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                      <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAudioEnabled(!isAudioEnabled);
                      if (!isAudioEnabled) {
                        speakMessage('Audio voice responses enabled. I will speak to you during the inspection.');
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                      isAudioEnabled
                        ? 'bg-amber-500 text-white'
                        : 'bg-black/70 text-white/80 border border-white/20 hover:bg-black/90'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{isAudioEnabled ? 'Voice Readout On' : 'Voice Muted'}</span>
                  </button>
                </div>

                {/* Lower Subtitle & Direct Voice/Chat Interaction Bar */}
                <div className="space-y-2 pointer-events-auto mb-1">
                  {/* Latest AI Agent Observation Subtitle */}
                  {messages.length > 0 && (
                    <div className="p-2.5 sm:p-3 rounded-2xl bg-black/85 backdrop-blur-md border border-amber-400/40 text-white shadow-xl max-w-xl mx-auto">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>SightView AI Observation</span>
                        </span>
                        {messages[messages.length - 1].severity && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                            {messages[messages.length - 1].severity}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-100 font-sans leading-relaxed line-clamp-2">
                        {messages[messages.length - 1].text.replace(/[*_#`]/g, '')}
                      </p>
                    </div>
                  )}

                  {/* Quick Inspection Voice Prompts */}
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                    {[
                      'Inspect ceiling water stain',
                      'Check electrical DB box',
                      'Is this crack structural?',
                      'Test floor tile hollowness',
                      'Check window sealant',
                    ].map((prompt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(prompt)}
                        className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/20 whitespace-nowrap transition-all shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <span>💬</span>
                        <span>{prompt}</span>
                      </button>
                    ))}
                  </div>

                  {/* Tap to Speak + Direct In-Call Chat Input */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`px-3 sm:px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all cursor-pointer shrink-0 ${
                        isListening
                          ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white ring-1 ring-emerald-300'
                      }`}
                      title="Tap to speak to AI inspector"
                    >
                      <Mic className={`w-3.5 h-3.5 ${isListening ? 'animate-bounce' : ''}`} />
                      <span>{isListening ? 'Listening...' : 'Tap to Speak'}</span>
                    </button>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (inCallInput.trim()) {
                          handleSendMessage(inCallInput);
                          setInCallInput('');
                        }
                      }}
                      className="flex-1 flex items-center gap-1 bg-black/70 backdrop-blur-md rounded-xl border border-white/25 p-1"
                    >
                      <input
                        type="text"
                        value={inCallInput}
                        onChange={(e) => setInCallInput(e.target.value)}
                        placeholder="Talk or type to AI inspector..."
                        className="flex-1 bg-transparent text-white text-xs px-2.5 py-1 focus:outline-none placeholder:text-white/60"
                      />
                      <button
                        type="submit"
                        disabled={!inCallInput.trim()}
                        className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold text-xs transition-all cursor-pointer"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Top Mode Switcher Banner on Viewport */}
          <div className={`absolute ${isVideoCallActive ? 'top-16 sm:top-14' : 'top-3'} left-3 right-3 flex flex-wrap items-center justify-between gap-2 z-30 pointer-events-auto transition-all`}>
            <div className="flex items-center gap-1.5 p-1 bg-black/60 backdrop-blur-md rounded-2xl border border-white/15 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  if (!isCameraActive) startCamera();
                }}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isCameraActive && !capturedImage
                    ? 'bg-emerald-500 text-white shadow-sm ring-1 ring-emerald-300'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Live Webcam</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setIsSimulatorActive(true);
                  setCapturedImage(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSimulatorActive && !isCameraActive && !capturedImage
                    ? 'bg-amber-500 text-white shadow-sm ring-1 ring-amber-300'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Interactive AR Stream</span>
              </button>
            </div>

            {capturedImage && (
              <span className="px-3 py-1 text-[11px] font-mono rounded-full bg-black/70 backdrop-blur-md text-amber-300 border border-amber-400/40 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Captured Frame
              </span>
            )}

            {isCameraActive && !capturedImage && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  60 FPS • REC
                </span>
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="p-1.5 rounded-full bg-black/60 hover:bg-black text-white border border-white/20 transition-all cursor-pointer"
                  title="Switch Front/Rear"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                </button>
              </div>
            )}
          </div>

          {/* AR HUD Targeting Overlay for Live Physical Camera */}
          {isCameraActive && !capturedImage && (
            <div className="absolute inset-4 sm:inset-8 border border-amber-400/40 rounded-2xl pointer-events-none flex flex-col justify-between p-3 sm:p-4 z-20">
              <div className="flex items-center justify-between text-white text-[10px] font-mono mt-8">
                <span className="bg-black/60 px-2 py-0.5 rounded border border-white/20">
                  {cameraFacing === 'environment' ? 'REAR WIDE-ANGLE' : 'FRONT / WEBCAM'}
                </span>
                <span className="bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40 font-bold">
                  SIGHTVIEW AI ONLINE
                </span>
              </div>

              {/* Scanning Laser Beam Effect */}
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_16px_#F59E0B] animate-laserSweep pointer-events-none opacity-85" />

              {/* Central Reticle */}
              <div className="self-center flex flex-col items-center gap-1.5">
                <div className="w-20 h-20 border-2 border-dashed border-amber-400 rounded-2xl flex items-center justify-center relative shadow-[0_0_20px_rgba(245,158,11,0.25)] animate-reticlePulse">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  {/* Reticle Corner Brackets */}
                  <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
                  <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-400" />
                  <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-400" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-400" />
                </div>
                <span className="text-[10px] font-mono text-amber-300 font-bold bg-black/75 backdrop-blur-sm px-2.5 py-0.5 rounded border border-amber-400/30">
                  AIM AT CEILING, DB BOX, OR TILES
                </span>
              </div>

              <div className="flex items-center justify-between text-white text-[10px] font-mono">
                <span className="bg-black/60 px-2 py-0.5 rounded border border-white/20">
                  TAP SNAP TO AUDIT
                </span>
                <span className="bg-black/60 px-2 py-0.5 rounded border border-white/20">
                  LUX: 520 • ISO AUTO
                </span>
              </div>
            </div>
          )}

          {/* 2. Captured / Uploaded Photo Preview */}
          {!isCameraActive && capturedImage && (
            <div
              onClick={() => setActivePhotoPreview({
                url: capturedImage,
                title: `Captured Inspection Frame • ${selectedProperty?.title || 'Property Inspection'}`,
                caption: 'High-resolution still frame captured from device camera. Analyzed with Gemini Multimodal Vision for structural, plumbing, and electrical defect anomalies.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                sender: 'user',
              })}
              className="relative w-full h-full z-10 cursor-pointer group select-none"
              title="Click to enlarge captured inspection photo"
            >
              <img
                src={capturedImage}
                alt="Captured Inspection"
                className="w-full h-full object-contain bg-black"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[10px] font-mono flex items-center gap-1.5 border border-white/20 opacity-85 group-hover:opacity-100 transition-opacity shadow-md">
                <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
                <span>Click to Enlarge Photo</span>
              </div>
              {/* Scanline AI Analysis Effect */}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-400/20 to-transparent animate-pulse flex items-center justify-center pointer-events-none">
                  <div className="px-4 py-2 rounded-full bg-[#1E2A44]/90 backdrop-blur-md text-amber-300 font-bold text-xs flex items-center gap-2 border border-amber-400/40 shadow-xl">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                    <span>Gemini AI Analyzing Vision Details...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Live Simulated Inspection Viewfinder with Interactive AR Pins and Laser Sweep */}
          {!isCameraActive && isSimulatorActive && !capturedImage && (
            <div className="relative w-full h-full overflow-hidden select-none z-10">
              <img
                src={SAMPLE_INSPECTION_PREVIEWS[simulatorPresetIndex % SAMPLE_INSPECTION_PREVIEWS.length].url}
                alt="Simulated Inspection View"
                className="w-full h-full object-cover scale-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-black/30 pointer-events-none" />

              {/* Scanning Laser Beam Effect */}
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_16px_#F59E0B] animate-laserSweep pointer-events-none opacity-85" />

              {/* Rotating Radar Tracker in Top Right Corner */}
              <div className="absolute top-14 right-4 pointer-events-none hidden sm:flex items-center gap-2 bg-black/60 px-2.5 py-1.5 rounded-xl border border-white/15 backdrop-blur-md">
                <div className="w-5 h-5 rounded-full border border-emerald-400/50 relative flex items-center justify-center animate-radarRotate">
                  <span className="absolute top-0 w-0.5 h-2.5 bg-gradient-to-b from-emerald-400 to-transparent" />
                </div>
                <span className="text-[10px] font-mono text-emerald-300 font-bold">RADAR SYNC</span>
              </div>

              {/* High-tech HUD Targeting Overlay */}
              <div className="absolute inset-4 sm:inset-8 border border-white/30 rounded-2xl pointer-events-none flex flex-col justify-between p-3 sm:p-4">
                <div className="flex items-center justify-between text-white text-[10px] font-mono mt-8">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-bold tracking-wider uppercase bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-400/50">
                      LIVE AR INSPECTION STREAM
                    </span>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 bg-black/60 px-2.5 py-0.5 rounded border border-white/20">
                    <span>60 FPS</span>
                    <span>EXP: +0.2</span>
                    <span>ISO: 100</span>
                  </div>
                </div>

                {/* Interactive Clickable AR Defect Detection Pins */}
                <div className="absolute inset-x-2 sm:inset-x-6 top-16 bottom-16 pointer-events-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  {/* Pin 1: Water / Moisture / Flashing */}
                  <button
                    type="button"
                    onClick={() => {
                      const sample = SAMPLE_INSPECTION_PREVIEWS[1]; // water leak
                      setCapturedImage(sample.url);
                      sendImageToAgent(sample.url, 'I see a potential water ingress mark here. Is it active dampness or cosmetic?');
                    }}
                    className="pointer-events-auto p-2 sm:p-2.5 rounded-xl bg-black/80 hover:bg-black backdrop-blur-md border border-amber-400 text-left shadow-lg transition-transform hover:scale-105 cursor-pointer max-w-[170px] sm:max-w-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span className="text-[10px] font-mono font-bold text-amber-300">
                        💧 MOISTURE RISK: 88%
                      </span>
                    </div>
                    <span className="block text-[9px] text-white/80 group-hover:text-amber-200 mt-0.5 truncate">
                      Tap to audit CIS 7 standard
                    </span>
                  </button>

                  {/* Pin 2: Hollowness / Crack */}
                  <button
                    type="button"
                    onClick={() => {
                      const sample = SAMPLE_INSPECTION_PREVIEWS[3]; // hollow tile
                      setCapturedImage(sample.url);
                      sendImageToAgent(sample.url, 'This tile sounds hollow upon impact tapping. What is the standard tolerance?');
                    }}
                    className="pointer-events-auto self-end sm:self-auto p-2 sm:p-2.5 rounded-xl bg-black/80 hover:bg-black backdrop-blur-md border border-emerald-400 text-left shadow-lg transition-transform hover:scale-105 cursor-pointer max-w-[170px] sm:max-w-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-[10px] font-mono font-bold text-emerald-300">
                        🔨 TILE HOLLOWNESS: 440Hz
                      </span>
                    </div>
                    <span className="block text-[9px] text-white/80 group-hover:text-emerald-200 mt-0.5 truncate">
                      Tap to test QLASSIC spec
                    </span>
                  </button>
                </div>

                {/* Central Reticle */}
                <div className="self-center flex flex-col items-center gap-1.5 pointer-events-none">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-dashed border-amber-400 rounded-2xl flex items-center justify-center relative animate-reticlePulse">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-emerald-400" />
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-emerald-400" />
                    <span className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-emerald-400" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-emerald-400" />
                  </div>
                  <span className="text-[10px] font-mono text-amber-300 font-bold bg-black/70 px-2 py-0.5 rounded">
                    ZONE: {SAMPLE_INSPECTION_PREVIEWS[simulatorPresetIndex % SAMPLE_INSPECTION_PREVIEWS.length].title.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-white text-[10px] font-mono">
                  <span className="bg-black/60 px-2 py-0.5 rounded border border-white/20">
                    DEFECT: {SAMPLE_INSPECTION_PREVIEWS[simulatorPresetIndex % SAMPLE_INSPECTION_PREVIEWS.length].category}
                  </span>
                  <span className="bg-black/60 px-2 py-0.5 rounded border border-white/20">
                    TAP SNAP TO AUDIT
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 4. Idle Camera State (Fallback if both disabled) */}
          {!isCameraActive && !isSimulatorActive && !capturedImage && (
            <div className="p-6 text-center text-slate-300 max-w-sm space-y-3 z-10">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto text-amber-400 border border-white/10 shadow-lg">
                <Camera className="w-7 h-7" />
              </div>
              <h4 className="font-serif font-bold text-base text-white">
                Live On-Site Camera Ready
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Start the live viewfinder, take a photo with your device camera, or test an instant live defect inspection simulation.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Start Viewfinder</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSimulatorActive(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs border border-white/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Launch Live Simulator</span>
                </button>
              </div>
            </div>
          )}

          {/* Camera Error Banner */}
          {cameraError && (
            <div className="absolute top-16 left-3 right-3 p-2.5 rounded-xl bg-amber-950/90 text-amber-200 text-xs backdrop-blur-md border border-amber-600/50 flex items-center justify-between z-30">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{cameraError}</span>
              </div>
              <button
                type="button"
                onClick={() => setCameraError(null)}
                className="text-amber-300 hover:text-white ml-2 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Retake / Clear photo button on captured preview */}
          {capturedImage && !isCameraActive && (
            <div className="absolute bottom-3 left-3 z-30 pointer-events-auto">
              <button
                type="button"
                onClick={() => {
                  setCapturedImage(null);
                  startCamera();
                }}
                className="px-3.5 py-1.5 rounded-full bg-black/75 hover:bg-black text-white text-xs font-semibold backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Retake Photo</span>
              </button>
            </div>
          )}
        </div>

        {/* Viewport Capture Controls Strip */}
        <div className="p-3.5 sm:p-4 bg-[#FAF8F5] border-t border-[#E8E2D6] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {/* Live Camera / Simulator Stream Controls */}
            {isCameraActive ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={snapFrame}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:opacity-95 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Snap Live Frame</span>
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3 py-2 rounded-xl border border-[#E8E2D6] bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Stop Stream
                </button>
              </div>
            ) : isSimulatorActive ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={snapFrame}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:opacity-95 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Snap Live View</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSimulatorPresetIndex((prev) => (prev + 1) % SAMPLE_INSPECTION_PREVIEWS.length)}
                  className="px-3 py-2 rounded-xl border border-[#E8E2D6] bg-white hover:bg-[#FAF7F0] text-[#1E2A44] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Switch inspection zone"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Cycle Inspection Zone</span>
                </button>

                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Connect physical camera"
                >
                  <Video className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Use Device Webcam</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startCamera}
                className="px-3.5 py-2 rounded-xl bg-[#1E2A44] hover:bg-[#2A3B5E] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Video className="w-4 h-4 text-amber-400" />
                <span>Start Viewfinder</span>
              </button>
            )}

            {/* Native Mobile Camera Input (Direct Shutter Trigger) */}
            <label
              className="px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Open phone camera directly"
            >
              <Camera className="w-4 h-4 text-amber-700" />
              <span>Take Photo</span>
              <input
                ref={nativeCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageFile}
                className="hidden"
              />
            </label>

            {/* Live AI Video Call & Walkthrough Recording Button */}
            <button
              type="button"
              onClick={isVideoCallActive ? stopVideoCallAndRecording : startVideoCallAndRecording}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                isVideoCallActive
                  ? 'bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-300 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
              title="Talk live to AI agent while recording physical video walkthrough"
            >
              {isVideoCallActive ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop &amp; Save Call ({Math.floor(videoCallDuration / 60)}:{(videoCallDuration % 60).toString().padStart(2, '0')})</span>
                </>
              ) : (
                <>
                  <Video className="w-3.5 h-3.5 text-amber-300" />
                  <span>Start AI Video Call / Record</span>
                </>
              )}
            </button>

            {/* Upload Existing Photo */}
            <label
              className="px-3.5 py-2 rounded-xl border border-[#E8E2D6] bg-white hover:bg-slate-50 text-[#1E2A44] text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Upload photo from library"
            >
              <Upload className="w-4 h-4 text-[#C98A3E]" />
              <span className="hidden xs:inline">Upload Photo</span>
              <input
                ref={photoUploadInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFile}
                className="hidden"
              />
            </label>
          </div>

          <div className="text-[11px] text-[#5B6478] font-medium hidden sm:block">
            Gemini 3 Multimodal Vision Active
          </div>
        </div>

        {/* 1-Tap Sample Scenarios Strip (Great for Testing & Mobile exploration) */}
        <div className="px-3.5 sm:px-4 py-2.5 bg-white border-t border-[#E8E2D6] flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Quick Test:
          </span>
          {SAMPLE_INSPECTION_PREVIEWS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadSampleInspection(sample)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#FAF8F5] hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-[#E8E2D6] shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>{sample.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ================= RECORDED AI VIDEO CALLS & WALKTHROUGHS GALLERY ================= */}
      {recordedVideos.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E8E2D6] shadow-[0_10px_30px_rgba(30,42,68,0.04)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-emerald-600" />
              <span className="font-serif font-bold text-base text-[#1E2A44]">
                Recorded AI Video Inspections &amp; Calls ({recordedVideos.length})
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
              Synced to Dossier Repository
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recordedVideos.map((vid) => (
              <div
                key={vid.id}
                className="p-3 rounded-2xl border border-[#E8E2D6] bg-[#FAF8F5] space-y-2 hover:border-amber-400 transition-all shadow-2xs"
              >
                <div
                  className="relative aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center group cursor-pointer"
                  onClick={() => setActiveVideoPreview(vid)}
                >
                  {vid.thumbnailUrl && (
                    <img src={vid.thumbnailUrl} alt={vid.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/90 text-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white font-mono text-[10px] font-bold">
                    {vid.durationSeconds}s
                  </span>
                </div>

                <div>
                  <div className="font-bold text-xs text-[#1E2A44] truncate">{vid.title}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{vid.timestamp}</div>
                  {vid.aiSummary && (
                    <p className="text-[11px] text-slate-700 mt-1 line-clamp-2 leading-relaxed">
                      {vid.aiSummary}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= ENLARGED RECORDED INSPECTION VIDEO MODAL ("WHAT IS IT?") ================= */}
      {activeVideoPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="fixed inset-0 cursor-pointer" onClick={() => setActiveVideoPreview(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#E8E2D6] shadow-2xl p-4 sm:p-6 z-10 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <Video className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <h4 className="font-serif font-bold text-sm sm:text-base text-[#1E2A44] truncate">
                    {activeVideoPreview.title}
                  </h4>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {activeVideoPreview.timestamp} • {activeVideoPreview.durationSeconds}s duration
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideoPreview(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-md">
              <video
                src={activeVideoPreview.videoUrl}
                poster={activeVideoPreview.thumbnailUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>

            {/* "What is it?" Explanation */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-xs text-[#1E2A44] uppercase tracking-wider font-mono">
                    What is this recording?
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  Synced to Dossier Module 04
                </span>
              </div>
              <p className="text-xs text-[#1E2A44] leading-relaxed">
                {activeVideoPreview.aiSummary ||
                  'Synchronized camera walkthrough capturing physical defect evidence, acoustic hollowness checks, and electrical DB inspections with live SightView AI vision evaluation.'}
              </p>

              {activeVideoPreview.defectsNoted && activeVideoPreview.defectsNoted.length > 0 && (
                <div className="pt-2 border-t border-[#E8E2D6] space-y-1.5">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                    Defects &amp; Items Audited in Video:
                  </span>
                  <ul className="grid grid-cols-1 gap-1">
                    {activeVideoPreview.defectsNoted.map((d, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 text-xs text-[#1E2A44]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              {activeVideoPreview.videoUrl && (
                <a
                  href={activeVideoPreview.videoUrl}
                  download="sightview-inspection-walkthrough.mp4"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E2D6] hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Video</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setActiveVideoPreview(null)}
                className="px-4 py-2 rounded-xl bg-[#1E2A44] hover:bg-[#2A3B5E] text-white text-xs font-bold transition-colors cursor-pointer ml-auto"
              >
                Close Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ENLARGED INSPECTION PHOTO MODAL ("WHAT IS IT?") ================= */}
      {activePhotoPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="fixed inset-0 cursor-pointer" onClick={() => setActivePhotoPreview(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#E8E2D6] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]">
            <div className="p-4 sm:p-5 border-b border-[#E8E2D6] bg-[#FAF8F5] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <ZoomIn className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <h4 className="font-serif font-bold text-sm sm:text-base text-[#1E2A44] truncate">
                    {activePhotoPreview.title}
                  </h4>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {activePhotoPreview.timestamp || 'Live Inspection Snapshot'} •{' '}
                    {activePhotoPreview.sender === 'user' ? 'Buyer Camera Attachment' : 'SightView AI Observation'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActivePhotoPreview(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center min-h-[260px] max-h-[55vh] border border-slate-800 shadow-inner">
                <img
                  src={activePhotoPreview.url}
                  alt={activePhotoPreview.title}
                  className="w-full h-full max-h-[55vh] object-contain"
                />
              </div>

              {/* "What is it?" Explanation */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-xs text-[#1E2A44] uppercase tracking-wider font-mono">
                      What is this inspection photo?
                    </span>
                  </div>
                  {activePhotoPreview.severity && getSeverityBadge(activePhotoPreview.severity)}
                </div>
                <p className="text-xs text-[#1E2A44] leading-relaxed">
                  {activePhotoPreview.caption ||
                    'High-resolution visual evidence evaluated against statutory defect standards (CIS 7 / Housing Development Act). Saved into the property inspection record for defect claims.'}
                </p>
                <div className="pt-2 border-t border-[#E8E2D6] flex items-center gap-2 text-[11px] text-slate-600">
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-semibold border border-amber-200">
                    SightView AI Vision
                  </span>
                  <span>Verifiable Evidence for Statutory Defect Rectification</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 border-t border-[#E8E2D6] bg-white flex items-center justify-between gap-2">
              <a
                href={activePhotoPreview.url}
                target="_blank"
                rel="noreferrer"
                download="sightview-inspection-photo.jpg"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E2D6] hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Photo</span>
              </a>

              <button
                type="button"
                onClick={() => setActivePhotoPreview(null)}
                className="px-4 py-2 rounded-xl bg-[#1E2A44] hover:bg-[#2A3B5E] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CONVERSATIONAL AGENT CHAT STREAM ================= */}
      <div className="bg-white rounded-3xl border border-[#E8E2D6] shadow-[0_10px_30px_rgba(30,42,68,0.04)] overflow-hidden flex flex-col h-[460px] sm:h-[500px]">
        {/* Chat Stream Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#E8E2D6] bg-[#FAF8F5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-serif font-bold text-sm text-[#1E2A44]">
              SightView Live Agent Stream
            </span>
          </div>

          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
            Malaysian HDA / SMA 2013 Grounded
          </span>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => {
            const isUser = m.sender === 'user';

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                {/* Chat Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-[#1E2A44] text-white rounded-tr-xs'
                      : 'bg-[#FAF8F5] text-[#1E2A44] border border-[#E8E2D6] rounded-tl-xs'
                  }`}
                >
                  {/* Photo Thumbnail if user sent an image */}
                  {m.photoUrl && (
                    <div
                      onClick={() => setActivePhotoPreview({
                        url: m.photoUrl!,
                        title: isUser ? 'Buyer Inspection Photo Attachment' : 'SightView AI Defect Observation Evidence',
                        caption: m.text,
                        timestamp: m.timestamp,
                        severity: m.severity,
                        sender: m.sender,
                      })}
                      className="mb-2.5 rounded-xl overflow-hidden aspect-[4/3] bg-black/10 border border-white/20 relative group cursor-pointer shadow-2xs hover:shadow-md select-none"
                      title="Click to enlarge photo and view defect details"
                    >
                      <img
                        src={m.photoUrl}
                        alt="Inspection Attachment"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="px-2.5 py-1 rounded-full bg-white/95 text-[#1E2A44] text-[10px] font-bold flex items-center gap-1 shadow-md">
                          <ZoomIn className="w-3.5 h-3.5 text-amber-600" />
                          <span>Click to Enlarge</span>
                        </div>
                      </div>
                      <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-white text-[9px] font-mono flex items-center gap-1 border border-white/20">
                        <ZoomIn className="w-2.5 h-2.5 text-amber-400" />
                        <span>Enlarge</span>
                      </span>
                    </div>
                  )}

                  {/* Message Text */}
                  <p className="whitespace-pre-wrap">{m.text}</p>

                  {/* Defect Severity Badge */}
                  {!isUser && m.severity && (
                    <div className="mt-2.5 pt-2 border-t border-[#E8E2D6]/60 flex items-center justify-between">
                      {getSeverityBadge(m.severity)}
                    </div>
                  )}
                </div>

                {/* Suggested Quick Reply Chips */}
                {!isUser && m.suggestedChips && m.suggestedChips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 max-w-[85%] sm:max-w-[78%]">
                    {m.suggestedChips.map((chip, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSendMessage(chip)}
                        className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors shadow-2xs text-left cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-[10px] text-slate-400 px-1">
                  {m.timestamp}
                </span>
              </div>
            );
          })}

          {/* Typing / Analyzing Indicator */}
          {isAnalyzing && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D6] max-w-xs text-xs text-[#5B6478]">
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
              <span>SightView AI is analyzing visual details...</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-[#E8E2D6] bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(userInput);
            }}
            className="flex items-center gap-2"
          >
            {/* Voice Input Mic */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-full border transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white border-rose-500 animate-pulse ring-2 ring-rose-300'
                  : 'bg-[#FAF8F5] text-slate-600 border-[#E8E2D6] hover:text-[#1E2A44]'
              }`}
              title="Speak with SightView AI"
            >
              {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask SightView or describe what you notice..."
              className="flex-1 px-4 py-2.5 rounded-full bg-[#FAF8F5] border border-[#E8E2D6] text-xs sm:text-sm text-[#1E2A44] placeholder-slate-400 focus:outline-hidden focus:border-amber-500 transition-colors"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!userInput.trim() || isAnalyzing}
              className="p-2.5 rounded-full bg-[#1E2A44] hover:bg-[#2A3B5E] text-white disabled:opacity-40 transition-colors shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4 text-amber-400" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
