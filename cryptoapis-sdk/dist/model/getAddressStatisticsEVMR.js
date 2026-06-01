"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressStatisticsEVMR = void 0;
var GetAddressStatisticsEVMR = (function () {
    function GetAddressStatisticsEVMR() {
    }
    GetAddressStatisticsEVMR.getAttributeTypeMap = function () {
        return GetAddressStatisticsEVMR.attributeTypeMap;
    };
    GetAddressStatisticsEVMR.discriminator = undefined;
    GetAddressStatisticsEVMR.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "GetAddressStatisticsEVMRData"
        }
    ];
    return GetAddressStatisticsEVMR;
}());
exports.GetAddressStatisticsEVMR = GetAddressStatisticsEVMR;
//# sourceMappingURL=getAddressStatisticsEVMR.js.map