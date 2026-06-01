"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedTokensTransactionsE400 = void 0;
var NewConfirmedTokensTransactionsE400 = (function () {
    function NewConfirmedTokensTransactionsE400() {
    }
    NewConfirmedTokensTransactionsE400.getAttributeTypeMap = function () {
        return NewConfirmedTokensTransactionsE400.attributeTypeMap;
    };
    NewConfirmedTokensTransactionsE400.discriminator = undefined;
    NewConfirmedTokensTransactionsE400.attributeTypeMap = [
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
    return NewConfirmedTokensTransactionsE400;
}());
exports.NewConfirmedTokensTransactionsE400 = NewConfirmedTokensTransactionsE400;
//# sourceMappingURL=newConfirmedTokensTransactionsE400.js.map