"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByAddressXRPE401 = void 0;
var ListTransactionsByAddressXRPE401 = (function () {
    function ListTransactionsByAddressXRPE401() {
    }
    ListTransactionsByAddressXRPE401.getAttributeTypeMap = function () {
        return ListTransactionsByAddressXRPE401.attributeTypeMap;
    };
    ListTransactionsByAddressXRPE401.discriminator = undefined;
    ListTransactionsByAddressXRPE401.attributeTypeMap = [
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
    return ListTransactionsByAddressXRPE401;
}());
exports.ListTransactionsByAddressXRPE401 = ListTransactionsByAddressXRPE401;
//# sourceMappingURL=listTransactionsByAddressXRPE401.js.map