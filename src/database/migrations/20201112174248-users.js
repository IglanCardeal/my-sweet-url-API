const psl = require('psl');

module.exports = {
  async up(db, client) {
    const newUser = await db.collection('users').insertOne({
      username: "teste",
      email: "tete@email.com",
      password: "$2b$12$WTeOrOdhuXPUdXPeuKjUjeMTgbhHdLkYA6qhVe6eL9UUzgtUizhQe"
    });

    const userId = newUser.ops[0]._id.toString();

    const NUMBER_OF_OBJECT = 20;

    const randomNumber = (min, max) => {
      return Math.floor(Math.random() * (max - min) + min);
    };

    const generatUsersUrlsObject = () => {
      const baseUrl = 'https://www.google.com';
      const parsedUlr = psl.parse(baseUrl.split('//')[1]).domain;
      const date = new Date().toLocaleDateString('br');

      // gerar letra aleatoria para teste de ordenacao
      const randomLetter = () => {
        const arr = 'WTeOrOdhuXPUdXPeuKjUjeMTgbhHdLkYA6qhVe6eL9UUzgtUizhQeasbuyhkdkakojf'.toLowerCase().split('');

        return arr[randomNumber(0, arr.length)];
      };

      let objArr = [];
      let i = 1;

      while (i <= NUMBER_OF_OBJECT) {
        const letter = randomLetter();

        objArr.push({
          alias: `${letter}_user-${i}`,
          url: `${baseUrl}/teste-${i}`,
          publicStatus: false,
          createdAt: date,
          updatedAt: date,
          userId: userId,
          domain: parsedUlr,
          number_access: randomNumber(0, 100) * 100
        });

        i++;
      }

      return objArr;
    };

    const userUrlsObject = generatUsersUrlsObject();

    await db.collection('urls').insertMany(userUrlsObject);
  },

  async down(db, client) {
    await db.dropDatabase('users');
  }
};
