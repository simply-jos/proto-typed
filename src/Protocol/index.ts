/**
 * Message marshalled and ready to be serialized
 */
export interface MarshalledMessage {
  name: string;

  payload: {};
}

export class Handler<T extends typeof MessageDeclaration> {
  public readonly type: T;
  public readonly handler: (message: T['prototype']) => Promise<Message<T['Response']['prototype']>>;

  constructor(fields: {
    type: T,
    handler: (message: T['prototype']) => Promise<Message<T['Response']['prototype']>>
  }) {
    Object.assign(this, fields);
  }
}

/**
 * Message repository used to parse messages and dispatch events
 */
export class MessageRepository {
  private messages: { [key: string]: typeof MessageDeclaration } = {};
  private messageDecorator: <T extends typeof MessageDeclaration>(target: T) => void;

  constructor() {
    this.messageDecorator = <T extends typeof MessageDeclaration>(target: T, name?: string) => {
      const messageName = name || target.name;

      target.__metadata = {
        name: messageName
      };

      if (this.messages[messageName])
        throw `Message declaration ${messageName} was already registered`

      this.messages[messageName] = target;
    };
  }

  DispatchToHandler(serializedMessage: string | MarshalledMessage, handlers: Handler<any>[]) {
    // Deserialize packet
    if (typeof serializedMessage == 'string') {
      try {
        var marshalled: MarshalledMessage = JSON.parse(serializedMessage);

        var messageName = marshalled.name;
        var payload = marshalled.payload;
      }

      catch (ex) {
        throw "Failed to deserialize message";
      }
    } else {
      var marshalled = serializedMessage;
    }

    // Convert the packet into its proper type
    try {
      var messageType = this.messages[marshalled.name];
      var unmarshalled = messageType.Unmarshal(marshalled);

      var message = messageType.CreateMessage(unmarshalled);
    }

    catch (ex) {
      throw "Failed to unmarshal message";
    }

    // Dispatch messages
    const response = handlers.find((v) => v.type == messageType).handler(message);

    // Take the response and pass it to the client
    return response;
  }

  GetMessageDeclarationDecorator() {
    return this.messageDecorator;
  }
}

export type UnionProxy<T, U> = {
  [K in keyof T]: T[K];
} & {
  [K in keyof U]: U[K];
}

export class MessageInstance {
  public readonly Serialize: () => string;
  
  constructor(type: typeof MessageDeclaration, fields: MessageDeclaration) {
    this.Serialize = (): string => {
      return type.Serialize(this);
    };

    Object.assign(this, fields);
  }
}

export type Message<T extends MessageDeclaration> = UnionProxy<MessageInstance, T>;

export class MessageDeclaration {
  static __metadata: {
    name: string
  };

  static Response: typeof MessageDeclaration;

  /**
   * Creates a new message of this declared message type
   * 
   * @param this Message declaration to create
   * @param fields Fields to assign to the new message
   */
  static CreateMessage<
    T extends typeof MessageDeclaration
  >(this: T, fields: T['prototype']): Message<T['prototype']> {
    // Create a new object of this declaration type
    let messageData = new this();
    Object.assign(messageData, fields)

    // Assign it to a new message instance
    let messageInstance = new MessageInstance(this, fields);
    return messageInstance as Message<T['prototype']>;
  }

  /**
   * Serializes a message to JSON
   * 
   * @param this Message declaration
   * @param message Message
   */
  static Serialize<
    T extends typeof MessageDeclaration
  >(this: T, message: T['prototype']): string {
    let marshaled = this.Marshal(message);

    return JSON.stringify(marshaled);
  }

  static Deserialize<
    T extends typeof MessageDeclaration
  >(this: T, value: string): Message<T['prototype']> {
    let marshalled = JSON.parse(value) as MarshalledMessage;
    let unmarshalled = this.Unmarshal(marshalled);

    return this.CreateMessage(unmarshalled);
  }

  static Marshal<
    T extends typeof MessageDeclaration
  >(this: T, value: T['prototype']): MarshalledMessage {
    return {
      name: this.__metadata.name,
      payload: value
    };
  }

  static Unmarshal<
    T extends typeof MessageDeclaration
  >(this: T, value: MarshalledMessage): T['prototype'] {
    if (value.name != this.__metadata.name)
      throw `Expected message with type ${this.__metadata.name}, got ${value.name}`;

    return value.payload as T['prototype'];
  }
}