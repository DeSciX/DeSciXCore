"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLogsByTransactionHashEVME403 = void 0;
var ListLogsByTransactionHashEVME403 = (function () {
    function ListLogsByTransactionHashEVME403() {
    }
    ListLogsByTransactionHashEVME403.getAttributeTypeMap = function () {
        return ListLogsByTransactionHashEVME403.attributeTypeMap;
    };
    ListLogsByTransactionHashEVME403.discriminator = undefined;
    ListLogsByTransactionHashEVME403.attributeTypeMap = [
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
    return ListLogsByTransactionHashEVME403;
}());
exports.ListLogsByTransactionHashEVME403 = ListLogsByTransactionHashEVME403;
//# sourceMappingURL=listLogsByTransactionHashEVME403.js.map