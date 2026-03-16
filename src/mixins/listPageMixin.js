import notificationMixin from './notificationMixin';
import errorMessageMixin from './errorMessageMixin';
import crudEventMixin from './crudEventMixin';
import modalMixin from './modalMixin';
import batchActionsMixin from './batchActionsMixin';
import companyChangeMixin from './companyChangeMixin';
import filtersMixin from './filtersMixin';

export default {
  mixins: [
    notificationMixin,
    errorMessageMixin,
    crudEventMixin,
    modalMixin,
    batchActionsMixin,
    companyChangeMixin,
    filtersMixin,
  ],
  methods: {
    showModalBase(item = null) {
      modalMixin.methods.showModal.call(this, item);
    },
    onItemClickBase(item) {
      return modalMixin.methods.onItemClick.call(this, item);
    },
  },
};
