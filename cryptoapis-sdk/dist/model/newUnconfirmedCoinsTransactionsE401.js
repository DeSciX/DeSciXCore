"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewUnconfirmedCoinsTransactionsE401 = void 0;
var NewUnconfirmedCoinsTransactionsE401 = (function () {
    function NewUnconfirmedCoinsTransactionsE401() {
    }
    NewUnconfirmedCoinsTransactionsE401.getAttributeTypeMap = function () {
        return NewUnconfirmedCoinsTransactionsE401.attributeTypeMap;
    };
    NewUnconfirmedCoinsTransactionsE401.discriminator = undefined;
    NewUnconfirmedCoinsTransactionsE401.attributeTypeMap = [
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
    return NewUnconfirmedCoinsTransactionsE401;
}());
exports.NewUnconfirmedCoinsTransactionsE401 = NewUnconfirmedCoinsTransactionsE401;
//# sourceMappingURL=newUnconfirmedCoinsTransactionsE401.js.map