// Copyright 2018 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Directive for CK Editor 5.
 */

require('services/ContextService.ts');
require('services/RteHelperService.ts');

const ClassicEditor = require(
  '@ckeditor/ckeditor5-build-classic/build/ckeditor.js');

var oppia = require('AppInit.ts').module;

oppia.directive('ckEditor5Rte', [
  'ContextService', 'RteHelperService', 'PAGE_CONTEXT',
  function(ContextService, RteHelperService, PAGE_CONTEXT) {
    return {
      restrict: 'E',
      scope: {
        uiConfig: '&'
      },
      template: '<div>' +
                '<div></div>' +
                '<div contenteditable="true" class="oppia-rte"></div>' +
                '</div>',
      require: '^ngModel',

      link: function(scope: ICustomScope, el, attrs, ngModel) {
        var _RICH_TEXT_COMPONENTS = RteHelperService.getRichTextComponents();
        var names = [];
        var icons = [];
        var canUseFs = (
          ContextService.getPageContext() === PAGE_CONTEXT.EXPLORATION_EDITOR ||
          ContextService.getPageContext() === PAGE_CONTEXT.TOPIC_EDITOR ||
          ContextService.getPageContext() === PAGE_CONTEXT.STORY_EDITOR ||
          ContextService.getPageContext() === PAGE_CONTEXT.SKILL_EDITOR);

        _RICH_TEXT_COMPONENTS.forEach(function(componentDefn) {
         var componentRequiresFsButFsCannotBeUsed =
        !canUseFs && componentDefn.requiresFs
          if (!((scope.uiConfig() &&
            scope.uiConfig().hide_complex_extensions &&
            componentDefn.isComplex) || componentRequiresFsButFsCannotBeUsed )) {
            names.push(componentDefn.id);
            icons.push(componentDefn.iconDataUrl);
          }
        });

        // Create rules to whitelist all the rich text components and their
        // wrappers and overlays. See format of filtering
        // rules here: http://docs.ckeditor.com/#!/guide/dev_allowed_content_rules
        // Whitelist the component tags with any attributes and classes.
        var componentRule = names.map(function(name) {
          return 'oppia-noninteractive-' + name;
        }).join(' ') + '(*)[*];';
        // Whitelist the inline component wrapper, which is a
        // span with a "type" attribute.
        var inlineWrapperRule = ' span[type];';
        // Whitelist the block component wrapper, which is a div
        // with a "type" attribute and a CSS class.
        var blockWrapperRule = ' div(oppia-rte-component-container)[type];';
        // Whitelist the transparent block component overlay, which is
        // a div with a CSS class.
        var blockOverlayRule = ' div(oppia-rte-component-overlay);';
        // Put all the rules together.
        var extraAllowedContentRules = (
          componentRule + inlineWrapperRule + blockWrapperRule + blockOverlayRule );

        var startupFocusEnabled = true;
        if (
          scope.uiConfig() &&
          scope.uiConfig().startupFocusEnabled !== undefined) {
          startupFocusEnabled = scope.uiConfig().startupFocusEnabled;
        }
        // Initialize CKEditor5.
        // CkEditor5 is initalized to the editable element which is passed through the
        // create api. el[0] is the ck-editor-5-rte and el[0].children[0].children[1] is
        // the contenteditable div which is defined in the template above.
        var ck = ClassicEditor.create(
          <HTMLElement>(el[0].children[0].children[1]));

        ck.model.document.on('change', function() {
          var elt = $('<div>' + ck.getData() + '</div>');
          var textElt = elt[0].childNodes;
          for (var i = textElt.length; i > 0; i--) {
            for (var j = textElt[i - 1].childNodes.length; j > 0; j--) {
              if (textElt[i - 1].childNodes[j - 1].nodeName === 'BR' ||
                (textElt[i - 1].childNodes[j - 1].nodeName === '#text' &&
                  textElt[i - 1].childNodes[j - 1].nodeValue.trim() === '')) {
                textElt[i - 1].childNodes[j - 1].remove();
              } else {
                break;
              }
            }
            if (textElt[i - 1].childNodes.length === 0) {
              if (textElt[i - 1].nodeName === 'BR' ||
                (textElt[i - 1].nodeName === '#text' &&
                  textElt[i - 1].nodeValue.trim() === '') ||
                  textElt[i - 1].nodeName === 'P') {
                textElt[i - 1].remove();
                continue;
              }
            } else {
              break;
            }
          }
          ngModel.$setViewValue(elt.html());
        });

        // A RegExp for matching rich text components.
        var componentRegExp = (
          /(<(oppia-noninteractive-(.+?))\b[^>]*>)[\s\S]*?<\/\2>/g
        );
        
      }
    };
  }
]);
