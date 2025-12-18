import basementApi from "./basementAxiosInstance";

export default class BasementUsersController {
  static async updateProfile(payload, file = null) {
    try {
      const formData = new FormData();
      
      Object.keys(payload).forEach(key => {
        if (payload[key] !== null && payload[key] !== undefined) {
          formData.append(key, payload[key]);
        }
      });
      
      if (file) {
        formData.append('photo', file);
      }
      
      const { data } = await basementApi.post('/user/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return data;
    } catch (error) {
      console.error("Ошибка при обновлении профиля:", error);
      throw error;
    }
  }

}

