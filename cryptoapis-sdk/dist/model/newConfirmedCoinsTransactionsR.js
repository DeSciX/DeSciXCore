"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedCoinsTransactionsR = void 0;
var NewConfirmedCoinsTransactionsR = (function () {
    function NewConfirmedCoinsTransactionsR() {
    }
    NewConfirmedCoinsTransactionsR.getAttributeTypeMap = function () {
        return NewConfirmedCoinsTransactionsR.attributeTypeMap;
    };
    NewConfirmedCoinsTransactionsR.discriminator = undefined;
    NewConfirmedCoinsTransactionsR.attributeTypeMap = [
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
            "type": "NewConfirmedCoinsTransactionsRData"
        }
    ];
    return NewConfirmedCoinsTransactionsR;
}());
exports.NewConfirmedCoinsTransactionsR = NewConfirmedCoinsTransactionsR;
//# sourceMappingURL=newConfirmedCoinsTransactionsR.js.map