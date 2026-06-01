"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashEVMR = void 0;
var ListTransactionsByBlockHashEVMR = (function () {
    function ListTransactionsByBlockHashEVMR() {
    }
    ListTransactionsByBlockHashEVMR.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashEVMR.attributeTypeMap;
    };
    ListTransactionsByBlockHashEVMR.discriminator = undefined;
    ListTransactionsByBlockHashEVMR.attributeTypeMap = [
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
            "type": "ListTransactionsByBlockHashEVMRData"
        }
    ];
    return ListTransactionsByBlockHashEVMR;
}());
exports.ListTransactionsByBlockHashEVMR = ListTransactionsByBlockHashEVMR;
//# sourceMappingURL=listTransactionsByBlockHashEVMR.js.map