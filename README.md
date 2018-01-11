# Prototyped

A library for building strongly-typed communication protocols in TypeScript.

## Features

- Compile time errors for protocol misuse
- Runtime exceptions thrown for network errors, protocol misuse
- Promise-based API with async/await support
- Decorator-based protocol definition shared betweeen client/sever (DRY)
- - Accidentally using an older version of your protocol will throw compile-time exceptions
- Define your own transport via callbacks (not just HTTP)

## Installing

```npm install proto-typed --save```

## Example

### Common module
Defines protocol, shared between client/server:

```typescript
import * as Prototyped from 'proto-typed'

// Initialize a protocol by creating a message respository
export var MessageRepository: Prototyped.MessageRepository = new Prototyped.MessageRepository();

// Get the decorator used to declare new messages
let MessageDecl = MessageRepository.GetMessageDeclarationDecorator();

export namespace Protocol {
  // Declare a "Hello" message's response
  @MessageDecl
  export class HelloMessageResponse extends Prototyped.MessageDeclaration {
    // Add some "pong" text to respond with
    pong: string
  }
  
  // Declare a "Hello" message
  @MessageDecl
  export class HelloMessage extends Prototyped.MessageDeclaration {
    // Assign the response type for this message
    static ResponseType = HelloMessageResponse;
  
    // Add some "ping" text to send
    ping: string;
  }
}
```

### Server
Simple Express server:

```typescript
import * as express from 'express'
import * as Prototyped from 'proto-typed'

// Import the communication protocol defined above
import * as Common from 'example-common'

async function main() {
  // Create an express app
  let app = express();

  // Create a "GET" endpoint for the client to send a message to
  app.get('/send', async (request: express.Request, response: express.Response) => {
    // Allow CORs
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, GET');
    response.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    // Grab the message data from the request
    const serializedMessage = request.query.messageData;

    try {
      // Dispatch the message to an appropriate handler
      let responseMessage = await Common.MessageRepository.DispatchToHandler(
        serializedMessage, // Message data
        null,              // Optional userdata
        [                  // Array of message handlers
          {
            type: Common.Protocol.HelloMessage,
            handler: async (message: Common.Protocol.HelloMessage, userdata: any) => {
              // Print the incoming "ping" message
              console.log(`Ping message: ${message.ping}`);

              // Unconditionally respond with a HelloMessageResponse
              // Returning any other type here will throw a compile and runtime error
              // because our previously declared protocol states the response type.
              return Common.Protocol.HelloMessageResponse.CreateMessage({
                pong: "pong!!! it's a pong message!!"
              });
            }
          }
      ]);

      // Send the response to the client
      response.send(responseMessage.Serialize());
    }

    catch (ex) {
      console.log(ex);
    }
  });

  // Hey, listen!
  app.listen(8090);
}

main();
```

### Client:
Bare-bones app to button to send a message and display a response:

```typescript
import axios from 'axios'
import * as Prototyped from 'proto-typed'

// Import the communication protocol defined above
import * as Common from 'example-common'

var serverEndpoint = "http://localhost:8090/send";

window.addEventListener('load', () => {
  // Initialize the message repository's send callback
  // This is used to send any message
  Common.MessageRepository.SetSendCallback(
    async (destination: string, userdata: any, serializedMessage: string) => {
      // Send the get request to the test server
      const response = await axios.get(
        "http://localhost:8090/send",
        {
          params: {
            messageData: serializedMessage
          }
        }
      );

      // Return the response
      return response.data;
    }
  );


  // Create a send button
  let sendPingButton = document.createElement('button');
  sendPingButton.innerHTML = 'Send Ping Message';

  // When clicked, initiate the message send..
  sendPingButton.addEventListener('click', async () => {
    // First, create the ping message
    let pingMessage = Common.Protocol.HelloMessage.CreateMessage({
      ping: "Hello from client!"
    });

    try {
      // Send the message and await the response message
      //
      // An exception will be thrown here if the server or send handler throws an exception, or
      // otherwise errors out (timeout, etc)
      let responseMessage = await pingMessage.Send();

      // The type of the response is known here, since we declared it in the message repository declaration.
      //
      // If the message is not of that type, an exception will be thrown at runtime.
      // If we misuse the type, an error will be displayed at compile time.

      // Display the pong message to the client
      alert(responseMessage.pong);
    }

    catch (ex) {
      alert("An error occured: " + ex);
    }
  });

  // Attach the button to the document body
  document.body.appendChild(sendPingButton);
});
```
