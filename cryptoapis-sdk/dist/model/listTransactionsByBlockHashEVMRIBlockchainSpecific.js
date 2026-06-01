"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashEVMRIBlockchainSpecific = void 0;
var ListTransactionsByBlockHashEVMRIBlockchainSpecific = (function () {
    function ListTransactionsByBlockHashEVMRIBlockchainSpecific() {
    }
    ListTransactionsByBlockHashEVMRIBlockchainSpecific.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashEVMRIBlockchainSpecific.attributeTypeMap;
    };
    ListTransactionsByBlockHashEVMRIBlockchainSpecific.discriminator = undefined;
    ListTransactionsByBlockHashEVMRIBlockchainSpecific.attributeTypeMap = [
        {
            "name": "bandwidth",
            "baseName": "bandwidth",
            "type": "string"
        },
        {
            "name": "energy",
            "baseName": "energy",
            "type": "number"
        }
    ];
    return ListTransactionsByBlockHashEVMRIBlockchainSpecific;
}());
exports.ListTransactionsByBlockHashEVMRIBlockchainSpecific = ListTransactionsByBlockHashEVMRIBlockchainSpecific;
//# sourceMappingURL=listTransactionsByBlockHashEVMRIBlockchainSpecific.js.map