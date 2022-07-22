sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "../utils/ControlGenerator",
    "../utils/JSONGenerator"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, ControlGenerator, JSONGenerator) {
        "use strict";

        let model = {};

        return Controller.extend("nl.qualiture.ui5html2rendermanagergenerator.controller.Main", {
            onInit: function () {
                const jsonModel = new JSONModel({
                    html: null,
                    generated: null
                });

                this.getView().setModel(jsonModel, "View");

                model = this.getView().getModel("View");
            },

            onPressConvertHTML() {
                const JSONG = new JSONGenerator();
                const html = model.getProperty("/html")
                    .replace(/\n/g, "")
                    .replace(/[\t ]+\</g, "<")
                    .replace(/\>[\t ]+\</g, "><")
                    .replace(/\>[\t ]+$/g, ">");
                const generated = JSONG.generateJSON(html);

                const cg = new ControlGenerator();
                cg.setMappingTable(model.Properties);

                const content = cg.generateControl(JSON.parse(generated), "nl.qualiture.democontrol", false);

                model.setProperty("/generated", content);
            }
        });
    });
