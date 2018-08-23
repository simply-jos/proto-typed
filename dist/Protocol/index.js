"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Decorator to indicate unenumerable field.
 *
 * Used to prevent marshalling of internal data fields.
 */
function unenumerable() {
    return function (target, propertyKey) {
        var descriptor = Object.getOwnPropertyDescriptor(target, propertyKey) || {};
        descriptor.writable = true;
        descriptor.enumerable = false;
        Object.defineProperty(target, propertyKey, descriptor);
    };
}
/**
 * Handler for a message, must return the message's response type
 */
var Handler = /** @class */ (function () {
    function Handler(fields) {
        Object.assign(this, fields);
    }
    return Handler;
}());
exports.Handler = Handler;
/**
 * Message repository used to parse messages and dispatch events
 */
var MessageRepository = /** @class */ (function () {
    /**
     * Creates a new MessageRepository with the specified send and recieve callbacks
     *
     * @param sendCallback Will be called when a message needs to be sent
     */
    function MessageRepository(sendCallback) {
        var _this = this;
        this.messages = {};
        this.sendCallback = sendCallback;
        this.messageDecorator = function (name) {
            return function (target) {
                var messageName = name || target.name;
                target.__metadata = {
                    name: messageName,
                    repository: _this
                };
                if (_this.messages[messageName])
                    throw "Message declaration " + messageName + " was already registered";
                _this.messages[messageName] = target;
            };
        };
    }
    MessageRepository.prototype.SetSendCallback = function (callback) {
        this.sendCallback = callback;
    };
    MessageRepository.prototype.SendPacket = function (destination, userdata, message) {
        return __awaiter(this, void 0, void 0, function () {
            var serialized, response, responseType, responseMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        serialized = message.Serialize();
                        return [4 /*yield*/, this.sendCallback(destination, userdata, serialized)];
                    case 1:
                        response = _a.sent();
                        responseType = message.GetDeclaration().ResponseType;
                        responseMessage = responseType.Deserialize(response);
                        return [2 /*return*/, responseMessage];
                }
            });
        });
    };
    MessageRepository.prototype.DispatchToHandler = function (serializedMessage, userdata, handlers) {
        // Deserialize packet
        if (typeof serializedMessage == 'string') {
            try {
                var marshalled = JSON.parse(serializedMessage);
                var messageName = marshalled.name;
                var payload = marshalled.payload;
            }
            catch (ex) {
                throw "Failed to deserialize message";
            }
        }
        else {
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
        var response = handlers.find(function (v) { return v.type == messageType; }).handler(message, userdata);
        // Take the response and pass it to the client
        return response;
    };
    MessageRepository.prototype.GetMessageDeclarationDecorator = function () {
        return this.messageDecorator;
    };
    return MessageRepository;
}());
exports.MessageRepository = MessageRepository;
var MessageInstance = /** @class */ (function () {
    function MessageInstance(type, fields) {
        this.messageType = type;
        Object.assign(this, fields);
    }
    MessageInstance.prototype.Serialize = function () {
        return this.messageType.Serialize(this);
    };
    MessageInstance.prototype.GetDeclaration = function () {
        return this.messageType;
    };
    /**
     * Sends this packet and optionally waits for a response
    */
    MessageInstance.prototype.Send = function (destination, userdata) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.messageType.__metadata.repository.SendPacket(destination, userdata, this)];
            });
        });
    };
    __decorate([
        unenumerable()
    ], MessageInstance.prototype, "messageType", void 0);
    return MessageInstance;
}());
exports.MessageInstance = MessageInstance;
/**
 * Message declaration base type.
 *
 * Extend this type to add your own declaration
 */
var MessageDeclaration = /** @class */ (function () {
    function MessageDeclaration() {
    }
    /**
     * Creates a new message of this declared message type
     *
     * @param this Message declaration to create
     * @param fields Fields to assign to the new message
     */
    MessageDeclaration.CreateMessage = function (fields) {
        // Create a new object of this declaration type
        var messageData = new this();
        Object.assign(messageData, fields);
        // Assign it to a new message instance
        var messageInstance = new MessageInstance(this, fields);
        return messageInstance;
    };
    /**
     * Creates a new error
     *
     * @param this Message declaration to create
     * @param fields Fields to assign to the new message
     */
    MessageDeclaration.CreateError = function (fields) {
        // Create a new object of this declaration type
        var messageData = new this();
        Object.assign(messageData, fields);
        // Assign it to a new message instance
        var messageInstance = new MessageInstance(this, fields);
        return messageInstance;
    };
    /**
     * Serializes a message to JSON
     *
     * @param this Message declaration
     * @param message Message
     */
    MessageDeclaration.Serialize = function (message) {
        var marshaled = this.Marshal(message);
        return JSON.stringify(marshaled);
    };
    /**
     * Deserializes a message from JSON
     *
     * @param this The message declaration
     * @param value The string to deserialize
     */
    MessageDeclaration.Deserialize = function (value) {
        if (typeof value == 'string')
            var marshalled = JSON.parse(value);
        else
            var marshalled = value;
        var unmarshalled = this.Unmarshal(marshalled);
        return this.CreateMessage(unmarshalled);
    };
    /**
     * Marshals a message from a deserialized message to a MarshalledMessage
     *
     * @param this The message declaration
     * @param value The deserialized message to marshal
     */
    MessageDeclaration.Marshal = function (value) {
        return {
            name: this.__metadata.name,
            payload: value
        };
    };
    /**
     * Unmarshals a message from a deserialized message to a message instance
     *
     * @param this The message declaration
     * @param value The marshalled message message to unmarshal
     */
    MessageDeclaration.Unmarshal = function (value) {
        if (value.name != this.__metadata.name)
            throw "Expected message with type " + this.__metadata.name + ", got " + value.name;
        return value.payload;
    };
    __decorate([
        unenumerable()
    ], MessageDeclaration, "__metadata", void 0);
    return MessageDeclaration;
}());
exports.MessageDeclaration = MessageDeclaration;
