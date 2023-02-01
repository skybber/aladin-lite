// Copyright 2013 - UDS/CNRS
// The Aladin Lite program is distributed under the terms
// of the GNU General Public License version 3.
//
// This file is part of Aladin Lite.
//
//    Aladin Lite is free software: you can redistribute it and/or modify
//    it under the terms of the GNU General Public License as published by
//    the Free Software Foundation, version 3 of the License.
//
//    Aladin Lite is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    The GNU General Public License is available in COPYING file
//    along with Aladin Lite.
//


/******************************************************************************
 * Aladin Lite project
 * 
 * File gui/Stack.js
 *
 * 
 * Author: Matthieu Baumann[CDS]
 * 
 *****************************************************************************/

import { HpxImageSurvey } from "../HpxImageSurvey.js";
import { ALEvent } from "../events/ALEvent.js";
import { HiPSSelector } from "./HiPSSelector.js";
import { Color } from "./../Color.js";
import { Utils } from './../Utils.js';

import $ from 'jquery';

export class HiPSLayer {

    // Constructor
    constructor(aladin, view, survey) {
        this.aladin = aladin;
        this.view = view;
        this.survey = survey;
        this.hidden = false;
        this.lastOpacity = 1.0;

        // HiPS header div
        this.headerDiv = $(
            '<div class="aladin-layer-header-' + survey.layer + ' aladin-hips-layer">' +
            '<span class="indicator right-triangle">&nbsp;</span>' +
            '<select class="aladin-surveySelection"></select>' +
            '<button class="aladin-btn-small aladin-layer-hide" type="button" title="Hide this layer">👁️</button>' +
            '<button class="aladin-btn-small aladin-HiPSSelector" type="button" title="Search for a specific HiPS">🔍</button>' +
            '<button class="aladin-btn-small aladin-delete-layer" type="button" title="Delete this layer">❌</button>' +
            '</div>'
        );

        if (this.survey.layer === "base") {
            this.headerDiv[0].getElementsByClassName("aladin-delete-layer")[0].style.visibility = "hidden";
        }

        // HiPS main options div
        let cmListStr = '';
        for (const cm of this.aladin.webglAPI.getAvailableColormapList()) {
            cmListStr += '<option>' + cm + '</option>';
        }
        // Add the native which is special:
        // - for FITS hipses, it is changed to grayscale
        // - for JPG/PNG hipses, we do not use any colormap in the backend
        this.nameRadioColorChoice = encodeURIComponent(Utils.uuidv4());
        cmListStr += '<option selected>native</option>';

        this.cmap = "native";
        this.color = "#ff0000";

        this.mainDiv = $('<div class="aladin-frame" style="display:none">' +
            '<div class="aladin-options">' +
            '  <div class="row">' +
            '    <div style="width: 50%"><label>Color map<input type="radio" class="colormap-color-selector" name="' + this.nameRadioColorChoice + '" value="colormap" id="colormap-radio" checked></label></div>' +
            '    <div style="width: 50%"><label>Color<input class="color-color-selector" type="radio" name="'+ this.nameRadioColorChoice + '" value="color"></label></div>' +
            '  </div>' +
            '  <div class="row"><div class="col-label"></div><div class="col-input"><select class="colormap-selector">' + cmListStr + '</select></div></div>' +
            '  <div class="row"><div class="col-label"></div><div class="col-input"><input type="color" name="color-radio" value="' + this.color + '" class="color-selector"></div></div>' +
            '  <label><div class="row"><div class="col-label">Reverse</div><div class="col-input"><input type="checkbox" class="reversed"></div></div></label>' +
            '  <div class="row"><div class="col-label"><label>Stretch</label></div><div class="col-input"><select class="stretch"><option>pow2</option><option selected>linear</option><option>sqrt</option><option>asinh</option><option>log</option></select></div></div>' +
            '  <div class="row"><div class="col-label"><label>Format</label></div><div class="col-input"><select class="format"></select></div></div>' +
            '  <div class="row"><div class="col-label"><label>Min cut</label></div><div class="col-input"><input type="number" class="min-cut"></div></div>' +
            '  <div class="row"><div class="col-label"><label>Max cut</label></div><div class="col-input"><input type="number" class="max-cut"></div></div>' +
            '  <div class="row"><div class="col-label"><label>Blending mode</label></div><div class="col-input"><select class="blending"><option>additive</option><option selected>default</option></select></div></div>' +
            '  <div class="row"><div class="col-label"><label>Opacity</label></div><div class="col-input"><input class="opacity" type="range" min="0" max="1" step="0.01"></div></div>' +
            '</div> ' +
            '</div>');

        this._addListeners();
        this._updateHiPSLayerOptions();

        let self = this;
        this.layerChangedListener = function(e) {
            const survey = e.detail.survey;


            if (survey.layer === self.survey.layer) {
                // Update the survey to the new one
                self.survey = survey;
                self._updateHiPSLayerOptions();
            }
            self._updateSurveysDropdownList();
        };
        ALEvent.HIPS_LAYER_CHANGED.listenedBy(this.aladin.aladinDiv, this.layerChangedListener);
    }

