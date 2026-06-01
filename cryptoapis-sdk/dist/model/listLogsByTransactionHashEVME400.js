"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLogsByTransactionHashEVME400 = void 0;
var ListLogsByTransactionHashEVME400 = (function () {
    function ListLogsByTransactionHashEVME400() {
    }
    ListLogsByTransactionHashEVME400.getAttributeTypeMap = function () {
        return ListLogsByTransactionHashEVME400.attributeTypeMap;
    };
    ListLogsByTransactionHashEVME400.discriminator = undefined;
    ListLogsByTransactionHashEVME400.attributeTypeMap = [
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
    return ListLogsByTransactionHashEVME400;
}());
exports.ListLogsByTransactionHashEVME400 = ListLogsByTransactionHashEVME400;
//# sourceMappingURL=listLogsByTransactionHashEVME400.js.map