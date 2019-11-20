let jwt = require('jsonwebtoken');
require('dotenv').config();

const geToken = (req) => {
    let token = jwt.sign({username: 'renoir'},
        process.env.SECRET,
        { expiresIn: '24h'}
    );

    return token; 
};

module.exports = geToken;