/**
 * Decorator to indicate unenumerable field.
 * 
 * Used to prevent marshalling of internal data fields.
 */
function unenumerable() {
  return function (target: any, propertyKey: string | symbol) {
    let descriptor = Object.getOwnPropertyDescriptor(target, propertyKey) || {};
    descriptor.writable = true;
    descriptor.enumerable = false;

    Object.defineProperty(target, propertyKey, descriptor);
  };
}

/**
 * Message marshalled and ready to be serialized
 */
export interface MarshalledMessage {
  name: string;

  payload: {};
}

/**
 * Handler for a message, must return the message's response type
 */
export class Handler<T extends typeof MessageDeclaration> {
  public readonly type: T;
  public readonly handler: (message: Message<T>, userdata?: any) => Promise<Message<T['ResponseType']>>;

  constructor(fields: {
    type: T,
    handler: (message: Message<T>, userdata?: any) => Promise<Message<T['ResponseType']>>
  }) {
    Object.assign(this, fields);
  }
}

export type SendCallbackType = (destination: string, userdata: any, serializedMessage) => Promise<string>;

/**
 * Message repository used to parse messages and dispatch events
 */
export class MessageRepository {
  private messages: { [key: string]: typeof MessageDeclaration } = {};
  private messageDecorator: <T extends typeof MessageDeclaration>(target: T) => void;

  /**
   * User-defined callback for sending a a packet.
   */
  private sendCallback: SendCallbackType;

  /**
   * Creates a new MessageRepository with the specified send and recieve callbacks
   * 
   * @param sendCallback Will be called when a message needs to be sent
   */
  constructor(sendCallback?: SendCallbackType) {
    this.sendCallback = sendCallback;

    this.messageDecorator = <T extends typeof MessageDeclaration>(target: T, name?: string) => {
      const messageName = name || target.name;

      target.__metadata = {
        name: messageName,
        repository: this
      };

      if (this.messages[messageName])
        throw `Message declaration ${messageName} was already registered`

      this.messages[messageName] = target;
    };
  }

  SetSendCallback(callback: SendCallbackType) {
    this.sendCallback = callback;
  }

  async SendPacket(destination: string, userdata: any, message: MessageInstance<any>): Promise<Message<any>> {
    // Dispatch the message with the client-defined send callback
    let serialized = message.Serialize();
    let response = await this.sendCallback(destination, userdata, serialized);

    // Deserialize result
    let responseType = message.GetDeclaration().ResponseType;
    let responseMessage = responseType.Deserialize(response);

    return responseMessage;
  }

  DispatchToHandler(serializedMessage: string | MarshalledMessage, userdata: any, handlers: Handler<any>[]) {
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
    const response = handlers.find((v) => v.type == messageType).handler(message, userdata);

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

export class MessageInstance<ResponseType extends typeof MessageDeclaration> {
  @unenumerable()
  private readonly messageType: typeof MessageDeclaration;
  
  constructor(type: typeof MessageDeclaration, fields: MessageDeclaration) {
    this.messageType = type;
    Object.assign(this, fields);
  }

  public Serialize(): string {
    return this.messageType.Serialize(this);
  }

  public GetDeclaration() {
    return this.messageType;
  }

  /**
   * Sends this packet and optionally waits for a response
  */
  async Send(destination?: string, userdata?: any): Promise<Message<ResponseType>> {
    return this.messageType.__metadata.repository.SendPacket(destination, userdata, this) as Promise<Message<ResponseType>>;
  }
}

export type Message<T extends typeof MessageDeclaration> = UnionProxy<MessageInstance<T['ResponseType']>, T['prototype']>;

export type Partial<T> = {
  [P in keyof T]?: T[P];
};

/**
 * Message declaration base type.
 * 
 * Extend this type to add your own declaration
 */
export class MessageDeclaration {
  @unenumerable()
  static __metadata: {
    name: string,
    repository: MessageRepository
  };

  static ResponseType: typeof MessageDeclaration;

  /**
   * Creates a new message of this declared message type
   * 
   * @param this Message declaration to create
   * @param fields Fields to assign to the new message
   */
  static CreateMessage<
    T extends typeof MessageDeclaration
  >(this: T, fields: T['prototype']): Message<T> {
    // Create a new object of this declaration type
    let messageData = new this();
    Object.assign(messageData, fields)

    // Assign it to a new message instance
    let messageInstance = new MessageInstance<T>(this, fields);
    return (messageInstance as any) as Message<T>;
  }


  /**
   * Creates a new error
   * 
   * @param this Message declaration to create
   * @param fields Fields to assign to the new message
   */
  static CreateError<
    T extends typeof MessageDeclaration
  >(this: T, fields: Partial<T['prototype']>): Message<T> {
    // Create a new object of this declaration type
    let messageData = new this();
    Object.assign(messageData, fields)

    // Assign it to a new message instance
    let messageInstance = new MessageInstance<T>(this, fields);
    return (messageInstance as any) as Message<T>;
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

  /**
   * Deserializes a message from JSON
   * 
   * @param this The message declaration
   * @param value The string to deserialize
   */
  static Deserialize<
    T extends typeof MessageDeclaration
  >(this: T, value: string): Message<T> {
    let marshalled = JSON.parse(value) as MarshalledMessage;
    let unmarshalled = this.Unmarshal(marshalled);

    return this.CreateMessage(unmarshalled);
  }

  /**
   * Marshals a message from a deserialized message to a MarshalledMessage
   * 
   * @param this The message declaration
   * @param value The deserialized message to marshal
   */
  static Marshal<
    T extends typeof MessageDeclaration
  >(this: T, value: T['prototype']): MarshalledMessage {
    return {
      name: this.__metadata.name,
      payload: value
    };
  }

  /**
   * Unmarshals a message from a deserialized message to a message instance
   * 
   * @param this The message declaration
   * @param value The marshalled message message to unmarshal
   */
  static Unmarshal<
    T extends typeof MessageDeclaration
  >(this: T, value: MarshalledMessage): T['prototype'] {
    if (value.name != this.__metadata.name)
      throw `Expected message with type ${this.__metadata.name}, got ${value.name}`;

    return value.payload as T['prototype'];
  }
}
