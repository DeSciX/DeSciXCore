"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashEVMRIGasPrice = void 0;
var ListTransactionsByBlockHashEVMRIGasPrice = (function () {
    function ListTransactionsByBlockHashEVMRIGasPrice() {
    }
    ListTransactionsByBlockHashEVMRIGasPrice.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashEVMRIGasPrice.attributeTypeMap;
    };
    ListTransactionsByBlockHashEVMRIGasPrice.discriminator = undefined;
    ListTransactionsByBlockHashEVMRIGasPrice.attributeTypeMap = [
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
    return ListTransactionsByBlockHashEVMRIGasPrice;
}());
exports.ListTransactionsByBlockHashEVMRIGasPrice = ListTransactionsByBlockHashEVMRIGasPrice;
//# sourceMappingURL=listTransactionsByBlockHashEVMRIGasPrice.js.map