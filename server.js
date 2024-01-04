const express = require('express');
var fs = require('fs');
const { parse } = require("csv-parse");
const bodyParser = require('body-parser');
const { createObjectCsvWriter } = require('csv-writer');
// const { MongoClient } = require('mongodb');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const ejs = require('ejs');
const mongotocsv = require('mongo-to-csv');
const Swal = require('sweetalert2');
const app = express();


// const data_editor = require("data-editor");

//////////////////////////////////Connection to the localhost database starts here//////////////////////////////
const uri = 'mongodb://localhost:27017'; // Replace with your MongoDB connection string
const client = new MongoClient(uri);
async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connected to the database');
  } catch (error) {
    console.error('Error connecting to the database', error);
  }
}
connectToDatabase();
//////////////////////////////////Connection to the localhost database ends here//////////////////////////////

///////////////////////////////////New Connection String Starts Here//////////////////////////////////////////



///////////////////////////////////New Connection String Ends Here////////////////////////////////////////////

//////////////////////////////////Connection to the database ends here///////////////////

/*-------------------------Required Packeges to be loaded above-----------------------------*/
const headers = ['Name', 'Email', 'Age', 'Gender'];



// Serve the static HTML file
app.use(express.static('public'));
app.use(express.static(__dirname)); //Get access to the main directory for CSS

// Set up middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
const port = 3000;

const csvWriter = createObjectCsvWriter({
  path: 'users.csv',
  header: [
    { id: 'name', title: 'Name' },
    { id: 'email', title: 'Email' },
    { id: 'age', title: 'Age' },
    { id: 'gender', title: 'Gender' },
  ],
  append: true
});





app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
  // fs.readFile(__dirname + '/styles.css', 'utf8');
});

///////////////////////////////Main CSV post route starts here ////////////////////////////////////////

// app.post('/', (req, res) => {
//   // fs.readFile(__dirname + '/styles.css', 'utf8');
//   const { name, email, age, gender } = req.body;
//   console.log(`Name: ${name}, Email: ${email}, Age: ${age}, Gender: ${gender}`);
//   const record = { name, email, age, gender };
//   csvWriter.writeRecords([record])
//     .then(() => {
//       // res.send('Form submitted successfully!');
//       res.sendFile(__dirname + "/success.html");
//     })
//     .catch((err) => {
//       console.error(err);
//       res.send('Error submitting form');
//     });
// });

//////////////////////////Main Post Route Ends Here ////////////////////////////////////////////

////////////////////////////////MongoDB Post Route Starts Here//////////////////////////////////

app.post('/', async (req, res) => {
  const { name, email, age, gender } = req.body;
  console.log(`Name: ${name}, Email: ${email}, Age: ${age}, Gender: ${gender}`);
  const record = { name, email, age, gender };
  try {
    const db = client.db('shopDB'); // Replace with your database name
    const collection = db.collection('userDB'); // Replace with your collection name
    await collection.insertOne(record);
    console.log('Data inserted into MongoDB');
    res.sendFile(__dirname + "/success.html");
  } catch (error) {
    console.error('Error inserting data into MongoDB', error);
    res.send('Error submitting form');
  }
});

////////////////////////////////MongoDB Post Route Ends Here////////////////////////////////////

//////////////////////////////Main View Route Starts Here//////////////////////////////////////

// app.get("/view", function(req,res){
//   // fs.readFile(__dirname + "/users.csv", 'utf8', function(err, contents) {
//   //   res.writeHead(200, {'Content-Type': 'text/plain'});
//   //    res.write(contents);
//   //    res.end();
//   //  });
//   res.sendFile(__dirname + "/table.html");
// });

//////////////////////////////Main View Route Ends Here//////////////////////////////////////

