// Утилита для воспроизведения звуковых уведомлений
import successSound from '@/assets/success.mp3';
import errorSound from '@/assets/error.mp3';

class SoundManager {
  constructor() {
    this.successSound = null;
    this.errorSound = null;
    this.isEnabled = true;
    this.initSounds();
  }

  initSounds() {
    try {
      // Создаем аудио объекты
      this.successSound = new Audio(successSound);
      this.errorSound = new Audio(errorSound);
      
      // Предзагружаем звуки
      this.successSound.load();
      this.errorSound.load();
      
      // Устанавливаем громкость
      this.successSound.volume = 0.5;
      this.errorSound.volume = 0.5;
    } catch (error) {
      console.warn('Не удалось инициализировать звуки:', error);
    }
  }

  playSuccess() {
    if (this.isEnabled && this.successSound) {
      try {
        this.successSound.currentTime = 0; // Сбрасываем время воспроизведения
        this.successSound.play().catch(error => {
          console.warn('Не удалось воспроизвести звук успеха:', error);
        });
      } catch (error) {
        console.warn('Ошибка воспроизведения звука успеха:', error);
      }
    }
  }

  playError() {
    if (this.isEnabled && this.errorSound) {
      try {
        this.errorSound.currentTime = 0; // Сбрасываем время воспроизведения
        this.errorSound.play().catch(error => {
          console.warn('Не удалось воспроизвести звук ошибки:', error);
        });
      } catch (error) {
        console.warn('Ошибка воспроизведения звука ошибки:', error);
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
  }
}

// Создаем единственный экземпляр
const soundManager = new SoundManager();

export default soundManager; 