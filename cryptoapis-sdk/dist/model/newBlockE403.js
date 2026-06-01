"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewBlockE403 = void 0;
var NewBlockE403 = (function () {
    function NewBlockE403() {
    }
    NewBlockE403.getAttributeTypeMap = function () {
        return NewBlockE403.attributeTypeMap;
    };
    NewBlockE403.discriminator = undefined;
    NewBlockE403.attributeTypeMap = [
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
    return NewBlockE403;
}());
exports.NewBlockE403 = NewBlockE403;
//# sourceMappingURL=newBlockE403.js.map