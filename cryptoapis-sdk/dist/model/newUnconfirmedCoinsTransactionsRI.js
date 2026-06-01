"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewUnconfirmedCoinsTransactionsRI = void 0;
var NewUnconfirmedCoinsTransactionsRI = (function () {
    function NewUnconfirmedCoinsTransactionsRI() {
    }
    NewUnconfirmedCoinsTransactionsRI.getAttributeTypeMap = function () {
        return NewUnconfirmedCoinsTransactionsRI.attributeTypeMap;
    };
    NewUnconfirmedCoinsTransactionsRI.discriminator = undefined;
    NewUnconfirmedCoinsTransactionsRI.attributeTypeMap = [
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
            "name": "referenceId",
            "baseName": "referenceId",
            "type": "string"
        }
    ];
    return NewUnconfirmedCoinsTransactionsRI;
}());
exports.NewUnconfirmedCoinsTransactionsRI = NewUnconfirmedCoinsTransactionsRI;
//# sourceMappingURL=newUnconfirmedCoinsTransactionsRI.js.map