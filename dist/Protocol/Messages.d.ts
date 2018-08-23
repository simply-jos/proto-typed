export interface SerializedMessage {
    type: string;
    payload: {};
}
/**
 * Base message that other classes should inherit from
 */
export declare class BaseMessage {
    constructor(fields: {});
    static Create<T extends typeof BaseMessage>(this: T, fields: T['prototype']): T['prototype'];
    static __packetName: string;
    success: boolean;
    error?: string;
    /**
     * Marshals a packet to a string (JSON-encoded SerializedMessage)
     */
    Marshal(): string;
    /**
     * Unmarshals a packet from a JSON-encoded SerializedMessage to its respective type
     *
     * @param this The type to unmarshal to
     * @param marshaled JSON-encoded SerializedMssage
     *
     * @returns U The unmarshaled object
     */
    static Unmarshal<T extends typeof BaseMessage, U = T['prototype']>(this: T, marshaled: string): U;
}
export declare function Packet<PacketTypeClass extends typeof BaseMessage, PacketClass = PacketTypeClass['prototype']>(constructor: PacketTypeClass): void;
export declare function HandleMessage(messageStr: string, handlers: {}): void;
