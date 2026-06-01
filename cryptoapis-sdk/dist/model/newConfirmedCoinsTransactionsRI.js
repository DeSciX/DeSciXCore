"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedCoinsTransactionsRI = void 0;
var NewConfirmedCoinsTransactionsRI = (function () {
    function NewConfirmedCoinsTransactionsRI() {
    }
    NewConfirmedCoinsTransactionsRI.getAttributeTypeMap = function () {
        return NewConfirmedCoinsTransactionsRI.attributeTypeMap;
    };
    NewConfirmedCoinsTransactionsRI.discriminator = undefined;
    NewConfirmedCoinsTransactionsRI.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "callbackSecretKey",
            "baseName": "callbackSecretKey",
            "type": "string"
        },
        {
            "name": "callbackUrl",
            "baseName": "callbackUrl",
            "type": "string"
        },
        {
            "name": "createdTimestamp",
            "baseName": "createdTimestamp",
            "type": "number"
        },
        {
            "name": "eventType",
            "baseName": "eventType",
            "type": "string"
        },
        {
            "name": "isActive",
            "baseName": "isActive",
            "type": "boolean"
        },
        {
            "name": "receiveCallbackOn",
            "baseName": "receiveCallbackOn",
            "type": "number"
        },
        {
            "name": "referenceId",
            "baseName": "referenceId",
            "type": "string"
        }
    ];
    return NewConfirmedCoinsTransactionsRI;
}());
exports.NewConfirmedCoinsTransactionsRI = NewConfirmedCoinsTransactionsRI;
//# sourceMappingURL=newConfirmedCoinsTransactionsRI.js.map