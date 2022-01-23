require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI);
const { Schema } = mongoose;

const urlSchema = new Schema({
  original_url: { type: String, required: true },
  short_url: Number
});

const oneURL = mongoose.model("oneURL", urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async (req,res) => {
    // takes the body of the post request, in this case, it's an URL
  const reqURL = req.body.url;
  let regex = new RegExp('^(https?:\\/\\/)?'+ 
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ 
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ 
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ 
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ 
    '(\\#[-a-z\\d_]*)?$','i');
  if (reqURL.match(regex)) {
      // it returns all the objects inside the collection
    const urls = await oneURL.find ()
      // check if the collection is empty
    if (urls.length === 0) {
      const newURL = new oneURL({
        original_url: reqURL,
        short_url: 1
      });
      newURL.save();    
    } else {
      const URLexist = await oneURL.exists({ original_url: reqURL });
      if (URLexist) {
        res.json({"message": "This URL have already stored"});
      } else {
          // it if not empty, it search one object with the higher short_url number using .sort(). This line works to take the higher value of short_url and increment it for the new object to store it
        await oneURL.findOne({}).sort( {short_url: -1 }).exec((err, post) => {
          if (err) {
            return console.log(err);
          }
          const newURL = new oneURL({
            original_url: reqURL,
            short_url: post.short_url + 1
          });
          newURL.save();
          res.json (newURL);
        });
      }
    }
  } else {
    res.json({ "error": "invalid url" });
  }
});

app.get('/api/shorturl/:short_url', (req,res) => {
  const shortURL = req.params.short_url;
  oneURL.findOne({ short_url: shortURL}, (err, oneURL) => {
    if (err) {
      return console.log(err);
    }
    res.redirect(oneURL.original_url);
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
