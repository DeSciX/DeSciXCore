"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressUTXOHistoricalE403 = void 0;
var ListConfirmedTransactionsByAddressUTXOHistoricalE403 = (function () {
    function ListConfirmedTransactionsByAddressUTXOHistoricalE403() {
    }
    ListConfirmedTransactionsByAddressUTXOHistoricalE403.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressUTXOHistoricalE403.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressUTXOHistoricalE403.discriminator = undefined;
    ListConfirmedTransactionsByAddressUTXOHistoricalE403.attributeTypeMap = [
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
    return ListConfirmedTransactionsByAddressUTXOHistoricalE403;
}());
exports.ListConfirmedTransactionsByAddressUTXOHistoricalE403 = ListConfirmedTransactionsByAddressUTXOHistoricalE403;
//# sourceMappingURL=listConfirmedTransactionsByAddressUTXOHistoricalE403.js.map