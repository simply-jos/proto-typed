/**
 * Message serialized to be sent over the wire
 */
export interface SerializedMessage {
  name: string;
  payload: {};
}

/**
 * Message repository used to parse messages and dispatch events
 */
export class MessageRepository {
  private messageTypes: { [key: string]: typeof Message } = {};
  private packetDecorator: <T extends typeof Message>(target: T) => void;

  constructor() {
    this.packetDecorator = <T extends typeof Message>(target: T, name?: string) => {
      const packetName = name || target.name;

      target.__metadata = {
        name: packetName
      };

      if (this.messageTypes[packetName])
        throw `Packet ${packetName} was already registered`

      this.messageTypes[packetName] = target;
    };
  }

  DispatchToHandler(serializedMessage: string, handlers: { [key: string]: (message: Message) => Message | undefined}) {
    // Deserialize packet
    try {
      var deserialized: SerializedMessage = JSON.parse(serializedMessage);

      var messageName = deserialized.name;
      var payload = deserialized.payload;
    }

    catch (ex) {
      throw "Failed to deserialize message";
    }

    // Convert the packet into its proper type
    try {
      var messageType = this.messageTypes[deserialized.name];
      var message = messageType.Unmarshal(deserialized);
    }

    catch (ex) {
      throw "Failed to unmarshal message";
    }

    // Dispatch message
    const response = handlers[messageType.__metadata.name](message);

    // Take the response and pass it to the client
    return response;
  }

  GetPacketDecorator() {
    return this.packetDecorator;
  }
}

export class Message {
  static __metadata: {
    name: string
  };

  static Serialize<
    T extends typeof Message
  >(this: T, value: T['prototype']): string {
    let marshaled = this.Marshal(value);

    return JSON.stringify(marshaled);
  }

  static Deserialize<
    T extends typeof Message
  >(this: T, value: string): T['prototype'] {
    let deserialized = JSON.parse(value);

    return this.Unmarshal(deserialized);
  }

  static Marshal<
    T extends typeof Message
  >(this: T, value: T['prototype']): SerializedMessage {
    return {
      name: this.__metadata.name,
      payload: value
    } as SerializedMessage;
  }

  static Unmarshal<
    T extends typeof Message
  >(this: T, marshaled: SerializedMessage): T['prototype'] {
    if (this.__metadata.name != marshaled.name)
      throw `Marshaled type name doesn't match our type name (${marshaled['name']} != ${this.__metadata.name})`;

    const packedObject: T['prototype'] = new this();
    Object.assign(packedObject, marshaled.payload);

    return packedObject;
  }
}