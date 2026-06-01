"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedTokensTransactionsE401 = void 0;
var NewConfirmedTokensTransactionsE401 = (function () {
    function NewConfirmedTokensTransactionsE401() {
    }
    NewConfirmedTokensTransactionsE401.getAttributeTypeMap = function () {
        return NewConfirmedTokensTransactionsE401.attributeTypeMap;
    };
    NewConfirmedTokensTransactionsE401.discriminator = undefined;
    NewConfirmedTokensTransactionsE401.attributeTypeMap = [
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
    return NewConfirmedTokensTransactionsE401;
}());
exports.NewConfirmedTokensTransactionsE401 = NewConfirmedTokensTransactionsE401;
//# sourceMappingURL=newConfirmedTokensTransactionsE401.js.map