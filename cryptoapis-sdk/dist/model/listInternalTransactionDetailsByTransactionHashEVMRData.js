"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListInternalTransactionDetailsByTransactionHashEVMRData = void 0;
var ListInternalTransactionDetailsByTransactionHashEVMRData = (function () {
    function ListInternalTransactionDetailsByTransactionHashEVMRData() {
    }
    ListInternalTransactionDetailsByTransactionHashEVMRData.getAttributeTypeMap = function () {
        return ListInternalTransactionDetailsByTransactionHashEVMRData.attributeTypeMap;
    };
    ListInternalTransactionDetailsByTransactionHashEVMRData.discriminator = undefined;
    ListInternalTransactionDetailsByTransactionHashEVMRData.attributeTypeMap = [
        {
            "name": "limit",
            "baseName": "limit",
            "type": "number"
        },
        {
            "name": "offset",
            "baseName": "offset",
            "type": "number"
        },
        {
            "name": "total",
            "baseName": "total",
            "type": "number"
        },
        {
            "name": "items",
            "baseName": "items",
            "type": "Array<ListInternalTransactionDetailsByTransactionHashEVMRI>"
        }
    ];
    return ListInternalTransactionDetailsByTransactionHashEVMRData;
}());
exports.ListInternalTransactionDetailsByTransactionHashEVMRData = ListInternalTransactionDetailsByTransactionHashEVMRData;
//# sourceMappingURL=listInternalTransactionDetailsByTransactionHashEVMRData.js.map