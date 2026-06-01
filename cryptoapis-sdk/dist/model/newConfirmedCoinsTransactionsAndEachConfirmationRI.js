"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedCoinsTransactionsAndEachConfirmationRI = void 0;
var NewConfirmedCoinsTransactionsAndEachConfirmationRI = (function () {
    function NewConfirmedCoinsTransactionsAndEachConfirmationRI() {
    }
    NewConfirmedCoinsTransactionsAndEachConfirmationRI.getAttributeTypeMap = function () {
        return NewConfirmedCoinsTransactionsAndEachConfirmationRI.attributeTypeMap;
    };
    NewConfirmedCoinsTransactionsAndEachConfirmationRI.discriminator = undefined;
    NewConfirmedCoinsTransactionsAndEachConfirmationRI.attributeTypeMap = [
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
            "name": "confirmationsCount",
            "baseName": "confirmationsCount",
            "type": "number"
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
            "name": "referenceId",
            "baseName": "referenceId",
            "type": "string"
        }
    ];
    return NewConfirmedCoinsTransactionsAndEachConfirmationRI;
}());
exports.NewConfirmedCoinsTransactionsAndEachConfirmationRI = NewConfirmedCoinsTransactionsAndEachConfirmationRI;
//# sourceMappingURL=newConfirmedCoinsTransactionsAndEachConfirmationRI.js.map