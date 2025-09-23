export default {
    methods: {
        getUserPhotoSrc(user) {
            if (!user) return '';
            if (user.photoUrl) return user.photoUrl();
            if (user.photo) {
                return `${import.meta.env.VITE_APP_BASE_URL}/storage/${user.photo}`;
            }
            return '';
        }
    }
};
