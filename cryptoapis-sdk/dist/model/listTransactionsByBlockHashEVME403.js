"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashEVME403 = void 0;
var ListTransactionsByBlockHashEVME403 = (function () {
    function ListTransactionsByBlockHashEVME403() {
    }
    ListTransactionsByBlockHashEVME403.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashEVME403.attributeTypeMap;
    };
    ListTransactionsByBlockHashEVME403.discriminator = undefined;
    ListTransactionsByBlockHashEVME403.attributeTypeMap = [
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
    return ListTransactionsByBlockHashEVME403;
}());
exports.ListTransactionsByBlockHashEVME403 = ListTransactionsByBlockHashEVME403;
//# sourceMappingURL=listTransactionsByBlockHashEVME403.js.map