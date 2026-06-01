"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightEVMRIBlockchainSpecific = void 0;
var ListTransactionsByBlockHeightEVMRIBlockchainSpecific = (function () {
    function ListTransactionsByBlockHeightEVMRIBlockchainSpecific() {
    }
    ListTransactionsByBlockHeightEVMRIBlockchainSpecific.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightEVMRIBlockchainSpecific.attributeTypeMap;
    };
    ListTransactionsByBlockHeightEVMRIBlockchainSpecific.discriminator = undefined;
    ListTransactionsByBlockHeightEVMRIBlockchainSpecific.attributeTypeMap = [
        {
            "name": "bandwidth",
            "baseName": "bandwidth",
            "type": "number"
        },
        {
            "name": "energy",
            "baseName": "energy",
            "type": "number"
        }
    ];
    return ListTransactionsByBlockHeightEVMRIBlockchainSpecific;
}());
exports.ListTransactionsByBlockHeightEVMRIBlockchainSpecific = ListTransactionsByBlockHeightEVMRIBlockchainSpecific;
//# sourceMappingURL=listTransactionsByBlockHeightEVMRIBlockchainSpecific.js.map