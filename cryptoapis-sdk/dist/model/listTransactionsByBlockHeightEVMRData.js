"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightEVMRData = void 0;
var ListTransactionsByBlockHeightEVMRData = (function () {
    function ListTransactionsByBlockHeightEVMRData() {
    }
    ListTransactionsByBlockHeightEVMRData.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightEVMRData.attributeTypeMap;
    };
    ListTransactionsByBlockHeightEVMRData.discriminator = undefined;
    ListTransactionsByBlockHeightEVMRData.attributeTypeMap = [
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
            "type": "Array<ListTransactionsByBlockHeightEVMRI>"
        }
    ];
    return ListTransactionsByBlockHeightEVMRData;
}());
exports.ListTransactionsByBlockHeightEVMRData = ListTransactionsByBlockHeightEVMRData;
//# sourceMappingURL=listTransactionsByBlockHeightEVMRData.js.map