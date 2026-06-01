"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedInternalTransactionsE403 = void 0;
var NewConfirmedInternalTransactionsE403 = (function () {
    function NewConfirmedInternalTransactionsE403() {
    }
    NewConfirmedInternalTransactionsE403.getAttributeTypeMap = function () {
        return NewConfirmedInternalTransactionsE403.attributeTypeMap;
    };
    NewConfirmedInternalTransactionsE403.discriminator = undefined;
    NewConfirmedInternalTransactionsE403.attributeTypeMap = [
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
    return NewConfirmedInternalTransactionsE403;
}());
exports.NewConfirmedInternalTransactionsE403 = NewConfirmedInternalTransactionsE403;
//# sourceMappingURL=newConfirmedInternalTransactionsE403.js.map