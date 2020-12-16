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
app.post('/api/v1/processData', async function (req, res) {
  // save request id and increment
  console.log(req.body);

  // connect to Rabbit MQ and create a channel
  let connection = await amqp.connect(messageQueueConnectionString);
  let channel = await connection.createConfirmChannel();

  // publish the data to Rabbit MQ
  await publishToChannel(channel, { routingKey: "request", exchangeName: "processing", data: req.body });

  // send the request id in the response
  //res.send({ requestId })
  res.sendStatus(200);
});

app.get('/api/v1/acidification', async function (req, res) {
  console.log("aqui");
  // connect to Rabbit MQ and create a channel
  let connection = await amqp.connect(messageQueueConnectionString);
  let channel = await connection.createConfirmChannel();

  return new Promise((resolve, reject) => {
    channel.consume("processing.requests", async function (msg) {
      // parse message
      let msgBody = msg.content.toString();
      let data = JSON.parse(msgBody);
      console.log("CONSUME: ", msgBody);      
      await channel.ack(msg);
      return res.status(200).json({
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
    
  


  // let data = await consume({ connection, channel });
  // console.log("RES: ", data);
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


async function listenForResults() {
  // connect to Rabbit MQ
  let connection = await amqp.connect(messageQueueConnectionString);

  // create a channel and prefetch 1 message at a time
  let channel = await connection.createChannel();
  await channel.prefetch(1);

  // start consuming messages
  await consume({ connection, channel });
}


// consume messages from RabbitMQ
function consume({ connection, channel, resultsChannel }) {
  return new Promise((resolve, reject) => {
    channel.consume("processing.requests", async function (msg) {
      // parse message
      let msgBody = msg.content.toString();
      let data = JSON.parse(msgBody);
      let requestId = data.requestId;
      let requestData = data.requestData;
      console.log("Received a request message, requestId:", requestId);
      console.log("CONSUME: ", requestData);      
      await channel.ack(msg);
      return requestData;
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