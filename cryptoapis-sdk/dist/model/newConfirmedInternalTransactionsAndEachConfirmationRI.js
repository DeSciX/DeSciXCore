"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedInternalTransactionsAndEachConfirmationRI = void 0;
var NewConfirmedInternalTransactionsAndEachConfirmationRI = (function () {
    function NewConfirmedInternalTransactionsAndEachConfirmationRI() {
    }
    NewConfirmedInternalTransactionsAndEachConfirmationRI.getAttributeTypeMap = function () {
        return NewConfirmedInternalTransactionsAndEachConfirmationRI.attributeTypeMap;
    };
    NewConfirmedInternalTransactionsAndEachConfirmationRI.discriminator = undefined;
    NewConfirmedInternalTransactionsAndEachConfirmationRI.attributeTypeMap = [
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
    return NewConfirmedInternalTransactionsAndEachConfirmationRI;
}());
exports.NewConfirmedInternalTransactionsAndEachConfirmationRI = NewConfirmedInternalTransactionsAndEachConfirmationRI;
//# sourceMappingURL=newConfirmedInternalTransactionsAndEachConfirmationRI.js.map