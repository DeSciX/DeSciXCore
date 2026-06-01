"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Unimplemented = void 0;
var Unimplemented = (function () {
    function Unimplemented() {
    }
    Unimplemented.getAttributeTypeMap = function () {
        return Unimplemented.attributeTypeMap;
    };
    Unimplemented.discriminator = undefined;
    Unimplemented.attributeTypeMap = [
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
    return Unimplemented;
}());
exports.Unimplemented = Unimplemented;
//# sourceMappingURL=unimplemented.js.map