    destroy() {
        ALEvent.HIPS_LAYER_CHANGED.remove(this.aladin.aladinDiv, this.layerChangedListener);
        this.mainDiv[0].removeEventListener("click", this.clickOnAladinFrameListener);
    }

    _addListeners() {
        const self = this;
        // HEADER DIV listeners
        // Click opener
        const clickOpener = this.headerDiv.find('.indicator');
        clickOpener.unbind("click");
        clickOpener.click(function () {
            if (clickOpener.hasClass('right-triangle')) {
                clickOpener.removeClass('right-triangle');
                clickOpener.addClass('down-triangle');
                self.mainDiv.slideDown(300);

                self.aladin.aladinDiv.dispatchEvent(new CustomEvent('select-layer', {
                    detail: self.survey.layer
                }));
            }
            else {
                clickOpener.removeClass('down-triangle');
                clickOpener.addClass('right-triangle');
                self.mainDiv.slideUp(300);
            }
        });

        // Click on aladin options should select the layer clicked
        let aladinOptionsFrame = self.mainDiv[0];
        this.clickOnAladinFrameListener = function(e) {
            self.aladin.aladinDiv.dispatchEvent(new CustomEvent('select-layer', {
                detail: self.survey.layer
            }));
        };
        aladinOptionsFrame.addEventListener("click", this.clickOnAladinFrameListener);

        // Update list of surveys
        self._updateSurveysDropdownList();
        const surveySelector = this.headerDiv.find('.aladin-surveySelection');
        surveySelector.unbind("change");
        surveySelector.change(function () {
            let cfg = HpxImageSurvey.SURVEYS[$(this)[0].selectedIndex];
            if (self.hidden) {
                cfg.options.opacity = 0.0;
            }

            const survey = self.aladin.createImageSurvey(
                cfg.id,
                cfg.name,
                cfg.url,
                undefined,
                cfg.maxOrder,
                cfg.options
            );
            self.aladin.setOverlayImageLayer(survey, self.survey.layer);

            self.aladin.aladinDiv.dispatchEvent(new CustomEvent('select-layer', {
                detail: self.survey.layer
            }));
        });

        // Search HiPS button
        const hipsSelector = this.headerDiv.find('.aladin-HiPSSelector');
        hipsSelector.unbind("click");
        hipsSelector.click(function () {
            if (!self.hipsSelector) {
                self.hipsSelector = new HiPSSelector(self.aladin.aladinDiv, (IDOrURL) => {
                    const layerName = self.survey.layer;
                    self.aladin.setOverlayImageLayer(IDOrURL, layerName);
                }, self.aladin);
            }

            self.hipsSelector.show();
        });

        // Delete HiPS button
        const deleteLayer = this.headerDiv.find('.aladin-delete-layer');
        deleteLayer.unbind('click');
        deleteLayer.click(function () {
            const removeLayerEvent = new CustomEvent('remove-layer', {
                detail: self.survey.layer
            });
            self.aladin.aladinDiv.dispatchEvent(removeLayerEvent);
        });

        // Hide HiPS button
        const hideLayer = this.headerDiv.find('.aladin-layer-hide');
        hideLayer.unbind("click");
        hideLayer.click(function () {
            self.hidden = !self.hidden;
            let opacitySlider = self.mainDiv.find('.opacity').eq(0);

            let newOpacity = 0.0;
            if (self.hidden) {
                self.lastOpacity = self.survey.getOpacity();
                hideLayer.text('');
            } else {
                newOpacity = self.lastOpacity;
                hideLayer.text('👁️');
            }
            // Update the opacity slider
            opacitySlider.val(newOpacity);
            opacitySlider.get(0).disabled = self.hidden;

            self.survey.setOpacity(newOpacity);

            // Update HpxImageSurvey.SURVEYS definition
            /*const idxSelectedHiPS = self.headerDiv.find('.aladin-surveySelection')[0].selectedIndex;
            let surveyDef = HpxImageSurvey.SURVEYS[idxSelectedHiPS];
            let options = surveyDef.options || {};
            options.opacity = newOpacity;
            surveyDef.options = options;*/
        });

        // MAIN DIV listeners
        // blending method
        if (self.survey.layer === "base") {
            this.mainDiv.find('.row').eq(8)[0].style.display = "none";
        } else {
            const blendingSelector = this.mainDiv.find('.blending').eq(0);
            blendingSelector.unbind("change");
            blendingSelector.change(function () {
                let mode = blendingSelector.val()
                self.survey.setBlendingConfig( mode === "additive" );
            });
        }

        // image format
        const format4ImgLayer = this.mainDiv.find('.format').eq(0);
        const minCut4ImgLayer = this.mainDiv.find('.min-cut').eq(0);
        const maxCut4ImgLayer = this.mainDiv.find('.max-cut').eq(0);
        format4ImgLayer.unbind("change");
        format4ImgLayer.change(function () {
            const imgFormat = format4ImgLayer.val();

            self.survey.changeImageFormat(imgFormat);

            let minCut = 0;
            let maxCut = 1;
            if (imgFormat === "fits") {
                // FITS format
                minCut = self.survey.properties.minCutout;
                maxCut = self.survey.properties.maxCutout;
            }
            self.survey.setCuts([minCut, maxCut]);

            // update the cuts only
            minCut4ImgLayer.val(parseFloat(minCut.toFixed(5)));
            maxCut4ImgLayer.val(parseFloat(maxCut.toFixed(5)));

            // update HpxImageSurvey.SURVEYS definition
            /*const idxSelectedHiPS = self.headerDiv.find('.aladin-surveySelection')[0].selectedIndex;
            let surveyDef = HpxImageSurvey.SURVEYS[idxSelectedHiPS];
            let options = surveyDef.options || {};
            options.minCut = minCut;
            options.maxCut = maxCut;
            options.imgFormat = imgFormat;
            surveyDef.options = options;*/
        });
        // min/max cut
        minCut4ImgLayer.unbind("input blur");
        maxCut4ImgLayer.unbind("input blur");
        minCut4ImgLayer.add(maxCut4ImgLayer).on('input blur', function (e) {
            let minCutValue = parseFloat(minCut4ImgLayer.val());
            let maxCutValue = parseFloat(maxCut4ImgLayer.val());

            if (isNaN(minCutValue) || isNaN(maxCutValue)) {
                return;
            }
            self.survey.setCuts([minCutValue, maxCutValue]);

            // update HpxImageSurvey.SURVEYS definition
            /*const idxSelectedHiPS = self.surveySelectionDiv[0].selectedIndex;
            let surveyDef = HpxImageSurvey.SURVEYS[idxSelectedHiPS];
            let options = surveyDef.options || {};
            options.minCut = minCutValue;
            options.maxCut = maxCutValue;
            surveyDef.options = options;*/
        });

        // colormap
        const colorMapSelect4ImgLayer = this.mainDiv.find('.colormap-selector').eq(0);
        const stretchSelect4ImgLayer = this.mainDiv.find('.stretch').eq(0);
        const reverseCmCb = this.mainDiv.find('.reversed').eq(0);
        const colorSelect4ImgLayer = self.mainDiv.find('.color-selector').eq(0);
        const colorMode = this.mainDiv[0].getElementsByClassName('colormap-color-selector');

        reverseCmCb.unbind("change");
        colorMapSelect4ImgLayer.unbind("change");
        colorSelect4ImgLayer.unbind("change");
        stretchSelect4ImgLayer.unbind("change");
        colorMapSelect4ImgLayer.add(colorSelect4ImgLayer).add(reverseCmCb).add(stretchSelect4ImgLayer).change(function () {
            const stretch = stretchSelect4ImgLayer.val();
            const reverse = reverseCmCb[0].checked;

            if (colorMode[0].checked) {
                // Color map case
                const cmap = colorMapSelect4ImgLayer.val();
                self.survey.setColormap(cmap, { reversed: reverse, stretch: stretch });

                // Save the colormap change
                //self.cmap = cmap;
            } else {
                // Single color case
                const colorHex = colorSelect4ImgLayer.val();
                let colorRgb = Color.hexToRgb(colorHex);
                self.survey.setColor([colorRgb.r / 255.0, colorRgb.g / 255.0, colorRgb.b / 255.0, 1.0], { reversed: reverse, stretch: stretch });
                
                // Save the color change
                //self.color = colorHex;
            }
        });

        colorSelect4ImgLayer.unbind("input");
        colorSelect4ImgLayer.on('input', function () {
            const stretch = stretchSelect4ImgLayer.val();
            const reverse = reverseCmCb[0].checked;

            const colorHex = colorSelect4ImgLayer.val();
            let colorRgb = Color.hexToRgb(colorHex);
            self.survey.setColor([colorRgb.r / 255.0, colorRgb.g / 255.0, colorRgb.b / 255.0, 1.0], {stretch: stretch, reversed: reverse});

            // Save the color change
            //self.color = colorHex;
        });

        // colormap/color radio
        const [colormapChoiceRadioBtn, colorChoiceRadioBtn] = document.querySelectorAll('input[name="' + this.nameRadioColorChoice + '"]');
        $(colormapChoiceRadioBtn).on("click", function (e) {
            // restore the colormap
            const cmap = self.cmap;

            // set the colormap
            self.survey.setColormap(cmap);
        });
        $(colorChoiceRadioBtn).on("click", function (e) {
            // set the color
            const colorHex = self.color;

            let colorRgb = Color.hexToRgb(colorHex);
            self.survey.setColor([colorRgb.r / 255.0, colorRgb.g / 255.0, colorRgb.b / 255.0, 1.0]);
        });

        // opacity
        const opacity4ImgLayer = self.mainDiv.find('.opacity').eq(0);
        opacity4ImgLayer.unbind("input");
        opacity4ImgLayer.on('input', function () {
            const opacity = +opacity4ImgLayer.val();
            self.survey.setOpacity(opacity);

            // update HpxImageSurvey.SURVEYS definition
            /*const idxSelectedHiPS = self.headerDiv.find('.aladin-surveySelection')[0].selectedIndex;
            let surveyDef = HpxImageSurvey.SURVEYS[idxSelectedHiPS];
            let options = surveyDef.options || {};
            options.opacity = opacity;
            surveyDef.options = options;*/
        });
    }

