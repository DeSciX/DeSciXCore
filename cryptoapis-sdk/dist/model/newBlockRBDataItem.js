"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewBlockRBDataItem = void 0;
var NewBlockRBDataItem = (function () {
    function NewBlockRBDataItem() {
        this['allowDuplicates'] = false;
    }
    NewBlockRBDataItem.getAttributeTypeMap = function () {
        return NewBlockRBDataItem.attributeTypeMap;
    };
    NewBlockRBDataItem.discriminator = undefined;
    NewBlockRBDataItem.attributeTypeMap = [
        {
            "name": "allowDuplicates",
            "baseName": "allowDuplicates",
            "type": "boolean"
        },
        {
            "name": "callbackSecretKey",
            "baseName": "callbackSecretKey",
            "type": "string"
        },
        {
            "name": "callbackUrl",
            "baseName": "callbackUrl",
            "type": "string"
        }
    ];
    return NewBlockRBDataItem;
}());
exports.NewBlockRBDataItem = NewBlockRBDataItem;
//# sourceMappingURL=newBlockRBDataItem.js.map