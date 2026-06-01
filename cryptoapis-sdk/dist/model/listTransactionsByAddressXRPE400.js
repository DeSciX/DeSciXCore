"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByAddressXRPE400 = void 0;
var ListTransactionsByAddressXRPE400 = (function () {
    function ListTransactionsByAddressXRPE400() {
    }
    ListTransactionsByAddressXRPE400.getAttributeTypeMap = function () {
        return ListTransactionsByAddressXRPE400.attributeTypeMap;
    };
    ListTransactionsByAddressXRPE400.discriminator = undefined;
    ListTransactionsByAddressXRPE400.attributeTypeMap = [
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
    return ListTransactionsByAddressXRPE400;
}());
exports.ListTransactionsByAddressXRPE400 = ListTransactionsByAddressXRPE400;
//# sourceMappingURL=listTransactionsByAddressXRPE400.js.map