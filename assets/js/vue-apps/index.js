import global from './global';
import grantDetail from './grant-detail';
import pastGrants from './past-grants';
import materials from './materials';
import formComponents from './form-components';

function init() {
    global.init();
    materials.init();
    formComponents.init();

    const PAST_GRANTS_SESSION_KEY = 'app.pastGrantsFilters';
    grantDetail.init(PAST_GRANTS_SESSION_KEY);
    pastGrants.init(PAST_GRANTS_SESSION_KEY);
}

export default { init };
