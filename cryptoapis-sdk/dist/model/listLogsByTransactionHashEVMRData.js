"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLogsByTransactionHashEVMRData = void 0;
var ListLogsByTransactionHashEVMRData = (function () {
    function ListLogsByTransactionHashEVMRData() {
    }
    ListLogsByTransactionHashEVMRData.getAttributeTypeMap = function () {
        return ListLogsByTransactionHashEVMRData.attributeTypeMap;
    };
    ListLogsByTransactionHashEVMRData.discriminator = undefined;
    ListLogsByTransactionHashEVMRData.attributeTypeMap = [
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
            "type": "Array<ListLogsByTransactionHashEVMRI>"
        }
    ];
    return ListLogsByTransactionHashEVMRData;
}());
exports.ListLogsByTransactionHashEVMRData = ListLogsByTransactionHashEVMRData;
//# sourceMappingURL=listLogsByTransactionHashEVMRData.js.map