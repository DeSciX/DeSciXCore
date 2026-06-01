"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlreadyExists = void 0;
var AlreadyExists = (function () {
    function AlreadyExists() {
    }
    AlreadyExists.getAttributeTypeMap = function () {
        return AlreadyExists.attributeTypeMap;
    };
    AlreadyExists.discriminator = undefined;
    AlreadyExists.attributeTypeMap = [
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
    return AlreadyExists;
}());
exports.AlreadyExists = AlreadyExists;
//# sourceMappingURL=alreadyExists.js.map