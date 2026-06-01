"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BannedIpAddressDetailsInner = void 0;
var BannedIpAddressDetailsInner = (function () {
    function BannedIpAddressDetailsInner() {
    }
    BannedIpAddressDetailsInner.getAttributeTypeMap = function () {
        return BannedIpAddressDetailsInner.attributeTypeMap;
    };
    BannedIpAddressDetailsInner.discriminator = undefined;
    BannedIpAddressDetailsInner.attributeTypeMap = [
        {
            "name": "attribute",
            "baseName": "attribute",
            "type": "string"
        },
        {
            "name": "message",
            "baseName": "message",
            "type": "string"
        }
    ];
    return BannedIpAddressDetailsInner;
}());
exports.BannedIpAddressDetailsInner = BannedIpAddressDetailsInner;
//# sourceMappingURL=bannedIpAddressDetailsInner.js.map