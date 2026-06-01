"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedCoinsTransactionsE403 = void 0;
var NewConfirmedCoinsTransactionsE403 = (function () {
    function NewConfirmedCoinsTransactionsE403() {
    }
    NewConfirmedCoinsTransactionsE403.getAttributeTypeMap = function () {
        return NewConfirmedCoinsTransactionsE403.attributeTypeMap;
    };
    NewConfirmedCoinsTransactionsE403.discriminator = undefined;
    NewConfirmedCoinsTransactionsE403.attributeTypeMap = [
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
    return NewConfirmedCoinsTransactionsE403;
}());
exports.NewConfirmedCoinsTransactionsE403 = NewConfirmedCoinsTransactionsE403;
//# sourceMappingURL=newConfirmedCoinsTransactionsE403.js.map