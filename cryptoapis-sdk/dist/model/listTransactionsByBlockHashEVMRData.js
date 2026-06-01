"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashEVMRData = void 0;
var ListTransactionsByBlockHashEVMRData = (function () {
    function ListTransactionsByBlockHashEVMRData() {
    }
    ListTransactionsByBlockHashEVMRData.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashEVMRData.attributeTypeMap;
    };
    ListTransactionsByBlockHashEVMRData.discriminator = undefined;
    ListTransactionsByBlockHashEVMRData.attributeTypeMap = [
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
            "type": "Array<ListTransactionsByBlockHashEVMRI>"
        }
    ];
    return ListTransactionsByBlockHashEVMRData;
}());
exports.ListTransactionsByBlockHashEVMRData = ListTransactionsByBlockHashEVMRData;
//# sourceMappingURL=listTransactionsByBlockHashEVMRData.js.map