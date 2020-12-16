require('dotenv').config();

const amqp = require('amqplib');

// RabbitMQ connection string
const messageQueueConnectionString = process.env.CLOUDAMQP_URL;

async function setup() {
  console.log("Setting up RabbitMQ Exchanges/Queues");
  // connect to RabbitMQ Instance
  let connection = await amqp.connect(messageQueueConnectionString);

  // create a channel
  let channel = await connection.createChannel();

  // create exchange
  //await channel.assertExchange("processing", "direct", { durable: true });
  await channel.assertExchange("topic_logs", "direct", { durable: true });

  // create queues
  //await channel.assertQueue("processing.requests", { durable: true });
  //await channel.assertQueue("processing.results", { durable: true });
  await channel.assertQueue("topic_logs.atlantico", { durable: true });
  await channel.assertQueue("topic_logs.pacifico", { durable: true });
  await channel.assertQueue("topic_logs.indico", { durable: true });

  // bind queues
  //await channel.bindQueue("processing.requests","processing", "request");
  //await channel.bindQueue("processing.results","processing", "result");
  await channel.bindQueue("topic_logs.atlantico","topic_logs", "atlantico");
  await channel.bindQueue("topic_logs.pacifico","topic_logs", "pacifico");
  await channel.bindQueue("topic_logs.indico","topic_logs", "indico");

  console.log("Setup DONE");
  process.exit();
}

setup();