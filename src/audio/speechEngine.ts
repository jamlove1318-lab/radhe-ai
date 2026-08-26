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
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              } else {
                interimTranscript += event.results[i][0].transcript;
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
            if (event.error !== 'no-speech') {
              this.callbacks?.onError(event.error);
            }
          };

          this.recognition.onend = () => {
            this.isListening = false;
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

  public startListening() {
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
      } catch (e) {
        console.warn('Could not start recognition:', e);
      }
    } else {
      this.callbacks?.onStateChange('listening');
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
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
        // Refined British or authoritative clear accent
        const britishVoice = voices.find(
          (v) => (v.lang.includes('en-GB') || v.name.includes('UK') || v.name.includes('British') || v.name.includes('George') || v.name.includes('Daniel'))
        );
        if (britishVoice) utterance.voice = britishVoice;
        utterance.pitch = 0.95;
        utterance.rate = 1.05;
      } else if (mode === 'ULTRON') {
        // Deep menacing resonance
        const deepVoice = voices.find(
          (v) => (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Alex') || v.name.includes('Google UK English Male'))
        );
        if (deepVoice) utterance.voice = deepVoice;
        utterance.pitch = 0.55; // Lower deep pitch
        utterance.rate = 0.9;   // Slower, chilling cadence
      } else {
        // RADHE: Balanced cosmic clarity
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
