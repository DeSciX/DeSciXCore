"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressStatisticsEVMRI = void 0;
var GetAddressStatisticsEVMRI = (function () {
    function GetAddressStatisticsEVMRI() {
    }
    GetAddressStatisticsEVMRI.getAttributeTypeMap = function () {
        return GetAddressStatisticsEVMRI.attributeTypeMap;
    };
    GetAddressStatisticsEVMRI.discriminator = undefined;
    GetAddressStatisticsEVMRI.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "blockHeight",
            "baseName": "blockHeight",
            "type": "number"
        },
        {
            "name": "blockTimestamp",
            "baseName": "blockTimestamp",
            "type": "number"
        },
        {
            "name": "internalTransactionsCounts",
            "baseName": "internalTransactionsCounts",
            "type": "GetAddressStatisticsEVMRIInternalTransactionsCounts"
        },
        {
            "name": "nativeTransactionsCounts",
            "baseName": "nativeTransactionsCounts",
            "type": "GetAddressStatisticsEVMRINativeTransactionsCounts"
        },
        {
            "name": "tokenTransfersCounts",
            "baseName": "tokenTransfersCounts",
            "type": "GetAddressStatisticsEVMRITokenTransfersCounts"
        }
    ];
    return GetAddressStatisticsEVMRI;
}());
exports.GetAddressStatisticsEVMRI = GetAddressStatisticsEVMRI;
//# sourceMappingURL=getAddressStatisticsEVMRI.js.map