"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLogsByTransactionHashEVMR = void 0;
var ListLogsByTransactionHashEVMR = (function () {
    function ListLogsByTransactionHashEVMR() {
    }
    ListLogsByTransactionHashEVMR.getAttributeTypeMap = function () {
        return ListLogsByTransactionHashEVMR.attributeTypeMap;
    };
    ListLogsByTransactionHashEVMR.discriminator = undefined;
    ListLogsByTransactionHashEVMR.attributeTypeMap = [
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
            "type": "ListLogsByTransactionHashEVMRData"
        }
    ];
    return ListLogsByTransactionHashEVMR;
}());
exports.ListLogsByTransactionHashEVMR = ListLogsByTransactionHashEVMR;
//# sourceMappingURL=listLogsByTransactionHashEVMR.js.map