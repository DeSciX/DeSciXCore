"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewBlockE401 = void 0;
var NewBlockE401 = (function () {
    function NewBlockE401() {
    }
    NewBlockE401.getAttributeTypeMap = function () {
        return NewBlockE401.attributeTypeMap;
    };
    NewBlockE401.discriminator = undefined;
    NewBlockE401.attributeTypeMap = [
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
    return NewBlockE401;
}());
exports.NewBlockE401 = NewBlockE401;
//# sourceMappingURL=newBlockE401.js.map