"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedCoinsTransactionsAndEachConfirmation400Response = void 0;
var NewConfirmedCoinsTransactionsAndEachConfirmation400Response = (function () {
    function NewConfirmedCoinsTransactionsAndEachConfirmation400Response() {
    }
    NewConfirmedCoinsTransactionsAndEachConfirmation400Response.getAttributeTypeMap = function () {
        return NewConfirmedCoinsTransactionsAndEachConfirmation400Response.attributeTypeMap;
    };
    NewConfirmedCoinsTransactionsAndEachConfirmation400Response.discriminator = undefined;
    NewConfirmedCoinsTransactionsAndEachConfirmation400Response.attributeTypeMap = [
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
            "name": "error",
            "baseName": "error",
            "type": "NewConfirmedCoinsTransactionsAndEachConfirmationE400"
        }
    ];
    return NewConfirmedCoinsTransactionsAndEachConfirmation400Response;
}());
exports.NewConfirmedCoinsTransactionsAndEachConfirmation400Response = NewConfirmedCoinsTransactionsAndEachConfirmation400Response;
//# sourceMappingURL=newConfirmedCoinsTransactionsAndEachConfirmation400Response.js.map