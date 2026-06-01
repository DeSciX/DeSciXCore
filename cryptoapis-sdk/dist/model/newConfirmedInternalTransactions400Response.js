"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedInternalTransactions400Response = void 0;
var NewConfirmedInternalTransactions400Response = (function () {
    function NewConfirmedInternalTransactions400Response() {
    }
    NewConfirmedInternalTransactions400Response.getAttributeTypeMap = function () {
        return NewConfirmedInternalTransactions400Response.attributeTypeMap;
    };
    NewConfirmedInternalTransactions400Response.discriminator = undefined;
    NewConfirmedInternalTransactions400Response.attributeTypeMap = [
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
            "type": "NewConfirmedInternalTransactionsE400"
        }
    ];
    return NewConfirmedInternalTransactions400Response;
}());
exports.NewConfirmedInternalTransactions400Response = NewConfirmedInternalTransactions400Response;
//# sourceMappingURL=newConfirmedInternalTransactions400Response.js.map