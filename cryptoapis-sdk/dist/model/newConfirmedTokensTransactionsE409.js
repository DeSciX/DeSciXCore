"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedTokensTransactionsE409 = void 0;
var NewConfirmedTokensTransactionsE409 = (function () {
    function NewConfirmedTokensTransactionsE409() {
    }
    NewConfirmedTokensTransactionsE409.getAttributeTypeMap = function () {
        return NewConfirmedTokensTransactionsE409.attributeTypeMap;
    };
    NewConfirmedTokensTransactionsE409.discriminator = undefined;
    NewConfirmedTokensTransactionsE409.attributeTypeMap = [
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
    return NewConfirmedTokensTransactionsE409;
}());
exports.NewConfirmedTokensTransactionsE409 = NewConfirmedTokensTransactionsE409;
//# sourceMappingURL=newConfirmedTokensTransactionsE409.js.map