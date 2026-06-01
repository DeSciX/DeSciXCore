"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedCoinsTransactionsE401 = void 0;
var NewConfirmedCoinsTransactionsE401 = (function () {
    function NewConfirmedCoinsTransactionsE401() {
    }
    NewConfirmedCoinsTransactionsE401.getAttributeTypeMap = function () {
        return NewConfirmedCoinsTransactionsE401.attributeTypeMap;
    };
    NewConfirmedCoinsTransactionsE401.discriminator = undefined;
    NewConfirmedCoinsTransactionsE401.attributeTypeMap = [
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
    return NewConfirmedCoinsTransactionsE401;
}());
exports.NewConfirmedCoinsTransactionsE401 = NewConfirmedCoinsTransactionsE401;
//# sourceMappingURL=newConfirmedCoinsTransactionsE401.js.map