"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashEVMRIValue = void 0;
var ListTransactionsByBlockHashEVMRIValue = (function () {
    function ListTransactionsByBlockHashEVMRIValue() {
    }
    ListTransactionsByBlockHashEVMRIValue.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashEVMRIValue.attributeTypeMap;
    };
    ListTransactionsByBlockHashEVMRIValue.discriminator = undefined;
    ListTransactionsByBlockHashEVMRIValue.attributeTypeMap = [
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
    return ListTransactionsByBlockHashEVMRIValue;
}());
exports.ListTransactionsByBlockHashEVMRIValue = ListTransactionsByBlockHashEVMRIValue;
//# sourceMappingURL=listTransactionsByBlockHashEVMRIValue.js.map