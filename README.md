# Node JWT Auth (Server)

This is a JWT Auth template for backend server. Should be used in conjunction with client app [React JWT Auth](https://github.com/TheSundayMailman/react-jwt-auth.git). 

Both MongoDB/Mongoose and PosgreSQL/Knex databases are supported. However, this current version is setup to run MongoDB/Mongoose.

## How to Use
* Clone repository into local directory of choice.
* In Command Line, move into the same directory, create a `.env` file, and run `npm install`.
* In your `.evn` file, declare all necessary environment variables.
* If using local database, run `mongod` to start your database.
* Run `nodemon server.js`.
