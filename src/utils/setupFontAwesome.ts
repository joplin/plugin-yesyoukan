import { library } from '@fortawesome/fontawesome-svg-core';
import { faTimes, faEllipsisV, faPlus, faUndo, faRedo } from '@fortawesome/free-solid-svg-icons';
import { faCheckCircle } from '@fortawesome/free-regular-svg-icons';

export default () => {
	library.add(faTimes, faEllipsisV, faPlus, faUndo, faRedo, faCheckCircle);
}