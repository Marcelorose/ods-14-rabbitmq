const path  = require('path');
require('dotenv').config({path:  path.resolve(process.cwd(), '../.env')});

const express = require('express');
const app = express();
const http = require('http');
const bodyParser = require('body-parser');
const amqp = require('amqplib');
const cors = require('cors');

// Middleware
app.use(bodyParser.json());

app.use(cors())

// RabbitMQ connection string
const messageQueueConnectionString = process.env.CLOUDAMQP_URL;

// handle the request


// handle the request
app.post('/api/v1/processData', async function (req, res) {

 // connect to Rabbit MQ and create a channel
 let connection = await amqp.connect(messageQueueConnectionString);
 let channel = await connection.createConfirmChannel();
 let key = req.body.key;

 // publish the data to Rabbit MQ
 //await publishToChannel(channel, { routingKey: "request", exchangeName: "processing", data: req.body });
 await publishToChannel(channel, { routingKey: key, exchangeName: "topic_logs", data: req.body });

 // send the request id in the response
 //res.send({ requestId })
 
 res.sendStatus(200);
 channel.close();
 connection.close();
});





app.get('/api/v1/acidification', async function (req, res) {

  console.log("aqui");
  // connect to Rabbit MQ and create a channel
  let connection = await amqp.connect(messageQueueConnectionString);
  let channel = await connection.createConfirmChannel();
  await channel.prefetch(1);

   return  new Promise((resolve, reject) => {
    channel.consume("topic_logs.pacifico", async function (msg) {
      // parse message
      let msgBody = msg.content.toString();
      let data = JSON.parse(msgBody);
      console.log("CONSUME: ", msgBody);      
      await channel.ack(msg);
      channel.close();
     
      return  res.status(200).json({
        data: msgBody,
      });

    });

    // handle connection closed
    connection.on("close", (err) => {
      return reject(err);
    });

    // handle errors
    connection.on("error", (err) => {
      return reject(err);
    });
  });
  
});


// utility function to publish messages to a channel
function publishToChannel(channel, { routingKey, exchangeName, data }) {
  return new Promise((resolve, reject) => {
    channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(data), 'utf-8'), { persistent: true }, function (err, ok) {
      if (err) {
        return reject(err);
      }

      resolve();
    })
  });
}



// Start the server
const PORT = 3000;
server = http.createServer(app);
server.listen(PORT, "localhost", function (err) {
  if (err) {
    console.error(err);
  } else {
    console.info("Listening on port %s.", PORT);
  }
});

// listen for results on RabbitMQ
//listenForResults();