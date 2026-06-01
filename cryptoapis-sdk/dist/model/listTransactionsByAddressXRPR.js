"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByAddressXRPR = void 0;
var ListTransactionsByAddressXRPR = (function () {
    function ListTransactionsByAddressXRPR() {
    }
    ListTransactionsByAddressXRPR.getAttributeTypeMap = function () {
        return ListTransactionsByAddressXRPR.attributeTypeMap;
    };
    ListTransactionsByAddressXRPR.discriminator = undefined;
    ListTransactionsByAddressXRPR.attributeTypeMap = [
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
            "type": "ListTransactionsByAddressXRPRData"
        }
    ];
    return ListTransactionsByAddressXRPR;
}());
exports.ListTransactionsByAddressXRPR = ListTransactionsByAddressXRPR;
//# sourceMappingURL=listTransactionsByAddressXRPR.js.map