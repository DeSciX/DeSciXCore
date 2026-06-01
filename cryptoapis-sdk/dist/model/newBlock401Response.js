"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewBlock401Response = void 0;
var NewBlock401Response = (function () {
    function NewBlock401Response() {
    }
    NewBlock401Response.getAttributeTypeMap = function () {
        return NewBlock401Response.attributeTypeMap;
    };
    NewBlock401Response.discriminator = undefined;
    NewBlock401Response.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "error",
            "baseName": "error",
            "type": "NewBlockE401"
        }
    ];
    return NewBlock401Response;
}());
exports.NewBlock401Response = NewBlock401Response;
//# sourceMappingURL=newBlock401Response.js.map