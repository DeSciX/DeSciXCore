"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedInternalTransactionsAndEachConfirmation401Response = void 0;
var NewConfirmedInternalTransactionsAndEachConfirmation401Response = (function () {
    function NewConfirmedInternalTransactionsAndEachConfirmation401Response() {
    }
    NewConfirmedInternalTransactionsAndEachConfirmation401Response.getAttributeTypeMap = function () {
        return NewConfirmedInternalTransactionsAndEachConfirmation401Response.attributeTypeMap;
    };
    NewConfirmedInternalTransactionsAndEachConfirmation401Response.discriminator = undefined;
    NewConfirmedInternalTransactionsAndEachConfirmation401Response.attributeTypeMap = [
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
            "type": "NewConfirmedInternalTransactionsAndEachConfirmationE401"
        }
    ];
    return NewConfirmedInternalTransactionsAndEachConfirmation401Response;
}());
exports.NewConfirmedInternalTransactionsAndEachConfirmation401Response = NewConfirmedInternalTransactionsAndEachConfirmation401Response;
//# sourceMappingURL=newConfirmedInternalTransactionsAndEachConfirmation401Response.js.map