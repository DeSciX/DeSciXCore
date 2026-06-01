"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE401 = void 0;
var ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE401 = (function () {
    function ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE401() {
    }
    ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE401.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE401.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE401.discriminator = undefined;
    ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE401.attributeTypeMap = [
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
    return ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE401;
}());
exports.ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE401 = ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE401;
//# sourceMappingURL=listConfirmedTransactionsByAddressByTimestampUTXOHistoricalE401.js.map