"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE400 = void 0;
var ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE400 = (function () {
    function ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE400() {
    }
    ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE400.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE400.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE400.discriminator = undefined;
    ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE400.attributeTypeMap = [
        {
            "name": "code",
            "baseName": "code",
            "type": "string"
        },
        {
            "name": "message",
            "baseName": "message",
            "type": "string"
        },
        {
            "name": "details",
            "baseName": "details",
            "type": "Array<BannedIpAddressDetailsInner>"
        }
    ];
    return ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE400;
}());
exports.ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE400 = ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE400;
//# sourceMappingURL=listConfirmedTransactionsByAddressByTimestampUTXOHistoricalE400.js.map