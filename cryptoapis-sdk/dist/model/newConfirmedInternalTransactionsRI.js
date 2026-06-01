"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedInternalTransactionsRI = void 0;
var NewConfirmedInternalTransactionsRI = (function () {
    function NewConfirmedInternalTransactionsRI() {
    }
    NewConfirmedInternalTransactionsRI.getAttributeTypeMap = function () {
        return NewConfirmedInternalTransactionsRI.attributeTypeMap;
    };
    NewConfirmedInternalTransactionsRI.discriminator = undefined;
    NewConfirmedInternalTransactionsRI.attributeTypeMap = [
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
    return NewConfirmedInternalTransactionsRI;
}());
exports.NewConfirmedInternalTransactionsRI = NewConfirmedInternalTransactionsRI;
//# sourceMappingURL=newConfirmedInternalTransactionsRI.js.map