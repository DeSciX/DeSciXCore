"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidNetwork = void 0;
var InvalidNetwork = (function () {
    function InvalidNetwork() {
    }
    InvalidNetwork.getAttributeTypeMap = function () {
        return InvalidNetwork.attributeTypeMap;
    };
    InvalidNetwork.discriminator = undefined;
    InvalidNetwork.attributeTypeMap = [
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
    return InvalidNetwork;
}());
exports.InvalidNetwork = InvalidNetwork;
//# sourceMappingURL=invalidNetwork.js.map