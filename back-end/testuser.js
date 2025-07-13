const bcrypt = require('bcrypt');

(async () => {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash("freepasses4all", saltRounds);
    console.log("Hashed Password:", hashedPassword);
})();
