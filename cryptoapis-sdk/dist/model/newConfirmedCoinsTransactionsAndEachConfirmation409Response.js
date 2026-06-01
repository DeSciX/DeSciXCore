"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedCoinsTransactionsAndEachConfirmation409Response = void 0;
var NewConfirmedCoinsTransactionsAndEachConfirmation409Response = (function () {
    function NewConfirmedCoinsTransactionsAndEachConfirmation409Response() {
    }
    NewConfirmedCoinsTransactionsAndEachConfirmation409Response.getAttributeTypeMap = function () {
        return NewConfirmedCoinsTransactionsAndEachConfirmation409Response.attributeTypeMap;
    };
    NewConfirmedCoinsTransactionsAndEachConfirmation409Response.discriminator = undefined;
    NewConfirmedCoinsTransactionsAndEachConfirmation409Response.attributeTypeMap = [
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
            "type": "NewConfirmedCoinsTransactionsAndEachConfirmationE409"
        }
    ];
    return NewConfirmedCoinsTransactionsAndEachConfirmation409Response;
}());
exports.NewConfirmedCoinsTransactionsAndEachConfirmation409Response = NewConfirmedCoinsTransactionsAndEachConfirmation409Response;
//# sourceMappingURL=newConfirmedCoinsTransactionsAndEachConfirmation409Response.js.map