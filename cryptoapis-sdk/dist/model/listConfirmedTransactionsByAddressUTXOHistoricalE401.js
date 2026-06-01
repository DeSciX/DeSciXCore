"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressUTXOHistoricalE401 = void 0;
var ListConfirmedTransactionsByAddressUTXOHistoricalE401 = (function () {
    function ListConfirmedTransactionsByAddressUTXOHistoricalE401() {
    }
    ListConfirmedTransactionsByAddressUTXOHistoricalE401.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressUTXOHistoricalE401.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressUTXOHistoricalE401.discriminator = undefined;
    ListConfirmedTransactionsByAddressUTXOHistoricalE401.attributeTypeMap = [
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
    return ListConfirmedTransactionsByAddressUTXOHistoricalE401;
}());
exports.ListConfirmedTransactionsByAddressUTXOHistoricalE401 = ListConfirmedTransactionsByAddressUTXOHistoricalE401;
//# sourceMappingURL=listConfirmedTransactionsByAddressUTXOHistoricalE401.js.map