app.get("/view", async (req, res) => {
  try {
    const db = client.db('shopDB'); // Replace with your database name
    const collection = db.collection('userDB'); // Replace with your collection name
    const users = await collection.find().toArray();
    res.render('table', { users }); // Render the 'table' template with the 'users' data
  } catch (error) {
    console.error('Error retrieving data from MongoDB', error);
    res.send('Error retrieving data');
  }
});

// app.get("/download", function(req,res){
//     console.log("File Download Prompted!");
//     var file = __dirname + '/users.csv';
//     res.download(file);
//     // res.sendFile(__dirname + '/users.csv');
// });

////////////////////////////////////CSV Download Code Starts Here//////////////////////////////////

app.get("/download", function (req, res) {
  const dbName = 'shopDB';
  const collectionName = 'userDB';
  let options = {
    database: 'shopDB',
    collection: 'userDB',
    fields: ['name', 'email', 'age', 'gender'],
    output: '"' + __dirname + '/userDB.csv"', // Enclose the output file path in double quotes
  };
  mongotocsv.export(options, function (err, success) {
    if (err) {
      console.log(err);
      res.status(500).send("Error exporting collection to CSV");
    } else {
      console.log("Collection exported to CSV successfully!");
      // Download the CSV file
      res.download(__dirname + '/userDB.csv', 'userDB.csv');
    }
  });
});


///////////////////////////////////CSV Download Code Ends Here//////////////////////////////////

app.get('/edit/:id', async (req, res) => {
  try {
    // const userId = req.params.id;
    const userId = new ObjectId(req.params.id);
    const db = client.db('shopDB');
    const collection = db.collection('userDB');
    const user = await collection.findOne({ _id: userId});
    // console.log('Retrieved user data:', user);
    res.render('editForm', { user });
  } catch (error) {
    console.error('Error retrieving user for editing', error);
    res.send('Error retrieving user for editing');
  }
});

app.post('/edit/:id', async (req, res) => {
  try {
    // const userId = req.params.id;
    const userId = new ObjectId(req.params.id);
    const updatedUserData = {
      name: req.body.name,
      email: req.body.email,
      age: req.body.age,
      gender: req.body.gender,
      // Add more fields as needed
    };
    const db = client.db('shopDB');
    const collection = db.collection('userDB');
    
    await collection.updateOne({ _id:userId }, { $set: updatedUserData });
    const result = await collection.updateOne({ _id: userId }, { $set: updatedUserData });
    console.log(result);

    res.redirect('/view'); // Redirect to the view route after editing
  } catch (error) {
    console.error('Error updating user data', error);
    res.send('Error updating user data');
  }
});

// Handle confirmation
app.get('/delete-confirm/:id', async (req, res) => {
  try {
      const userId = new ObjectId(req.params.id);
      const db = client.db('shopDB');
      const collection = db.collection('userDB');
      const userToDelete = await collection.findOne({ _id: userId });
      const userName = userToDelete.name;

      // Delete the user and render the deleteRecord template
      await collection.deleteOne({ _id: userId });
      res.render('deleteRecord', { userName });
  } catch (error) {
      console.error('Error deleting user', error);
      res.send('Error deleting user');
  }
});

// Handle cancellation
app.get('/delete-cancel', (req, res) => {
  // res.send('Deletion cancelled...');
  res.redirect("/view");
});


app.post('/delete', async (req, res) => {
  try {
      const userId = new ObjectId(req.body.userId);
      const db = client.db('shopDB');
      const collection = db.collection('userDB');
      const userToDelete = await collection.findOne({ _id: userId });
      const userName = userToDelete.name;

      // Render the confirmDelete template
      res.render('confirmDelete', { userName, userId });
  } catch (error) {
      console.error('Error rendering confirmation page', error);
      res.send('Error rendering confirmation page');
  }
});


// Start the server
app.listen(port, function () {
  console.log(`Server started on port ${port}`);
});

// //Start the server
// app.listen(port, "10.62.58.105", function () {
//   console.log(`Server started on port ${port}`);
// });
