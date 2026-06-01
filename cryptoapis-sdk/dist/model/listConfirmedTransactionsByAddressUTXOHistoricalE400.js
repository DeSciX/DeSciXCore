"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressUTXOHistoricalE400 = void 0;
var ListConfirmedTransactionsByAddressUTXOHistoricalE400 = (function () {
    function ListConfirmedTransactionsByAddressUTXOHistoricalE400() {
    }
    ListConfirmedTransactionsByAddressUTXOHistoricalE400.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressUTXOHistoricalE400.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressUTXOHistoricalE400.discriminator = undefined;
    ListConfirmedTransactionsByAddressUTXOHistoricalE400.attributeTypeMap = [
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
    return ListConfirmedTransactionsByAddressUTXOHistoricalE400;
}());
exports.ListConfirmedTransactionsByAddressUTXOHistoricalE400 = ListConfirmedTransactionsByAddressUTXOHistoricalE400;
//# sourceMappingURL=listConfirmedTransactionsByAddressUTXOHistoricalE400.js.map