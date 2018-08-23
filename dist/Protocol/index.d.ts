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
export declare class Handler<T extends typeof MessageDeclaration> {
    readonly type: T;
    readonly handler: (message: Message<T>, userdata?: any) => Promise<Message<T['ResponseType']>>;
    constructor(fields: {
        type: T;
        handler: (message: Message<T>, userdata?: any) => Promise<Message<T['ResponseType']>>;
    });
}
export declare type SendCallbackType = (destination: string, userdata: any, serializedMessage) => Promise<string>;
/**
 * Message repository used to parse messages and dispatch events
 */
export declare class MessageRepository {
    private messages;
    private messageDecorator;
    /**
     * User-defined callback for sending a a packet.
     */
    private sendCallback;
    /**
     * Creates a new MessageRepository with the specified send and recieve callbacks
     *
     * @param sendCallback Will be called when a message needs to be sent
     */
    constructor(sendCallback?: SendCallbackType);
    SetSendCallback(callback: SendCallbackType): void;
    SendPacket(destination: string, userdata: any, message: MessageInstance<any>): Promise<Message<any>>;
    DispatchToHandler(serializedMessage: string | MarshalledMessage, userdata: any, handlers: Handler<any>[]): Promise<any>;
    GetMessageDeclarationDecorator(): <T extends typeof MessageDeclaration>(name?: string) => (target: T) => void;
}
export declare type UnionProxy<T, U> = {
    [K in keyof T]: T[K];
} & {
    [K in keyof U]: U[K];
};
export declare class MessageInstance<ResponseType extends typeof MessageDeclaration> {
    private readonly messageType;
    constructor(type: typeof MessageDeclaration, fields: MessageDeclaration);
    Serialize(): string;
    GetDeclaration(): typeof MessageDeclaration;
    /**
     * Sends this packet and optionally waits for a response
    */
    Send(destination?: string, userdata?: any): Promise<Message<ResponseType>>;
}
export declare type Message<T extends typeof MessageDeclaration> = UnionProxy<MessageInstance<T['ResponseType']>, T['prototype']>;
export declare type Partial<T> = {
    [P in keyof T]?: T[P];
};
/**
 * Message declaration base type.
 *
 * Extend this type to add your own declaration
 */
export declare class MessageDeclaration {
    static __metadata: {
        name: string;
        repository: MessageRepository;
    };
    static ResponseType: typeof MessageDeclaration;
    /**
     * Creates a new message of this declared message type
     *
     * @param this Message declaration to create
     * @param fields Fields to assign to the new message
     */
    static CreateMessage<T extends typeof MessageDeclaration>(this: T, fields: T['prototype']): Message<T>;
    /**
     * Creates a new error
     *
     * @param this Message declaration to create
     * @param fields Fields to assign to the new message
     */
    static CreateError<T extends typeof MessageDeclaration>(this: T, fields: Partial<T['prototype']>): Message<T>;
    /**
     * Serializes a message to JSON
     *
     * @param this Message declaration
     * @param message Message
     */
    static Serialize<T extends typeof MessageDeclaration>(this: T, message: T['prototype']): string;
    /**
     * Deserializes a message from JSON
     *
     * @param this The message declaration
     * @param value The string to deserialize
     */
    static Deserialize<T extends typeof MessageDeclaration>(this: T, value: string | object): Message<T>;
    /**
     * Marshals a message from a deserialized message to a MarshalledMessage
     *
     * @param this The message declaration
     * @param value The deserialized message to marshal
     */
    static Marshal<T extends typeof MessageDeclaration>(this: T, value: T['prototype']): MarshalledMessage;
    /**
     * Unmarshals a message from a deserialized message to a message instance
     *
     * @param this The message declaration
     * @param value The marshalled message message to unmarshal
     */
    static Unmarshal<T extends typeof MessageDeclaration>(this: T, value: MarshalledMessage): T['prototype'];
}
