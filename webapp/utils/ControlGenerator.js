sap.ui.define([
    "sap/ui/base/Object",
    "../utils/PropertyGenerator"
], function (Object, Property) {
    "use strict";
    return Object.extend("nl.qualiture.ui5html2rendermanagergenerator.utils.ControlGenerator", {
        constructor: function (json) {
            this.setJSON(json);
        },
        setJSON: function (json) {
            this._json = json;
        },
        getJSON: function () {
            return this._json;
        },
        getAllProperties: function () {
            this.generateRendererFn();
            return this.props;
        },
        setMappingTable: function (aMappings) {
            this._aMappings = aMappings;
        },
        generateControl: function (json, name, skipRenderer) {
            if (json) {
                this.setJSON(json);
            }
            if (!this.getJSON()) {
                console.log("No JSON available!");
                return;
            }
            // must be first --> will search for properties
            var renderer = this.generateRendererFn();

            var controlStr = [];
            controlStr.push(this.generateBeginControl(name));
            controlStr.push(this.generateMetadata());
            controlStr.push(",\n\n");
            controlStr.push(this.generateInitFn());
            controlStr.push(",\n\n");
            if (!skipRenderer) {
                controlStr.push(renderer);
                controlStr.push(",\n\n");
            }
            controlStr.push(this.generateAfterRenderingFn());
            if (this.props && this.props.length > 0) {
                controlStr.push(",\n\n");
                controlStr.push(this.generateSettersFn());
            }
            controlStr.push(this.generateEndControl());
            return controlStr.join(" ");
        },
        generateBeginControl: function (name) {
            if (!name || (name && name === "")) {
                name = "namespace.ControlName";
            }
            var begin = "sap.ui.define([\n";
            begin += "\t\"sap/ui/core/Control\"\n";
            begin += "], (Control) => {\n";
            begin += "\t\"use strict\";\n";
            begin += "\treturn Control.extend(\"" + name + "\", {\n";
            return begin;
        },
        generateSeperateRenderer: function (json, name) {
            if (json) {
                this.setJSON(json);
            }
            if (!this.getJSON()) {
                console.log("No JSON available!");
                return;
            }
            if (!name || (name && name === "")) {
                name = "namespace.ControlName";
            }
            this._firstTime = true;
            var sControlName = name.substr(name.lastIndexOf(".") + 1);
            var sRenderer = "sap.ui.define([], function() {";
            sRenderer += "\"use strict\";";
            sRenderer += "var " + sControlName + " = {};";
            sRenderer += sControlName + ".render = function(rm, control) {";
            sRenderer += this.renderControl(this.getJSON());
            sRenderer += "};";
            sRenderer += "return " + sControlName + ";";
            sRenderer += "},true);";
            return sRenderer;
        },
        generateEndControl: function () {
            var end = "\t});\n});\n";
            return end;
        },
        generateMetadata: function () {
            var meta = "\t\t\"metadata\":{\n\t\t\t\"properties\":{\n";
            var allprops = [];
            $.each(this.props, function (key, value) {
                allprops.push("\t\t\t\t" + value.getPropMeta());
            });
            meta += allprops.join(",\n");
            meta += "\n\t\t\t},\n\t\t\t\"events\":{}\n\t\t}";
            return meta;
        },
        generateInitFn: function () {
            var InitFn = "\t\tinit() { ";
            InitFn += "}";
            return InitFn;
        },
        generateRendererFn: function () {
            this._firstTime = true;
            var RendererFn = "\t\trenderer(rm, control) {\n";
            RendererFn += this.renderControl(this.getJSON());
            RendererFn += "\t\t}";
            return RendererFn;
        },
        generateAfterRenderingFn: function () {
            var AfterRenderingFn = "\t\tonAfterRendering(event) { ";
            AfterRenderingFn += "}";
            return AfterRenderingFn;
        },
        generateSettersFn: function () {
            var propsSetters = [];
            $.each(this.props, function (key, value) {
                var sSetter = value.getSetterFn();
                if (sSetter) {
                    propsSetters.push("\t\t" + sSetter);
                }
            });
            return propsSetters.join(",\n");
        },
        renderControl: function (controljson) {
            var me = this;
            let control = `\t\t\trm.openStart("${controljson.tag}"`
            if (this._firstTime) {
                this.props = [];
                control += ", control";
                this._firstTime = false;
            }
            control += ")"

            if (controljson.style) {
                var styles = controljson.style.split(";");
                $.each(styles, function (key, value) {
                    if (value) {
                        var style = value.split(":");
                        control += ".style(\"" + style[0] + "\", \"" + style[1] + "\")";
                    }
                });
            }
            if (controljson.class) {
                var classes = controljson.class.split(" ");
                $.each(classes, function (key, value) {
                    if (value) {
                        control += ".class(\"" + value + "\")";
                    }
                });
            }
            if (controljson.src) {
                control += this.addAttribute("src");
            }
            if (controljson.href) {
                control += this.addAttribute("href");
            }
            control += ".openEnd();\n";
            if (controljson.html) {
                control += this.addProperty();
            }
            if (controljson.children) {
                $.each(controljson.children, function (key, value) {
                    control += me.renderControl(value);
                });
            }
            control += `\t\t\trm.close("${controljson.tag}");\n\n`
            return control;
        },
        addProperty: function () {
            if (!this.props) {
                return;
            }
            var l = this.getParamCount("prop");
            var sTempPropName = "prop" + (++l);
            if (this._aMappings) {
                var aFoundName = this._aMappings.filter(function (aMapping) {
                    return aMapping._name === sTempPropName;
                });
            }
            var p = new Property(sTempPropName, aFoundName && aFoundName.length > 0 && aFoundName[0].value ? aFoundName[0].value :
                sTempPropName, aFoundName &&
                    aFoundName.length > 0 ? aFoundName[0]._type : "string", false, aFoundName && aFoundName.length > 0 ? aFoundName[0]._generateSetter :
                true);
            this.props.push(p);
            return "\t\t\trm.text(control." + p.generateFnName("get") + "());\n";
        },
        addAttribute: function (attr) {
            if (!this.props) {
                return;
            }
            var l = this.getParamCount(attr);
            var sTempAttrName = attr + (++l);
            if (this._aMappings) {
                var aFoundName = this._aMappings.filter(function (aMapping) {
                    return aMapping._name === sTempAttrName;
                });
            }
            var p = new Property(sTempAttrName, aFoundName && aFoundName.length > 0 && aFoundName[0].value ? aFoundName[0].value :
                sTempAttrName, "string", true,
                aFoundName && aFoundName.length > 0 ? aFoundName[0]._generateSetter : true);
            this.props.push(p);
            return ".attr(\"" + attr + "\",control." + p.generateFnName("get") + "())";
        },
        getParamCount: function (param) {
            // var l = _.countBy(this.props,function(prop){
            // 	return prop.getName().substr(0,param.length) === param?param:"Others";
            // });
            var l = 0;
            $.each(this.props, function (key, value) {
                if (value.getKey().substr(0, param.length) === param) {
                    l++;
                }
            });
            return l ? l : 0;
        }
    });
});