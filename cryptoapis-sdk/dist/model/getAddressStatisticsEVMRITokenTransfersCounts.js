"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressStatisticsEVMRITokenTransfersCounts = void 0;
var GetAddressStatisticsEVMRITokenTransfersCounts = (function () {
    function GetAddressStatisticsEVMRITokenTransfersCounts() {
    }
    GetAddressStatisticsEVMRITokenTransfersCounts.getAttributeTypeMap = function () {
        return GetAddressStatisticsEVMRITokenTransfersCounts.attributeTypeMap;
    };
    GetAddressStatisticsEVMRITokenTransfersCounts.discriminator = undefined;
    GetAddressStatisticsEVMRITokenTransfersCounts.attributeTypeMap = [
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
    return GetAddressStatisticsEVMRITokenTransfersCounts;
}());
exports.GetAddressStatisticsEVMRITokenTransfersCounts = GetAddressStatisticsEVMRITokenTransfersCounts;
//# sourceMappingURL=getAddressStatisticsEVMRITokenTransfersCounts.js.map