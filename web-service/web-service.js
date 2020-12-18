const path  = require('path');
require('dotenv').config({path:  path.resolve(process.cwd(), '../.env')});

const express = require('express');
const app = express();
const http = require('http');
const bodyParser = require('body-parser');
const amqp = require('amqplib');
const cors = require('cors');

app.use(bodyParser.json());

app.use(cors())

const messageQueueConnectionString = process.env.CLOUDAMQP_URL;

app.post('/api/v1/processData', async function (req, res) {

 let connection = await amqp.connect(messageQueueConnectionString);
 let channel = await connection.createConfirmChannel();
 let key = req.body.key;

 await publishToChannel(channel, { routingKey: key, exchangeName: "topic_logs", data: req.body });
 
 res.sendStatus(200);
 channel.close();
 connection.close();
});

app.get('/api/v1/acidification', async function (req, res) {

  let connection = await amqp.connect(messageQueueConnectionString);
  let channel = await connection.createConfirmChannel();
  await channel.prefetch(1);

   return  new Promise((resolve, reject) => {
    channel.consume("topic_logs." + req.query.oceano, async function (msg) {
      let msgBody = msg.content.toString();
      let data = JSON.parse(msgBody);
      await channel.ack(msg);
      channel.close();
     
      return  res.status(200).json({
        data: msgBody,
      });

    });

    connection.on("close", (err) => {
      return reject(err);
    });

    connection.on("error", (err) => {
      return reject(err);
    });
  });
  
});

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

const PORT = 3000;
server = http.createServer(app);
server.listen(PORT, "localhost", function (err) {
  if (err) {
    console.error(err);
  } else {
    console.info("Listening on port %s.", PORT);
  }
});