import { PersonaMode, VoiceState } from '../types';

export interface SpeechCallbacks {
  onStateChange: (state: VoiceState) => void;
  onTranscript: (text: string, isFinal: boolean) => void;
  onError: (error: string) => void;
}

class SpeechEngine {
  private recognition: any = null;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private callbacks: SpeechCallbacks | null = null;
  private enabled: boolean = true;
  private audioStream: any = null;
  private autoRestart: boolean = false;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          this.recognition = new SpeechRecognition();
          this.recognition.continuous = true;
          this.recognition.interimResults = true;
          this.recognition.lang = 'en-US';

          this.recognition.onstart = () => {
            this.isListening = true;
            this.callbacks?.onStateChange('listening');
          };

          this.recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const transcript = event.results[i][0]?.transcript || '';
              if (event.results[i].isFinal) {
                finalTranscript += transcript;
              } else {
                interimTranscript += transcript;
              }
            }

            if (finalTranscript.trim().length > 0) {
              this.callbacks?.onTranscript(finalTranscript.trim(), true);
            } else if (interimTranscript.trim().length > 0) {
              this.callbacks?.onTranscript(interimTranscript.trim(), false);
            }
          };

          this.recognition.onerror = (event: any) => {
            console.warn('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
              this.callbacks?.onError('Microphone permission blocked. Please allow mic access in your browser.');
            } else if (event.error !== 'no-speech') {
              this.callbacks?.onError(`Speech Error: ${event.error}`);
            }
          };

          this.recognition.onend = () => {
            this.isListening = false;
            // Auto restart if user intended continuous listening
            if (this.autoRestart) {
              try {
                this.recognition.start();
                this.isListening = true;
                return;
              } catch (e) {}
            }
            if (!this.isSpeaking) {
              this.callbacks?.onStateChange('idle');
            }
          };
        } catch (e) {
          console.warn('SpeechRecognition initialization failed', e);
        }
      }
    }
  }

  public registerCallbacks(callbacks: SpeechCallbacks) {
    this.callbacks = callbacks;
  }

  public isSpeechSupported(): boolean {
    return typeof window !== 'undefined' && ('speechSynthesis' in window || !!this.recognition);
  }

  public async startListening(continuous: boolean = false) {
    this.autoRestart = continuous;

    // Explicitly request browser microphone permission prompt
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err: any) {
        console.warn('Microphone permission denied:', err);
        this.callbacks?.onError('Microphone access denied. Please click the Lock icon in browser bar and Allow Microphone.');
      }
    }

    if (this.recognition) {
      try {
        this.recognition.start();
        this.isListening = true;
        this.callbacks?.onStateChange('listening');
      } catch (e) {
        // Recognition might already be running
        this.isListening = true;
        this.callbacks?.onStateChange('listening');
      }
    } else {
      this.callbacks?.onError('Live speech-to-text is supported on Chrome, Edge, Safari & Android browsers.');
      this.callbacks?.onStateChange('listening');
    }
  }

  public stopListening() {
    this.autoRestart = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    if (this.audioStream) {
      try {
        this.audioStream.getTracks().forEach((t: any) => t.stop());
      } catch (e) {}
      this.audioStream = null;
    }
    this.isListening = false;
    if (!this.isSpeaking) {
      this.callbacks?.onStateChange('idle');
    }
  }

  public speak(
    text: string,
    mode: PersonaMode = 'JARVIS',
    onEnd?: () => void
  ) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !this.enabled) {
      onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop ongoing speech

      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();

      // Configure Persona Voice Properties
      if (mode === 'JARVIS') {
        const britishVoice = voices.find(
          (v) => (v.lang.includes('en-GB') || v.name.includes('UK') || v.name.includes('British') || v.name.includes('George') || v.name.includes('Daniel'))
        );
        if (britishVoice) utterance.voice = britishVoice;
        utterance.pitch = 0.95;
        utterance.rate = 1.05;
      } else if (mode === 'ULTRON') {
        const deepVoice = voices.find(
          (v) => (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Alex') || v.name.includes('Google UK English Male'))
        );
        if (deepVoice) utterance.voice = deepVoice;
        utterance.pitch = 0.55;
        utterance.rate = 0.9;
      } else {
        utterance.pitch = 1.0;
        utterance.rate = 1.02;
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.callbacks?.onStateChange('speaking');
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.callbacks?.onStateChange('idle');
        onEnd?.();
      };

      utterance.onerror = (e) => {
        console.warn('TTS error:', e);
        this.isSpeaking = false;
        this.callbacks?.onStateChange('idle');
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speak error:', e);
      this.isSpeaking = false;
      this.callbacks?.onStateChange('idle');
      onEnd?.();
    }
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.callbacks?.onStateChange('idle');
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

export const speechEngine = new SpeechEngine();
