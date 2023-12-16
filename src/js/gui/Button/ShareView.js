// Copyright 2023 - UDS/CNRS
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

import { CtxMenuActionButtonOpener } from "./CtxMenuOpener";
import { ContextMenu } from "../Widgets/ContextMenu";
import shareIconUrl from '../../../../assets/icons/share.svg';
import { ProjectionEnum } from "../../ProjectionEnum";
import { ShortLivedBox } from "../Box/ShortLivedBox";
/******************************************************************************
 * Aladin Lite project
 *
 * File gui/ActionButton.js
 *
 * A context menu that shows when the user right clicks, or long touch on touch device
 *
 *
 * Author: Matthieu Baumann[CDS]
 *
 *****************************************************************************/
/**
 * Class representing a Tabs layout
 * @extends CtxMenuActionButtonOpener
 */
 export class ShareActionButton extends CtxMenuActionButtonOpener {
    /**
     * UI responsible for displaying the viewport infos
     * @param {Aladin} aladin - The aladin instance.
     */
    constructor(aladin, options) {
        let layout = [
            {
                label: {
                    content: 'Save the view',
                    tooltip: {
                        content: 'View URL will be saved into your clipboard',
                        position: {
                            direction: 'bottom'
                        }
                    }
                },
                action(o) {
                    var url = aladin.getShareURL();
                    navigator.clipboard.writeText(url);

                    let infoBox = ShortLivedBox.getInstance(aladin);
                    infoBox._show({
                        content: 'View URL saved into your clipboard!',
                        duration: 2000,
                        position: {
                            anchor: 'center bottom'
                        }
                    })
                }
            },
            {
                label: 'HiPS2FITS cutout',
                action(o) {
                    let hips2fitsUrl = 'https://alasky.cds.unistra.fr/hips-image-services/hips2fits#';
                    let radec = aladin.getRaDec();
                    let fov = Math.max.apply(null, aladin.getFov());
                    let hipsId = aladin.getBaseImageLayer().id;
                    let proj = aladin.getProjectionName();
                    hips2fitsUrl += 'ra=' + radec[0] + '&dec=' + radec[1] + '&fov=' + fov + '&projection=' + proj + '&hips=' + encodeURIComponent(hipsId);
                    window.open(hips2fitsUrl, '_blank');
                }
            },
            {
                label: 'Export to notebook',
                disabled: true,
            },
            {
                label: {
                    content: 'Save the WCS',
                    tooltip: {
                        content: 'World Coordinate System of the view',
                        position: {
                            direction: 'right'
                        }
                    }
                },
                action(o) {
                    let wcs = aladin.getViewWCS()
                    navigator.clipboard.writeText(JSON.stringify(wcs));

                    let infoBox = ShortLivedBox.getInstance(aladin);
                    infoBox._show({
                        content: 'WCS saved!',
                        duration: 2000,
                        position: {
                            anchor: 'center bottom'
                        }
                    })
                }
            },
        ];

        let self;
        super({
            ctxMenu: layout,
            ...options,
            iconURL: shareIconUrl,
            openDirection: 'top',
            tooltip: {content: 'You can share/export your view into many ways', position: {direction: 'top'}},
        });
        self = this;
        this.addClass('medium-sized-icon')
    }

    _show() {
        super._show()
    }
}