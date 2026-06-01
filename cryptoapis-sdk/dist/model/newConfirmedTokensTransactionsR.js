"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedTokensTransactionsR = void 0;
var NewConfirmedTokensTransactionsR = (function () {
    function NewConfirmedTokensTransactionsR() {
    }
    NewConfirmedTokensTransactionsR.getAttributeTypeMap = function () {
        return NewConfirmedTokensTransactionsR.attributeTypeMap;
    };
    NewConfirmedTokensTransactionsR.discriminator = undefined;
    NewConfirmedTokensTransactionsR.attributeTypeMap = [
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
            "type": "NewConfirmedTokensTransactionsRData"
        }
    ];
    return NewConfirmedTokensTransactionsR;
}());
exports.NewConfirmedTokensTransactionsR = NewConfirmedTokensTransactionsR;
//# sourceMappingURL=newConfirmedTokensTransactionsR.js.map