"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedCoinsTransactionsAndEachConfirmation403Response = void 0;
var NewConfirmedCoinsTransactionsAndEachConfirmation403Response = (function () {
    function NewConfirmedCoinsTransactionsAndEachConfirmation403Response() {
    }
    NewConfirmedCoinsTransactionsAndEachConfirmation403Response.getAttributeTypeMap = function () {
        return NewConfirmedCoinsTransactionsAndEachConfirmation403Response.attributeTypeMap;
    };
    NewConfirmedCoinsTransactionsAndEachConfirmation403Response.discriminator = undefined;
    NewConfirmedCoinsTransactionsAndEachConfirmation403Response.attributeTypeMap = [
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
            "type": "NewConfirmedCoinsTransactionsAndEachConfirmationE403"
        }
    ];
    return NewConfirmedCoinsTransactionsAndEachConfirmation403Response;
}());
exports.NewConfirmedCoinsTransactionsAndEachConfirmation403Response = NewConfirmedCoinsTransactionsAndEachConfirmation403Response;
//# sourceMappingURL=newConfirmedCoinsTransactionsAndEachConfirmation403Response.js.map