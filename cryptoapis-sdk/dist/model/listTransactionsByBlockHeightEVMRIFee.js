"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightEVMRIFee = void 0;
var ListTransactionsByBlockHeightEVMRIFee = (function () {
    function ListTransactionsByBlockHeightEVMRIFee() {
    }
    ListTransactionsByBlockHeightEVMRIFee.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightEVMRIFee.attributeTypeMap;
    };
    ListTransactionsByBlockHeightEVMRIFee.discriminator = undefined;
    ListTransactionsByBlockHeightEVMRIFee.attributeTypeMap = [
        {
            "name": "amount",
            "baseName": "amount",
            "type": "string"
        },
        {
            "name": "unit",
            "baseName": "unit",
            "type": "string"
        }
    ];
    return ListTransactionsByBlockHeightEVMRIFee;
}());
exports.ListTransactionsByBlockHeightEVMRIFee = ListTransactionsByBlockHeightEVMRIFee;
//# sourceMappingURL=listTransactionsByBlockHeightEVMRIFee.js.map