    _updateHiPSLayerOptions() {
        const colorModeTr = this.mainDiv.find('.row').eq(0);
        const colorMapTr = this.mainDiv.find('.row').eq(1);
        const colorTr = this.mainDiv.find('.row').eq(2);
        const reverseTr = this.mainDiv.find('.row').eq(3);
        const stretchTr = this.mainDiv.find('.row').eq(4);
        const formatTr = this.mainDiv.find('.row').eq(5);
        const minCutTr = this.mainDiv.find('.row').eq(6);
        const maxCutTr = this.mainDiv.find('.row').eq(7);

        const colormapMode = this.mainDiv.find('.colormap-color-selector').eq(0);
        const colorMode = this.mainDiv.find('.color-color-selector').eq(0);
        const colorVal = this.mainDiv.find('.color-selector').eq(0);

        const reverseCmCb = this.mainDiv.find('.reversed').eq(0);
        const colorMapSelect4ImgLayer = this.mainDiv.find('.colormap-selector').eq(0);
        const stretchSelect4ImgLayer = this.mainDiv.find('.stretch').eq(0);
        const formatSelect4ImgLayer = this.mainDiv.find('.format').eq(0);
        const opacity4ImgLayer = this.mainDiv.find('.opacity').eq(0);
        const minCut = this.mainDiv.find('.min-cut').eq(0);
        const maxCut = this.mainDiv.find('.max-cut').eq(0);

        formatSelect4ImgLayer.empty();
        this.survey.properties.formats.forEach(format => {
            formatSelect4ImgLayer.append($('<option>', {
                value: format,
                text: format
            }));
        });

        const options = this.survey.options;
        const cmap = options.colormap;
        const reverse = options.reversed;
        const stretch = options.stretch;

        // Update radio color/colormap selection
        if (cmap) {
            colormapMode[0].checked = true;
            colorMode[0].checked = false;
        } else {
            colormapMode[0].checked = false;
            colorMode[0].checked = true;
        }

        const colored = this.survey.colored;

        const imgFormat = options.imgFormat;
        formatSelect4ImgLayer.val(imgFormat);

        // cuts
        if (colored) {
            colorModeTr[0].style.display = "none";

            colorTr[0].style.display = "none";

            colorMapTr[0].style.display = "none";
            reverseTr[0].style.display = "none";
            stretchTr[0].style.display = "none";

            minCutTr[0].style.display = "none";
            maxCutTr[0].style.display = "none";
        }
        else {
            colorModeTr[0].style.display = "flex";
            if (!colormapMode[0].checked) {
                colorTr[0].style.display = "flex";
                stretchTr[0].style.display = "flex";

                colorMapTr[0].style.display = "none";
                reverseTr[0].style.display = "none";
            } else {
                colorTr[0].style.display = "none";

                colorMapTr[0].style.display = "flex";
                reverseTr[0].style.display = "flex";
                stretchTr[0].style.display = "flex";
            }

            if (options.minCut) {
                if (parseFloat(minCut.val()) != options.minCut) {
                    minCut.val(parseFloat(options.minCut.toFixed(5)));
                }
            }
            else {
                minCut.val(0.0);
            }

            minCutTr[0].style.display = "flex";

            if (options.maxCut) {
                if (parseFloat(maxCut.val()) != options.maxCut) {
                    maxCut.val(parseFloat(options.maxCut.toFixed(5)));
                }
            }
            else {
                maxCut.val(0.0);
            }
            maxCutTr[0].style.display = "flex";
        }

        const opacity = options.opacity;
        opacity4ImgLayer.val(opacity);

        // TODO: traiter ce cas
        if (this.survey.colored) {
            return;
        }
        
        if (options.color) {
            const [r, g, b, _] = options.color;
            const hexColor = Color.rgbToHex(r*255, g*255, b*255);
            colorVal[0].value = hexColor;

            // save color
            this.color = hexColor;
        } else {
            colorMapSelect4ImgLayer.val(cmap);

            // save cmap
            this.cmap = cmap;
        }
        reverseCmCb.prop('checked', reverse);
        stretchSelect4ImgLayer.val(stretch);
    }

