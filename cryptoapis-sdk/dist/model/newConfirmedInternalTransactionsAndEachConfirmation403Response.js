"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedInternalTransactionsAndEachConfirmation403Response = void 0;
var NewConfirmedInternalTransactionsAndEachConfirmation403Response = (function () {
    function NewConfirmedInternalTransactionsAndEachConfirmation403Response() {
    }
    NewConfirmedInternalTransactionsAndEachConfirmation403Response.getAttributeTypeMap = function () {
        return NewConfirmedInternalTransactionsAndEachConfirmation403Response.attributeTypeMap;
    };
    NewConfirmedInternalTransactionsAndEachConfirmation403Response.discriminator = undefined;
    NewConfirmedInternalTransactionsAndEachConfirmation403Response.attributeTypeMap = [
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
            "type": "NewConfirmedInternalTransactionsAndEachConfirmationE403"
        }
    ];
    return NewConfirmedInternalTransactionsAndEachConfirmation403Response;
}());
exports.NewConfirmedInternalTransactionsAndEachConfirmation403Response = NewConfirmedInternalTransactionsAndEachConfirmation403Response;
//# sourceMappingURL=newConfirmedInternalTransactionsAndEachConfirmation403Response.js.map