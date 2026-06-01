"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightEVMR = void 0;
var ListTransactionsByBlockHeightEVMR = (function () {
    function ListTransactionsByBlockHeightEVMR() {
    }
    ListTransactionsByBlockHeightEVMR.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightEVMR.attributeTypeMap;
    };
    ListTransactionsByBlockHeightEVMR.discriminator = undefined;
    ListTransactionsByBlockHeightEVMR.attributeTypeMap = [
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
            "type": "ListTransactionsByBlockHeightEVMRData"
        }
    ];
    return ListTransactionsByBlockHeightEVMR;
}());
exports.ListTransactionsByBlockHeightEVMR = ListTransactionsByBlockHeightEVMR;
//# sourceMappingURL=listTransactionsByBlockHeightEVMR.js.map