    _updateSurveysDropdownList() {
        let surveySelectionDiv = this.headerDiv.find('.aladin-surveySelection');

        let surveys = HpxImageSurvey.SURVEYS.sort(function (a, b) {
            if (!a.order) {
                return a.name > b.name ? 1 : -1;
            }
            return a.maxOrder && a.maxOrder > b.maxOrder ? 1 : -1;
        });
        surveySelectionDiv.empty();

        if (this.survey) {
            let surveyFound = false;
            surveys.forEach(s => {
                const isCurSurvey = this.survey.id.endsWith(s.id);
                surveySelectionDiv.append($("<option />").attr("selected", isCurSurvey).val(s.id).text(s.name));
                surveyFound |= isCurSurvey;
            });

            // The survey has not been found among the ones cached
            if (!surveyFound) {
                // Cache it
                /*HpxImageSurvey.SURVEYS.push({
                    id: this.survey.properties.id,
                    name: this.survey.properties.name,
                    maxOrder: this.survey.properties.maxOrder,
                    url: this.survey.properties.url,
                    options: this.survey.options
                });
                surveySelectionDiv.append($("<option />").attr("selected", true).val(this.survey.properties.id).text(this.survey.properties.name));*/

                console.warn(this.survey, " has not been found in SURVEYS!")
            } else {
                // Update the HpxImageSurvey
                const idxSelectedHiPS = surveySelectionDiv[0].selectedIndex;
                let surveyDef = HpxImageSurvey.SURVEYS[idxSelectedHiPS];
                surveyDef.options = this.survey.options;
            }
        }
    }

    attachTo(parentDiv) {
        this.headerDiv.append(this.mainDiv);
        parentDiv.append(this.headerDiv);

        this._addListeners();
    }

    show() {
        this.mainDiv.style.display = 'block';
    }

    hide() {
        this.headerDiv.style.display = 'none';
        this.mainDiv.style.display = 'none';
    }
}