"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressStatisticsEVMRINativeTransactionsCounts = void 0;
var GetAddressStatisticsEVMRINativeTransactionsCounts = (function () {
    function GetAddressStatisticsEVMRINativeTransactionsCounts() {
    }
    GetAddressStatisticsEVMRINativeTransactionsCounts.getAttributeTypeMap = function () {
        return GetAddressStatisticsEVMRINativeTransactionsCounts.attributeTypeMap;
    };
    GetAddressStatisticsEVMRINativeTransactionsCounts.discriminator = undefined;
    GetAddressStatisticsEVMRINativeTransactionsCounts.attributeTypeMap = [
        {
            "name": "incoming",
            "baseName": "incoming",
            "type": "number"
        },
        {
            "name": "outgoing",
            "baseName": "outgoing",
            "type": "number"
        }
    ];
    return GetAddressStatisticsEVMRINativeTransactionsCounts;
}());
exports.GetAddressStatisticsEVMRINativeTransactionsCounts = GetAddressStatisticsEVMRINativeTransactionsCounts;
//# sourceMappingURL=getAddressStatisticsEVMRINativeTransactionsCounts.js.map