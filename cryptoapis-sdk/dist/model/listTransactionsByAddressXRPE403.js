"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByAddressXRPE403 = void 0;
var ListTransactionsByAddressXRPE403 = (function () {
    function ListTransactionsByAddressXRPE403() {
    }
    ListTransactionsByAddressXRPE403.getAttributeTypeMap = function () {
        return ListTransactionsByAddressXRPE403.attributeTypeMap;
    };
    ListTransactionsByAddressXRPE403.discriminator = undefined;
    ListTransactionsByAddressXRPE403.attributeTypeMap = [
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
    return ListTransactionsByAddressXRPE403;
}());
exports.ListTransactionsByAddressXRPE403 = ListTransactionsByAddressXRPE403;
//# sourceMappingURL=listTransactionsByAddressXRPE403.js.map