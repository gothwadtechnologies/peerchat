export class PhoneRingtones {
  private static audioCtx: AudioContext | null = null;
  private static ringInterval: any = null;

  static playRingtone() {
    this.stop();
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = this.audioCtx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const ringPattern = () => {
        const now = ctx.currentTime;
        
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';

        osc1.frequency.setValueAtTime(400, now);
        osc1.frequency.linearRampToValueAtTime(450, now + 0.1);
        osc1.frequency.linearRampToValueAtTime(400, now + 0.5);
        osc1.frequency.linearRampToValueAtTime(450, now + 0.9);
        osc1.frequency.linearRampToValueAtTime(400, now + 1.3);

        osc2.frequency.setValueAtTime(480, now);
        osc2.frequency.linearRampToValueAtTime(520, now + 0.2);
        osc2.frequency.linearRampToValueAtTime(480, now + 0.6);
        osc2.frequency.linearRampToValueAtTime(520, now + 1.0);

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.12, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.08, now + 1.0);
        gainNode.gain.linearRampToValueAtTime(0.08, now + 1.7);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.85);
        osc2.stop(now + 1.85);
      };

      ringPattern();
      this.ringInterval = setInterval(() => {
        ringPattern();
      }, 4000);
    } catch (e) {
      console.warn('Ringtone failed to generate:', e);
    }
  }

  static playOutgoingBeep() {
    this.stop();
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = this.audioCtx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const beepPattern = () => {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(425, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.1);
        gain.gain.setValueAtTime(0.05, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.30);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.35);
      };

      beepPattern();
      this.ringInterval = setInterval(() => {
        beepPattern();
      }, 4000);
    } catch (e) {
      console.warn('Outgoing tone generation failed:', e);
    }
  }

  static stop() {
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }
}
