import { UserDto } from '@/dto/users/UserDto';
import api from './axiosInstance';

const UsersController = {
    async getAllUsers() {
        try {
            const { data } = await api.get('/admin/users');
            return UserDto.fromArray(data);
        } catch (error) {
            console.error('Ошибка входа:', error);
            throw error;
        }
    },
}

export default UsersController;