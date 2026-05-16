import { applyProjectSelection } from '@/utils/projectSearchUtils';

export default {
  methods: {
    onSelectedProjectUpdate(project) {
      applyProjectSelection(this, project);
    },
  },
};
