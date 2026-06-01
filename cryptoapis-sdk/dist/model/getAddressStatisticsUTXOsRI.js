"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressStatisticsUTXOsRI = void 0;
var GetAddressStatisticsUTXOsRI = (function () {
    function GetAddressStatisticsUTXOsRI() {
    }
    GetAddressStatisticsUTXOsRI.getAttributeTypeMap = function () {
        return GetAddressStatisticsUTXOsRI.attributeTypeMap;
    };
    GetAddressStatisticsUTXOsRI.discriminator = undefined;
    GetAddressStatisticsUTXOsRI.attributeTypeMap = [
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
            "name": "transactionCounts",
            "baseName": "transactionCounts",
            "type": "GetAddressStatisticsUTXOsRITransactionCounts"
        }
    ];
    return GetAddressStatisticsUTXOsRI;
}());
exports.GetAddressStatisticsUTXOsRI = GetAddressStatisticsUTXOsRI;
//# sourceMappingURL=getAddressStatisticsUTXOsRI.js.map