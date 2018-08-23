"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Base message that other classes should inherit from
 */
var BaseMessage = /** @class */ (function () {
    function BaseMessage(fields) {
        Object.assign(this, fields);
    }
    BaseMessage.Create = function (fields) {
        return new this(fields);
    };
    /**
     * Marshals a packet to a string (JSON-encoded SerializedMessage)
     */
    BaseMessage.prototype.Marshal = function () {
        return JSON.stringify({
            type: BaseMessage.__packetName,
            payload: this
        });
    };
    /**
     * Unmarshals a packet from a JSON-encoded SerializedMessage to its respective type
     *
     * @param this The type to unmarshal to
     * @param marshaled JSON-encoded SerializedMssage
     *
     * @returns U The unmarshaled object
     */
    BaseMessage.Unmarshal = function (marshaled) {
        var serialized = JSON.parse(marshaled);
        var packetType = serialized.type;
        if (packetType != this.__packetName)
            throw "Marshaled packet is not of type " + this.__packetName;
        var payload = serialized.payload;
        var message = new this(payload);
        return message;
    };
    return BaseMessage;
}());
exports.BaseMessage = BaseMessage;
var packets = {};
function Packet(constructor) {
    var packetName = constructor.toString();
    constructor.__packetName = packetName;
    packets[packetName] = constructor;
}
exports.Packet = Packet;
function HandleMessage(messageStr, handlers) {
    try {
        var message = JSON.parse(messageStr);
        var messageType = message.type;
        var contents = message.contents;
    }
    catch (ex) {
        throw "Error parsing packet of type: " + messageType;
    }
    try {
        var packet = packets[messageType].Unmarshal(contents);
    }
    catch (ex) {
        throw "No packet registered for message of type: " + messageType;
    }
    try {
        var handler = handler[messageType];
    }
    catch (ex) {
        throw "No handler registered for message of type: " + messageType;
    }
    handler();
}
exports.HandleMessage = HandleMessage;
