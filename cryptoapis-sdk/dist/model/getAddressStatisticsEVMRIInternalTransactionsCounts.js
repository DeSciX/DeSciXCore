"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressStatisticsEVMRIInternalTransactionsCounts = void 0;
var GetAddressStatisticsEVMRIInternalTransactionsCounts = (function () {
    function GetAddressStatisticsEVMRIInternalTransactionsCounts() {
    }
    GetAddressStatisticsEVMRIInternalTransactionsCounts.getAttributeTypeMap = function () {
        return GetAddressStatisticsEVMRIInternalTransactionsCounts.attributeTypeMap;
    };
    GetAddressStatisticsEVMRIInternalTransactionsCounts.discriminator = undefined;
    GetAddressStatisticsEVMRIInternalTransactionsCounts.attributeTypeMap = [
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
    return GetAddressStatisticsEVMRIInternalTransactionsCounts;
}());
exports.GetAddressStatisticsEVMRIInternalTransactionsCounts = GetAddressStatisticsEVMRIInternalTransactionsCounts;
//# sourceMappingURL=getAddressStatisticsEVMRIInternalTransactionsCounts.js.map