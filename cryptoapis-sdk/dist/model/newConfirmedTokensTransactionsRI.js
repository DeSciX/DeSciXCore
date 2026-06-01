"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedTokensTransactionsRI = void 0;
var NewConfirmedTokensTransactionsRI = (function () {
    function NewConfirmedTokensTransactionsRI() {
    }
    NewConfirmedTokensTransactionsRI.getAttributeTypeMap = function () {
        return NewConfirmedTokensTransactionsRI.attributeTypeMap;
    };
    NewConfirmedTokensTransactionsRI.discriminator = undefined;
    NewConfirmedTokensTransactionsRI.attributeTypeMap = [
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
    return NewConfirmedTokensTransactionsRI;
}());
exports.NewConfirmedTokensTransactionsRI = NewConfirmedTokensTransactionsRI;
//# sourceMappingURL=newConfirmedTokensTransactionsRI.js.map