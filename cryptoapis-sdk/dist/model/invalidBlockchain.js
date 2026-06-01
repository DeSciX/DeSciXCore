"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidBlockchain = void 0;
var InvalidBlockchain = (function () {
    function InvalidBlockchain() {
    }
    InvalidBlockchain.getAttributeTypeMap = function () {
        return InvalidBlockchain.attributeTypeMap;
    };
    InvalidBlockchain.discriminator = undefined;
    InvalidBlockchain.attributeTypeMap = [
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
    return InvalidBlockchain;
}());
exports.InvalidBlockchain = InvalidBlockchain;
//# sourceMappingURL=invalidBlockchain.js.map