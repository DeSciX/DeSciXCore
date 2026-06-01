"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewBlockRB = void 0;
var NewBlockRB = (function () {
    function NewBlockRB() {
    }
    NewBlockRB.getAttributeTypeMap = function () {
        return NewBlockRB.attributeTypeMap;
    };
    NewBlockRB.discriminator = undefined;
    NewBlockRB.attributeTypeMap = [
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "NewBlockRBData"
        }
    ];
    return NewBlockRB;
}());
exports.NewBlockRB = NewBlockRB;
//# sourceMappingURL=newBlockRB.js.map