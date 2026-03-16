import { getUserPhotoSrc as resolveUserPhotoSrc } from '@/utils/userUtils';

export default {
  methods: {
    getUserPhotoSrc(user) {
      return resolveUserPhotoSrc(user);
    }
  }
};
