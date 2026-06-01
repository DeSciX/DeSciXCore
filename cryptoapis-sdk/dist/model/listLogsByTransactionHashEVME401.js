"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLogsByTransactionHashEVME401 = void 0;
var ListLogsByTransactionHashEVME401 = (function () {
    function ListLogsByTransactionHashEVME401() {
    }
    ListLogsByTransactionHashEVME401.getAttributeTypeMap = function () {
        return ListLogsByTransactionHashEVME401.attributeTypeMap;
    };
    ListLogsByTransactionHashEVME401.discriminator = undefined;
    ListLogsByTransactionHashEVME401.attributeTypeMap = [
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
    return ListLogsByTransactionHashEVME401;
}());
exports.ListLogsByTransactionHashEVME401 = ListLogsByTransactionHashEVME401;
//# sourceMappingURL=listLogsByTransactionHashEVME401.js.map