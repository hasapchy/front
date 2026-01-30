export const isImageFile = (file) => {
    const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml']
    return imageTypes.includes(file.mime_type) || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file.name || '')
  }
  
  export const isAudioFile = (file) => {
    const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/webm']
    return audioTypes.includes(file.mime_type) || /\.(mp3|wav|ogg|m4a|webm)$/i.test(file.name || '')
  }