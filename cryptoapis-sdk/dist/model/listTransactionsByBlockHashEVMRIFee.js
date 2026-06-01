"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashEVMRIFee = void 0;
var ListTransactionsByBlockHashEVMRIFee = (function () {
    function ListTransactionsByBlockHashEVMRIFee() {
    }
    ListTransactionsByBlockHashEVMRIFee.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashEVMRIFee.attributeTypeMap;
    };
    ListTransactionsByBlockHashEVMRIFee.discriminator = undefined;
    ListTransactionsByBlockHashEVMRIFee.attributeTypeMap = [
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
    return ListTransactionsByBlockHashEVMRIFee;
}());
exports.ListTransactionsByBlockHashEVMRIFee = ListTransactionsByBlockHashEVMRIFee;
//# sourceMappingURL=listTransactionsByBlockHashEVMRIFee.js.map