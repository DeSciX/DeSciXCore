"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedInternalTransactions401Response = void 0;
var NewConfirmedInternalTransactions401Response = (function () {
    function NewConfirmedInternalTransactions401Response() {
    }
    NewConfirmedInternalTransactions401Response.getAttributeTypeMap = function () {
        return NewConfirmedInternalTransactions401Response.attributeTypeMap;
    };
    NewConfirmedInternalTransactions401Response.discriminator = undefined;
    NewConfirmedInternalTransactions401Response.attributeTypeMap = [
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
            "type": "NewConfirmedInternalTransactionsE401"
        }
    ];
    return NewConfirmedInternalTransactions401Response;
}());
exports.NewConfirmedInternalTransactions401Response = NewConfirmedInternalTransactions401Response;
//# sourceMappingURL=newConfirmedInternalTransactions401Response.js.map