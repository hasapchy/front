/**
 * Утилита для работы с FormData
 */

/**
 * Создать FormData из объекта данных
 * @param {Object} data - Объект с данными
 * @param {Object} [options={}] - Опции
 * @param {File|null} [options.file=null] - Файл для добавления
 * @param {string} [options.fileKey='file'] - Ключ для файла
 * @param {Array<string>} [options.booleanFields=[]] - Поля, которые нужно преобразовать в '1'/'0'
 * @param {Array<string>} [options.arrayFields=[]] - Поля, которые являются массивами
 * @returns {FormData} FormData объект
 */
export function createFormData(data, options = {}) {
  const {
    file = null,
    fileKey = 'file',
    booleanFields = [],
    arrayFields = []
  } = options;

  const formData = new FormData();

  Object.keys(data).forEach((key) => {
    const value = data[key];
    if (value == null) return;

    if (booleanFields.includes(key)) {
      formData.append(key, value ? '1' : '0');
    } else if (arrayFields.includes(key) && Array.isArray(value)) {
      value.forEach((item, index) => {
        formData.append(`${key}[${index}]`, item);
      });
    } else {
      formData.append(key, value);
    }
  });

  if (file) {
    formData.append(fileKey, file);
  }

  return formData;
}

/**
 * Создать FormData для загрузки файлов
 * @param {Object} data - Объект с данными
 * @param {File|Array<File>} files - Файл или массив файлов
 * @param {string} [fileKey='files[]'] - Ключ для файлов
 * @returns {FormData} FormData объект
 */
export function createFormDataWithFiles(data, files, fileKey = 'files[]') {
  const formData = new FormData();

  Object.keys(data).forEach((key) => {
    const value = data[key];
    if (value != null) {
      formData.append(key, value);
    }
  });

  if (files) {
    const filesArray = Array.isArray(files) ? files : [files];
    filesArray.forEach(file => {
      formData.append(fileKey, file);
    });
  }

  return formData;
}

