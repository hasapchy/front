import successSound from '@/assets/success.mp3';
import errorSound from '@/assets/error.mp3';
import messageSound from '@/assets/message.mp3';

class SoundManager {
  constructor() {
    this.successSound = null;
    this.errorSound = null;
    this.messageSound = null;
    this.isEnabled = true;
    this.store = null;
    this.initSounds();
  }

  initSounds() {
    try {
      this.successSound = new Audio(successSound);
      this.errorSound = new Audio(errorSound);
      this.messageSound = new Audio(messageSound);
      this.successSound.load();
      this.errorSound.load();
      this.messageSound.load();
      this.successSound.volume = 0.5;
      this.errorSound.volume = 0.5;
      this.messageSound.volume = 0.5;
    } catch (error) {
      console.warn('Не удалось инициализировать звуки:', error);
    }
  }

  playSuccess() {
    const isEnabled = this.store ? this.store.getters.soundEnabled : this.isEnabled;
    if (isEnabled && this.successSound) {
      try {
        this.successSound.currentTime = 0;
        this.successSound.play().catch(error => {
          console.warn('Не удалось воспроизвести звук успеха:', error);
        });
      } catch (error) {
        console.warn('Ошибка воспроизведения звука успеха:', error);
      }
    }
  }

  playError() {
    const isEnabled = this.store ? this.store.getters.soundEnabled : this.isEnabled;
    if (isEnabled && this.errorSound) {
      try {
        this.errorSound.currentTime = 0;
        this.errorSound.play().catch(error => {
          console.warn('Не удалось воспроизвести звук ошибки:', error);
        });
      } catch (error) {
        console.warn('Ошибка воспроизведения звука ошибки:', error);
      }
    }
  }

  playMessage() {
    const isEnabled = this.store ? this.store.getters.soundEnabled : this.isEnabled;
    if (isEnabled && this.messageSound) {
      try {
        this.messageSound.currentTime = 0;
        this.messageSound.play().catch(() => {});
      } catch {
        void 0;
      }
    }
  }

  toggleSound() {
    this.isEnabled = !this.isEnabled;
    return this.isEnabled;
  }

  setVolume(volume) {
    if (this.successSound) this.successSound.volume = volume;
    if (this.errorSound) this.errorSound.volume = volume;
    if (this.messageSound) this.messageSound.volume = volume;
  }

  setStore(store) {
    this.store = store;
  }
}

const soundManager = new SoundManager();

export default soundManager; 