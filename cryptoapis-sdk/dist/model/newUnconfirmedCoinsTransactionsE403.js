"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewUnconfirmedCoinsTransactionsE403 = void 0;
var NewUnconfirmedCoinsTransactionsE403 = (function () {
    function NewUnconfirmedCoinsTransactionsE403() {
    }
    NewUnconfirmedCoinsTransactionsE403.getAttributeTypeMap = function () {
        return NewUnconfirmedCoinsTransactionsE403.attributeTypeMap;
    };
    NewUnconfirmedCoinsTransactionsE403.discriminator = undefined;
    NewUnconfirmedCoinsTransactionsE403.attributeTypeMap = [
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
    return NewUnconfirmedCoinsTransactionsE403;
}());
exports.NewUnconfirmedCoinsTransactionsE403 = NewUnconfirmedCoinsTransactionsE403;
//# sourceMappingURL=newUnconfirmedCoinsTransactionsE403.js.map