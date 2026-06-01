"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressStatisticsUTXOsRITransactionCounts = void 0;
var GetAddressStatisticsUTXOsRITransactionCounts = (function () {
    function GetAddressStatisticsUTXOsRITransactionCounts() {
    }
    GetAddressStatisticsUTXOsRITransactionCounts.getAttributeTypeMap = function () {
        return GetAddressStatisticsUTXOsRITransactionCounts.attributeTypeMap;
    };
    GetAddressStatisticsUTXOsRITransactionCounts.discriminator = undefined;
    GetAddressStatisticsUTXOsRITransactionCounts.attributeTypeMap = [
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
    return GetAddressStatisticsUTXOsRITransactionCounts;
}());
exports.GetAddressStatisticsUTXOsRITransactionCounts = GetAddressStatisticsUTXOsRITransactionCounts;
//# sourceMappingURL=getAddressStatisticsUTXOsRITransactionCounts.js.map