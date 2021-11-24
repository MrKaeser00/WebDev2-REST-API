/*
  Necessary node modules:
    npm install knex --save
    npm install mysql
    npm install express body-parser --save

  A new user root2 was created for this program.
  Login to mysql:
    sudo mysql –u root –p
  Create the user
    CREATE USER 'root2'@'localhost' IDENTIFIED WITH mysql_native_password BY 'practical4_password';
  The 'mysql_native_password' bit is important for Knex.js to connect successfully.
  New database
    CREATE DATABASE practical4;
  Grant access to root2:
    GRANT ALL PRIVILEGES ON practical4.* TO 'root2'@'localhost';
  Select DB:
    use practical4;
  To import the data into the DB, I simply copied the data from the 'db.sql' file and pasted it into the terminal for mysql.

Operations:
  CREATE: POST: requests were done with curl ie, to create a city:
    curl -X POST -d "Name=test&Code=DEU&District=tes&Population=123123" localhost:3000/addCity
  READ: GET: browser at localhost:3000/getCity/{cityName} gives details as response to browser
  UPDATE: POST: with curl to update:
    curl -X POST -d "Name=Berlin&Population=55227" localhost:3000/updateCity
  DELETE: GET: browser at localhost:3000/deleteCity/{cityName} gives response

  The necessary knowledge was acquired mostly from the getting started pages from the different modules:
    https://expressjs.com/en/starter/installing.html
    https://knexjs.org/
  And this cheatsheet for Knex.js
    https://devhints.io/knex

  Necessary node modules for the documentation:
    npm install apidoc

  The documentation was generated using the following command in bash:
	npx apidoc -i . -o apidoc

  Knowledge about apidoc was found on the documentation of the module:
    https://apidocjs.com/
*/

// database connection
const knex = require('knex')({
  client: 'mysql',
  connection: {
    host : '127.0.0.1',
    port : 3306,
    user : 'root2',
    password : 'practical4_password',
    database : 'practical4'
  }
})

// used for parser for POST request
const bodyParser = require("body-parser")
// Expressjs instance
const app = require('express')()
const port = 3000

// tell Express to use the body-parser module
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

/**
 * @api {post} /addCity/ Add City to database
 * @apiVersion 0.1.0
 * @apiName AddCity
 * @apiGroup Create
 *
 * @apiBody {String} Name         Name of the City.
 * @apiBody {String} Code         Three letter Country Code of the City.
 * @apiBody {String} District     District of the City.
 * @apiBody {Number} Population   Population count of the City.
 *
 * @apiExample {bash} Curl example
 * curl -X POST -d "Name=test&Code=DEU&District=testDistrict&Population=123123" http://localhost:3000/addCity
 *
 * @apiSuccess {Number} ID            ID of the City.
 * @apiSuccess {String} Name          Name of the City.
 * @apiSuccess {String} CountryCode   CountryCode of the City.
 * @apiSuccess {String} District      District of the City.
 * @apiSuccess {Number} Population    Population of the City.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "ID": 4080,
 *       "Name": "test",
 *       "Country": "Germany",
 *       "District": "testDistrict",
 *       "Population": 123123
 *     }
 *
 */
app.post('/addCity', (req, res) => {
  // Use this to get the ID for the new entry
  knex('city').max('ID').first().then(maxPromise => {
    knex('city').insert({
      ID: maxPromise['max(`ID`)']+1,
      Name: req.body.Name,
      CountryCode: req.body.Code,
      District: req.body.District,
      Population: req.body.Population
    }).then(() => {
      // respond with the created city
      knex('city').where('Name', req.body.Name).first().then(rows => {
        // respond with JSON
        res.json(rows)
      })
    })
  })
})

/**
 * @api {get} /getCity/:cityName Retrieve City from database
 * @apiVersion 0.1.0
 * @apiName GetCity
 * @apiGroup Read
 *
 * @apiParam {String} cityName        Name of City to retrieve.
 *
 * @apiExample {curl} Curl example
 * curl http://localhost:3000/getCity/berlin
 *
 * @apiSuccess {String} Name          Name of the City.
 * @apiSuccess {String} Country       Country name of the City.
 * @apiSuccess {String} District      District of the City.
 * @apiSuccess {Number} Population    Population of the City.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "Name": "Berlin",
 *       "Country": "Germany",
 *       "District": "Berliini",
 *       "Population": 3386667
 *     }
 *
 * @apiError CountryCodeNotFound  The Country code of the City was not found.
 * @apiError CityNotFound         The Name of the City was not found.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "CityNotFound"
 *     }
 *
 */
app.get('/getCity/:cityName([A-z]+)', (req, res) => {
  const cityName = req.params.cityName
  knex('city').where('Name', cityName).first().then(rows => {
    // check if entry exists
    if (typeof rows !== 'undefined') {
      const code = rows['CountryCode']
      knex('country').select('Name').where('Code', code).first().then(rows2 => {
        if (typeof rows2 !== 'undefined') {
          const responsejson = {
            //ID: rows['ID'],
            Name: rows['Name'],
            Country: rows2['Name'],
            District: rows['District'],
            Population: rows['Population'],
          }
          res.json(responsejson)
        } else {
          res.status(404).json({error: "CountryCodeNotFound"})
        }
      })
    } else {
      res.status(404).json({error: "CityNotFound"})
    }
  })
})

/**
 * @api {post} /updateCity/  Update population of City
 * @apiVersion 0.1.0
 * @apiName UpdateCity
 * @apiGroup Update
 *
 * @apiBody {String} Name        Name of the City.
 * @apiBody {Number} Population  Population count of the City.
 *
 * @apiExample {curl} Curl example
 * curl -X POST -d "Name=Berlin&Population=55227" http://localhost:3000/updateCity/
 *
 * @apiSuccess {Number} ID            ID of the City.
 * @apiSuccess {String} Name          Name of the City.
 * @apiSuccess {String} CountryCode   3 letter CountryCode of the City.
 * @apiSuccess {String} District      District of the City.
 * @apiSuccess {Number} Population    Population of the City.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "ID": 3068,
 *       "Name": "Berlin",
 *       "CountryCode": "DEU",
 *       "District": "Berliini",
 *       "Population": 55227
 *     }
 *
 * @apiError CityNotFound The id of the User was not found.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "CityNotFound"
 *     }
 *
 */
app.post('/updateCity', (req, res) => {
  // update city set population = 'Population from POST' where Name = 'Name from POST'
  knex('city').where('Name', req.body.Name).update({
    Population: req.body.Population
  }).then(() => {
    knex('city').where('Name', req.body.Name).first().then(rows => {
      if (typeof rows !== 'undefined') {
        res.json(rows)
      } else {
        res.status(404).json({error: "CityNotFound"})
      }
    })
  })
})

/**
 * @api {get} /deleteCity/:cityName Delete City from database
 * @apiVersion 0.1.0
 * @apiName DeleteCity
 * @apiGroup Delete
 *
 * @apiParam {String} cityName        Name of City to delete.
 *
 * @apiExample {curl} Curl example
 * curl http://localhost:3000/deleteCity/test
 *
 * @apiSuccess {String} success       Success of the operation.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true
 *     }
 *
 */
app.get('/deleteCity/:cityName([A-z]+)', (req, res) => {
  const cityName = req.params.cityName
  // delete from city where Name = 'Name from URI'
  knex('city').where('Name', cityName).del().then(rows => {
    var success = false
    if (rows > 0) {
      success = true
    }
    res.json({success: success})
  })
})

// listen for incoming traffic
app.listen(port, () => {
  console.log(`Practical5 api listening at http://localhost:${port}`)
})
