"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedTokensTransactionsE403 = void 0;
var NewConfirmedTokensTransactionsE403 = (function () {
    function NewConfirmedTokensTransactionsE403() {
    }
    NewConfirmedTokensTransactionsE403.getAttributeTypeMap = function () {
        return NewConfirmedTokensTransactionsE403.attributeTypeMap;
    };
    NewConfirmedTokensTransactionsE403.discriminator = undefined;
    NewConfirmedTokensTransactionsE403.attributeTypeMap = [
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
    return NewConfirmedTokensTransactionsE403;
}());
exports.NewConfirmedTokensTransactionsE403 = NewConfirmedTokensTransactionsE403;
//# sourceMappingURL=newConfirmedTokensTransactionsE403.js.map