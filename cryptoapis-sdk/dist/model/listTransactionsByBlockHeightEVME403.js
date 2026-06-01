"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightEVME403 = void 0;
var ListTransactionsByBlockHeightEVME403 = (function () {
    function ListTransactionsByBlockHeightEVME403() {
    }
    ListTransactionsByBlockHeightEVME403.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightEVME403.attributeTypeMap;
    };
    ListTransactionsByBlockHeightEVME403.discriminator = undefined;
    ListTransactionsByBlockHeightEVME403.attributeTypeMap = [
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
    return ListTransactionsByBlockHeightEVME403;
}());
exports.ListTransactionsByBlockHeightEVME403 = ListTransactionsByBlockHeightEVME403;
//# sourceMappingURL=listTransactionsByBlockHeightEVME403.js.map