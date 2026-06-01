"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE403 = void 0;
var ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE403 = (function () {
    function ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE403() {
    }
    ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE403.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE403.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE403.discriminator = undefined;
    ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE403.attributeTypeMap = [
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
    return ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE403;
}());
exports.ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE403 = ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE403;
//# sourceMappingURL=listConfirmedTransactionsByAddressByTimestampUTXOHistoricalE403.js.map