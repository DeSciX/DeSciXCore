"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewUnconfirmedCoinsTransactionsR = void 0;
var NewUnconfirmedCoinsTransactionsR = (function () {
    function NewUnconfirmedCoinsTransactionsR() {
    }
    NewUnconfirmedCoinsTransactionsR.getAttributeTypeMap = function () {
        return NewUnconfirmedCoinsTransactionsR.attributeTypeMap;
    };
    NewUnconfirmedCoinsTransactionsR.discriminator = undefined;
    NewUnconfirmedCoinsTransactionsR.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "NewUnconfirmedCoinsTransactionsRData"
        }
    ];
    return NewUnconfirmedCoinsTransactionsR;
}());
exports.NewUnconfirmedCoinsTransactionsR = NewUnconfirmedCoinsTransactionsR;
//# sourceMappingURL=newUnconfirmedCoinsTransactionsR.js.map