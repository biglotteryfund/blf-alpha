const uuidv4 = require('uuid/v4');
const userService = require('../../services/user');

function init({ router }) {
    if (!process.env.USE_LOCAL_DATABASE) {
        return;
    }

    router.post('/seed/user', (req, res) => {
        const uuid = uuidv4();
        const newUser = {
            username: `${uuid}@example.com`,
            password: uuid,
            level: 5
        };

        userService.createUser(newUser).then(() => {
            res.json(newUser);
        });
    });
}

module.exports = {
    init
};
